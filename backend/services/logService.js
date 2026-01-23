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
 * Update logs for a specific monitoring session and user
 * @param {string} monitoringId - The unique identifier of the monitoring document.
 * @param {string} userId - The unique identifier of the user.
 * @param {Array} updatedLogs - The new array of logs after deletion.
 * @return {Promise<Array>} A promise that resolves to the updated array of logs.
 * @throws {Error} Throws an error if there is an issue updating the logs in the database.
 */
const updateLogs = async (monitoringId, userId, updatedLogs) => {
    try {
        // First, delete all existing logs for this monitoring session and user
        await Log.deleteMany({ monitoringId, userId });

        // Then, create new logs from the updated array
        const createPromises = updatedLogs.map(logData => {
            return new Log({
                monitoringId,
                userId,
                description: logData.description,
                day: logData.day,
                assessment: logData.assessment,
                logType: logData.logType,
                assessmentNames: logData.assessmentNames || [],
                displayNames: logData.displayNames || [],
                isCompleted: logData.isCompleted || false,
                creationDate: logData.creationDate || new Date(),
                lastModificationDate: logData.lastModificationDate || null,
                completionDate: logData.completionDate || null
            }).save();
        });

        // Wait for all new logs to be created
        const newLogs = await Promise.all(createPromises);
        console.log("Logs updated successfully");
        return newLogs;

    } catch (error) {
        console.error(error);
        throw new Error("An error occurred while updating the logs");
    }
};

module.exports = { createLog, getLogsByMonitoringAndUser, updateLogs };