const Assessment = require('../models/assessmentModel');
const mongoose = require('mongoose');

/**
 * Create an assessement and add it to the db
 * @param {string} monitoringId - The unique identifier of the monitoring document-
 * @param {Object} newAssessment - The assessment object to be created.
 * @return {Promise<Object>} A promise that resolves to an object containing the ID of the newly created assessment.
 * @throws {Error} Throws an error if the monitoring document is not found or if there is an error saving the updates to the database.
 */
const createAssessment = async (assessmentData) => {

    try {
        // Compute next position on the server to avoid relying on client-side counts
        const nextPosition = (await Assessment.countDocuments({ monitoringId: assessmentData.monitoringId })) + 1;

        // create new Monitoring
        let newAssessment = new Assessment({
            userId: assessmentData.userId,
            monitoringId: assessmentData.monitoringId,
            position: nextPosition,
            name: assessmentData.name,
            day: assessmentData.day,
            type: assessmentData.type,
            status: assessmentData.status,
            creationDate: Date.now(),
            lastModificationDate: Date.now(),
        });

        // save it to the db
        const createdAssessement = await newAssessment.save();
        console.log("New Assessement created successfully");
        return createdAssessement; // Return the created assessement document

    } catch (error) {
        console.error(error);
        throw new Error("An error occurred while creating the assessment");
    }
};

/**
 * Resequence positions 1..N for assessments within a monitoring.
 *
 * Behavior:
 * - If orderedAssessmentIds is provided and non-empty:
 *   - It must contain exactly all assessment _ids for the given monitoring (no extras, no missing, no duplicates).
 *   - Positions are recalculated to 1..N in the order provided.
 *   - On mismatch, a validation error is thrown.
 * - If orderedAssessmentIds is omitted or empty:
 *   - All assessments are resequenced in their current persisted order
 *     (by position, creationDate, _id) to ensure positions 1..N with no gaps.
 *
 * Note: Only the `position` field is updated; `lastModificationDate` is not modified.
 *
 * @param {string} monitoringId
 * @param {string[]=} orderedAssessmentIds
 * @returns {Promise<Array<{ _id: string, position: number }>>}
 */
const resequenceAssessments = async (monitoringId, orderedAssessmentIds = []) => {
  if (!monitoringId) return [];

  // Load all existing assessments for this monitoring in a stable, persisted order
  const assessmentsInMonitoring = await Assessment.find({ monitoringId })
    .sort({ position: 1, creationDate: 1, _id: 1 })
    .select({ _id: 1 })
    .lean();

  const assessmentIdsInPersistedOrder = assessmentsInMonitoring.map(a => a._id.toString());
  if (assessmentIdsInPersistedOrder.length === 0) return [];

  let finalAssessmentIds;

  if (Array.isArray(orderedAssessmentIds) && orderedAssessmentIds.length > 0) {
    const requestedIds = orderedAssessmentIds.map(String);

    const requestedIdsSet = new Set(requestedIds);
    const monitoringAssessmentIdsSet = new Set(assessmentIdsInPersistedOrder);

    // Any mismatch (duplicates, size, or membership) → single validation error
    const hasDuplicates = requestedIdsSet.size !== requestedIds.length;
    const differentSizes = requestedIdsSet.size !== monitoringAssessmentIdsSet.size;
    let differentMembers = false;
    if (!hasDuplicates && !differentSizes) {
      for (const id of requestedIdsSet) {
        if (!monitoringAssessmentIdsSet.has(id)) {
          differentMembers = true;
          break;
        }
      }
    }

    if (hasDuplicates || differentSizes || differentMembers) {
      throw new Error('ValidationError: orderedAssessmentIds must exactly match assessments of this monitoring');
    }

    // Use requested order directly
    finalAssessmentIds = requestedIds;
  } else {
    // No explicit order provided: resequence everyone by current persisted order
    finalAssessmentIds = assessmentIdsInPersistedOrder;
  }

  // Persist positions 1..N for the computed final order (only update `position`)
  await Assessment.bulkWrite(
    finalAssessmentIds.map((assessmentId, index) => ({
      updateOne: {
        filter: { _id: assessmentId, monitoringId },
        update: { $set: { position: index + 1 } }
      }
    }))
  );

  return finalAssessmentIds.map((assessmentId, index) => ({ _id: assessmentId, position: index + 1 }));
};


/**
 * Updates the survey questions for a specific assessment.
 * 
 * @param {string} assessmentId - The unique identifier of the assessment to update.
 * @param {Array} updatedQuestions - The new set of questions to update the assessment with.
 * @returns {Promise<Object>} A promise that resolves with the updated assessment document.
 * @throws {Error} If no assessment is found with the given ID or if there's a database error during the update.
 */
const updateAssessmentSurvey = async (assessmentId, updatedQuestions, workshops) => {
    try {
        // Find the assessment by its ID
        const assessment = await Assessment.findById(assessmentId);
        if (!assessment) {
            throw new Error('No assessment found with the given ID');
        }

        // Update assessment with workshops if provided
        if (workshops && Array.isArray(workshops)) {
            // If sections were explicitly disabled, clear workshops and all workshop links
            if (workshops.length === 0) {
                assessment.workshops = [];
                // Force-clear workshopId on all questions from payload (defensive copy)
                assessment.questions = (updatedQuestions || []).map(q => q ? { ...q, workshopId: null } : q);
            } else {
                // Build a map from temporary workshop _id (string) to normalized mongoose ObjectId
                const idMap = new Map();

                const normalizedWorkshops = workshops.map(w => {
                    const originalId = w._id ? w._id.toString() : undefined;
                    let normalizedId;
                    if (originalId && mongoose.Types.ObjectId.isValid(originalId)) {
                        normalizedId = new mongoose.Types.ObjectId(originalId);
                    } else {
                        normalizedId = new mongoose.Types.ObjectId();
                    }
                    if (originalId) {
                        idMap.set(originalId, normalizedId);
                    }
                    return { ...w, _id: normalizedId };
                });

                // Save workshops with mongoose ObjectId
                assessment.workshops = normalizedWorkshops;

                // Replace question temporary workshopId values (uuid/string) with normalized mongoose ObjectIds
                const updatedQuestionsWithRealIds = (updatedQuestions || []).map(q => {
                    if (!q) return q;
                    const currentId = q.workshopId ? q.workshopId.toString() : undefined;
                    if (currentId && idMap.has(currentId)) {
                        return { ...q, workshopId: idMap.get(currentId) };
                    }
                    if (currentId && mongoose.Types.ObjectId.isValid(currentId) && typeof q.workshopId === 'string') {
                        return { ...q, workshopId: new mongoose.Types.ObjectId(currentId) };
                    }
                    return q;
                });

                assessment.questions = updatedQuestionsWithRealIds;
            }
        } else {
            // Update the questions of the assessment without workshop changes
            assessment.questions = updatedQuestions;
        }

        // Update the last modification date of the assessment
        assessment.lastModificationDate = new Date();

        // Save the updated assessment
        await assessment.save();

        // Return the updated assessment document
        return assessment.questions;
    } catch (error) {
        console.error('Error updating assessment survey:', error);
        throw error; // Rethrow the error to be handled by the calling function
    }
};

/**
 * List assessments for a monitoring, optionally filtered by assessmentType.
 * @param {string} monitoringId
 * @param {string=} assessmentType
 * @returns {Promise<Array>}
 */
const getAssessmentsByMonitoringId = async (monitoringId, assessmentType) => {
    try {
        const filter = { monitoringId };
        if (assessmentType) {
            filter.type = assessmentType;
        }
        // Populate owner minimal identity to avoid an extra roundtrip on the client
        return await Assessment.find(filter)
            .populate({ path: 'userId', select: 'firstName lastName', model: 'Users' });
    } catch (error) {
        console.error(error);
        throw new Error("An error occurred while getting the assessments");
    }
};

/**
 * Copies all assessments associated with a specific monitoring ID and saves them as new assessments.
 * @param {string} monitoringId - The unique identifier of the monitoring whose assessments are to be copied.
 * @param {string} newMonitoringId - The unique identifier of the new monitoring to which the copied assessments will belong.
 * @return {Promise<Array>} A promise that resolves to an array of newly created assessment documents.
 * @throws {Error} Throws an error if there's an issue executing the query or saving the copies.
 */
const copyAssessmentsByMonitoringId = async (monitoringId, newMonitoringId) => {
    try {
        // Retrieve all assessments associated with the original monitoringId
        const assessmentsToCopy = await Assessment.find({ monitoringId: monitoringId });

        // Map over the retrieved assessments and create new assessment objects with the same properties but a new monitoringId
        const copiedAssessmentsPromises = assessmentsToCopy.map(assessment => {
            const copiedAssessment = new Assessment({
                ...assessment.toObject(), // Convert the mongoose document to a plain object
                _id: undefined,
                monitoringId: newMonitoringId, // Associate the new assessments with the new monitoring
                createdAt: new Date(), // Optional: set a new creation date
                updatedAt: new Date(), // Optional: set a new updated date
            });

            return copiedAssessment.save(); // Save each copied assessment
        });

        // Resolve all promises to save all copied assessments
        const copiedAssessments = await Promise.all(copiedAssessmentsPromises);

        return copiedAssessments; // Return the array of new assessment documents
    } catch (error) {
        console.error("Error copying assessments:", error);
        throw new Error("An error occurred while copying the assessments");
    }
};


/**
 * Updates am assessment document in the database.
 * 
 * @param {string} assessmentId - The unique identifier of the assessment to update.
 * @param {Object} updatedAssessmentData - An object containing the updated fields of the assessment.
 * @returns {Promise<Object>} The updated assessment document.
 * @throws {Error} If no assessment is found with the given ID or if there's a database error.
 */
const updateAssessment = async (assessmentId, updatedAssessmentData) => {
    try {
        // Remove the non-ObjectId id from updatedAssessmentData if it exists
        delete updatedAssessmentData.id;

        // Finds an assessment document by its ID and updates it with the provided data
        const updatedAssessment = await Assessment.findByIdAndUpdate(
            assessmentId,
            updatedAssessmentData,
            { new: true } // Return the modified document rather than the original
        );

        if (!updatedAssessment) {
            throw new Error('No assessment found with the given ID');
        }

        return updatedAssessment;
    } catch (error) {
        console.error('Error updating assessment:', error);
        throw error; // Rethrow the error to be handled by the calling function
    }
};

/**
 * Deletes a specific assessment by its ID.
 * 
 * @param {string} assessmentId - The unique identifier of the assessment to delete.
 * @returns {Promise<Object>} A promise that resolves to an object containing a message indicating the deletion success or an error message.
 */
const deleteAssessment = async (assessmentId) => {
    try {
        // Find the monitoring by ID and remove it
        const deletedAssessment = await Assessment.findByIdAndRemove(assessmentId);

        if (deletedAssessment) {
            // Resequence the entire monitoring after deletion
            await resequenceAssessments(deletedAssessment.monitoringId);
            return { message: "Assessment deleted successfully" };
        } else {
            return { error: "No assessment found with the given id" };
        }
    } catch (error) {
        console.error("Error deleting assessment:", error);
        throw new Error("An error occurred while deleting the assessment");
    }
};

/**
 * Deletes all assessments belonging to a given monitoringId
 * 
 * @param {string} monitoringId - The unique identifier of the monitoring
 * @returns {Promise<Object>} A promise that resolves to an object containing a message indicating the deletion success or an error message.
 */
const deleteAssessmentsFromMonitoring = async (monitoringId) => {
    try {
        // Use Mongoose to find and delete all assessments with the given monitoringId
        const deleteResult = await Assessment.deleteMany({ monitoringId });

        // Check if any assessments were deleted
        if (deleteResult.deletedCount > 0) {
            return { message: `${deleteResult.deletedCount} assessments deleted successfully` };
        } else {
            return { message: "No assessments found with the given monitoring ID" };
        }
    } catch (error) {
        console.error("Error deleting assessments:", error);
        throw new Error("An error occurred while deleting assessments from monitoring");
    }
};


/**
 * Asynchronously fetches survey data based on the given assessment IDs. This function first determines the appropriate collection to use based on the sandbox parameter. 
 *
 * @param {string} currentAssessmentServerId - The unique identifier for the specific assessment
 * @param {string} sandbox - A flag indicating whether to use the sandbox environment, affecting the choice of collection for the query
 * @return {Promise<Object>} An object containing the status of the operation ('success' or 'error'), and depending on that, either the survey data (including questions, type, name, and status) or an error message
 * @throws {Error} Throws an error if an unexpected condition is encountered during the survey data retrieval process
 */
const fetchSurveyData = async (currentAssessmentServerId, sandbox) => {

    try {
        // add condition if `sandbox` affects the query
        const assessment = await Assessment.findOne({
            _id: currentAssessmentServerId,
        });

        if (!assessment) {
            return { status: 'error', message: 'No assessment found with the provided ID' };
        }

        // If assessment is found, return the survey and additional details
        return {
            status: 'success',
            data: {
                survey: assessment.questions,
                type: assessment.type,
                name: assessment.name,
                status: assessment.status,
                workshops: assessment.workshops
            }
        };
    } catch (error) {
        console.error(error);
        return { status: 'error', message: 'An error occurred while fetching the survey data' };
    }
};


module.exports = {
    createAssessment,
    deleteAssessment,
    updateAssessmentSurvey,
    updateAssessment,
    deleteAssessmentsFromMonitoring,
    fetchSurveyData,
    copyAssessmentsByMonitoringId,
    resequenceAssessments,
    getAssessmentsByMonitoringId
};