const router = require("express").Router();
const path = require('path');
const createPdf = require('../utils/createPdfReport');
const createDocx = require('../utils/createDocxReport');
const createPdfPaperVersion = require('../utils/createPdfPaperVersion');
const { getMonitoringById } = require('../services/monitoringService');
const { getUserWithId } = require('../services/userService');
const { getAssessmentsByMonitoringId } = require('../services/assessmentService');
const { getAnswersFromAssessmentId, getAnswersFromAssessmentIdAndUserId } = require("../services/responseService");

require("dotenv").config();

/**
 * POST endpoint for exporting a PDF report for a given monitoring and session
 * @param {Object} req - The Express request object, containing the selected monitoring, and day
 * @param {Object} res - The Express response object used to send back the HTTP response.
 * @return {Promise<Object>} A promise that resolves to a create the pdf
 */

router.post('/export/pdf', async (req, res) => {
    try {
        const { assessments, monitoring, selectedDay, language, status, userId, sandbox } = req.body

        const tempFilePath = path.join(__dirname, '../assets/temp.pdf');

        await createPdf(
            assessments,
            tempFilePath,
            monitoring.name,
            selectedDay,
            language,
            status,
            userId,
            sandbox
        );

        // Send the file
        res.sendFile(tempFilePath);
    } catch (error) {
        console.error('Error exporting PDF:', error);
        res.status(500).send('Error exporting PDF');
    }
});

/**
 * POST endpoint for exporting a DOCX report for a given monitoring and session
 * @param {Object} req - The Express request object, containing the selected monitoring, and day
 * @param {Object} res - The Express response object used to send back the HTTP response.
 * @return {Promise<Object>} A promise that resolves to a create the docx
 */
router.post('/export/docx', async (req, res) => {
    try {
        const { assessments, monitoring, selectedDay, language, status, userId, sandbox } = req.body;

        const tempFilePath = path.join(__dirname, '../assets/temp.docx');

        await createDocx(
            assessments,
            tempFilePath,
            monitoring.name,
            selectedDay,
            language,
            status,
            userId,
            sandbox
        );

        // Send the file
        res.sendFile(tempFilePath);
    } catch (error) {
        console.error('Error exporting DOCX:', error);
        res.status(500).send('Error exporting DOCX');
    }
});

/**
 * POST endpoint for exporting a PDF paper version of assessments associated with a given monitoring ID.
 * @param {Object} req - The Express request object, containing monitoringId, assessmentIds, lng, isLinked, and sandbox in the body.
 * @param {Object} res - The Express response object used to send back the HTTP response.
 * @return {Promise<Object>} A promise that resolves to a response object containing either the PDF file or an error message.
 */
router.post('/export/pdfPaperVersion', async (req, res) => {
    const { monitoringId, assessmentIds, lng, isLinked, sandbox, currentUserId } = req.body;

    try {

        // Find the monitoring document
        const monitoring = await getMonitoringById(monitoringId);
        const monitoringName = monitoring.name;

        // Fetch assessments by userId and monitoringId
        const allAssessments = await getAssessmentsByMonitoringId(monitoringId);

        // Filter the assessments by the provided assessment IDs
        const assessments = allAssessments.filter(assessment =>
            assessmentIds.includes(assessment._id.toString())
        );

        // Check if assessments are found
        if (!assessments || assessments.length === 0) {
            return res.status(404).send('No assessments found');
        }

        // Sort assessments according to the order of assessmentIds
        const sortedAssessments = assessmentIds.map(id =>
            assessments.find(assessment => assessment._id.toString() === id)
        );

        const outputDir = path.join(__dirname, '../assets');

        // Construct the file path in the output directory
        const tempFilePath = path.join(outputDir, `paper_version.pdf`);

        // Generate the PDF with the sorted assessments data
        await createPdfPaperVersion(currentUserId, monitoringId, assessmentIds, isLinked, lng, sandbox, sortedAssessments, tempFilePath, monitoringName);

        // Send the generated PDF file back to the client
        res.download(tempFilePath, 'assessments_paper_version.pdf');
    } catch (error) {
        console.error('Error exporting PDF:', error);
        res.status(500).send('Error exporting PDF');
    }
});

module.exports = router;
