const mongoose = require("mongoose");

// Mirrors the frontend `src/utils/enums.js`: keep them in sync.
const CourseImprovementStatus = {
  PENDING: "pending",
  COMPLETED: "completed",
  FAILED: "failed",
  TIMEOUT: "timeout",
};

/** `kind` of a `comprehension` entry in the AI Beacon improvement report. */
const ComprehensionKind = {
  GRADED_CHOICE: "graded_choice",
  GRADED_TEXT: "graded_text",
};

const { Mixed } = mongoose.Schema.Types;

// The `result` mirrors the `structured_output` of the AI Beacon improvement report, so the
// mapping is a pass-through (unknown keys are dropped by mongoose). `comprehension` and
// `scales` are omitted by the API when no question of that kind was sent, hence no default.

const quoteSchema = new mongoose.Schema(
  {
    question: String,
    text: String,
    assessment: String,
    day: String,
  },
  { _id: false }
);

const themeSchema = new mongoose.Schema(
  {
    theme: String,
    // Number of participants mentioning the theme (not a ratio).
    prevalence: Number,
    // Only present for questions with enough answers.
    quotes: { type: [quoteSchema], default: undefined },
    recommendations: { type: [String], default: undefined },
    // Shape not specified yet by AI Beacon.
    locations: { type: [Mixed], default: undefined },
  },
  { _id: false }
);

// `graded_choice` and `graded_text` entries share this schema; use `kind` to tell them apart.
// correct/total/percentage/common_errors only exist for `graded_choice`,
// responses/common_shortfalls/frequently_correct only for `graded_text`.
const comprehensionSchema = new mongoose.Schema(
  {
    kind: { type: String, enum: Object.values(ComprehensionKind) },
    question: String,
    assessment: String,
    day: String,
    learning_type: String,
    correct: Number,
    total: Number,
    percentage: Number,
    common_errors: {
      type: [new mongoose.Schema({ answer: String, count: Number }, { _id: false })],
      default: undefined,
    },
    responses: Number,
    common_shortfalls: { type: [String], default: undefined },
    frequently_correct: { type: [String], default: undefined },
    locations: { type: [Mixed], default: undefined },
    recommendation: String,
  },
  { _id: false }
);

const scaleSchema = new mongoose.Schema(
  {
    question: String,
    assessment: String,
    day: String,
    options: { type: [String], default: undefined },
    // Parallel to `options`.
    counts: { type: [Number], default: undefined },
    // null on a tie.
    modal_option: { type: String, default: null },
    total: Number,
    unmatched: Number,
  },
  { _id: false }
);

const coverageSchema = new mongoose.Schema(
  {
    questions_received: Number,
    questions_used: Number,
    answers_received: Number,
    answers_used: Number,
    quotes_suppressed_small_n: Number,
    citations_unresolved: Number,
    batches: Number,
    batch_themes_unmerged: Number,
    questions_by_kind: {
      graded_choice: Number,
      graded_text: Number,
      scale: Number,
      open: Number,
    },
  },
  { _id: false }
);

const courseImprovementSchema = new mongoose.Schema({
  monitoringId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Monitoring",
    required: true,
  },
  requesterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Users",
    required: true,
  },
  status: {
    type: String,
    enum: Object.values(CourseImprovementStatus),
    default: CourseImprovementStatus.PENDING,
    required: true,
  },
  // Failure or timeout reason, when status is `failed` or `timeout`.
  error: { type: String },
  // HTTP status returned by AI Beacon when it rejected the request (e.g. 400 for size limits).
  errorHttpStatus: { type: Number },
  aiBeaconJobId: { type: String },
  analysisId: { type: String },
  result: {
    summary: { type: String, default: "" },
    themes: { type: [themeSchema], default: undefined },
    comprehension: { type: [comprehensionSchema], default: undefined },
    scales: { type: [scaleSchema], default: undefined },
    coverage: { type: coverageSchema },
  },
  createdAt: { type: Date, default: Date.now },
});

courseImprovementSchema.index({ monitoringId: 1, createdAt: -1 });
// At most one pending job per monitoring and requester.
courseImprovementSchema.index(
  { monitoringId: 1, requesterId: 1 },
  {
    unique: true,
    partialFilterExpression: { status: CourseImprovementStatus.PENDING },
  }
);

const model = mongoose.model("CourseImprovement", courseImprovementSchema);
module.exports = Object.assign(model, { CourseImprovementStatus, ComprehensionKind });
