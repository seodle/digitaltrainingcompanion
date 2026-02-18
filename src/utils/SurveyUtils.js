import axios from "axios";
import { BACKEND_URL } from "../config";
import jwt_decode from "jwt-decode";
import { questionBank } from '../assets/questionBank';
import { LearningType } from "./enums";
import { v4 as uuidv4 } from 'uuid';

/**
 * Adds a copy suffix to a string, incrementing the number if it already has one.
 * @param {string} text - The text to add the copy suffix to
 * @returns {string} The text with the copy suffix
 */
const addCopySuffix = (text) => {
    const copySuffix = " (Copy)";
    return text.includes(copySuffix)
        ? text.replace(/ \(Copy(\d*)\)$/, (match, number) =>
            ` (Copy${number ? parseInt(number, 10) + 1 : 2})`)
        : text + copySuffix;
};

/**
 * Duplicates a question by creating a new question with similar properties but a unique ID.
 * For non-single-text questions, adds a copy suffix to indicate it's a copy.
 * The new question is inserted immediately after the original in the questions array.
 *
 * @param {Array} questions - The current array of questions.
 * @param {Function} setQuestions - The state setter function for questions.
 * @param {number} questionId - The ID of the question to duplicate.
 */
export const duplicateQuestion = (questions, setQuestions, questionId) => {
    const questionIndex = questions.findIndex(question => question.questionId === questionId);
    if (questionIndex === -1) return; // Early return if question not found

    const originalQuestion = questions[questionIndex];
    const newQuestionId = Math.max(...questions.map(question => question.questionId)) + 1;

    // If this is a matrix question, duplicate all questions with the same matrixId
    if (originalQuestion.matrixId) {
        const matrixQuestions = questions.filter(q => q.matrixId === originalQuestion.matrixId);
        const newMatrixId = uuidv4();

        // Create new questions for each question in the matrix
        const newQuestions = matrixQuestions.map((question, index) => {
            const newQuestion = {
                ...question,
                questionId: newQuestionId + index,
                matrixId: newMatrixId
            };

            // Add copy suffix for matrix questions
            newQuestion.question = addCopySuffix(question.question);
            newQuestion.shortName = addCopySuffix(question.shortName);
            newQuestion.matrixTitle = addCopySuffix(question.matrixTitle);

            return newQuestion;
        });

        // Insert all duplicated questions after the original
        setQuestions(prevQuestions => {
            const updatedQuestions = [
                ...prevQuestions.slice(0, questionIndex + 1),
                ...newQuestions,
                ...prevQuestions.slice(questionIndex + 1)
            ];

            // Modified: Added sorting by questionId to ensure correct order
            return updatedQuestions.sort((a, b) => a.questionId - b.questionId);
        });
    } else {
        // Create the new question object
        const newQuestion = {
            ...originalQuestion,
            questionId: newQuestionId,
        };

        // Only add copy suffix for non-single-text questions
        if (originalQuestion.questionType !== 'single-text') {
            newQuestion.question = addCopySuffix(originalQuestion.question);
            newQuestion.shortName = addCopySuffix(originalQuestion.shortName);
        }

        // Insert the duplicated question after the original
        setQuestions(prevQuestions => [
            ...prevQuestions.slice(0, questionIndex + 1),
            newQuestion,
            ...prevQuestions.slice(questionIndex + 1)
        ]);
    }
};

/**
 * Moves a question up or down within its workshop.
 *
 * @param {Array} questions - The current array of questions.
 * @param {Function} setQuestions - The state setter function for questions.
 * @param {string} workshopName - The name of the workshop containing the question.
 * @param {string} questionId - The ID of the question to move.
 * @param {string} direction - The direction to move the question ('up' or 'down').
*/
export const reorderQuestionWithinWorkshop = (questions, setQuestions, workshopId, questionId, direction) => {

    // Filter questions for the specified workshopId
    const workshopQuestions = questions.filter(question => question.workshopId === workshopId);

    // Find the index of the question to be moved within the workshop
    const questionIndex = workshopQuestions.findIndex(question => question.questionId === questionId);
    if (questionIndex === -1) return; // question not found

    // Get the question(s) to be moved
    const questionToMove = workshopQuestions[questionIndex];
    const questionsToMove = questionToMove.matrixId
        ? workshopQuestions.filter(q => q.matrixId === questionToMove.matrixId)
        : [questionToMove];

    // Check bounds within the workshop's questions
    if ((direction === 'up' && questionIndex === 0) || (direction === 'down' && questionIndex >= workshopQuestions.length - questionsToMove.length)) {
        return; // Can't move beyond array bounds within the same workshop
    }

    let newQuestions = [];

    if (direction === 'up') {
        const questionBefore = workshopQuestions[questionIndex - 1]; // The question before the one being moved
        const questionsBefore = questionBefore && questionBefore.matrixId
            ? workshopQuestions.filter(q => q.matrixId === questionBefore.matrixId)
            : [questionBefore]; // If matrixId exists, include all related questions; else just the single question

        // Moving up: target is the group before, first index from questionsBefore, last index from questionsToMove
        const firstMoveIndex = workshopQuestions.indexOf(questionsBefore[0]);
        const lastMoveIndex = workshopQuestions.indexOf(questionsToMove[questionsToMove.length - 1]);

        // Debug the array slices
        const beforeSlice = workshopQuestions.slice(0, firstMoveIndex);
        const afterSlice = workshopQuestions.slice(lastMoveIndex + 1);

        // Rebuild the array by correctly ordering the question groups
        newQuestions = [
            ...beforeSlice,
            ...questionsToMove,
            ...questionsBefore,
            ...afterSlice
        ];
    } else if (direction === 'down') {
        // Define the question(s) after the last question to be moved
        const questionAfter = workshopQuestions[questionIndex + questionsToMove.length];  // The question after the last question in the group
        const questionsAfter = questionAfter && questionAfter.matrixId
            ? workshopQuestions.filter(q => q.matrixId === questionAfter.matrixId)
            : [questionAfter]; // If matrixId exists, include all related questions; else just the single question

        // Moving down: target is the group after, first index from questionsToMove, last index from questionsAfter
        const firstMoveIndex = workshopQuestions.indexOf(questionsToMove[0]);
        const lastMoveIndex = workshopQuestions.indexOf(questionsAfter[questionsAfter.length - 1]);

        // Debug the array slices
        const beforeSlice = workshopQuestions.slice(0, firstMoveIndex);
        const afterSlice = workshopQuestions.slice(lastMoveIndex + 1);

        // Rebuild the array by correctly ordering the question groups
        newQuestions = [
            ...beforeSlice,
            ...questionsAfter,
            ...questionsToMove,
            ...afterSlice
        ];
    }

    // Fix: Replace only the questions from this workshop while preserving others
    setQuestions(prevQuestions => {
        const otherWorkshopQuestions = prevQuestions.filter(q => q.workshopId !== workshopId);
        return [...otherWorkshopQuestions, ...newQuestions];
    });
};

/**
 * Adds a new option with empty label and value to the options array of a specific question.
 *
 * @param {Function} setQuestions - The state setter function for questions.
 * @param {string} questionId - The ID of the question to which the new option is to be added.
*/
export const addOption = (setQuestions, questionId) => {
    setQuestions(prevQuestions =>
        prevQuestions.map(question =>
            question.questionId === questionId
                ? { ...question, options: [...question.options, { label: '', value: '' }] }
                : question
        )
    );
};

/**
 * Removes an option from a specific question's options array based on the option's index.
 *
 * @param {Function} setQuestions - The state setter function for questions.
 * @param {string} questionId - The ID of the question from which the option is to be removed.
 * @param {number} optionIndex - The index of the option to be removed from the question's options array.
*/
export const removeOption = (setQuestions, questionId, optionIndex) => {
    setQuestions(prevQuestions =>
        prevQuestions.map(question =>
            question.questionId === questionId
                ? { ...question, options: question.options.filter((_, index) => index !== optionIndex) }
                : question
        )
    );
};

/**
 * Handles changes to the options of a question, updating the label and value based on user input.
 *
 * @param {Function} setQuestions - The state setter function for questions.
 * @param {Object} e - The event object containing the new option label.
 * @param {string} questionId - The ID of the question being updated.
 * @param {number} optionIndex - The index of the option within the question's options array.
*/
export const changeOption = (setQuestions, e, questionId, optionIndex) => {
    const newLabel = e.target.value;
    setQuestions(prevQuestions => {
        // Find the target question to determine if it's a matrix question
        const targetQuestion = prevQuestions.find(q => q.questionId === questionId);

        return prevQuestions.map(question => {
            // If target question is a matrix question, update all questions in the same matrix
            if (targetQuestion?.matrixId && question.matrixId === targetQuestion.matrixId) {
                // Get the old label before updating
                const oldLabel = question.options[optionIndex]?.label;

                // Update correctAnswer array if this option was marked as correct
                const updatedCorrectAnswer = question.correctAnswer?.map(answer =>
                    answer === oldLabel ? newLabel : answer
                ) || [];

                return {
                    ...question,
                    options: question.options.map((option, index) =>
                        index === optionIndex ? { ...option, label: newLabel, value: newLabel } : option
                    ),
                    correctAnswer: updatedCorrectAnswer
                };
            }
            // For non-matrix questions, only update the specific question
            else if (question.questionId === questionId) {
                // Get the old label before updating
                const oldLabel = question.options[optionIndex].label;

                // Update correctAnswer array if this option was marked as correct
                const updatedCorrectAnswer = question.correctAnswer?.map(answer =>
                    answer === oldLabel ? newLabel : answer
                ) || [];

                return {
                    ...question,
                    options: question.options.map((option, index) =>
                        index === optionIndex ? { ...option, label: newLabel, value: newLabel } : option
                    ),
                    correctAnswer: updatedCorrectAnswer
                };
            }
            return question;
        });
    });
};

/**
 * Updates the adoption type of a specific question.
 *
 * @param {Function} setQuestions - The state setter function for questions.
 * @param {Object} e - The event object from the adoption type select element.
 * @param {string} questionId - The ID of the question being updated.
 */
export const changeLearningType = (setQuestions, e, questionId) => {
    const newLearningType = e.target.value;
    setQuestions((prevQuestions) =>
        prevQuestions.map((question) =>
            question.questionId === questionId ? { ...question, learningType: newLearningType } : question
        )
    );
};

/**
 * Updates the correct answer for a specific question based on user selection.
 *
 * @param {Function} setQuestions - The state setter function for questions.
 * @param {Object} event - The event object from the correct answer select element.
 * @param {string} questionId - The ID of the question being updated.
 */
export const changeCorrectAnswer = (setQuestions, event, questionId) => {
    setQuestions(prevQuestions =>
        prevQuestions.map(q => {
            if (q.questionId === questionId) {

                return {
                    ...q,
                    correctAnswer: event.target.value
                };
            }
            return q;
        })
    );
};

/**
 * Saves the edits made to a question and updates the list of questions.
 *
 * @param {Function} setQuestions - The state setter function for questions.
 * @param {string} questionId - The ID of the question being edited.
 * @param {object} newQuestionData - The updated data for the question.
*/
export const saveEdits = (setQuestions, setEditingQuestionId, questionId, newQuestionData) => {
    setQuestions(prevQuestions =>
        prevQuestions.map(question =>
            question.questionId === questionId ? { ...question, ...newQuestionData } : question
        )
    );
    setEditingQuestionId(null);
};

/**
 * Removes a question from the list based on its workshop and ID.
 *
 * @param {Function} setQuestions - The state setter function for questions.
 * @param {string} workshopName - The name of the category to which the question belongs.
 * @param {string} questionId - The ID of the question to be removed.
*/
export const removeQuestion = (setQuestions, workshopId, questionId) => {
    setQuestions(prevQuestions => {
        // Find the question to be removed
        const questionToRemove = prevQuestions.find(q => q.questionId === questionId);

        // If it's a matrix question, remove all questions with the same matrixId
        if (questionToRemove && questionToRemove.matrixId) {
            return prevQuestions.filter(q => q.matrixId !== questionToRemove.matrixId);
        }

        // Otherwise, just remove the single question
        return prevQuestions.filter(question => !(question.workshopId === workshopId && question.questionId === questionId));
    });
};

/**
 * Updates the mandatory status of a question based on user interaction.
 *
 * @param {Function} setQuestions - The state setter function for questions.
 * @param {Object} event - The change event from the mandatory switch.
 * @param {string} questionId - The ID of the question being updated.
 */
export const changeMandatoryStatus = (setQuestions, event, questionId) => {
    setQuestions((prevQuestions) =>
        prevQuestions.map((question) =>
            question.questionId === questionId
                ? { ...question, isMandatory: event.target.checked }
                : question
        )
    );
};


/**
 * save survey data to the assessment
 *
 * assessmentId
 * @param {string} assessmentId - The is of the assessment
 * @param {string} surveyData - The data from the survey
 */
export const saveSurveyToAssessment = async (assessmentId, suveyData) => {
    try {
        const token = localStorage.getItem("token");

        // save the survey to the assessmentId
        const response = await axios.put(`${BACKEND_URL}/assessments/${assessmentId}/survey`,
            suveyData,
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );
        return response.data;
    } catch (error) {
        throw new Error('Failed to submit the survey: ' + error.message);
    }
};

/**
 * Fetches existing survey data from the backend based on the current assessment server ID.
 * Updates the state with fetched survey questions, workshop details, and whether the survey has multiple workshops.
 *
 * @param {Function} setQuestions - State setter function for updating the list of questions.
 * @param {Function} setSplitWorkshops - State setter function to update whether there are multiple workshops.
 * @param {Function} setWorkshops - State setter function for updating the list of workshops.
 * @param {Function} setInitialQuestions - State setter function for updating the list of initial questions.
 * @param {string} currentAssessmentServerId - The current assessment server ID used to fetch the survey.
 * @param {Array} predifinedQuestionIds - List of predinied questions.
 */
export const fetchExistingSurvey = async (setQuestions, setSplitWorkshops, setWorkshops, setInitialQuestions, currentAssessmentServerId, predifinedQuestionIds, languageCode) => {

    try {
        const token = localStorage.getItem("token");
        const decodedToken = jwt_decode(token);
        const sandbox = decodedToken.sandbox;

        // get the all the surveys from this assessment
        const response = await axios.get(`${BACKEND_URL}/survey`, {
            params: {
                currentAssessmentServerId: currentAssessmentServerId,
                sandbox: sandbox
            }
        });

        // Always set initialQuestions with predefined questions for new workshops
        let predifinedQuestion = fetchPredifinedQuestions(predifinedQuestionIds, languageCode);
        setInitialQuestions(predifinedQuestion);

        // if there is a response
        if (response.data && response.data.survey && Array.isArray(response.data.survey) && response.data.survey.length > 0) {

            // Prefer workshops directly on data if present; fallback to nested assessment.workshops for backward compatibility
            const workshopsFromResponse = Array.isArray(response.data.workshops)
                ? response.data.workshops
                : (response.data.assessment && Array.isArray(response.data.assessment.workshops)
                    ? response.data.assessment.workshops
                    : []);

            if (workshopsFromResponse.length > 0) {
                setSplitWorkshops(true);
                setWorkshops(workshopsFromResponse);
            }

            const updatedQuestions = response.data.survey.map(question => ({
                ...question,
                options: question.choices.map(choice => ({ label: choice, value: choice })),
                correctAnswer: Array.isArray(question.correctAnswer) ? question.correctAnswer : (question.correctAnswer ? [question.correctAnswer] : []),
            }));

            // update the array
            setQuestions(updatedQuestions);

        } else {
            // if no questions, get the predifinned questions for the example
            setQuestions(predifinedQuestion);
        }
    } catch (error) {
        console.error('Error fetching existing survey data:', error);
    }
};


/**
 * Fetch the predefined questions for a specific survey configuration
 */
function fetchPredifinedQuestions(predifinedQuestionIds, languageCode) {

    return predifinedQuestionIds.map(id => ({
        ...questionBank[languageCode][id],
        workshopId: "",
        questionId: id,
        options: questionBank[languageCode][id].options.map(option => ({
            value: option,
            label: option
        }))
    }));
}

/**
 * Gets workshop details (ID and position) by workshop name from the questions array.
 *
 * @param {Array} questions - The array of questions to search in.
 * @param {string} workshopName - The name of the workshop to find.
 * @returns {Object|null} Workshop object with id, name, and position, or null if not found.
 */
export const getWorkshopDetailsById = (workshops, workshopId) => {
    if (!Array.isArray(workshops) || !workshopId) return null;
    const found = workshops.find(w => String(w?._id) === String(workshopId));
    return found || null;
};

/**
 * Moves a question to a different workshop.
 *
 * @param {Function} setQuestions - The state setter function for all questions.
 * @param {string} questionId - The ID of the question to move.
 * @param {string} targetWorkshopId - The unique ID of the workshop to move the question to.
*/
export const moveQuestionToWorkshop = (setQuestions, questionId, targetWorkshop) => {
    setQuestions(prevQuestions => {
        const questionToMove = prevQuestions.find(q => q.questionId === questionId);
        if (!questionToMove || !targetWorkshop) return prevQuestions;

        // Use workshop _id (UUID when unsaved, real ObjectId when saved)
        const targetWorkshopId = targetWorkshop._id;

        if (questionToMove.matrixId) {
            return prevQuestions.map(q => (
                q.matrixId === questionToMove.matrixId
                    ? {
                        ...q,
                        workshopId: targetWorkshopId
                    }
                    : q
            ));
        }

        return prevQuestions.map(q => (
            q.questionId === questionId
                ? {
                    ...q,
                    workshopId: targetWorkshopId
                }
                : q
        ));
    });
};


/**
 * Builds ordered workshops from a workshops list and its questions.
 * Returns an array of workshops: [{ workshopId, label, position, questions }].
 * Questions with missing/unmatched workshopId are placed in a final workshop with no label.
 */
export const groupQuestionsByWorkshop = (workshops, questions) => {
    const workshopList = Array.isArray(workshops) ? [...workshops] : [];

    const groupedByWorkshopId = new Map();
    workshopList.forEach(w => groupedByWorkshopId.set(w._id, []));

    const unassignedQuestions = [];
    (questions || []).forEach(question => {
        const wid = question.workshopId;
        if (wid && groupedByWorkshopId.has(wid)) {
            groupedByWorkshopId.get(wid).push(question);
        } else {
            unassignedQuestions.push(question);
        }
    });

    const orderedWorkshops = workshopList
        .slice()
        .sort((a, b) => (a.workshopPosition ?? 0) - (b.workshopPosition ?? 0))
        .map(w => ({
            workshopId: w._id,
            label: w.label,
            position: w.workshopPosition,
            questions: groupedByWorkshopId.get(w._id) || []
        }));

    if (unassignedQuestions.length > 0) {
        orderedWorkshops.push({
            workshopId: 'unassigned',
            label: null,
            position: Number.MAX_SAFE_INTEGER,
            questions: unassignedQuestions
        });
    }

    return orderedWorkshops;
};

