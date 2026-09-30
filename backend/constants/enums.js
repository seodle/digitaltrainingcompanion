/**
 * Shared backend enums. Mirrors the frontend `src/utils/enums.js` values so the two
 * sides never drift; keep them in sync when adding a new type.
 */

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

const UserType = {
    TEACHER: "Teacher",
    TEACHER_TRAINER: "Teacher-trainer",
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

module.exports = {
    AssessmentType,
    AssessmentStatus,
    UserType,
    QuestionType,
    LEARNING_ASSESSMENT_TYPES,
    STUDENT_ASSESSMENT_TYPES,
    MULTIPLE_CHOICE_QUESTION_TYPES,
};
