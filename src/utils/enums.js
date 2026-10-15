const OptionTypes = {
    DELETE: 'Delete',
    EDIT: 'Edit',
    PREVIEW: 'Preview',
    OPEN: 'Open',
    COPY: 'Copy',
    CLOSE: 'Close',
    DELETE_ALL_ANSWERS: 'Delete-answers',
    UNSHARE: 'Remove-monitoring',
};

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
}

const UserType = {
    TEACHER: "Teacher",
    TEACHER_TRAINER: "Teacher-trainer",
}

// Assessment types each kind of user can create / access, in display order
const ASSESSMENT_TYPES_BY_USER = {
    [UserType.TEACHER_TRAINER]: [
        AssessmentType.TRAINEE_CHARACTERISTICS,
        AssessmentType.TRAINING_CHARACTERISTICS,
        AssessmentType.IMMEDIATE_REACTIONS,
        AssessmentType.LEARNING,
        AssessmentType.ORGANIZATIONAL_CONDITIONS,
        AssessmentType.BEHAVIORAL_CHANGES,
        AssessmentType.SUSTAINABILITY_CONDITIONS,
        AssessmentType.STUDENT_CHARACTERISTICS,
        AssessmentType.STUDENT_LEARNING_OUTCOMES,
    ],
    [UserType.TEACHER]: [
        AssessmentType.STUDENT_CHARACTERISTICS,
        AssessmentType.IMMEDIATE_REACTIONS,
        AssessmentType.STUDENT_LEARNING_OUTCOMES,
    ],
};

const TEACHER_ASSESSMENT_TYPES = ASSESSMENT_TYPES_BY_USER[UserType.TEACHER];

// Canonical display order of all assessment types (1-based)
const ASSESSMENT_TYPE_ORDER = Object.fromEntries(
    ASSESSMENT_TYPES_BY_USER[UserType.TEACHER_TRAINER].map((type, index) => [type, index + 1])
);

// Assessment types that evaluate learning (knowledge / skills / attitudes)
const LEARNING_ASSESSMENT_TYPES = [
    AssessmentType.LEARNING,
    AssessmentType.STUDENT_LEARNING_OUTCOMES,
];

const QuestionType = {
    TEXT: "text",
    RADIO_ORDERED: "radio-ordered",
    RADIO_UNORDERED: "radio-unordered",
    CHECKBOX: "checkbox",
    SINGLE_TEXT: "single-text",
}

const LogType = {
    OBSERVATION: "Observation",
    CHANGE: "Change",
    ASK_FOR_HELP: "Ask for help",
}

const AdoptionType = {
    ACTUAL_USE_TRAINING_CONTENT: "actual_use_training_content",
    TRANSFER_DIGITAL_SKILLS: "transfer_digital_skills",
}

const LearningType = {
    KNOWLEDGE: "Knowledge",
    SKILL: "Skill",
    ATTITUDE: "Attitude"
}

module.exports = {OptionTypes, AssessmentType, ASSESSMENT_TYPES_BY_USER, TEACHER_ASSESSMENT_TYPES, ASSESSMENT_TYPE_ORDER, LEARNING_ASSESSMENT_TYPES, UserType, QuestionType, LogType, LearningType, AdoptionType};