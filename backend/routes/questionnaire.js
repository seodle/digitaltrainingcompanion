const router = require("express").Router();
const { createAndSaveQuestionnaire, fetchAllQuestionnaires, updateQuestionnaireEmail, getQuestionnaireCount, getQuestionnaireById } = require('../services/questionnaireService.js');

/**
POST endpoint for submitting questionnaire responses.
@param {Object} req - The Express request object, expected to contain the questionnaire responses in its body along with a questionnaireId.
@param {Object} res - The Express response object used to send back the HTTP response.
@return {Promise<Object>} A promise that resolves to the response object, which can be either the saved questionnaire document or an error message.
*/
router.post("/questionnaire", async (req, res) => {
  try {
    const result = await createAndSaveQuestionnaire(req.body);

    if (result.status === 'success') {
      res.json(result.data);
    } else {
      // TODO Handle cases crashes
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET endpoint to retrieve all questionnaire documents. It queries the database for all documents in the 'Questionnaire' collection, checks if any documents are found, and returns them. 
 * @param {Object} req - The Express request object.
 * @param {Object} res - The Express response object used to send back the HTTP response.
 * @return {Promise<Object>} A promise that resolves to the response object, which can be the list of all questionnaire documents or an error message.
 */
router.get("/results", async (req, res) => {
  try {
    const documents = await fetchAllQuestionnaires();
    res.json(documents); // Send the documents as a response
  } catch (error) {
    // Decide on the status code based on the error message
    const statusCode = error.message === "No questionnaires found" ? 404 : 500;
    res.status(statusCode).json({ error: error.message });
  }
});

/**
 * Updates a questionnaire's email field based on the provided questionnaire ID. It finds the questionnaire by its ID and updates the userEmail field with the provided email. 
 * @param {string} questionnaireId - The unique identifier of the questionnaire to update.
 * @param {string} email - The new email address to associate with the questionnaire.
 * @return {Promise<Object>} A promise that resolves to the updated questionnaire document or an error message.
 * @throws {Error} Throws an error if the questionnaire is not found or if there's a database update error.
 */
router.put("/survey/updateEmail", async (req, res) => {
  const { questionnaireId, email } = req.body;

  try {
    const updatedQuestionnaire = await updateQuestionnaireEmail(questionnaireId, email);
    res.json(updatedQuestionnaire); // Send the updated questionnaire as a response
  } catch (error) {
    const statusCode = error.message === "No questionnaire found with the given questionnaireId" ? 404 : 500;
    res.status(statusCode).json({ error: error.message });
  }
});

// Route handler for getting the total count of questionnaires
/**
 * GET endpoint to retrieve the total count of questionnaires in the database. It calls the getQuestionnaireCount service function and returns the count.
 * @param {Object} req - The Express request object.
 * @param {Object} res - The Express response object used to send back the HTTP response.
 * @return {Promise<Object>} A promise that resolves to a response object containing the count or an error message.
 */
router.get("/questionnaire/count", async (req, res) => {
  try {
    const count = await getQuestionnaireCount();
    res.json({ count: count });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Route handler for getting a questionnaire by its ID
/**
 * GET endpoint to retrieve a specific questionnaire's details by its questionnaireId. It calls the getQuestionnaireById service function and returns the questionnaire document.
 * @param {Object} req - The Express request object, containing the questionnaireId as a route parameter.
 * @param {Object} res - The Express response object used to send back the HTTP response.
 * @return {Promise<Object>} A promise that resolves to a response object containing the questionnaire document or an error message.
 */
router.get("/results/respondent/:surveyId", async (req, res) => {
  const { questionnaireId } = req.params;

  try {
    const questionnaire = await getQuestionnaireById(questionnaireId);
    res.json(questionnaire);
  } catch (error) {
    const statusCode = error.message === "No questionnaire found with the given ID" ? 404 : 500;
    res.status(statusCode).json({ error: error.message });
  }
});



module.exports = router;
