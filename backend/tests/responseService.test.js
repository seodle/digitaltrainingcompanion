import { beforeAll, afterAll, describe, test, expect } from 'vitest';
const mongoose = require('mongoose');
const { ObjectId } = require('mongodb');
const MonitoringService = require('../services/monitoringService');
const AssessmentService = require('../services/assessmentService');
const { updateAssessmentSurvey } = require('../services/assessmentService');
const ResponseService = require('../services/responseService');
const Monitoring = require('../models/monitoringModel');
const Assessment = require('../models/assessmentModel');
const Response = require("../models/responseModel");
const User = require('../models/userModel');

// parameters
const userId = "67dd633041a25940eabca458"; // UPDATE this with yours


// Array of possible display names
const displayNames = [
    "John Doe", "Jane Smith", "Marco Polo", "Alice Wonderland",
    "Bob Builder", "Charlie Brown", "Dora Explorer", "Harry Potter",
    "Sherlock Holmes", "Tom Sawyer"
];
// Array of possible emails
const emails = [
    "superman@krypton.com", "wonderwoman@themyscira.com", "flash@centralcity.com", "aquaman@atlantis.com",
    "cyborg@starcity.com", "greenlantern@oa.com", "martianmanhunter@mars.com", "blackcanary@starcity.com",
    "hawkman@thanagar.com", "ironman@starkindustries.com", "spiderman@dailybugle.com", "captainamerica@shield.com",
    "thor@asgard.com", "hulk@avengers.com", "blackwidow@shield.com", "doctorstrange@sanctum.com",
    "scarletwitch@avengers.com", "vision@avengers.com", "antman@pymtech.com"
];
// all assessment types
const assessmentsTypes = ["Trainee characteristics", "Training characteristics", "Immediate reactions",
    "Sustainability conditions", "Student characteristics", "Organizational conditions", "Learning",
    "Behavioral changes", "Student learning outcomes"
]
// Array of possible responses
const possibleResponses = ["Very Weak", "Weak", "Neutral", "Strong", "Very Strong"];

let monitoring;

function randomElementFromArray(array) {
    return array[Math.floor(Math.random() * array.length)];
}

let assessments = [];

const createAssessmentAndReponsesForType = async (assessmentType, monitoringId) => {
    
    const assessmentData = {
        monitoringId: monitoring._Id,
        name: 'Test Assessment',
        day: 1,
        type: assessmentType,
        status: 'Open',
        position: 1,
    };
    const assessment = await AssessmentService.createAssessment(assessmentData);

    assessments.push(assessment);

    // create a questionnaire
    const questionnaire = {
        questionId: "0",
        shortName: "Questionnaire test",
        question: "To what extent do you intend to use what you've seen to conduct a classroom activity?",
        questionType: "radio-ordered",
        isMandatory: false,
        choices: possibleResponses,
        workshopId: null,
        competencies: [],
        response: [],
    };

    await updateAssessmentSurvey(assessment._id, [questionnaire]);


    // add different answers
    for (let i = 0; i < 100; i++) {
        // Select a random response
        questionnaire.response = randomElementFromArray(possibleResponses);

        // Create a new response using the chosen model
        const responseData = {
            userId: userId,
            email: randomElementFromArray(emails),
            monitoringId: monitoringId,
            assessmentId: assessment._id,
            assessmentType: assessment.type,
            survey: [questionnaire],
            displayName: randomElementFromArray(displayNames)
        };

        // Save the new response to the database
        const savedResponse = await new Response(responseData).save();
    }
}

// Establish a MongoDB memory server connection
// Connect to the database before running any tests
beforeAll(async () => {
    const localUri = "mongodb://localhost:27017/test_digitaltrainingcompanion";
    await mongoose.connect(localUri);

    await User.create({
        _id: userId,
        firstName: 'Test',
        lastName: 'Trainer',
        email: 'trainer@example.com',
        password: 'secret',
        termsAccepted: true,
        userStatus: 'Teacher-trainer',
        isVerified: true
    });

    const monitoringData = {
        orderId: 1,
        userId: userId,
        name: 'Test Monitoring',
        description: 'This is a test monitoring',
        creationDate: new Date(),
        lastModification: new Date(),
    };
    monitoring = await MonitoringService.createMonitoring(monitoringData);
    // create for each type questionnaire and questions
    for (const assessmentsType of assessmentsTypes) {
        await createAssessmentAndReponsesForType(assessmentsType, monitoring._id);
    }

    
});

// Disconnect and stop memory server
afterAll(async () => {
    // remove all monitoring for the userid
    await Monitoring.deleteMany({ });
    await Assessment.deleteMany({ });
    await Response.deleteMany({ });
    await User.deleteOne({ _id: userId });

    // disconnect the db
    await mongoose.disconnect();
});


describe('Create Reponses', () => {

    test('get responses from assessment', async () => {
        // Iterate over all assessment types
        for (const assessment of assessments) {
            // Retrieve responses for this specific assessment
            const responses = await ResponseService.getAnswersFromAssessmentId(assessment._id, userId);

            // Check that there are 100 responses for this assessment
            expect(responses.length).toBe(100);

            // Optionally, validate other properties for each response
            responses.forEach(response => {
                const questionnaire0 = response.survey[0];
                const responseChoice0 = questionnaire0.response;
                
                expect(userId).toBe(response.userId._id.toString());
                expect(emails).toContain(response.email);
                expect(String(monitoring._id)).toBe(String(response.monitoringId));
                expect(String(assessment._id)).toBe(String(response.assessmentId));
                expect(assessment.type).toBe(response.assessmentType);
                expect(possibleResponses).toContain(responseChoice0[0]);

                const isTeacherAssessmentType =
                    assessment.type === 'Student characteristics' ||
                    assessment.type === 'Student learning outcomes';
                if (isTeacherAssessmentType) {
                    expect(response.displayName).toBeUndefined();
                } else {
                    expect(displayNames).toContain(response.displayName);
                }
            });
        }

    });

    test('delete responses from assessment', async () => {
        const assessment = assessments[0];
        console.log(assessment._id)

        const initialCount = await Response.countDocuments({ assessmentId: assessment._id, userId: userId });
        expect(initialCount).toBeGreaterThan(0);

        const deletionResult = await ResponseService.deleteAnswersFromAssessment(assessment._id, userId);

        expect(deletionResult).toBeDefined();
        expect(deletionResult.message).toContain('deleted successfully');

        const finalCount = await Response.countDocuments({ assessmentId: assessment._id, userId: userId });
        expect(finalCount).toBe(0);
    });
    
});