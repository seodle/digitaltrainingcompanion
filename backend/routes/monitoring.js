const router = require("express").Router();

const { createMonitoring, getMonitoringsByUserId, deleteMonitoring,
  getMonitoringByCreationDate, updateMonitoring, copyMonitoring, getMonitoringById } = require('../services/monitoringService');
const { deleteAssessmentsFromMonitoring } = require('../services/assessmentService');
const { deleteAnswersFromMonitoring } = require('../services/responseService');

require("dotenv").config();


/**
 * POST endpoint for creating a new monitoring document. It extracts monitoring data from the request body and calls the createMonitoring service function to create a new document in the database. Upon successful creation, the created monitoring document is returned in the response. If an error occurs during creation, a 500 status code and an error message are returned.
 * @param {Object} req - The Express request object, expected to contain userId, name, description, creationDate, and lastModification in its body.
 * @param {Object} res - The Express response object used to send back the HTTP response.
 * @return {Promise<Object>} A promise that resolves to a response object containing either the created monitoring document or an error message.
*/
router.post("/monitoring", async (req, res) => {
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
router.get("/monitorings/:userId", async (req, res) => {

  const { userId } = req.params;

  try {
    const monitorings = await getMonitoringsByUserId(userId);
    res.json({ monitorings });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET endpoint for fetching a monitoring document by its creation date.
 * @param {Object} req - The Express request object, containing the creationDate in the route parameters.
 * @param {Object} res - The Express response object used to send back the HTTP response.
 * @return {Promise<Object>} A promise that resolves to a response object containing either the monitoring document or an error message.
 */
router.get("/monitorings/findbydate/:creationDate", async (req, res) => {
  const creationDate = new Date(req.params.creationDate);

  try {
    const monitoring = await getMonitoringByCreationDate(creationDate);

    res.json(monitoring);
  } catch (error) {
    const statusCode = error.message.includes("No monitoring found") ? 404 : 500;
    res.status(statusCode).json({ error: error.message });
  }
});

/**
 * PUT endpoint for updating a monitoring with a specific monitoringId.
 * @param {Object} req - The Express request object, containing the monitoringId in the route parameters and the monitoring in the request body.
 * @param {Object} res - The Express response object used to send back the HTTP response.
 * @return {Promise<Object>} A promise that resolves to a response object containing either the ID of the newly updated monitoring or an error message.
*/
router.put("/updateEdited/monitorings/:monitoringId", async (req, res) => {
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
 * DELETE endpoint for removing a specific monitoring by its ID along with all its associated assessments.
 * @param {Object} req - The Express request object, containing the monitoringId in the route parameters.
 * @param {Object} res - The Express response object used to send back the HTTP response.
 * @return {Promise<Object>} A promise that resolves to a response object. If the deletion is successful, it returns a message indicating the successful deletion of the assessments.
 */
router.delete("/monitoring/:monitoringId", async (req, res) => {
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
 * DELETE endpoint for removing all answers from a specific monitoring
 * @param {Object} req - The Express request object, containing the monitoringId in the route parameters.
 * @param {Object} res - The Express response object used to send back the HTTP response.
 * @return {Promise<Object>} A promise that resolves to a response object. If the deletion is successful, it returns a message indicating the successful deletion of the answers.
 */
router.delete("/monitoring/:monitoringId/answers", async (req, res) => {
  const { monitoringId } = req.params;

  try {
    // Call the deleteAnswersFromMonitoring function from the responseService
    const deleteAnswersFromMonitoringResult = await deleteAnswersFromMonitoring(monitoringId);

    // Send response based on deleteAssessmentResult
    res.json({ message: deleteAnswersFromMonitoringResult.message });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "An error occurred while deleting the responses from the monitoring",
    });
  }
});

// Fetch all open assessments for a specific user
router.get("/getOpenAssessments", async (req, res) => {
  const { userId } = req.query;

  try {
    // Fetch all monitorings for the user
    const userMonitorings = await req.models.Monitoring.find({ userId: userId });

    const openAssessments = userMonitorings.map(monitoring =>
      monitoring.assessments
        .filter(assessment => assessment.status === "Open")
        .map(assessment => ({
          assessmentId: assessment._id.toString(),
          monitoringId: monitoring._id.toString()
        }))
    ).flat();

    res.json(openAssessments);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "An error occurred while fetching the open assessments for the user",
    });
  }
});

/**
 * GET endpoint for fetching a specific monitoring by its ID.
 * @param {Object} req - The Express request object, containing the monitoringId in the route parameters.
 * @param {Object} res - The Express response object used to send back the HTTP response.
 * @return {Promise<Object>} A promise that resolves to a response object containing either the monitoring document or an error message.
 */
router.get("/monitoring/:monitoringId", async (req, res) => {
  const { monitoringId } = req.params;

  try {
    const monitoring = await getMonitoringById(monitoringId);
    res.json(monitoring);
  } catch (error) {
    const statusCode = error.message.includes("not found") ? 404 : 500;
    res.status(statusCode).json({ error: error.message });
  }
});

module.exports = router;