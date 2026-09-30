const mongoose = require("mongoose");
const workshopSchema = require("./workshopSchema");

// Allowed values, exported with the model for use across the backend. Mirrors the frontend
// `src/utils/enums.js`: keep them in sync. Not enforced with `enum:` on the schema fields:
// existing documents may hold other values.
const AssessmentType = {
    TRAINEE_CHARACTERISTICS: "Trainee characteristics",
    TRAINING_CHARACTERISTICS: "Training characteristics",
    IMMEDIATE_REACTIONS: "Immediate reactions",
    SUSTAINABILITY_CONDITIONS: "Sustainability conditions",
    STUDENT_CHARACTERISTICS: "Student characteristics",
    ORGANIZATIONAL_CONDITIONS: "Organizational conditions",
    LEARNING: "Learning",
    BEHAVIORAL_CHANGES: "Behavioral changes",
    STUDENT_LEARNING_OUTCOMES: "Student learning outcomes",
};

const AssessmentStatus = {
    DRAFT: "Draft",
    OPEN: "Open",
    CLOSE: "Close",
};

const QuestionType = {
    TEXT: "text",
    RADIO_ORDERED: "radio-ordered",
    RADIO_UNORDERED: "radio-unordered",
    CHECKBOX: "checkbox",
    SINGLE_TEXT: "single-text",
};

/** Assessment types for which questions have a "correct answer" (learning-type). */
const LEARNING_ASSESSMENT_TYPES = [
    AssessmentType.LEARNING,
    AssessmentType.STUDENT_LEARNING_OUTCOMES,
];

/** Assessment types answered by students (as opposed to teachers). */
const STUDENT_ASSESSMENT_TYPES = [
    AssessmentType.STUDENT_CHARACTERISTICS,
    AssessmentType.STUDENT_LEARNING_OUTCOMES,
];

/** Question types with a fixed set of choices (multiple-choice style). */
const MULTIPLE_CHOICE_QUESTION_TYPES = [
    QuestionType.RADIO_ORDERED,
    QuestionType.RADIO_UNORDERED,
    QuestionType.CHECKBOX,
];

// Question Schema
const questionSchema = new mongoose.Schema({
    questionId: { type: String, required: true }, // used for the position of a question within the assessment
    shortName: { type: String }, // used to identify the question. Should be replaced by a unique identifier!!!
    question: { type: String },
    context: { type: String },
    questionType: { type: String },
    organizationalType: { type: String },
    learningType: { type: String },
    adoptionType: { type: String },
    isMandatory: { type: Boolean, default: false },
    choices: [String],
    workshopId: { type: mongoose.Schema.Types.ObjectId, default: null }, // Reference to embedded workshop
    correctAnswer: { type: [String], default: [] },
    explanation: { type: String },
    framework: { type: String },
    competencies: [String],
    response: [String],
    matrixId: { type: String }, // Matrix unique identifier
    matrixPosition: { type: Number }, // Position of the question within the matrix
    matrixTitle: { type: String },
    creationDate: { type: Date }
});

// Assessment Schema
const assessmentSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "Users" },
    monitoringId: String,
    name: String,
    day: String,
    type: String,
    status: String,
    creationDate: { type: Date, default: Date.now() }, // should be createdAt
    lastModificationDate: Date, // should be updatedAt
    scheduledSendAt: { type: Date, default: null },
    scheduledSendStatus: { type: String, enum: ['pending', 'sent', null], default: null },
    position: Number,
    workshops: { type: [workshopSchema], default: [] },
    questions: [questionSchema],
});

const model = mongoose.model("Assessment", assessmentSchema);
module.exports = Object.assign(model, {
    AssessmentType,
    AssessmentStatus,
    QuestionType,
    LEARNING_ASSESSMENT_TYPES,
    STUDENT_ASSESSMENT_TYPES,
    MULTIPLE_CHOICE_QUESTION_TYPES,
});