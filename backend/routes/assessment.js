const router = require("express").Router();
const { requireMonitoringOwnerOrRedeemer, requireMonitoringOwner, requireAssessmentOwner } = require('../middleware/authorization');
const Monitoring = require('../models/monitoringModel');

const { createAssessment, updateAssessment, deleteAssessment, updateAssessmentSurvey, copyAssessmentsByMonitoringId, resequenceAssessments, getAssessmentsByMonitoringId } = require('../services/assessmentService');


const path = require('path');
const fs = require('fs');
require("dotenv").config();


/**
 * POST endpoint for adding a new assessment. The monitoringId is extracted from the route parameters, and the new assessment object is taken from the request body. 
 * @param {Object} req - The Express request object, containing the monitoringId in the route parameters and the new assessment in the request body.
 * @param {Object} res - The Express response object used to send back the HTTP response.
 * @return {Promise<Object>} A promise that resolves to a response object containing either the ID of the newly added assessment or an error message.
*/
router.post("/", async (req, res) => {
  const assessmentData = req.body;

  try {
    const result = await createAssessment(assessmentData);
    res.json(result);
  } catch (error) {
    const statusCode = error.message === "Assessment not found" ? 404 : 500;
    res.status(statusCode).json({ error: error.message });
  }
});

/**
 * GET endpoint for fetching all assessments associated with a specific monitoring ID. 
 * @param {Object} req - The Express request object, containing the monitoringId as a route parameter.
 * @param {Object} res - The Express response object used to send back the HTTP response.
 */
router.get("/monitoring/:monitoringId", requireMonitoringOwnerOrRedeemer('monitoringId'), async (req, res) => {
  const { monitoringId } = req.params;
  const assessmentType = req.query.assessmentType;

  try {
    const assessments = await getAssessmentsByMonitoringId(monitoringId, assessmentType);
    if (Array.isArray(assessments) && assessments.length === 0) {
      return res.status(204).end();
    }
    res.json(assessments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});


/**
 * POST endpoint for copying all assessments associated with a specific monitoring ID to a new monitoring ID.
 * @param {Object} req - The Express request object, containing the monitoringId and newMonitoringId as route parameters.
 * @param {Object} res - The Express response object used to send back the HTTP response.
 */
router.post("/monitoring/:monitoringId/copy", requireMonitoringOwnerOrRedeemer('monitoringId'), async (req, res) => {
  const { monitoringId } = req.params;
  const { newMonitoringId } = req.body || {};
  if (!newMonitoringId) {
    return res.status(400).json({ error: 'newMonitoringId is required in body' });
  }

  try {
    // Call the copyAssessmentsByMonitoringId service function
    const copiedAssessments = await copyAssessmentsByMonitoringId(monitoringId, newMonitoringId);

    // Send a response with the copied assessments
    res.status(201).json(copiedAssessments);
  } catch (error) {
    console.error("Error copying assessments:", error);
    res.status(500).json({ error: error.message });
  }
});


/**
 * PUT endpoint for updating an assessment with a specific assessmentId.
 * @param {Object} req - The Express request object, containing the assessmentId in the route parameters and the new assessment in the request body.
 * @param {Object} res - The Express response object used to send back the HTTP response.
 * @return {Promise<Object>} A promise that resolves to a response object containing either the ID of the newly updated assessment or an error message.
*/
router.put('/:assessmentId', requireAssessmentOwner('assessmentId'), async (req, res) => {
  const { assessmentId } = req.params;
  const updatedAssessment = req.body;

  try {
    const { status, data } = await updateAssessment(assessmentId, updatedAssessment);

    if (status === 'error') {
      return res.status(404).json({ error: data.message });
    }

    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "An error occurred while updating the assessment" });
  }
});

/**
 * DELETE endpoint for removing a specific assessment by its ID.
 * @param {Object} req - The Express request object, containing the assessmentID in the route parameters.
 * @param {Object} res - The Express response object used to send back the HTTP response.
 * @return {Promise<Object>} A promise that resolves to a response object. If the deletion is successful, it returns a message indicating the successful deletion of the assessment.
 */
router.delete("/:assessmentId", requireAssessmentOwner('assessmentId'), async (req, res) => {
  const { assessmentId } = req.params;

  try {
    // Call the deleteAssessment function from the assessmentService
    const deleteAssessmentResult = await deleteAssessment(assessmentId);

    // Send response based on deleteAssessmentResult
    res.json({ message: deleteAssessmentResult.message });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "An error occurred while deleting the assessment",
    });
  }
});

/**
 * PUT endpoint for updating the survey questions of a specific assessment.
 * @param {Object} req - The Express request object, containing the assessmentId in the route parameters and the updated list of questions in the request body.
 * @param {Object} res - The Express response object used to send back the HTTP response.
 * @return {Promise<Object>} A promise that resolves to a response object containing either the updated list of questions if the update is successful, or an error message.
*/
router.put("/:assessmentId/survey", requireAssessmentOwner('assessmentId'), async (req, res) => {
  const { assessmentId } = req.params;
  const { questions: updatedQuestions, workshops } = req.body;

  try {
    // Call the service function to update the assessment survey
    const updatedSurvey = await updateAssessmentSurvey(assessmentId, updatedQuestions, workshops);

    // Respond with the updated survey questions
    res.json(updatedSurvey);
  } catch (error) {
    console.error('Route error:', error.message);
    res.status(500).json({
      error: error.message,
    });
  }
});


/**
 * PUT resequence positions for all assessments in a monitoring.
 * Body (optional): { orderedAssessmentIds: string[] }
 * - If provided and non-empty: must contain exactly all assessment IDs for the monitoring (no extras/missing/duplicates).
 *   Positions are recalculated to 1..N in that order.
 * - If omitted/empty: resequence all assessments by current persisted order (1..N).
 * Returns: { updated: Array<{ _id: string, position: number }> }
 */
router.put("/monitoring/:monitoringId/resequence", requireMonitoringOwner('monitoringId'), async (req, res) => {
  const { monitoringId } = req.params;
  const { orderedAssessmentIds } = req.body || {};

  try {
    const updated = await resequenceAssessments(monitoringId, orderedAssessmentIds || []);
    res.json({ updated });
  } catch (error) {
    const status = String(error.message || '').startsWith('ValidationError:') ? 400 : 500;
    console.error("Error resequencing assessments:", error);
    res.status(status).json({ error: error.message });
  }
});

module.exports = router;