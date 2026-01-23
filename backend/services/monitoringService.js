const Monitoring = require('../models/monitoringModel');
const User = require("../models/userModel");

/**
 * Asynchronously creates a new monitoring document in the database with the provided monitoring data. 
 * @param {Object} monitoringData - An object containing the necessary data to create a monitoring document, including userId, name, description, creationDate, and lastModification.
 * @return {Promise<Object>} A promise that resolves to the newly created monitoring document.
 * @throws {Error} Throws an error if the document cannot be saved to the database, encapsulating any underlying database errors.
 */
const createMonitoring = async (monitoringData) => {
  try {

    // create new Monitoring
    let newMonitoring = new Monitoring({
      orderId: monitoringData.orderId,
      userId: monitoringData.userId,
      name: monitoringData.name,
      description: monitoringData.description,
      creationDate: monitoringData.creationDate,
      lastModification: monitoringData.lastModification,
      sharingCode: monitoringData.sharingCode,
    });

    // save it to the db
    const createdMonitoring = await newMonitoring.save();
    console.log("New monitoring created successfully");
    return createdMonitoring; // Return the created monitoring document
  } catch (error) {
    console.error(error);
    throw new Error("An error occurred while creating the monitoring");
  }
};

/**
 * Fetches monitorings for a user including those accessible via redeemed sharing codes.
 * @param {string} userId - The user's ID.
 * @returns {Promise<Array>} A promise that resolves to an array of monitoring documents.
 */
const getMonitoringsByUserId = async (userId) => {
  try {
    // First, retrieve the user to access their redeemed sharing codes
    const user = await User.findById(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Array of sharing codes that the user has redeemed
    const redeemedCodes = user.sharingCodeRedeemed || [];

    // Query for monitorings that belong to the user or are linked by a redeemed sharing code
    const monitorings = await Monitoring.find({
      $or: [
        { userId: userId },
        { sharingCode: { $in: redeemedCodes } }
      ]
    });

    return monitorings;
  } catch (error) {
    console.error(error);
    throw new Error("An error occurred while getting the monitorings");
  }
};

/**
 * Fetches a monitoring document by monitoringId.
 * @param {string} monitoringId - The monitoring's ID.
 * @returns {Promise<Object>} A promise that resolves to a monitoring document.
 */
const getMonitoringById = async (monitoringId) => {
  try {
    const monitoring = await Monitoring.findById(monitoringId);
    if (!monitoring) {
      throw new Error("Monitoring not found");
    }
    return monitoring;
  } catch (error) {
    console.error(error);
    throw new Error("An error occurred while getting the monitoring");
  }
};



/**
 * Fetches a monitoring document based on its creation date.
 * @param {Date} creationDate - The creation date of the monitoring to be retrieved.
 * @return {Promise<Object>} A promise that resolves to the monitoring document if found.
 * @throws {Error} Throws an error if no monitoring is found or if there is a failure in executing the query.
 */
const getMonitoringByCreationDate = async (creationDate) => {
  try {
    const monitoring = await Monitoring.findOne({ creationDate: creationDate });

    if (!monitoring) {
      throw new Error("No monitoring found with the given creation date");
    }

    return monitoring;
  } catch (error) {
    console.error(error);
    throw new Error("An error occurred while getting the monitoring");
  }
};

/**
 * Updates a monitoring document in the database.
 * 
 * @param {string} monitoringId - The unique identifier of the monitoring to update.
 * @param {Object} updatedMonitoringData - An object containing the updated fields of the monitoring.
 * @returns {Promise<Object>} The updated monitoring document.
 * @throws {Error} If no monitoring is found with the given ID or if there's a database error.
 */
const updateMonitoring = async (monitoringId, updatedMonitoringData) => {

  console.log(updatedMonitoringData)

  try {
    // Remove the non-ObjectId id from updatedMonitoringData if it exists
    delete updatedMonitoringData.id;

    // Finds a monitoring document by its ID and updates it with the provided data
    const updatedMonitoring = await Monitoring.findByIdAndUpdate(
      monitoringId,
      updatedMonitoringData,
      { new: true } // Return the modified document rather than the original
    );

    if (!updatedMonitoring) {
      throw new Error('No monitoring found with the given ID');
    }

    return updatedMonitoring;
  } catch (error) {
    console.error('Error updating monitoring:', error);
    throw error; // Rethrow the error to be handled by the calling function
  }
};

/**
 * Deletes a specific monitoring by its ID.
 * 
 * @param {string} monitoringId - The unique identifier of the monitoring to delete.
 * @returns {Promise<Object>} A promise that resolves to an object containing a message indicating the deletion success or an error message.
 */
const deleteMonitoring = async (monitoringId) => {
  try {
    // Find the monitoring by ID and remove it
    const deletedMonitoring = await Monitoring.findByIdAndRemove(monitoringId);

    if (deletedMonitoring) {
      return { message: "Monitoring deleted successfully" };
    } else {
      return { error: "No monitoring found with the given id" };
    }
  } catch (error) {
    console.error("Error deleting monitoring:", error);
    throw new Error("An error occurred while deleting the monitoring");
  }
};


/**
 * / check if a monitoring with the given sharingCode exists. If it does return, otherwise false
 * @param {string} sharingCode 
 * @returns {Promise<Bool>} a boolean indicating if the sharing code exists
 */
const doesSharingCodeExist = async (sharingCode) => {
  const monitoring = await Monitoring.findOne({ sharingCode: sharingCode });
  return !!monitoring;
};


module.exports = {
  createMonitoring, getMonitoringsByUserId, getMonitoringByCreationDate, getMonitoringById,
  updateMonitoring, deleteMonitoring, doesSharingCodeExist
};