const express = require("express");
const router = express.Router();
const ApiKey = require('../models/apiKeysModel');
const Assessment = require('../models/assessmentModel');
const Response = require('../models/responseModel');
const User = require('../models/userModel');

// Verify API key middleware
const verifyApiKey = async (req, res, next) => {
    try {
        const apiKey = req.headers['x-api-key'] || req.query.key;

        if (!apiKey) {
            return res.status(401).json({ error: 'API key is required' });
        }

        // Find and verify the API key
        const key = await ApiKey.findOne({ key: apiKey });

        if (!key) {
            return res.status(401).json({ error: 'Invalid API key' });
        }

        // Update last used timestamp
        key.lastUsed = new Date();
        await key.save();

        // Add key info to request
        req.apiKey = key;
        next();
    } catch (error) {
        console.error('API key verification error:', error);
        res.status(500).json({ error: 'Error verifying API key' });
    }
};

// Get embedded question route
router.get('/embed/assessment/:assessmentId/question/:questionId', verifyApiKey, async (req, res) => {
    try {
        const { assessmentId, questionId } = req.params;
        const apiKey = req.headers['x-api-key'] || req.query.key;
        let lng = req.query.lng || 'en';

        // Ensure lng is only fr, en or de
        if (!['fr', 'en', 'de', 'it', 'es'].includes(lng)) {
            lng = 'en';
        }

        // Translations object
        const translations = {
            en: {
                namePlaceholder: "Enter your name or a nickname",
                submitButton: "Submit",
                thankYouMessage: "Thank you for your response!",
                provideAnswer: "Please provide an answer",
                selectOption: "Please select an option",
                selectAtLeastOne: "Please select at least one option",
                failedSubmit: "Failed to submit response. Please try again.",
                title: "Survey Question"
            },
            fr: {
                namePlaceholder: "Entrez votre nom ou un surnom",
                submitButton: "Envoyer",
                thankYouMessage: "Merci pour votre réponse !",
                provideAnswer: "Veuillez fournir une réponse",
                selectOption: "Veuillez sélectionner une option",
                selectAtLeastOne: "Veuillez sélectionner au moins une option",
                failedSubmit: "Échec de l'envoi de la réponse. Veuillez réessayer.",
                title: "Question du sondage"
            },
            de: {
                namePlaceholder: "Geben Sie Ihren Namen ein oder einen Spitznamen",
                submitButton: "Absenden",
                thankYouMessage: "Vielen Dank für Ihre Antwort!",
                provideAnswer: "Bitte geben Sie eine Antwort ein",
                selectOption: "Bitte wählen Sie eine Option",
                selectAtLeastOne: "Bitte wählen Sie mindestens eine Option",
                failedSubmit: "Antwort konnte nicht gesendet werden. Bitte versuchen Sie es erneut.",
                title: "Umfrage Frage"
            },
            it: {
                namePlaceholder: "Inserisci il tuo nome o un soprannome",
                submitButton: "Invia",
                thankYouMessage: "Grazie per la tua risposta!",
                provideAnswer: "Per favore fornisci una risposta",
                selectOption: "Per favore seleziona un'opzione",
                selectAtLeastOne: "Per favore seleziona almeno un'opzione",
                failedSubmit: "Invio della risposta fallito. Per favore riprova.",
                title: "Domanda del sondaggio"
            },
            es: {
                namePlaceholder: "Ingresa tu nombre o un apodo",
                submitButton: "Enviar",
                thankYouMessage: "¡Gracias por tu respuesta!",
                provideAnswer: "Por favor proporciona una respuesta",
                selectOption: "Por favor selecciona una opción",
                selectAtLeastOne: "Por favor selecciona al menos una opción",
                failedSubmit: "Error al enviar la respuesta. Por favor intenta nuevamente.",
                title: "Pregunta de la encuesta"
            }
        };
        // Get translations for current language
        const t = translations[lng];

        // Find the assessment and question
        const assessment = await Assessment.findById(assessmentId);
        if (!assessment) {
            return res.status(404).send('Assessment not found');
        }

        const question = assessment.questions.find(q =>
            q.questionId === questionId || q._id.toString() === questionId
        );
        if (!question) {
            return res.status(404).send('Question not found');
        }

        // Check if this is a matrix question and get all related questions
        let matrixQuestions = [];
        if (question.matrixId) {
            matrixQuestions = assessment.questions
                .filter(q => q.matrixId === question.matrixId)
                .sort((a, b) => a.matrixPosition - b.matrixPosition);
        }

        // Function to generate input section based on question type
        const getInputSection = (question, matrixQuestions) => {
            // If it's a matrix question, generate matrix table
            if (question.matrixId && matrixQuestions.length > 0) {
                return `
                    <div class="matrix-container">
                        <table class="matrix-table">
                            <thead>
                                <tr>
                                    <th class="matrix-question-header"></th>
                                    ${question.choices.map(choice => `
                                        <th class="matrix-choice-header">${choice}</th>
                                    `).join('')}
                                </tr>
                            </thead>
                            <tbody>
                                ${matrixQuestions.map((matrixQ, index) => `
                                    <tr>
                                        <td class="matrix-question-cell">${matrixQ.question}</td>
                                        ${question.choices.map(choice => `
                                            <td class="matrix-choice-cell">
                                                <input 
                                                    type="${question.questionType === 'checkbox' ? 'checkbox' : 'radio'}" 
                                                    name="answer_${index}" 
                                                    value="${choice}"
                                                    data-question-index="${index}"
                                                    data-question-id="${matrixQ.questionId}"
                                                >
                                            </td>
                                        `).join('')}
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                `;
            }

            // Regular question types (non-matrix)
            switch (question.questionType) {
                case 'radio-ordered':
                case 'radio-unordered':
                    return `
                        <div class="options">
                            ${question.choices.map(choice => `
                                <label class="option">
                                    <input 
                                        type="radio" 
                                        name="answer" 
                                        value="${choice}"
                                        style="margin-right: 10px;"
                                    >
                                    ${choice}
                                </label>
                            `).join('')}
                        </div>
                    `;
                case 'text':
                    return `
                        <div class="answer-section">
                            <textarea 
                                class="text-input" 
                                id="answer"
                                rows="4"
                            ></textarea>
                        </div>
                    `;
                case 'checkbox':
                    return `
                        <div class="checkbox-group">
                            ${question.choices.map(choice => `
                                <label class="option">
                                    <input 
                                        type="checkbox" 
                                        name="answer" 
                                        value="${choice}"
                                        style="margin-right: 10px;"
                                    >
                                    ${choice}
                                </label>
                            `).join('')}
                        </div>
                    `;
                default:
                    return '';
            }
        };

        const html = `
        <!DOCTYPE html>
        <html lang="${lng}">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${t.title}</title>
            <style>
                /* Ensure layout never exceeds iframe width */
                html, body {
                    width: 100%;
                    max-width: 100%;
                    overflow-x: hidden;
                    box-sizing: border-box;
                }
                *, *::before, *::after { box-sizing: inherit; }
                body {
                    font-family: Arial, sans-serif;
                    margin: 0;
                    padding: 20px;
                    background-color: inherit;
                    color: inherit;
                }
                .question-container {
                    width: 100%;
                    max-width: 100%;
                    margin: 0 auto;
                }
                .question {
                    font-size: 16px;
                    color: inherit;
          
                }
                .context {
                    color: #666;
                    margin-bottom: 15px;
                    font-size: 14px;
                }
                .options {
                    display: flex;
                    flex-direction: row;
                    flex-wrap: wrap;
                    color: inherit;
                }
                .checkbox-group {
                    display: flex;
                    flex-direction: row;
                    flex-wrap: wrap;
                }
                .option {
                    display: flex;
                    align-items: center;
                    padding: 10px;
                    border-radius: 4px;
                    cursor: pointer;
                    transition: inherit 0.2s;
                }
                .option:hover {
                    background-color: #f5f5f5;
                }
                .text-input {
                    width: 100%;
                    padding: 10px;
                    border: 1px solid #ccc;
                    border-radius: 4px;
                    font-size: 14px;
                    resize: vertical;
                }
                .display-name-section {
                    margin-top: 20px;
                    margin-bottom: 10px;
                }
                .display-name-input {
                    width: 100%;
                    padding: 8px;
                    border: 1px solid #ccc;
                    border-radius: 4px;
                    font-size: 14px;
                }
                .display-name-label {
                    display: block;
                    margin-bottom: 5px;
                    color: #333;
                    font-weight: 500;
                }
                .submit-button {
                    margin-top: 20px;
                    padding: 10px 20px;
                    background-color: #F7941E;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 14px;
                }
                .submit-button:hover {
                    background-color: #D17A1D;
                }
                .success-message {
                    display: none;
                    color: green;
                    text-align: center;
                    padding: 20px;
                }
                .error-message {
                    display: none;
                    color: red;
                    margin-top: 10px;
                }
                .matrix-container {
                    margin: 20px 0;
                    overflow-x: hidden; /* prevent horizontal scrollbar */
                }
                .matrix-table {
                    width: 100%;
                    max-width: 100%;
                    border-collapse: collapse;
                    margin: 15px 0;
                    font-size: 14px;
                    table-layout: fixed; /* force cells to shrink to fit */
                }
                .matrix-table th,
                .matrix-table td {
                    border: 1px solid #ddd;
                    padding: 12px 8px;
                    text-align: center;
                    word-wrap: break-word;
                    word-break: break-word;
                    white-space: normal;
                    max-width: 100%;
                }
                .matrix-question-header {
                    background-color: #f8f9fa;
                    font-weight: bold;
                    text-align: left;
                    min-width: 0; /* allow shrinking */
                }
                .matrix-choice-header {
                    background-color: #f8f9fa;
                    font-weight: bold;
                    min-width: 0; /* allow shrinking */
                }
                .matrix-question-cell {
                    text-align: left;
                    font-weight: 500;
                    background-color: #fafafa;
                    padding: 12px;
                }
                .matrix-choice-cell {
                    text-align: center;
                    padding: 8px;
                }
                .matrix-choice-cell input[type="radio"],
                .matrix-choice-cell input[type="checkbox"] {
                    margin: 0;
                    transform: scale(1.2);
                }
            </style>
        </head>
        <body>
            <div class="question-container">
                <div class="question">${question.matrixId ? question.matrixTitle : question.question}</div>
                ${question.context ? `<div class="context">${question.context}</div>` : ''}
                ${getInputSection(question, matrixQuestions)}
                <div class="display-name-section">
                    <input 
                        type="text" 
                        id="displayName" 
                        class="display-name-input"
                        placeholder="${t.namePlaceholder}"
                    >
                </div>
                <div class="error-message" id="error-message"></div>
                <button class="submit-button" onclick="submitAnswer()">${t.submitButton}</button>
                <div class="success-message" id="success-message">
                    ${t.thankYouMessage}
                </div>
            </div>

            <script>
                const translations = ${JSON.stringify(t)};
                
                async function submitAnswer() {
                    let answer;
                    const errorMessage = document.getElementById('error-message');
                    const successMessage = document.getElementById('success-message');
                    const displayName = document.getElementById('displayName').value.trim();
                    
                    errorMessage.style.display = 'none';
                    
                    // Check if this is a matrix question
                    const isMatrix = ${question.matrixId ? 'true' : 'false'};
                    
                    if (isMatrix) {
                        // Handle matrix questions
                        const matrixAnswers = [];
                        const matrixQuestions = ${JSON.stringify(matrixQuestions.map(q => ({ questionId: q.questionId, question: q.question })))};
                        
                        for (let i = 0; i < matrixQuestions.length; i++) {
                            if ('${question.questionType}' === 'checkbox') {
                                const checkboxes = document.querySelectorAll(\`input[name="answer_\${i}"]:checked\`);
                                const selectedValues = Array.from(checkboxes).map(cb => cb.value);
                                matrixAnswers.push(selectedValues);
                            } else {
                                const selectedOption = document.querySelector(\`input[name="answer_\${i}"]:checked\`);
                                matrixAnswers.push(selectedOption ? selectedOption.value : null);
                            }
                        }
                        
                        // Validate that all matrix questions have answers
                        const hasEmptyAnswers = matrixAnswers.some(ans => 
                            ans === null || (Array.isArray(ans) && ans.length === 0)
                        );
                        
                        if (hasEmptyAnswers) {
                            errorMessage.textContent = translations.selectOption;
                            errorMessage.style.display = 'block';
                            return;
                        }
                        
                        answer = matrixAnswers;
                    } else {
                        // Handle regular questions
                        switch('${question.questionType}') {
                            case 'text':
                                answer = document.getElementById('answer')?.value;
                                if (!answer || answer.trim() === '') {
                                    errorMessage.textContent = translations.provideAnswer;
                                    errorMessage.style.display = 'block';
                                    return;
                                }
                                break;
                            case 'checkbox':
                                const checkboxes = document.querySelectorAll('input[name="answer"]:checked');
                                answer = Array.from(checkboxes).map(cb => cb.value);
                                if (answer.length === 0) {
                                    errorMessage.textContent = translations.selectAtLeastOne;
                                    errorMessage.style.display = 'block';
                                    return;
                                }
                                break;
                            case 'radio-ordered':
                            case 'radio-unordered':
                                const selectedOption = document.querySelector('input[name="answer"]:checked');
                                if (!selectedOption) {
                                    errorMessage.textContent = translations.selectOption;
                                    errorMessage.style.display = 'block';
                                    return;
                                }
                                answer = selectedOption.value;
                                break;
                        }
                    }

                    try {
                        const response = await fetch('/embed/assessment/${assessmentId}/question/${questionId}/responses', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'x-api-key': '${apiKey}'
                            },
                            body: JSON.stringify({
                                answer: answer,
                                displayName: displayName
                            })
                        });

                        if (response.ok) {
                            const inputSection = document.querySelector('.answer-section') || 
                                               document.querySelector('.options') || 
                                               document.querySelector('.checkbox-group');
                            if (inputSection) inputSection.style.display = 'none';
                            document.querySelector('.display-name-section').style.display = 'none';
                            document.querySelector('.submit-button').style.display = 'none';
                            successMessage.style.display = 'block';
                        } else {
                            throw new Error('Failed to submit response');
                        }
                    } catch (error) {
                        errorMessage.textContent = translations.failedSubmit;
                        errorMessage.style.display = 'block';
                    }
                }
            </script>
        </body>
        </html>
        `;

        res.send(html);
    } catch (error) {
        console.error('Error serving question:', error);
        res.status(500).send('Error loading question');
    }
});

// Submit response route
router.post('/embed/assessment/:assessmentId/question/:questionId/responses', verifyApiKey, async (req, res) => {
    try {
        const { assessmentId, questionId } = req.params;
        const { answer, displayName } = req.body;

        console.log('Submitting response:', { assessmentId, questionId, answer, displayName });

        if (!answer) {
            return res.status(400).json({ error: 'Answer is required' });
        }

        // Find the assessment
        const assessment = await Assessment.findById(assessmentId);
        if (!assessment) {
            return res.status(404).json({ error: 'Assessment not found' });
        }

        // Find the question to get its details
        const question = assessment.questions.find(q =>
            q.questionId === questionId || q._id.toString() === questionId
        );

        if (!question) {
            return res.status(404).json({ error: 'Question not found' });
        }

        // Find the user's email
        const user = await User.findById(assessment.userId);
        const userEmail = user ? user.email : null;

        let surveyData = [];

        // Handle matrix questions differently
        if (question.matrixId) {
            // Get all questions in the matrix
            const matrixQuestions = assessment.questions
                .filter(q => q.matrixId === question.matrixId)
                .sort((a, b) => a.matrixPosition - b.matrixPosition);

            // Store one response per matrix question (aligned with standard survey storage)
            console.log('Original answer from iframe:', answer);

            matrixQuestions.forEach((matrixQ, index) => {
                const matrixAnswer = Array.isArray(answer) ? answer[index] : undefined;

                // Skip if no answer provided for this row
                if (matrixAnswer === undefined || matrixAnswer === null || (Array.isArray(matrixAnswer) && matrixAnswer.length === 0)) {
                    return;
                }

                const responseValue = matrixQ.questionType === 'checkbox'
                    ? (Array.isArray(matrixAnswer) ? matrixAnswer : [matrixAnswer])
                    : [matrixAnswer];

                surveyData.push({
                    questionId: matrixQ.questionId,
                    shortName: matrixQ.shortName,
                    question: matrixQ.question,
                    questionType: matrixQ.questionType,
                    isMandatory: matrixQ.isMandatory,
                    choices: matrixQ.choices,
                    workshopId: matrixQ.workshopId || "",
                    correctAnswer: matrixQ.correctAnswer || [],
                    competencies: matrixQ.competencies || [],
                    response: responseValue,
                    matrixId: matrixQ.matrixId,
                    matrixPosition: matrixQ.matrixPosition,
                    matrixTitle: matrixQ.matrixTitle
                });
            });
        } else {
            // Handle regular questions
            surveyData.push({
                questionId: question.questionId,
                shortName: question.shortName,
                question: question.question,
                questionType: question.questionType,
                isMandatory: question.isMandatory,
                choices: question.choices,
                workshopId: question.workshopId || "",
                correctAnswer: question.correctAnswer || [],
                competencies: question.competencies || [],
                response: question.questionType === 'checkbox' ? answer : [answer],
                matrixId: question.matrixId || undefined,
                matrixPosition: question.matrixPosition || undefined,
                matrixTitle: question.matrixTitle || undefined
            });
        }

        // Create new response document
        const response = new Response({
            userId: assessment.userId,
            email: userEmail,
            monitoringId: assessment.monitoringId,
            assessmentId: assessment._id,
            survey: surveyData,
            displayName: displayName || "Anonymous",
        });

        // Save the response
        await response.save();
        console.log('Response saved successfully:', response);

        // Update the assessment's lastModificationDate
        assessment.lastModificationDate = new Date();
        await assessment.save();

        res.status(201).json({
            message: 'Response submitted successfully',
            responseId: response._id,
            timestamp: new Date()
        });

    } catch (error) {
        console.error('Error submitting response:', error);
        res.status(500).json({ error: 'Error submitting response' });
    }
});

// Optional: Add a route to check embedded question status
router.get('/embed/assessment/:assessmentId/question/:questionId/status', verifyApiKey, async (req, res) => {
    try {
        const { assessmentId, questionId } = req.params;

        const assessment = await Assessment.findById(assessmentId);
        if (!assessment) {
            return res.status(404).json({ error: 'Assessment not found' });
        }

        const question = assessment.questions.find(q =>
            q.questionId === questionId || q._id.toString() === questionId
        );

        if (!question) {
            return res.status(404).json({ error: 'Question not found' });
        }

        res.json({
            assessmentStatus: assessment.status,
            responseCount: question.response ? question.response.length : 0,
            lastModified: assessment.lastModificationDate
        });

    } catch (error) {
        console.error('Error checking question status:', error);
        res.status(500).json({ error: 'Error checking question status' });
    }
});

module.exports = router;
