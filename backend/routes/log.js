const express = require("express");
const router = express.Router();
const {
    createLog,
    getVisibleLogsForMonitoring,
    getMonitoringFollowersForLog,
    updateLog,
    deleteLog,
    updateCompletion,
    requestHelp,
    getLogChat,
    addLogChatMessage,
} = require('../services/logService');
const { requireLogOwner, requireMonitoringOwnerOrRedeemer } = require('../middleware/authorization');

const sendServiceError = (res, err, fallbackStatus = 500) => {
    const status = err.status || fallbackStatus;
    return res.status(status).json({ error: err.message || 'Server error' });
};

router.post('/', async (req, res) => {
    try {
        const { monitoringId, ...rest } = req.body;

        if (!monitoringId) {
            return res.status(400).json({ error: 'Missing required field: monitoringId' });
        }

        const createdLog = await createLog({ ...rest, monitoringId }, req.user._id);
        res.status(200).json(createdLog);
    } catch (err) {
        console.error('Error creating log:', err);
        sendServiceError(res, err);
    }
});

router.get('/monitoring/:monitoringId/followers', requireMonitoringOwnerOrRedeemer('monitoringId'), async (req, res) => {
    try {
        const followers = await getMonitoringFollowersForLog(req.params.monitoringId, req.user._id);
        res.status(200).json(followers);
    } catch (err) {
        console.error(err);
        sendServiceError(res, err);
    }
});

router.get('/monitoring/:monitoringId', requireMonitoringOwnerOrRedeemer('monitoringId'), async (req, res) => {
    try {
        const logs = await getVisibleLogsForMonitoring(req.params.monitoringId, req.user._id);
        res.status(200).json(logs);
    } catch (err) {
        console.error(err.message);
        sendServiceError(res, err);
    }
});

router.post('/:logId/help-request', async (req, res) => {
    try {
        const updated = await requestHelp(req.params.logId, req.user._id, req.user.userStatus);
        res.status(200).json(updated);
    } catch (err) {
        console.error(err);
        sendServiceError(res, err, 400);
    }
});

router.get('/:logId/chat', async (req, res) => {
    try {
        const chat = await getLogChat(req.params.logId, req.user._id);
        res.status(200).json(chat);
    } catch (err) {
        console.error(err);
        sendServiceError(res, err, 400);
    }
});

router.post('/:logId/chat', async (req, res) => {
    try {
        const chat = await addLogChatMessage(req.params.logId, req.user._id, req.body && req.body.text);
        res.status(200).json(chat);
    } catch (err) {
        console.error(err);
        sendServiceError(res, err, 400);
    }
});

router.patch('/:logId', requireLogOwner, async (req, res) => {
    const { logId } = req.params;

    try {
        const updated = await updateLog(logId, req.user._id, req.body);
        res.status(200).json(updated);
    } catch (err) {
        console.error(err.message);
        sendServiceError(res, err, 400);
    }
});

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
        sendServiceError(res, err, 400);
    }
});

router.delete('/:logId', requireLogOwner, async (req, res) => {
    const { logId } = req.params;
    try {
        await deleteLog(logId, req.user._id);
        res.status(204).send();
    } catch (err) {
        console.error(err.message);
        sendServiceError(res, err, 400);
    }
});

module.exports = router;
