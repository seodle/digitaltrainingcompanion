const Users = require("../models/userModel");
const sleep = require("../utils/sleep");
const {
  createAiBeaconApiClientForUser,
  createAiBeaconReadOnlyApiClientForUser,
} = require("../clients/aiBeacon.client");

const PROCESSING_POLL_INTERVAL_MS = 2000;
const PROCESSING_POLL_TIMEOUT_MS = 60000;
const ANALYSIS_JOB_POLL_INTERVAL_MS = 2000;
const ANALYSIS_JOB_POLL_MAX_ATTEMPTS = 60;
const OPEN_ENDED_QUESTION_TYPE = "text";
const MULTIPLE_CHOICES_QUESTION_TYPE = "checkbox";

function parseCoachFeedbackResponseField(responseField) {
  if (!responseField) return null;
  if (typeof responseField === "object") {
    return responseField;
  }
  if (typeof responseField !== "string") {
    return null;
  }

  try {
    const parsed = JSON.parse(responseField);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch (error) {
    return null;
  }
}

function extractImprovedDraftFromCoachFeedbackAnalysis(analysis) {
  if (!analysis || typeof analysis !== "object") {
    return "";
  }

  const structuredDraft = String(
    analysis?.structured_output?.improved_draft ?? ""
  ).trim();
  if (structuredDraft) {
    return structuredDraft;
  }

  const parsedResponse = parseCoachFeedbackResponseField(analysis.response);
  const responseDraft = String(parsedResponse?.improved_draft ?? "").trim();
  if (responseDraft) {
    return responseDraft;
  }

  return String(analysis?.improved_draft ?? "").trim();
}

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

function extractCourseContentIds(rawContents) {
  return extractCourseContents(rawContents)
    .map((item) => {
      const id = Number(item.id);
      return Number.isFinite(id) ? id : null;
    })
    .filter((id) => id !== null);
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
  const essayQuestions = Array.isArray(normalizedSource?.essay)
    ? normalizedSource.essay
    : normalizedSource?.essay && typeof normalizedSource.essay === "object"
      ? [normalizedSource.essay]
      : String(normalizedSource?.essay || "").trim()
        ? [{ question: String(normalizedSource.essay) }]
        : [];

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
        ? Object.entries(rawOptions)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([, label]) => String(label || "").trim())
            .filter((label) => label.length > 0)
        : [];

    const answerKey = String(entry?.correct_answer ?? "").trim();
    let correctAnswer = [];
    if (answerKey && rawOptions && typeof rawOptions === "object" && !Array.isArray(rawOptions)) {
      const matchedLabel = rawOptions[answerKey];
      if (matchedLabel) {
        correctAnswer = [String(matchedLabel).trim()];
      }
    } else if (answerKey && options.includes(answerKey)) {
      correctAnswer = [answerKey];
    }

    const questionName = String(entry?.question_name || "").trim();

    mappedQuestions.push({
      questionId: String(nextQuestionId),
      shortName: questionName || `Question ${nextQuestionId}`,
      question: questionText,
      questionType: MULTIPLE_CHOICES_QUESTION_TYPE,
      choices: options,
      correctAnswer,
      explanation: String(entry?.explanation || "").trim(),
      isMandatory: false,
      workshopId: null,
    });
    nextQuestionId += 1;
  });

  const mapOpenEndedEntry = (entry) => {
    const questionText = String(entry?.question || "").trim();
    if (!questionText) return;

    const questionName = String(entry?.question_name || "").trim();
    const answer = String(entry?.correct_answer ?? "").trim();

    mappedQuestions.push({
      questionId: String(nextQuestionId),
      shortName: questionName || `Question ${nextQuestionId}`,
      question: questionText,
      questionType: OPEN_ENDED_QUESTION_TYPE,
      choices: [],
      correctAnswer: answer ? [answer] : [],
      explanation: String(entry?.explanation || "").trim(),
      isMandatory: false,
      workshopId: null,
    });
    nextQuestionId += 1;
  };

  shortAnswerQuestions.forEach(mapOpenEndedEntry);
  essayQuestions.forEach(mapOpenEndedEntry);

  return mappedQuestions;
}

async function pollAnalysisJobForAnalysisId({ client, courseId, jobId }) {
  const normalizedCourseId = String(courseId || "").trim();
  const normalizedJobId = String(jobId || "").trim();
  if (!normalizedCourseId || !normalizedJobId) {
    return null;
  }

  let jobResponse = null;
  let pollAttempt = 0;
  do {
    jobResponse = await client.get(
      `/api/analysis/course/${encodeURIComponent(normalizedCourseId)}/jobs/${encodeURIComponent(normalizedJobId)}`
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
  if (finalStatus !== "completed") {
    return null;
  }

  const results = Array.isArray(jobResponse?.results) ? jobResponse.results : [];
  const firstResultWithAnalysisId = results.find(
    (result) =>
      result?.analysis_id !== undefined &&
      result?.analysis_id !== null &&
      String(result.analysis_id).trim() !== ""
  );

  if (!firstResultWithAnalysisId) {
    return null;
  }

  return String(firstResultWithAnalysisId.analysis_id);
}

async function fetchCourseAnalysisById({ client, courseId, analysisId }) {
  const normalizedCourseId = String(courseId || "").trim();
  const normalizedAnalysisId = String(analysisId || "").trim();
  if (!normalizedCourseId || !normalizedAnalysisId) {
    return null;
  }

  return client.get(
    `/api/analysis/course/${encodeURIComponent(normalizedCourseId)}/${encodeURIComponent(normalizedAnalysisId)}`
  );
}

async function runCourseAnalysisJob({ client, courseId, startPath, startPayload }) {
  const normalizedCourseId = String(courseId || "").trim();
  if (!normalizedCourseId) {
    throw new Error("courseId is required");
  }

  const startResponse = await client.post(startPath, startPayload);

  const jobId = startResponse?.job_id;
  if (jobId === undefined || jobId === null || String(jobId).trim() === "") {
    return null;
  }

  const analysisId = await pollAnalysisJobForAnalysisId({
    client,
    courseId: normalizedCourseId,
    jobId,
  });
  if (!analysisId) {
    return null;
  }

  return fetchCourseAnalysisById({
    client,
    courseId: normalizedCourseId,
    analysisId,
  });
}

async function generateAssessmentAnalyses({
  userId,
  courseId,
  analysisTypes,
  contentIds,
  numberOfQuestions,
  questionCategory,
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
  const normalizedNumberOfQuestions = Number(numberOfQuestions);
  const normalizedQuestionCategory = String(questionCategory || "")
    .trim()
    .toLowerCase();

  const analysisType = Array.isArray(analysisTypes)
    ? analysisTypes[0]
    : analysisTypes;
  const analyzePayload = { analysis_type: analysisType };
  if (normalizedContentIds !== undefined) {
    analyzePayload.content_ids = normalizedContentIds;
  }
  if (
    normalizedQuestionCategory &&
    Number.isInteger(normalizedNumberOfQuestions) &&
    normalizedNumberOfQuestions > 0
  ) {
    analyzePayload.question_categories = {
      [normalizedQuestionCategory]: normalizedNumberOfQuestions,
    };
  }

  const client = await createAiBeaconApiClientForUser(userId);
  const analysisResponse = await runCourseAnalysisJob({
    client,
    courseId: normalizedCourseId,
    startPath: `/api/analysis/course/${encodeURIComponent(normalizedCourseId)}/analyze`,
    startPayload: analyzePayload,
  });

  return { duplicates: [], analysis: analysisResponse };
}

async function generateQuestionsFromAiBeacon({
  userId,
  courseId,
  contentIds,
  numberOfQuestions,
  questionCategory,
}) {
  const { analysis } = await generateAssessmentAnalyses({
    userId,
    courseId,
    analysisTypes: ["assessment_generation"],
    contentIds,
    numberOfQuestions,
    questionCategory,
  });

  return mapAiBeaconAssessmentAnalysisToQuestions(analysis);
}

async function enrichCoachFeedbackFromAiBeacon({
  userId,
  courseId,
  feedbackText,
  contentIds,
}) {
  const normalizedCourseId = String(courseId || "").trim();
  if (!normalizedCourseId) {
    throw new Error("courseId is required");
  }

  const feedback_text = String(feedbackText || "").trim();
  if (!feedback_text) {
    throw new Error("feedback_text is required");
  }

  const content_ids = Array.isArray(contentIds)
    ? contentIds.map((id) => Number(id)).filter((id) => Number.isFinite(id))
    : [];
  if (content_ids.length === 0) {
    throw new Error("content_ids must be a non-empty array");
  }

  const client = await createAiBeaconReadOnlyApiClientForUser(userId);
  const analysis = await runCourseAnalysisJob({
    client,
    courseId: normalizedCourseId,
    startPath: `/api/analysis/course/${encodeURIComponent(normalizedCourseId)}/coach-feedback`,
    startPayload: { feedback_text, content_ids },
  });

  const improvedDraft = extractImprovedDraftFromCoachFeedbackAnalysis(analysis);
  if (!improvedDraft) {
    throw new Error("AI Beacon did not return an improved draft");
  }

  return { improvedDraft };
}

async function createReadOnlyApiKeyForUser(userId) {
  const client = await createAiBeaconApiClientForUser(userId);
  const response = await client.post("/api/users/me/api-keys", {
    name: "read-only",
    "expires_in_days": 365,
    scopes: ["analysis:read"],
  });

  const readOnlyKey = String(
    response?.key ?? response?.api_key ?? response?.token ?? ""
  ).trim();
  if (!readOnlyKey) {
    throw new Error("AI Beacon did not return a read-only API key");
  }

  return readOnlyKey;
}

module.exports = {
  extractAvailableCourses,
  extractSyncedCourses,
  extractCourseContents,
  extractCourseContentIds,
  resolveLmsConnectionId,
  waitForCourseProcessingCompletion,
  isCourseProcessingDone,
  generateAssessmentAnalyses,
  mapAiBeaconAssessmentAnalysisToQuestions,
  generateQuestionsFromAiBeacon,
  enrichCoachFeedbackFromAiBeacon,
  createReadOnlyApiKeyForUser,
};
