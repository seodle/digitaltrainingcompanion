import { AssessmentType } from './enums';

export const assessmentTypeConfigs = {
    [AssessmentType.TRAINEE_CHARACTERISTICS]: {
        color: '#2196F3',
        icon: '👥',
        name: 'label_assessment_type_trainee_characteristics',
    },
    [AssessmentType.TRAINING_CHARACTERISTICS]: {
        color: '#9C27B0',
        icon: '📚',
        name: 'label_assessment_type_training_characteristics',
    },
    [AssessmentType.IMMEDIATE_REACTIONS]: {
        color: '#FF9800',
        icon: '⚡',
        name: 'label_assessment_type_immediate_reactions',
    },
    [AssessmentType.LEARNING]: {
        color: '#4CAF50',
        icon: '🎯',
        name: 'label_assessment_type_learning',
    },
    [AssessmentType.ORGANIZATIONAL_CONDITIONS]: {
        color: '#E91E63',
        icon: '🏢',
        name: 'label_assessment_type_organizational_conditions',
    },
    [AssessmentType.BEHAVIORAL_CHANGES]: {
        color: '#00BCD4',
        icon: '🔄',
        name: 'label_assessment_type_behavioral_changes',
    },
    [AssessmentType.SUSTAINABILITY_CONDITIONS]: {
        color: '#673AB7',
        icon: '♻️',
        name: 'label_assessment_type_sustainability_conditions',
    },
    [AssessmentType.STUDENT_CHARACTERISTICS]: {
        color: '#F44336',
        icon: '👨‍🎓',
        name: 'label_assessment_type_student_characteristics',
    },
    [AssessmentType.STUDENT_LEARNING_OUTCOMES]: {
        color: '#009688',
        icon: '📊',
        name: 'label_assessment_type_student_learning_outcomes',
    },
};

export const getAssessmentTypeConfig = (type) =>
    assessmentTypeConfigs[type] || { color: '#95A5A6', icon: '📋', name: type };
