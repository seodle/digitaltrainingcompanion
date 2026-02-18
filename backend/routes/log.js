const express = require("express");
const router = express.Router();
const { createLog, getLogsByMonitoringAndUser, updateLog, deleteLog, updateCompletion } = require('../services/logService');
const { requireLogOwner, requireMonitoringOwnerOrRedeemer } = require('../middleware/authorization');

/**
 * Route to create a new log
 */
router.post('/', async (req, res) => {
    try {
        const { monitoringId, ...rest } = req.body;

        if (!monitoringId) {
            return res.status(400).json({ error: 'Missing required field: monitoringId' });
        }

        const logData = {
            ...rest,
            monitoringId,
            userId: req.user._id
        };

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
 * Route to get logs by monitoring ID for the current user
 */
router.get('/monitoring/:monitoringId', requireMonitoringOwnerOrRedeemer('monitoringId'), async (req, res) => {
    const { monitoringId } = req.params;
    const userId = req.user && req.user._id;
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
 * Update a single log by id (partial update)
 */
router.patch('/:logId', requireLogOwner, async (req, res) => {
    const { logId } = req.params;

    try {
        const updated = await updateLog(logId, req.user._id, req.body);
        res.status(200).json(updated);
    } catch (err) {
        console.error(err.message);
        res.status(400).json({ error: err.message });
    }
});

/**
 * Toggle/set completion on a single log
 */
router.patch('/:logId/completion', requireLogOwner, async (req, res) => {
    const { logId } = req.params;
    const { isCompleted } = req.body;
    if (typeof isCompleted !== 'boolean') {
        return res.status(400).json({ error: 'isCompleted must be boolean' });
    }
    try {
        const updated = await updateCompletion(logId, req.user._id, isCompleted);
        res.status(200).json(updated);
    } catch (err) {
        console.error(err.message);
        res.status(400).json({ error: err.message });
    }
});

/**
 * Delete a single log by id
 */
router.delete('/:logId', requireLogOwner, async (req, res) => {
    const { logId } = req.params;
    try {
        await deleteLog(logId, req.user._id);
        res.status(204).send();
    } catch (err) {
        console.error(err.message);
        res.status(400).json({ error: err.message });
    }
});

module.exports = router;