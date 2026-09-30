const Users = require("../models/userModel");
const Monitoring = require("../models/monitoringModel");
const Assessment = require("../models/assessmentModel");
const Response = require("../models/responseModel");
const CourseImprovement = require("../models/courseImprovementModel");
const sleep = require("../utils/sleep");
const {
  AiBeaconApiError,
  createAiBeaconApiClientForUser,
  createAiBeaconReadOnlyApiClientForUser,
} = require("../clients/aiBeacon.client");
const { UserType } = Users;
const {
  AssessmentStatus,
  QuestionType,
  LEARNING_ASSESSMENT_TYPES,
  MULTIPLE_CHOICE_QUESTION_TYPES,
} = Assessment;
const { CourseImprovementStatus } = CourseImprovement;

// AI Beacon rejects (400) a whole request when a single answer exceeds this length.
const MAX_ANSWER_LENGTH = 20000;

const OPEN_ENDED_QUESTION_TYPE = "text";
const MULTIPLE_CHOICES_QUESTION_TYPE = "checkbox";

// Polling of AI Beacon status endpoints for question generation, coach feedback and course sync.
// These are usually fast, but may take longer with a lot of context.
const DEFAULT_POLLING_TIMEOUT_MS = 5 * 60 * 1000;
const DEFAULT_POLLING_INTERVAL_MS = 2000;

// Course improvement report: up to ~15 min of generation, plus 2-3 min of cold start.
const COURSE_IMPROVEMENT_POLLING_TIMEOUT_MS = 30 * 60 * 1000;
const COURSE_IMPROVEMENT_POLLING_INTERVAL_MS = 10000;
// Time limit for the first POST of the report only: it carries all responses of a monitoring
// (up to ~10M characters), so it may take longer than the default 30s request timeout.
const COURSE_IMPROVEMENT_START_REQUEST_TIMEOUT_MS = 2 * 60 * 1000;
// A pending course improvement older than this has no job polling it anymore (e.g. the server
// restarted): the polling timeout plus the start request timeout.
const COURSE_IMPROVEMENT_PENDING_MAX_AGE_MS =
  COURSE_IMPROVEMENT_POLLING_TIMEOUT_MS + COURSE_IMPROVEMENT_START_REQUEST_TIMEOUT_MS;

// Status of an analysis job, as returned by the AI Beacon job endpoint
// (not to be confused with CourseImprovementStatus, the status of our own stored record).
const AI_BEACON_JOB_STATUS = {
  COMPLETED: "completed",
  FAILED: "failed",
};

// Codes set on the errors thrown while polling an analysis job.
const AI_BEACON_JOB_ERROR_CODE = {
  FAILED: "AI_BEACON_JOB_FAILED",
  TIMEOUT: "AI_BEACON_JOB_TIMEOUT",
};

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

function extractSummaryFromCoachFeedbackAnalysis(analysis) {
  if (!analysis || typeof analysis !== "object") {
    return "";
  }

  const structuredSummary = String(
    analysis?.structured_output?.summary ?? ""
  ).trim();
  if (structuredSummary) {
    return structuredSummary;
  }

  const parsedResponse = parseCoachFeedbackResponseField(analysis.response);
  const responseSummary = String(parsedResponse?.summary ?? "").trim();
  if (responseSummary) {
    return responseSummary;
  }

  return String(analysis?.summary ?? "").trim();
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

  while (Date.now() - startedAt < DEFAULT_POLLING_TIMEOUT_MS) {
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

    await sleep(DEFAULT_POLLING_INTERVAL_MS);
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

function createAnalysisJobError({ message, code, jobResponse }) {
  const error = new Error(message);
  error.code = code;
  error.jobResponse = jobResponse ?? null;
  return error;
}

/**
 * Polls an analysis job until it is completed. The job status response already contains the
 * analysis (`results[].result.structured_output`), so no extra fetch is needed.
 * Throws when the job fails or when `pollingTimeoutMs` is exceeded.
 *
 * @returns {Promise<Object>} The first job result: `{ ...result, analysis_id, structured_output }`.
 */
async function pollAnalysisJobForResult({
  client,
  courseId,
  jobId,
  pollingTimeoutMs,
  pollingIntervalMs,
}) {
  const jobPath = `/api/analysis/course/${encodeURIComponent(courseId)}/jobs/${encodeURIComponent(jobId)}`;
  const startedAt = Date.now();

  while (true) {
    const jobResponse = await client.get(jobPath);
    const status = String(jobResponse?.status || "").toLowerCase();

    if (status === AI_BEACON_JOB_STATUS.FAILED) {
      throw createAnalysisJobError({
        message: String(jobResponse?.error || "AI Beacon analysis job failed"),
        code: AI_BEACON_JOB_ERROR_CODE.FAILED,
        jobResponse,
      });
    }

    if (status === AI_BEACON_JOB_STATUS.COMPLETED) {
      const results = Array.isArray(jobResponse?.results) ? jobResponse.results : [];
      const first = results[0];
      if (!first) {
        throw createAnalysisJobError({
          message: "AI Beacon job completed without a result",
          code: AI_BEACON_JOB_ERROR_CODE.FAILED,
          jobResponse,
        });
      }
      return {
        ...(first.result || {}),
        analysis_id: first.analysis_id ?? null,
        structured_output: first.result?.structured_output,
      };
    }

    if (Date.now() - startedAt + pollingIntervalMs >= pollingTimeoutMs) {
      throw createAnalysisJobError({
        message: `AI Beacon analysis job timed out after ${pollingTimeoutMs}ms`,
        code: AI_BEACON_JOB_ERROR_CODE.TIMEOUT,
        jobResponse,
      });
    }

    await sleep(pollingIntervalMs);
  }
}

/**
 * Starts an analysis job (POST) and polls its status (GET) until the result is available.
 * Shared by question generation, coach feedback and course improvements.
 *
 * @param {Object} params
 * @param {number} [params.pollingTimeoutMs] - How long to poll before giving up.
 * @param {number} [params.pollingIntervalMs] - Delay between two status checks.
 * @param {Function} [params.onJobStarted] - Called with the job id once the job has been created.
 * @returns {Promise<Object>} See pollAnalysisJobForResult.
 */
async function runCourseAnalysisJob({
  client,
  courseId,
  startPath,
  startPayload,
  pollingTimeoutMs = DEFAULT_POLLING_TIMEOUT_MS,
  pollingIntervalMs = DEFAULT_POLLING_INTERVAL_MS,
  onJobStarted,
}) {
  const normalizedCourseId = String(courseId || "").trim();
  if (!normalizedCourseId) {
    throw new Error("courseId is required");
  }

  const startResponse = await client.post(startPath, startPayload);

  const jobId = String(startResponse?.job_id ?? "").trim();
  if (!jobId) {
    throw new Error("AI Beacon did not return a job id");
  }
  if (onJobStarted) {
    await onJobStarted(jobId);
  }

  return pollAnalysisJobForResult({
    client,
    courseId: normalizedCourseId,
    jobId,
    pollingTimeoutMs,
    pollingIntervalMs,
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
  question,
}) {
  const normalizedCourseId = String(courseId || "").trim();
  if (!normalizedCourseId) {
    throw new Error("courseId is required");
  }

  const feedback_text = String(feedbackText || "").trim();
  if (!feedback_text) {
    throw new Error("feedback_text is required");
  }

  const startPayload = {
    feedback_text,
    content_ids: [],
  };
  const normalizedQuestion = String(question || "").trim();
  if (normalizedQuestion) {
    startPayload.question = normalizedQuestion;
  }

  const client = await createAiBeaconReadOnlyApiClientForUser(userId);
  const analysis = await runCourseAnalysisJob({
    client,
    courseId: normalizedCourseId,
    startPath: `/api/analysis/course/${encodeURIComponent(normalizedCourseId)}/coach-feedback`,
    startPayload,
  });

  const summary = extractSummaryFromCoachFeedbackAnalysis(analysis);
  if (!summary) {
    throw new Error("AI Beacon did not return a summary");
  }

  return { summary };
}

/**
 * Normalizes an answer (string or array of strings) into a sorted, de-duplicated array of strings.
 * Used to compare a given answer with the expected correct answer regardless of order.
 */
function normalizeAnswer(value) {
  const values = Array.isArray(value) ? value : [value];
  return Array.from(
    new Set(
      values.filter((v) => v !== null && v !== undefined && v !== "").map(String)
    )
  ).sort();
}

/**
 * Checks whether an answer matches the correct answer (set equality, order-insensitive).
 */
function isAnswerCorrect(answer, correctAnswer) {
  const given = normalizeAnswer(answer);
  const expected = normalizeAnswer(correctAnswer);
  return (
    given.length === expected.length && given.every((v, i) => v === expected[i])
  );
}

/**
 * Computes the percentage (0-100, one decimal) of correct answers for a question.
 * Returns null when there are no answers.
 */
function computeCorrectAnswerPercentage(answers, correctAnswer) {
  if (answers.length === 0) return null;
  const correctCount = answers.filter((answer) =>
    isAnswerCorrect(answer, correctAnswer)
  ).length;
  return Math.round((correctCount / answers.length) * 1000) / 10;
}

/**
 * Whether a correct-answer percentage should be computed for this question.
 * Only for learning-type assessments, multiple-choice questions with a defined correct answer.
 */
function shouldComputeCorrectAnswerPercentage(assessmentType, question) {
  return (
    LEARNING_ASSESSMENT_TYPES.includes(assessmentType) &&
    MULTIPLE_CHOICE_QUESTION_TYPES.includes(question.questionType) &&
    normalizeAnswer(question.correctAnswer).length > 0
  );
}

/**
 * Text to send as the question: `question` is optional in DTC, so fall back to the short name.
 * Empty when the question has neither (such questions are left out of the payload).
 */
function resolveQuestionText(question) {
  return (
    String(question.question || "").trim() || String(question.shortName || "").trim()
  );
}

/**
 * Normalizes a given answer for the payload: no empty values, and values longer than
 * MAX_ANSWER_LENGTH are truncated so that one very long answer can't make the whole report fail.
 */
function toAnswerPayload(value) {
  return normalizeAnswer(value)
    .filter((entry) => entry.trim() !== "")
    .map((entry) => entry.slice(0, MAX_ANSWER_LENGTH));
}

/**
 * Extracts the question metadata we need to build the AI Beacon payload, from either
 * an assessment question or a response survey item (both share the same shape).
 */
function pickQuestionMetadata(question) {
  return {
    question: resolveQuestionText(question),
    questionType: question.questionType,
    learningType: question.learningType,
    choices: question.choices || [],
    correctAnswer: normalizeAnswer(question.correctAnswer),
    explanation: question.explanation,
  };
}

/**
 * Maps a question to the AI Beacon `kind` field.
 * `radio-ordered` is always a scale, even if it has options.
 */
function resolveQuestionKind(question) {
  if (String(question.questionType) === QuestionType.RADIO_ORDERED) {
    return "scale";
  }

  const hasCorrectAnswer = normalizeAnswer(question.correctAnswer).length > 0;
  const hasOptions = Array.isArray(question.choices) && question.choices.length > 0;
  if (hasCorrectAnswer && hasOptions) return "graded_choice";
  if (hasCorrectAnswer) return "graded_text";
  return "open";
}

/**
 * Maps an internal question (camelCase, DTC fields) to the AI Beacon question shape.
 */
function toAiBeaconQuestion(question, assessmentType) {
  const options = Array.isArray(question.choices)
    ? question.choices.map((option) => String(option || "").trim()).filter(Boolean)
    : [];
  const correctAnswer = normalizeAnswer(question.correctAnswer);
  const learningType = String(question.learningType || "").trim();
  const explanation = String(question.explanation || "").trim();

  const entry = {
    question: question.question,
    kind: resolveQuestionKind({ ...question, choices: options, correctAnswer }),
    answers: question.answers,
  };
  if (learningType) entry.learning_type = learningType;
  if (options.length > 0) entry.options = options;
  if (correctAnswer.length > 0) entry.correct_answer = correctAnswer;
  if (explanation) entry.explanation = explanation;
  if (shouldComputeCorrectAnswerPercentage(assessmentType, question)) {
    entry.correct_answer_percentage = computeCorrectAnswerPercentage(
      question.answers,
      correctAnswer
    );
  }
  return entry;
}

/**
 * Builds the payload of all responses of a monitoring, grouped by assessment then by question.
 * Private helper of getMonitoringResponsesPayload. Pure function: no database access.
 *
 * The payload is intentionally minimal: no internal DTC identifiers (monitoring, assessment,
 * question ids), no participant-related information (userId, email, displayName), and no
 * UI-only metadata. The course id is returned separately so it can be used in the URL,
 * not in the POST body.
 *
 * - Question metadata comes from the assessment (source of truth); questions only present in
 *   responses (stale snapshots) are appended using the response's own metadata.
 * - Lenient on data quality, since AI Beacon rejects the whole request for a single invalid
 *   entry: questions without any text (no `question` nor short name) or without any answer
 *   are left out, empty answers are dropped, very long answers are truncated, and assessments
 *   left without questions are dropped.
 * - Assessments without responses are dropped.
 * - `correct_answer_percentage` is only present for learning-type assessments and
 *   multiple-choice questions with a correct answer.
 *
 * @param {Object} params
 * @param {Object} params.monitoring - Monitoring document (only courseAiBeaconId is used).
 * @param {Array<Object>} params.assessments - Assessment documents, already ordered.
 * @param {Array<Object>} params.responses - Response documents for those assessments.
 * @returns {Object} `{ courseAiBeaconId, assessments: [{ type, day, questions }] }`.
 */
function buildMonitoringResponsesPayload({ monitoring, assessments, responses }) {
  const toPlain = (doc) =>
    doc && typeof doc.toObject === "function" ? doc.toObject() : doc;

  // Group responses by assessmentId
  const responsesByAssessmentId = new Map();
  for (const rawResponse of responses || []) {
    const response = toPlain(rawResponse);
    const key = String(response.assessmentId);
    if (!responsesByAssessmentId.has(key)) responsesByAssessmentId.set(key, []);
    responsesByAssessmentId.get(key).push(response);
  }

  const assessmentsPayload = [];

  for (const rawAssessment of assessments || []) {
    const assessment = toPlain(rawAssessment);
    const assessmentResponses =
      responsesByAssessmentId.get(String(assessment._id)) || [];
    if (assessmentResponses.length === 0) continue;

    // Ordered question map: assessment questions first (source of truth)
    const questionsById = new Map();
    for (const question of assessment.questions || []) {
      questionsById.set(String(question.questionId), {
        ...pickQuestionMetadata(question),
        answers: [],
      });
    }

    // Collect answers, appending unknown questions from the response snapshot
    for (const response of assessmentResponses) {
      for (const surveyItem of response.survey || []) {
        const key = String(surveyItem.questionId);
        if (!questionsById.has(key)) {
          questionsById.set(key, {
            ...pickQuestionMetadata(surveyItem),
            answers: [],
          });
        }
        const answer = toAnswerPayload(surveyItem.response);
        if (answer.length > 0) {
          questionsById.get(key).answers.push(answer);
        }
      }
    }

    const questions = Array.from(questionsById.values())
      .filter((question) => question.question && question.answers.length > 0)
      .map((question) => toAiBeaconQuestion(question, assessment.type));
    if (questions.length === 0) continue;

    assessmentsPayload.push({
      type: assessment.type,
      day: assessment.day,
      questions,
    });
  }

  const plainMonitoring = toPlain(monitoring) || {};

  return {
    courseAiBeaconId: plainMonitoring.courseAiBeaconId ?? null,
    assessments: assessmentsPayload,
  };
}

/**
 * Fetches all responses of a monitoring (all assessment types, all sessions) and builds the
 * payload to be sent to the AI Beacon API for course improvement suggestions.
 *
 * - Draft assessments are excluded.
 * - Teacher: only their own responses. Teacher-trainer: all responses of the monitoring.
 *
 * @param {string} monitoringId - The unique identifier of the monitoring.
 * @param {string} requesterId - The unique identifier of the current user.
 * @returns {Promise<Object>} The payload (see buildMonitoringResponsesPayload).
 */
async function getMonitoringResponsesPayload(monitoringId, requesterId) {
  if (!requesterId) {
    throw new Error("Missing requesterId for response retrieval");
  }

  const requester = await Users.findById(requesterId).select("userStatus");
  const status = String(requester?.userStatus || "");
  if (status !== UserType.TEACHER && status !== UserType.TEACHER_TRAINER) {
    throw new Error("Unauthorized: invalid user status");
  }

  const monitoring = await Monitoring.findById(monitoringId).select(
    "courseAiBeaconId"
  );
  if (!monitoring) {
    throw new Error("Monitoring not found");
  }

  const assessments = await Assessment.find({
    monitoringId: String(monitoringId),
    status: { $ne: AssessmentStatus.DRAFT },
  }).sort({ position: 1 });

  const assessmentIds = assessments.map((assessment) => assessment._id);
  const responseFilter = { assessmentId: { $in: assessmentIds } };
  if (status === UserType.TEACHER) {
    responseFilter.userId = requesterId;
  }

  const responses = await Response.find(responseFilter).select(
    "assessmentId survey completionDate"
  );

  return buildMonitoringResponsesPayload({ monitoring, assessments, responses });
}

/**
 * Extracts the improvement report from an AI Beacon analysis. The CourseImprovement `result`
 * schema mirrors `structured_output`, so this is a pass-through: unknown keys are dropped by
 * mongoose when saving. Returns null when there is nothing to store.
 */
function mapCourseImprovementResult(analysis) {
  const result = analysis?.structured_output;
  if (!result || typeof result !== "object" || Array.isArray(result)) return null;

  return Object.keys(result).length > 0 ? result : null;
}

/**
 * Message to store when AI Beacon rejected a request: its response body usually names the
 * exceeded limit (400), which is more useful than our generic error message.
 */
function extractAiBeaconErrorMessage(error) {
  if (error instanceof AiBeaconApiError) {
    const body = error.responseBody;
    const detail =
      typeof body === "string" ? body : body?.detail ?? body?.error ?? body?.message;
    const text =
      typeof detail === "string" ? detail : detail ? JSON.stringify(detail) : "";
    if (text.trim()) return text.trim();
  }
  return error?.message || "Course improvement generation failed";
}

/**
 * Marks pending course improvements that nobody is polling anymore (e.g. after a server
 * restart) as timed out, so they don't block new requests forever.
 */
async function expireStaleCourseImprovements({ monitoringId, requesterId }) {
  await CourseImprovement.updateMany(
    {
      monitoringId,
      requesterId,
      status: CourseImprovementStatus.PENDING,
      createdAt: { $lt: new Date(Date.now() - COURSE_IMPROVEMENT_PENDING_MAX_AGE_MS) },
    },
    {
      $set: {
        status: CourseImprovementStatus.TIMEOUT,
        error: "Course improvement generation timed out",
      },
    }
  );
}

function toCurrentJob(courseImprovement) {
  return {
    status: courseImprovement.status,
    error: courseImprovement.error ?? null,
    errorHttpStatus: courseImprovement.errorHttpStatus ?? null,
    createdAt: courseImprovement.createdAt,
  };
}

/**
 * Background part of the course improvement generation: sends the payload to AI Beacon, polls
 * the job until it is done and stores the outcome on the pending CourseImprovement. Never
 * rejects: failures are recorded on the document.
 */
async function runCourseImprovementJob({
  courseImprovementId,
  userId,
  courseId,
  startPayload,
}) {
  try {
    const client = await createAiBeaconApiClientForUser(userId, {
      requestTimeoutMs: COURSE_IMPROVEMENT_START_REQUEST_TIMEOUT_MS,
    });
    const analysis = await runCourseAnalysisJob({
      client,
      courseId,
      startPath: `/api/analysis/course/${encodeURIComponent(courseId)}/improvement-report`,
      startPayload,
      pollingTimeoutMs: COURSE_IMPROVEMENT_POLLING_TIMEOUT_MS,
      pollingIntervalMs: COURSE_IMPROVEMENT_POLLING_INTERVAL_MS,
      onJobStarted: (jobId) =>
        CourseImprovement.updateOne(
          { _id: courseImprovementId },
          { $set: { aiBeaconJobId: jobId } }
        ),
    });

    const result = mapCourseImprovementResult(analysis);
    if (!result) {
      throw new Error("AI Beacon did not return a course improvement analysis");
    }

    // Only update while still pending: a record expired as stale must not be overwritten.
    await CourseImprovement.updateOne(
      { _id: courseImprovementId, status: CourseImprovementStatus.PENDING },
      {
        $set: {
          status: CourseImprovementStatus.COMPLETED,
          analysisId: analysis.analysis_id ?? undefined,
          result,
        },
      }
    );
  } catch (error) {
    const isTimeout = error?.code === AI_BEACON_JOB_ERROR_CODE.TIMEOUT;
    try {
      await CourseImprovement.updateOne(
        { _id: courseImprovementId, status: CourseImprovementStatus.PENDING },
        {
          $set: {
            status: isTimeout
              ? CourseImprovementStatus.TIMEOUT
              : CourseImprovementStatus.FAILED,
            error: extractAiBeaconErrorMessage(error),
            ...(error instanceof AiBeaconApiError && { errorHttpStatus: error.status }),
          },
        }
      );
    } catch (updateError) {
      // Last resort: the outcome could not be stored, the record will expire as stale.
      console.error("Failed to store course improvement failure:", updateError);
    }
  }
}

/**
 * Starts the generation of course improvement suggestions for a monitoring and returns
 * immediately. The report can take a long time (up to ~15 min), so the AI Beacon call and
 * polling run in the background (see runCourseImprovementJob); clients poll
 * getCourseImprovementState.
 *
 * Only one pending job per monitoring and requester: if one is already running, no new job is
 * started and the running one is returned. (Question generation and coach feedback are
 * separate features and are not affected.)
 *
 * Uses the full API client (not the read-only one): this feature is used by authenticated
 * teachers and teacher-trainers.
 *
 * @param {Object} params
 * @param {string} params.userId - The current user (requester).
 * @param {string} params.monitoringId - The monitoring whose responses are analyzed.
 * @returns {Promise<{ currentJob: Object }>} The pending job (see toCurrentJob).
 */
async function startCourseImprovementGeneration({ userId, monitoringId }) {
  await expireStaleCourseImprovements({ monitoringId, requesterId: userId });

  const findPending = () =>
    CourseImprovement.findOne({
      monitoringId,
      requesterId: userId,
      status: CourseImprovementStatus.PENDING,
    }).select("status error errorHttpStatus createdAt");

  const alreadyPending = await findPending();
  if (alreadyPending) {
    return { currentJob: toCurrentJob(alreadyPending) };
  }

  const { courseAiBeaconId, assessments } = await getMonitoringResponsesPayload(
    monitoringId,
    userId
  );

  const courseId = String(courseAiBeaconId || "").trim();
  if (!courseId) {
    throw new Error("Monitoring is not linked to a synced course");
  }
  if (assessments.length === 0) {
    throw new Error("Monitoring has no responses to analyze");
  }

  let courseImprovement;
  try {
    courseImprovement = await CourseImprovement.create({
      monitoringId,
      requesterId: userId,
    });
  } catch (error) {
    // Concurrent request: the unique index on pending jobs rejected the second one.
    if (error?.code === 11000) {
      const concurrentlyPending = await findPending();
      if (concurrentlyPending) {
        return { currentJob: toCurrentJob(concurrentlyPending) };
      }
    }
    throw error;
  }

  // Intentionally not awaited: runs in the background and never rejects.
  runCourseImprovementJob({
    courseImprovementId: courseImprovement._id,
    userId,
    courseId,
    startPayload: { assessments, include_quotes: true },
  });

  return { currentJob: toCurrentJob(courseImprovement) };
}

/**
 * Returns the latest completed course improvement for this monitoring and requester, plus the
 * state of the most recent attempt when it is not completed (pending, failed or timeout), so
 * the previous report can stay visible while a new one is generated.
 * `courseImprovement` and `currentJob` are null when not applicable.
 */
async function getCourseImprovementState({ monitoringId, requesterId }) {
  if (!monitoringId || !requesterId) {
    throw new Error("monitoringId and requesterId are required");
  }

  await expireStaleCourseImprovements({ monitoringId, requesterId });

  const [courseImprovement, latestAttempt] = await Promise.all([
    CourseImprovement.findOne({
      monitoringId,
      requesterId,
      status: CourseImprovementStatus.COMPLETED,
    }).sort({ createdAt: -1 }),
    CourseImprovement.findOne({ monitoringId, requesterId })
      .sort({ createdAt: -1 })
      .select("status error errorHttpStatus createdAt"),
  ]);

  const currentJob =
    latestAttempt && latestAttempt.status !== CourseImprovementStatus.COMPLETED
      ? toCurrentJob(latestAttempt)
      : null;

  return { courseImprovement, currentJob };
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
  mapCourseImprovementResult,
  generateQuestionsFromAiBeacon,
  enrichCoachFeedbackFromAiBeacon,
  getMonitoringResponsesPayload,
  startCourseImprovementGeneration,
  getCourseImprovementState,
  createReadOnlyApiKeyForUser,
};
