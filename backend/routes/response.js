const express = require("express");
const router = express.Router();
const { requireAssessmentOwner, requireMonitoringOwner, requireMonitoringOwnerOrRedeemer, requireTeacherTrainer } = require('../middleware/authorization');
const Response = require('../models/responseModel');

const {
  getAnswersFromAssessmentId,
  getPseudoByAssessmentIds,
  getLastResponseByUserId,
  deleteAnswersFromMonitoring,
  deleteAnswersFromAssessment
} = require('../services/responseService');



// Get responses for a given assessmentId
// - Teachers (owners) get all responses
// - Trainers (redeemers) get only their own responses
router.get("/assessment/:assessmentId", requireMonitoringOwnerOrRedeemer('assessmentId'), async (req, res) => {
  const { assessmentId } = req.params;

  try {
    const currentUserId = req.user && req.user._id;
    const foundResponses = await getAnswersFromAssessmentId(assessmentId, currentUserId);

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
router.get("/monitoring/:monitoringId/displayNames", requireMonitoringOwnerOrRedeemer('monitoringId'), async (req, res) => {
  const { assessmentIds } = req.query;
  const { monitoringId } = req.params;

  if (!assessmentIds) {
    return res.status(400).json({ error: 'assessmentIds parameter is required' });
  }

  try {
    const ids = assessmentIds.split(',').map(id => id.trim()).filter(Boolean);

    if (ids.length === 0) {
      return res.status(400).json({ error: 'No valid assessment IDs provided' });
    }

    const displayNames = await getPseudoByAssessmentIds(ids, req.user._id);

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
 * Get the last response for the current authenticated user
 * 
 * @route GET /responses/last
 * @returns {Object} The last response object or an appropriate error message.
 */
router.get('/last', async (req, res) => {
  const userId = req.user && req.user._id;

  try {
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    // Use the service function to fetch the last response
    const lastResponse = await getLastResponseByUserId(userId);

    if (lastResponse) {
      return res.json(lastResponse); // Return the last response
    } else {
      return res.status(404).json({
        message: 'No responses found for current user'
      });
    }
  } catch (error) {
    console.error("Error fetching last response:", error);
    return res.status(500).json({
      message: 'An error occurred while fetching the last response'
    });
  }
});

// Delete all answers for a specific assessment and user
router.delete("/assessment/:assessmentId", requireAssessmentOwner, async (req, res) => {
  try {
    const { assessmentId, userId } = req.params;
    const result = await deleteAnswersFromAssessment(assessmentId, userId);
    return res.json({ message: result.message });
  } catch (error) {
    console.error("Error deleting responses from assessment:", error);
    return res.status(500).json({ error: "An error occurred while deleting the responses from the assessment" });
  }
});

// Delete all answers for a specific monitoring (owner only)
router.delete("/monitoring/:monitoringId", requireMonitoringOwner('monitoringId'), async (req, res) => {
  try {
    const { monitoringId } = req.params;
    const result = await deleteAnswersFromMonitoring(monitoringId);
    return res.json({ message: result.message });
  } catch (error) {
    console.error("Error deleting responses from monitoring:", error);
    return res.status(500).json({ error: "An error occurred while deleting the responses from the monitoring" });
  }
});

// Update a single question's answer in a response (owner-only via responseId)
router.put('/:responseId', requireAssessmentOwner('responseId'), async (req, res) => {
  try {
    const { responseId } = req.params;
    const { questionId, answer } = req.body;

    if (!questionId || typeof answer === 'undefined') {
      return res.status(400).json({ error: 'Missing questionId or answer' });
    }

    const response = await Response.findById(responseId);
    if (!response) {
      return res.status(404).json({ error: 'Response not found' });
    }

    const questionIndex = response.survey.findIndex(q => q.questionId === questionId);
    if (questionIndex === -1) {
      return res.status(404).json({ error: 'Question not found' });
    }

    response.survey[questionIndex].response = Array.isArray(answer) ? answer : [answer];
    const updatedResponse = await response.save();

    return res.json({ success: true, updatedResponse: updatedResponse });
  } catch (error) {
    console.error("Error updating response:", error);
    return res.status(500).json({ error: "Error updating response" });
  }
});

module.exports = router;
