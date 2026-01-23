const express = require("express");
const router = express.Router();

const { getAnswersFromMonitoringId, getAnswersFromAssessmentId, getAnswersFromAssessmentIdAndUserId, getPseudoByAssessmentIds, getLastResponseByUserId } = require('../services/responseService');



// Get all responses for a given monitoringId
router.get("/responses/monitoring/:monitoringId", async (req, res) => {
  const { monitoringId } = req.params;

  try {
    // Find all responses that match the monitoringId
    const foundResponses = await getAnswersFromMonitoringId(monitoringId);

    if (foundResponses.length > 0) {
      res.json(foundResponses);
    } else {
      res.status(204).end(); // No content
    }
  } catch (err) {
    console.error("Error getting responses:", err);
    res.status(500).send("Error getting responses");
  }
});


// Get all responses for a given assessmentId
router.get("/responses/assessment/:assessmentId", async (req, res) => {
  const { assessmentId } = req.params;

  try {
    // Use the service function to get the responses
    const foundResponses = await getAnswersFromAssessmentId(assessmentId);

    if (foundResponses.length > 0) {
      res.json(foundResponses);
    } else {
      res.status(204).end(); // No content
    }
  } catch (err) {
    console.error("Error getting responses:", err);
    res.status(500).send("Error getting responses");
  }
});

// Get all responses for a given assessmentId
router.get("/responses/assessment/:assessmentId/userId/:userId", async (req, res) => {
  const { assessmentId, userId } = req.params;

  try {
    // Find all responses that match the assessmentId
    const foundResponses = await getAnswersFromAssessmentIdAndUserId(assessmentId, userId);

    if (foundResponses.length > 0) {
      res.json(foundResponses);
    } else {
      res.status(204).end(); // No content
    }
  } catch (err) {
    console.error("Error getting responses:", err);
    res.status(500).send("Error getting responses");
  }
});

/**
 * Retrieves users pseudo who have responded to specified assessments.
 * 
 * @route GET /responses/byAssessments
 * @param {Object} req - Express request object
 * @param {Object} req.query - Query parameters
 * @param {string} req.query.assessmentIds - Comma-separated list of assessment IDs (e.g., "id1,id2,id3")
 * @param {Object} res - Express response object
 * @returns {Promise<void>} Resolves when response has been sent
 * 
 * @description 
 * Returns a list of users who have submitted responses to any of the specified assessments.
 * Response Status Codes:
 * - 200: Returns array of users with their IDs and display names
 * - 204: No users found for the specified assessments
 * - 500: Server error
 * 
 * @example
 * // Request: GET /responses/byAssessments?assessmentIds=507f1f77bcf86cd799439011,507f1f77bcf86cd799439012
 * // Success Response (200):
 * // [{ _id: "user1", displayName: "John Doe" }, { _id: "user2", displayName: "Jane Smith" }]
 */
router.get("/responses/byAssessmentsIds", async (req, res) => {
  const { assessmentIds } = req.query;

  if (!assessmentIds) {
    return res.status(400).json({ error: 'assessmentIds parameter is required' });
  }

  try {
    const ids = assessmentIds.split(',').map(id => id.trim()).filter(Boolean);

    if (ids.length === 0) {
      return res.status(400).json({ error: 'No valid assessment IDs provided' });
    }

    const displayNames = await getPseudoByAssessmentIds(ids);

    console.log("displayNames: ", displayNames)


    if (displayNames.length === 0) {
      return res.status(204).end();
    }

    res.json(displayNames);
  } catch (err) {
    console.error("Error getting display names:", err);
    res.status(500).json({ error: 'Error retrieving display names' });
  }
});

/**
 * Get the last response for a specific user
 * 
 * @route GET /responses/last/:userId
 * @param {string} userId - The ID of the user whose last response is being fetched.
 * @returns {Object} The last response object or an appropriate error message.
 */
router.get('/responses/last/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    // Use the service function to fetch the last response
    const lastResponse = await getLastResponseByUserId(userId);

    if (lastResponse) {
      return res.json(lastResponse); // Return the last response
    } else {
      return res.status(404).json({
        message: `No responses found for userId: ${userId}`
      });
    }
  } catch (error) {
    console.error("Error fetching last response:", error);
    return res.status(500).json({
      message: 'An error occurred while fetching the last response'
    });
  }
});

module.exports = router;
