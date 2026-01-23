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

module.exports = {OptionTypes, AssessmentType, UserType, QuestionType, LogType, LearningType, AdoptionType};