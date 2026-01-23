const router = require("express").Router();
const { fetchSurveyData } = require('../services/assessmentService.js');

const Response = require('../models/responseModel');

require("dotenv").config();

// Get survey data based on monitoring and assessment
router.get("/survey", async (req, res) => {

  const { currentAssessmentServerId, sandbox } = req.query;

  console.log("############## GET /survey -> currentAssessmentServerId", currentAssessmentServerId, "\n")

  const result = await fetchSurveyData(currentAssessmentServerId, sandbox);

  if (result.status === 'error') {
    const statusCode = result.message === 'No monitoring found with the provided ID' || result.message === 'No assessment found with the provided ID' ? 404 : 500;
    return res.status(statusCode).send(result.message);
  }

  res.json(result.data);
});

// submit a new response
router.post("/response", async (req, res) => {
  // Get the response data from the request body
  const { userId, email, monitoringId, assessmentId, assessmentType, survey, sandbox, displayName } = req.body;

  console.log("############## POST /survey -> assessmentId", assessmentId, "\n")

  // Choose the collection based on the sandbox parameter
  const ResponseModel = sandbox === 'true' ? Response : Response;

  // Create a new response using the chosen model
  const response = new ResponseModel({
    userId,
    email,
    monitoringId,
    assessmentId,
    assessmentType,
    survey,
    displayName,
  });

  try {
    // Save the new response to the database
    const savedResponse = await response.save();

    // Send the newly created response's ID back to the client
    res.json({ id: savedResponse._id, success: true });
  } catch (err) {
    console.error("Error saving response:", err);
    res.status(500).send("Error saving response");
  }
});

// Update an existing response
router.put("/response", async (req, res) => {
  const { id, questionId, answer, sandbox } = req.body;

  // Determine the collection based on the sandbox parameter
  const ResponseModel = sandbox === 'true' ? Response : Response;

  try {

    // Find the existing response document by ID
    const response = await ResponseModel.findById(id);

    console.log("response", response);

    // If the document is not found, return an error
    if (!response) {
      return res.status(404).json({ error: "Response not found" });
    }

    // Find the specific question within the survey array to update
    const questionIndex = response.survey.findIndex(q => q.questionId === questionId);

    console.log("questionIndex", questionIndex);

    // If the question is not found, return an error
    if (questionIndex === -1) {
      return res.status(404).json({ error: "Question not found" });
    }

    // Check if answer is already an array, do not wrap if it's already an array
    if (Array.isArray(answer)) {
      response.survey[questionIndex].response = answer;
    } else {
      response.survey[questionIndex].response = [answer];
    }

    // Save the updated response document
    const updatedResponse = await response.save();

    // Send back the updated response with success confirmation
    res.json({ success: true, updatedResponse });
  } catch (err) {
    console.error("Error updating response:", err);
    res.status(500).send("Error updating response");
  }
});

// Get a response
router.get("/response", async (req, res) => {
  const { userId, monitoringId, assessmentId, sandbox } = req.query;

  // Determine the collection based on the sandbox parameter
  const ResponseModel = sandbox === 'true' ? Response : Response;

  try {
    // Search for an existing response that matches the given parameters
    const response = await ResponseModel.findOne({
      userId,
      monitoringId,
      assessmentId
    });

    // Return true if a response is found, otherwise return false
    const isResponseFound = response ? true : false;

    res.json({ isResponseFound });
  } catch (err) {
    console.error("Error finding response:", err);
    res.status(500).json({ message: "Error finding response" });
  }
});

module.exports = router;