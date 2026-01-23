const express = require("express");
const router = express.Router();
const { createLog, getLogsByMonitoringAndUser, updateLogs } = require('../services/logService');

/**
 * Route to create a new log
 */
router.post('/logs/:monitoringId/byUser/:userId', async (req, res) => {
    const { monitoringId, userId } = req.params;
    const logData = {
        monitoringId,
        userId,
        ...req.body.log
    };

    try {
        const createdLog = await createLog(logData);
        console.log('Created log:', createdLog);
        res.status(200).json(createdLog);
    } catch (err) {
        console.error('Error creating log:', err);
        console.error('Error message:', err.message);
        res.status(500).json({ error: err.message });
    }
});

/**
 * Route to get logs by monitoring ID and user ID
 */
router.get('/logs/:monitoringId/byUser/:userId', async (req, res) => {
    const { monitoringId, userId } = req.params;

    try {
        const logs = await getLogsByMonitoringAndUser(monitoringId, userId);

        // Instead of sending 404, send empty array with 200 status
        res.status(200).json(logs); // This will be [] if no logs found
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error' });
    }
});

/**
 * Route to update logs (including deletion)
 * Expects an array of logs in the request body
 */
router.post('/logs/:monitoringId', async (req, res) => {
    const { monitoringId } = req.params;
    const { userId, logs } = req.body;

    try {
        // Validate required fields
        if (!userId || !logs) {
            return res.status(400).json({
                error: 'Missing required fields: userId and logs array are required'
            });
        }

        // Update the logs
        const updatedLogs = await updateLogs(monitoringId, userId, logs);

        res.status(200).json({
            message: 'Logs updated successfully',
            logs: updatedLogs
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({
            error: 'An error occurred while updating the logs',
            details: err.message
        });
    }
});

module.exports = router;