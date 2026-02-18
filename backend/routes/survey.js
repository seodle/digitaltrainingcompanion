const router = require("express").Router();
const { fetchSurveyData } = require('../services/assessmentService.js');

const Response = require('../models/responseModel');

require("dotenv").config();

// Get survey data based on monitoring and assessment
router.get("/survey", async (req, res) => {

  const { currentAssessmentServerId, sandbox } = req.query;

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

  // Create a new response using the chosen model
  const response = new Response({
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

module.exports = router;