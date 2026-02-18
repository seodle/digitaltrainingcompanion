const router = require("express").Router();
const Monitoring = require('../models/monitoringModel');
const { requireMonitoringOwner, requireMonitoringOwnerOrRedeemer } = require('../middleware/authorization');
const { stopSharingMonitoring, startSharingMonitoring } = require('../services/monitoringService');

const { createMonitoring, getMonitoringsByUserId, deleteMonitoring, updateMonitoring, getMonitoringById, getUsersByRedeemedCode } = require('../services/monitoringService');
const { deleteAssessmentsFromMonitoring } = require('../services/assessmentService');

require("dotenv").config();



/**
 * POST endpoint for creating a new monitoring document. It extracts monitoring data from the request body and calls the createMonitoring service function to create a new document in the database. Upon successful creation, the created monitoring document is returned in the response. If an error occurs during creation, a 500 status code and an error message are returned.
 * @param {Object} req - The Express request object, expected to contain userId, name, description, creationDate, and lastModification in its body.
 * @param {Object} res - The Express response object used to send back the HTTP response.
 * @return {Promise<Object>} A promise that resolves to a response object containing either the created monitoring document or an error message.
*/
router.post("/", async (req, res) => {
  try {
    const createdMonitoring = await createMonitoring(req.body);
    res.json(createdMonitoring);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET endpoint for fetching all monitoring documents associated with a given user. 
 * @param {Object} req - The Express request object, containing the userId in the route parameters.
 * @param {Object} res - The Express response object used to send back the HTTP response.
 * @return {Promise<Object>} A promise that resolves to a response object containing either an array of monitorings or an error message.
 */
router.get("/", async (req, res) => {
  try {
    const userId = req.user && req.user._id;
    const monitorings = await getMonitoringsByUserId(userId);
    res.json({ monitorings });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT endpoint for updating a monitoring with a specific monitoringId.
 * @param {Object} req - The Express request object, containing the monitoringId in the route parameters and the monitoring in the request body.
 * @param {Object} res - The Express response object used to send back the HTTP response.
 * @return {Promise<Object>} A promise that resolves to a response object containing either the ID of the newly updated monitoring or an error message.
*/
router.put("/:monitoringId", requireMonitoringOwner('monitoringId'), async (req, res) => {
  const { monitoringId } = req.params;
  const updatedMonitoringData = req.body;

  try {
    // Calls the updateMonitoring function with the monitoring ID and updated data
    const { status, data } = await updateMonitoring(monitoringId, updatedMonitoringData);

    if (status === 'error') {
      return res.status(404).json({ error: data.message });
    }

    res.json(data); // Sends the updated monitoring document as the response
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "An error occurred while updating the assessment" });
  }
});

/**
 * PUT endpoint to stop sharing a monitoring by its owner.
 * Clears the monitoring's sharingCode and removes it from all users who redeemed it.
 */
router.put("/:monitoringId/stopSharing", requireMonitoringOwner('monitoringId'), async (req, res) => {
  const { monitoringId } = req.params;
  try {
    const result = await stopSharingMonitoring(monitoringId);
    if (result.error) {
      return res.status(result.status).json({ error: result.error });
    }
    return res.status(200).json({ message: result.message });
  } catch (error) {
    console.error('Error stopping sharing:', error);
    return res.status(500).json({ error: 'Server error during stop sharing' });
  }
});

/**
 * PUT endpoint to start sharing a monitoring by its owner.
 * Sets the monitoring's sharingCode to the provided value.
 */
router.put("/:monitoringId/startSharing", requireMonitoringOwner('monitoringId'), async (req, res) => {
  const { monitoringId } = req.params;
  const { sharingCode } = req.body || {};
  try {
    const result = await startSharingMonitoring(monitoringId, sharingCode);
    if (result.error) {
      return res.status(result.status).json({ error: result.error });
    }
    return res.status(200).json(result.result);
  } catch (error) {
    console.error('Error starting sharing:', error);
    return res.status(500).json({ error: 'Server error during start sharing' });
  }
});


/**
 * DELETE endpoint for removing a specific monitoring by its ID along with all its associated assessments.
 * @param {Object} req - The Express request object, containing the monitoringId in the route parameters.
 * @param {Object} res - The Express response object used to send back the HTTP response.
 * @return {Promise<Object>} A promise that resolves to a response object. If the deletion is successful, it returns a message indicating the successful deletion of the assessments.
 */
router.delete("/:monitoringId", requireMonitoringOwner('monitoringId'), async (req, res) => {
  const { monitoringId } = req.params;

  try {
    // Call the deleteMonitoring function from the monitoringService
    const deleteMonitoringResult = await deleteMonitoring(monitoringId);

    // Check if the deleteMonitoringResult contains an error
    if (deleteMonitoringResult.error) {
      return res.status(404).json({ error: deleteMonitoringResult.error });
    }

    // Call the deleteAssessmentsFromMonitoring function from the monitoringService
    const deleteAssessmentsResult = await deleteAssessmentsFromMonitoring(monitoringId);

    // Send response based on deleteAssessmentsResult
    res.json({ message: deleteAssessmentsResult.message });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "An error occurred while deleting the monitoring and its assessments",
    });
  }
});


/**
 * GET endpoint for fetching a specific monitoring by its ID.
 * @param {Object} req - The Express request object, containing the monitoringId in the route parameters.
 * @param {Object} res - The Express response object used to send back the HTTP response.
 * @return {Promise<Object>} A promise that resolves to a response object containing either the monitoring document or an error message.
 */
router.get("/:monitoringId", requireMonitoringOwnerOrRedeemer('monitoringId'), async (req, res) => {
  const { monitoringId } = req.params;

  try {
    const monitoring = await getMonitoringById(monitoringId);
    res.json(monitoring);
  } catch (error) {
    const statusCode = error.message.includes("not found") ? 404 : 500;
    res.status(statusCode).json({ error: error.message });
  }
});

/**
 * GET users who follow a monitoring (redeemed its sharing code) + anonymized owner info
 * Owner-only access
 * Mounted at /monitorings
 * Path: /:monitoringId/followers
 */
router.get("/:monitoringId/followers", requireMonitoringOwner('monitoringId'), async (req, res) => {
  try {
    const { monitoringId } = req.params;
    const monitoring = await Monitoring.findById(monitoringId).select('sharingCode');
    if (!monitoring || !monitoring.sharingCode) {
      return res.status(404).json({ error: 'Monitoring not found or no sharing code' });
    }

    const result = await getUsersByRedeemedCode(monitoring.sharingCode);
    if (result.error) {
      return res.status(result.status).json({ error: result.error });
    }

    return res.json(result.result);
  } catch (error) {
    console.error('Error fetching followers:', error);
    return res.status(500).json({ message: 'Error fetching followers' });
  }
});

module.exports = router;