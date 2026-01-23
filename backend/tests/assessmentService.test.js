import { beforeAll, afterAll, describe, test, expect } from 'vitest';
const mongoose = require('mongoose');
const AssessmentService = require('../services/assessmentService');
const MonitoringService = require('../services/monitoringService');
const Assessment = require('../models/assessmentModel');
const Monitoring = require('../models/monitoringModel');

const userId = "67dd633041a25940eabca458"; // UPDATE this with yours
const possibleResponses = ["Very Weak", "Weak", "Neutral", "Strong", "Very Strong"];

let monitoring;
let assessment;
let questionnaire;

beforeAll(async () => {
    const localUri = "mongodb://localhost:27017/test_digitaltrainingcompanion"; // TODO: add this in a config file
    await mongoose.connect(localUri);
    
    const monitoringData = {
        orderId: 1,
        userId: userId,
        name: 'Test Monitoring',
        description: 'This is a test monitoring',
        creationDate: new Date(),
        lastModification: new Date(),
    };
    monitoring = await MonitoringService.createMonitoring(monitoringData);

    questionnaire = {
        questionId: "0",
        shortName: "Questionnaire test",
        question: "To what extent do you intend to use what you've seen to conduct a classroom activity?",
        questionType: "radio-ordered",
        isMandatory: false,
        choices: possibleResponses,
        workshopId: null,
        correctAnswer: [],
        competencies: [],
        response: [],
    };

    const assessmentData = {
        monitoringId: monitoring._id,
        name: 'Test Assessment',
        day: 1,
        type: 'Type1',
        status: 'Draft',
        questions: [questionnaire]
    };
    assessment = await new Assessment(assessmentData).save();
});

// Disconnect and stop memory server
afterAll(async () => {
    await Monitoring.deleteMany({});
    await Assessment.deleteMany({});
    // disconnect the db
    await mongoose.disconnect();
});

describe('Assessment Service', () => {
    // Test for creating an assessment
    test('createAssessment adds an assessment to the database', async () => {
        const assessmentData = {
            monitoringId: monitoring._id,
            name: 'Test Assessment 2',
            day: 1,
            type: 'Type1',
            status: 'Draft',
        };

        const createdAssessment = await AssessmentService.createAssessment(assessmentData);

        expect(createdAssessment).toBeDefined();
        expect(createdAssessment.name).toEqual(assessmentData.name);
    });

    // Test for fetching an assessment by ID
    test('getAssessmentsByMonitoringId retrieves assessments for a given monitoringId', async () => {
        const assessments = await AssessmentService.getAssessmentsByMonitoringId(assessment.monitoringId);

        expect(assessments).toBeDefined();
        expect(assessments.length).toBeGreaterThan(0);
        expect(assessments[0].name).toEqual(assessment.name);
    });

    // Test for updating an assessment
    test('updateAssessment updates an assessment', async () => {
        const updatedData = { name: 'Updated Assessment' };
        const updatedAssessment = await AssessmentService.updateAssessment(assessment._id, updatedData);

        expect(updatedAssessment).toBeDefined();
        expect(updatedAssessment.name).toEqual(updatedData.name);
    });

    test('Retrieving survey data linked to an assessment', async () => {
        const surveyData = await AssessmentService.fetchSurveyData(assessment._id);
    
        // Assertions to verify the questionnaire was retrieved correctly
        expect(surveyData).toBeDefined();
        expect(surveyData.data.survey[0].shortName).toBe(questionnaire.shortName);
    });

    test('Update survey data linked to an assessment', async () => {
        questionnaire.shortName = "Questionnaire test 2";
        
        const updatedSurveyData = await AssessmentService.updateAssessmentSurvey(assessment._id, [questionnaire]);

        expect(updatedSurveyData).toBeDefined();
        expect(updatedSurveyData[0].shortName).toBe(questionnaire.shortName);
    });

    // Test for deleting an assessment
    test('deleteAssessment deletes an assessment', async () => {
        const deletionResult = await AssessmentService.deleteAssessment(assessment._id);
        const assessmentPostDeletion = await Assessment.findById(assessment._id);

        expect(deletionResult).toBeDefined();
        expect(deletionResult.message).toContain('successfully');
        expect(assessmentPostDeletion).toBeNull();
    });

    // Test for deleting all assessments associated with a specific monitoring ID
    test('deleteAssessmentsFromMonitoring deletes all assessments for a monitoringId', async () => {
        const monitoringId = assessment.monitoringId; // Use the monitoringId from the createdAssessment

        const assessmentsPreDeletion = await AssessmentService.getAssessmentsByMonitoringId(monitoringId);
        expect(assessmentsPreDeletion.length).toBeGreaterThan(0);

        const deletionResult = await AssessmentService.deleteAssessmentsFromMonitoring(monitoringId);
        expect(deletionResult).toBeDefined();

        const assessmentsPostDeletion = await AssessmentService.getAssessmentsByMonitoringId(monitoringId);
        expect(assessmentsPostDeletion.length).toBe(0);
    });
});