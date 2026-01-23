const Response = require('../models/responseModel');


/**
 * Get every answers from a given assessmentId
 * 
 * @param {string} assessmentId - The unique identifier of the assessment.
 * @returns {Promise<Object>} A promise that resolves to an object containing the responses or an error message.
 */
const getAnswersFromAssessmentId = async (assessmentId) => {
  try {
    const responses = await Response.find({ assessmentId: assessmentId }).populate('userId');

    return responses;
  } catch (error) {
    console.error(error);
    throw new Error("An error occurred while getting the responses from the assessment");
  }
};

/**
 * Get every answers from a given monitoringId
 * 
 * @param {string} monitoringId - The unique identifier of the monitoring.
 * @returns {Promise<Object>} A promise that resolves to an object containing the responses or an error message.
 */
const getAnswersFromMonitoringId = async (monitoringId) => {
  try {
    const responses = await Response.find({ monitoringId: monitoringId });

    return responses;
  } catch (error) {
    console.error(error);
    throw new Error("An error occurred while getting the responses from the assessment");
  }
};

/**
 * Get every answers from a given assessmentId
 * 
 * @param {string} assessmentId - The unique identifier of the assessment.
 * @param {string} userId - The unique identifier of the user.
 * @returns {Promise<Object>} A promise that resolves to an object containing the responses or an error message.
 */
const getAnswersFromAssessmentIdAndUserId = async (assessmentId, userId) => {
  try {
    const responses = await Response.find({ assessmentId: assessmentId, userId: userId });

    return responses;
  } catch (error) {
    console.error(error);
    throw new Error("An error occurred while getting the responses from the assessment");
  }
};

/**
 * Deletes every answers from a monitoring
 * 
 * @param {string} monitoringId - The unique identifier of the monitoring to delete.
 * @returns {Promise<Object>} A promise that resolves to an object containing a message indicating the deletion success or an error message.
 */
const deleteAnswersFromMonitoring = async (monitoringId) => {
  try {
    const deletedResponses = await Response.deleteMany({ monitoringId: monitoringId });

    if (deletedResponses) {
      return { message: "All answers from monitoring deleted successfully" };
    } else {
      return { error: "No Answers found with the given monitoringId" };
    }
  } catch (error) {
    console.error("Error deleting answers from monitoring:", error);
    throw new Error("An error occurred while deleting the answers from the monitoring");
  }
};

/**
 * Deletes every answers from an assessment, for a current userId
 * 
 * @param {string} assessmentId - The unique identifier of the assessment to delete.
 * @param {string} userId - The userId.
 * @returns {Promise<Object>} A promise that resolves to an object containing a message indicating the deletion success or an error message.
 */
const deleteAnswersFromAssessment = async (assessmentId, userId) => {

  try {
    const deletedResponses = await Response.deleteMany({ assessmentId: assessmentId, userId: userId });

    if (deletedResponses) {
      return { message: "Answers from Assessment deleted successfully" };
    } else {
      return { error: "No Answers found with the given AssessmentId and userId" };
    }
  } catch (error) {
    console.error("Error deleting answers from assessment:", error);
    throw new Error("An error occurred while deleting the answers from the assessment");
  }
};

/**
 * Deletes every answers for a current userId
 * 
 * @param {string} userId - The userId.
 * @returns {Promise<Object>} A promise that resolves to an object containing a message indicating the deletion success or an error message.
 */
const deleteAnswersFromUserId = async (userId) => {
  try {
    const deletedResponses = await Response.deleteMany({ userId: userId });

    if (deletedResponses) {
      return { message: "Answers deleted successfully" };
    } else {
      return { message: "No Answers found with the given userId" };
    }
  } catch (error) {
    console.error("Error deleting answers from userId:", error);
    throw new Error("An error occurred while deleting the answers from the userId");
  }
};


/**
 * Get all unique display names from responses for given assessment IDs
 * 
 * @param {string[]} assessmentIds - Array of assessment IDs to query
 * @returns {Promise<Array<string>>} Array of unique display names from responses
 */
const getPseudoByAssessmentIds = async (assessmentIds) => {
  try {
    const responses = await Response.find({
      assessmentId: { $in: assessmentIds },
      displayName: { $exists: true, $ne: null, $ne: '' }
    }).distinct('displayName');

    return responses;
  } catch (error) {
    console.error('Error in getPseudoByAssessmentIds:', error);
    throw error;
  }
};

/**
 * Get the last response for a given userId
 * 
 * @param {string} userId - The unique identifier of the user.
 * @returns {Promise<Object|null>} A promise that resolves to the last response object or null if no responses are found.
 */
const getLastResponseByUserId = async (userId) => {
  try {
    // Validate userId
    if (!userId) {
      throw new Error("Invalid userId provided");
    }

    // Fetch the last response sorted by completionDate in descending order
    const response = await Response.findOne({ userId })
      .sort({ completionDate: -1 }) // Sort by most recent
      .exec(); // Execute the query

    // Return the response if found, otherwise return null
    return response || null;
  } catch (error) {
    console.error(`Error fetching last response for userId: ${userId}`, error);
    throw new Error("An error occurred while fetching the last response");
  }
};

module.exports = { getAnswersFromMonitoringId, deleteAnswersFromMonitoring, deleteAnswersFromAssessment, deleteAnswersFromUserId, getAnswersFromAssessmentId, getAnswersFromAssessmentIdAndUserId, getPseudoByAssessmentIds, getLastResponseByUserId };