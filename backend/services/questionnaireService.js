const fs = require("fs");
const path = require("path");


// Function to read the questionnaire.json file
function loadQuestionnaire() {
    const filePath = path.join(__dirname, "../assets/questionnaire.json");
    const jsonData = fs.readFileSync(filePath);
    return JSON.parse(jsonData);
}

/**
 * Asynchronously creates and saves a new questionnaire based on the provided responses.
 * @param {Object} responses - An object containing the questionnaireId and responses to the questionnaire. 
 * @return {Promise<Object>} A promise that resolves to an object containing the status of the operation ('success' or 'error').
 * @throws {Error} Throws an error if an unexpected condition is encountered during the questionnaire creation or saving process.
 */
const createAndSaveQuestionnaire = async (responses) => {

    const questionnaire = loadQuestionnaire();
    const questions = questionnaire.map(question => ({
      ...question,
      response: responses[question.questionId]
    }));
  
    let newQuestionnaire = new Questionnaire({
        questionnaireName: "market study",
        userEmail: "",
        questionnaireId: responses.questionnaireId,
        dateCreated: new Date(),
        questions: questions
    });
  
    try {
      const createdDocument = await newQuestionnaire.save();
      console.log("New questionnaire successfully saved in the database");
      return { status: 'success', data: createdDocument };
    } catch (error) {
      console.error(error);
      throw new Error("An error occurred while creating the questionnaire document");
    }
};

/**
 * Fetches all questionnaire documents from the database.
 * @return {Promise<Array>} A promise that resolves to an array of questionnaire documents.
 * @throws {Error} Throws an error if no questionnaires are found or on any database query failure.
 */
const fetchAllQuestionnaires = async () => {
    const documents = await Questionnaire.find();
  
    if (!documents || documents.length === 0) {
      throw new Error("No questionnaires found"); // Throwing an error to be caught by the route handler
    }
  
    return documents; // Return the found documents
};


/**
 * Asynchronously updates the email field of a specific questionnaire identified by its questionnaireId. This function first attempts to find the questionnaire in the database using the provided questionnaireId.
 * @param {string} questionnaireId - The unique identifier of the questionnaire to be updated.
 * @param {string} email - The new email address to be set for the questionnaire.
 * @return {Promise<Object>} A promise that resolves to the updated questionnaire document upon successful update.
 * @throws {Error} Throws an error if no questionnaire with the specified questionnaireId is found or if there's an issue saving the changes to the database.
 */
const updateQuestionnaireEmail = async (questionnaireId, email) => {
    const questionnaire = await Questionnaire.findOne({ questionnaireId: questionnaireId });
  
    if (!questionnaire) {
      throw new Error("No questionnaire found with the given questionnaireId"); // Throwing an error to be caught by the route handler
    }
  
    questionnaire.userEmail = email;
    await questionnaire.save();
  
    return questionnaire; // Return the updated questionnaire
};
  
/**
 * Retrieves the total count of questionnaires stored in the database.
 * @return {Promise<number>} A promise that resolves to the total count of questionnaire documents.
 * @throws {Error} Throws an error if there's an issue accessing the database.
 */
const getQuestionnaireCount = async () => {
    const count = await Questionnaire.countDocuments();
    return count;
};

/**
 * Fetches a single questionnaire document based on the provided questionnaireId.
 * @param {string} questionnaireId - The unique identifier for the desired questionnaire.
 * @return {Promise<Object>} A promise that resolves to the questionnaire document if found.
 * @throws {Error} Throws an error if no questionnaire is found with the given ID or if there's a database access issue.
 */
const getQuestionnaireById = async (questionnaireId) => {
    const questionnaire = await Questionnaire.findOne({ questionnaireId: questionnaireId });
  
    if (!questionnaire) {
        throw new Error("No questionnaire found with the given ID");
    }
  
    // Return the found questionnaire document
    return questionnaire; 
};



module.exports = { createAndSaveQuestionnaire, fetchAllQuestionnaires, updateQuestionnaireEmail, getQuestionnaireCount, getQuestionnaireById };
