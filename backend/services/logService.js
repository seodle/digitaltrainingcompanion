const Log = require('../models/logModel');

/**
 * Create a log and add it to the database
 * @param {Object} logData - The log data to be created.
 * @return {Promise<Object>} A promise that resolves to the created log object.
 * @throws {Error} Throws an error if there is an issue saving the log to the database.
 */
const createLog = async (logData) => {
    try {
        // Create new Log with all fields including arrays
        let newLog = new Log({
            monitoringId: logData.monitoringId,
            userId: logData.userId,
            description: logData.description,
            day: logData.day,
            assessment: logData.assessment,
            logType: logData.logType,
            assessmentNames: logData.assessmentNames || [],
            displayNames: logData.displayNames || [],
            isCompleted: logData.isCompleted || false,
            creationDate: Date.now(),
            lastModificationDate: null,
        });

        // Save it to the database
        const createdLog = await newLog.save();
        console.log("New Log created successfully");
        return createdLog;

    } catch (error) {
        console.error(error);
        throw new Error("An error occurred while creating the log");
    }
};

/**
 * Retrieve logs from the database based on monitoringId and userId
 * @param {string} monitoringId - The unique identifier of the monitoring document.
 * @param {string} userId - The unique identifier of the user.
 * @return {Promise<Array>} A promise that resolves to an array of logs.
 * @throws {Error} Throws an error if there is an issue retrieving the logs from the database.
 */
const getLogsByMonitoringAndUser = async (monitoringId, userId) => {
    try {
        // Find logs that match both monitoringId and userId
        const logs = await Log.find({ monitoringId, userId });
        return logs;
    } catch (error) {
        console.error(error);
        throw new Error("An error occurred while retrieving the logs");
    }
};

/**
 * Update a single log by id for the given user
 * @param {string} logId - The log identifier.
 * @param {string} userId - The user identifier (ownership).
 * @param {Object} updates - Partial updates to apply.
 * @return {Promise<Object>} Updated log.
 */
const updateLog = async (logId, userId, updates) => {
    try {
        const allowed = ['description', 'day', 'assessment', 'logType', 'assessmentNames', 'displayNames', 'isCompleted'];
        const body = {};
        for (const key of allowed) {
            if (updates[key] !== undefined) body[key] = updates[key];
        }

        const now = new Date();
        if (Object.keys(body).length > 0) {
            body.lastModificationDate = now;
        }
        if (Object.prototype.hasOwnProperty.call(body, 'isCompleted')) {
            body.completionDate = body.isCompleted ? now : null;
        }

        const updated = await Log.findOneAndUpdate(
            { _id: logId, userId },
            { $set: body },
            { new: true }
        );
        if (!updated) {
            throw new Error('Log not found or not owned by user');
        }
        return updated;
    } catch (error) {
        console.error(error);
        throw new Error("An error occurred while updating the log");
    }
};

/**
 * Update completion status of a single log
 * @param {string} logId
 * @param {string} userId
 * @param {boolean} isCompleted
 * @return {Promise<Object>} Updated log.
 */
const updateCompletion = async (logId, userId, isCompleted) => {
    try {
        const now = new Date();
        const updated = await Log.findOneAndUpdate(
            { _id: logId, userId },
            { $set: { isCompleted, completionDate: isCompleted ? now : null, lastModificationDate: now } },
            { new: true }
        );
        if (!updated) {
            throw new Error('Log not found or not owned by user');
        }
        return updated;
    } catch (error) {
        console.error(error);
        throw new Error("An error occurred while updating completion");
    }
};

/**
 * Delete a single log by id for the given user
 * @param {string} logId
 * @param {string} userId
 * @return {Promise<void>}
 */
const deleteLog = async (logId, userId) => {
    try {
        const result = await Log.deleteOne({ _id: logId, userId });
        if (result.deletedCount === 0) {
            throw new Error('Log not found or not owned by user');
        }
        return;
    } catch (error) {
        console.error(error);
        throw new Error("An error occurred while deleting the log");
    }
};

module.exports = { createLog, getLogsByMonitoringAndUser, updateLog, updateCompletion, deleteLog };