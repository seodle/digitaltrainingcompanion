const Users = require("../models/userModel");
const sleep = require("../utils/sleep");
const {
  createAiBeaconApiClientForUser,
} = require("../clients/aiBeacon.client");

const PROCESSING_POLL_INTERVAL_MS = 2000;
const PROCESSING_POLL_TIMEOUT_MS = 60000;
const ANALYSIS_JOB_POLL_INTERVAL_MS = 2000;
const ANALYSIS_JOB_POLL_MAX_ATTEMPTS = 60;
const OPEN_ENDED_QUESTION_TYPE = "text";
const MULTIPLE_CHOICES_QUESTION_TYPE = "checkbox";

function extractAvailableCourses(rawAvailable) {
  if (!Array.isArray(rawAvailable)) return [];

  return rawAvailable.map((course) => ({
    id: String(course?.id ?? "").trim(),
    name: String(course?.displayname ?? course?.fullname ?? course?.shortname ?? "").trim(),
  }));
}

function isCourseProcessingDone(status) {
  if (!status || typeof status !== "object") return false;

  const hasPending = Object.prototype.hasOwnProperty.call(status, "pending");
  const hasDownloading = Object.prototype.hasOwnProperty.call(status, "downloading");
  const hasProcessing = Object.prototype.hasOwnProperty.call(status, "processing");
  if (!hasPending || !hasDownloading || !hasProcessing) {
    return false;
  }

  const pending = Number(status.pending);
  const downloading = Number(status.downloading);
  const processing = Number(status.processing);
  if (
    !Number.isFinite(pending) ||
    !Number.isFinite(downloading) ||
    !Number.isFinite(processing) ||
    pending < 0 ||
    downloading < 0 ||
    processing < 0
  ) {
    return false;
  }

  return pending + downloading + processing === 0;
}

async function waitForCourseProcessingCompletion({ client, courseId }) {
  const startedAt = Date.now();
  let lastStatus = null;

  while (Date.now() - startedAt < PROCESSING_POLL_TIMEOUT_MS) {
    let status;
    try {
      status = await client.get(
        `/api/files/courses/${encodeURIComponent(courseId)}/processing-status`
      );
    } catch (error) {
      // Some aiBeacon tenants don't expose this endpoint yet.
      // Treat it as "status endpoint unavailable" instead of hard failure.
      if (Number(error?.status) === 404) {
        return { done: null, unsupported: true, status: null };
      }
      throw error;
    }
    lastStatus = status;

    if (isCourseProcessingDone(status)) {
      return { done: true, unsupported: false, status };
    }

    await sleep(PROCESSING_POLL_INTERVAL_MS);
  }

  return { done: false, unsupported: false, status: lastStatus };
}

async function resolveLmsConnectionId({ userId, client, forceRefresh = false }) {
  const user = await Users.findById(userId).select("lmsConnectionId");
  if (!user) {
    throw new Error("User not found");
  }

  if (!forceRefresh && user.lmsConnectionId) {
    return String(user.lmsConnectionId);
  }

  const connections = await client.get("/api/courses/connections");
  const lmsConnectionId = connections?.[0]?.id;

  if (!lmsConnectionId) {
    return null;
  }

  const normalizedId = String(lmsConnectionId);
  if (user.lmsConnectionId !== normalizedId) {
    user.lmsConnectionId = normalizedId;
    await user.save();
  }

  return normalizedId;
}

function extractSyncedCourses(syncResult) {
  const syncedCourses = Array.isArray(syncResult?.synced_courses)
    ? syncResult.synced_courses
    : [];

  return syncedCourses.map((course) => ({
    courseAiBeaconId: String(course?.course_id ?? "").trim(),
    courseMoodleId: String(course?.lms_course_id ?? "").trim(),
  }));
}

function extractCourseContents(rawContents) {
  if (!Array.isArray(rawContents)) return [];

  return rawContents.map((item) => ({
    id: item?.id ?? null,
    lms_content_id: item?.lms_content_id ?? null,
    module_name: item?.module_name ?? "",
    section_name: item?.section_name ?? "",
    name: item?.name ?? "",
    content_type: item?.content_type ?? "",
  }));
}

function mapAiBeaconAssessmentAnalysisToQuestions(rawAnalysis) {
  const normalizedSource =
    rawAnalysis?.structured_output &&
    typeof rawAnalysis.structured_output === "object"
      ? rawAnalysis.structured_output
      : rawAnalysis;

  const multipleChoiceQuestions = Array.isArray(normalizedSource?.multiple_choice)
    ? normalizedSource.multiple_choice
    : [];
  const shortAnswerQuestions = Array.isArray(normalizedSource?.short_answer)
    ? normalizedSource.short_answer
    : [];
  const essayPrompt =
    normalizedSource?.essay && typeof normalizedSource.essay === "object"
      ? String(normalizedSource.essay?.question || "").trim()
      : String(normalizedSource?.essay || "").trim();

  const mappedQuestions = [];
  let nextQuestionId = 1;

  multipleChoiceQuestions.forEach((entry) => {
    const questionText = String(entry?.question || "").trim();
    if (!questionText) return;

    const rawOptions = entry?.options;
    const options = Array.isArray(rawOptions)
      ? rawOptions
          .map((option) => String(option || "").trim())
          .filter((option) => option.length > 0)
      : rawOptions && typeof rawOptions === "object"
        ? Object.values(rawOptions)
            .map((option) => String(option || "").trim())
            .filter((option) => option.length > 0)
        : [];

    mappedQuestions.push({
      questionId: String(nextQuestionId),
      shortName: `Question ${nextQuestionId}`,
      question: questionText,
      questionType: MULTIPLE_CHOICES_QUESTION_TYPE,
      choices: options,
      isMandatory: false,
      workshopId: null,
    });
    nextQuestionId += 1;
  });

  shortAnswerQuestions.forEach((entry) => {
    const questionText = String(entry?.question || "").trim();
    if (!questionText) return;

    mappedQuestions.push({
      questionId: String(nextQuestionId),
      shortName: `Question ${nextQuestionId}`,
      question: questionText,
      questionType: OPEN_ENDED_QUESTION_TYPE,
      choices: [],
      isMandatory: false,
      workshopId: null,
    });
    nextQuestionId += 1;
  });

  if (essayPrompt) {
    mappedQuestions.push({
      questionId: String(nextQuestionId),
      shortName: `Question ${nextQuestionId}`,
      question: essayPrompt,
      questionType: OPEN_ENDED_QUESTION_TYPE,
      choices: [],
      isMandatory: false,
      workshopId: null,
    });
  }

  return mappedQuestions;
}

async function generateAssessmentAnalyses({
  userId,
  courseId,
  analysisTypes,
  contentIds,
}) {
  const normalizedCourseId = String(courseId || "").trim();
  if (!normalizedCourseId) {
    throw new Error("courseId is required");
  }

  const normalizedContentIds = Array.isArray(contentIds)
    ? contentIds
        .map((id) => Number(id))
        .filter((id) => Number.isFinite(id))
    : undefined;

  const payload = { analysis_types: analysisTypes };
  if (normalizedContentIds !== undefined) {
    payload.content_ids = normalizedContentIds;
  }

  const client = await createAiBeaconApiClientForUser(userId);
  const raw = await client.post(
    `/api/analysis/course/${encodeURIComponent(normalizedCourseId)}/check-duplicates`,
    payload
  );

  const duplicates = Array.isArray(raw?.duplicates) ? raw.duplicates : [];
  const reusableDuplicate = duplicates.find(
    (duplicate) =>
      duplicate?.existing_analysis?.id !== undefined &&
      duplicate?.existing_analysis?.id !== null
  );
  const hasReusableDuplicate = Boolean(reusableDuplicate);
  const shouldRunAnalysis =
    duplicates.length === 0 ||
    duplicates.some((duplicate) => duplicate?.is_stale === true) ||
    !hasReusableDuplicate;
  let analysisIdToFetch = reusableDuplicate
    ? String(reusableDuplicate.existing_analysis.id)
    : null;
  let analysisResponse = null;

  if (shouldRunAnalysis) {
    const analysisType = Array.isArray(analysisTypes)
      ? analysisTypes[0]
      : analysisTypes;
    const analyzePayload = { analysis_type: analysisType };
    if (normalizedContentIds !== undefined) {
      analyzePayload.content_ids = normalizedContentIds;
    }
    const analyzeResponse = await client.post(
      `/api/analysis/course/${encodeURIComponent(normalizedCourseId)}/analyze`,
      analyzePayload
    );

    const jobId = analyzeResponse?.job_id;
    if (jobId !== undefined && jobId !== null && String(jobId).trim() !== "") {
      let jobResponse = null;
      let pollAttempt = 0;
      do {
        jobResponse = await client.get(
          `/api/analysis/course/${encodeURIComponent(normalizedCourseId)}/jobs/${encodeURIComponent(String(jobId))}`
        );

        const status = String(jobResponse?.status || "").toLowerCase();
        if (status === "completed" || status === "failed") {
          break;
        }

        pollAttempt += 1;
        if (pollAttempt < ANALYSIS_JOB_POLL_MAX_ATTEMPTS) {
          await sleep(ANALYSIS_JOB_POLL_INTERVAL_MS);
        }
      } while (pollAttempt < ANALYSIS_JOB_POLL_MAX_ATTEMPTS);

      const finalStatus = String(jobResponse?.status || "").toLowerCase();
      if (finalStatus === "completed") {
        const results = Array.isArray(jobResponse?.results)
          ? jobResponse.results
          : [];
        const firstResultWithAnalysisId = results.find(
          (result) =>
            result?.analysis_id !== undefined &&
            result?.analysis_id !== null &&
            String(result.analysis_id).trim() !== ""
        );
        if (firstResultWithAnalysisId) {
          analysisIdToFetch = String(firstResultWithAnalysisId.analysis_id);
        }
      }
    }
  }

  if (analysisIdToFetch) {
    analysisResponse = await client.get(
      `/api/analysis/course/${encodeURIComponent(normalizedCourseId)}/${encodeURIComponent(analysisIdToFetch)}`
    );
  }

  return { duplicates, analysis: analysisResponse };
}

module.exports = {
  extractAvailableCourses,
  extractSyncedCourses,
  extractCourseContents,
  resolveLmsConnectionId,
  waitForCourseProcessingCompletion,
  isCourseProcessingDone,
  generateAssessmentAnalyses,
  mapAiBeaconAssessmentAnalysisToQuestions,
};
