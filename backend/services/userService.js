const Users = require("../models/userModel");
const Monitorings = require("../models/monitoringModel");

/**
 * Appends a new sharing code to the sharingCodeRedeemed array of a user.
 * 
 * @param {string} userId - The unique identifier of the user to update.
 * @param {string} newCode - The new sharing code to append.
 * @returns {Promise&lt;Object&gt;} The updated user document.
 * @throws {Error} If no user is found with the given ID or if there's a database error.
 */
const startFollowingMonitoring = async (userId, sharingCode) => {
    try {
        // Check if the sharing code exists in any monitoring document
        const monitoring = await Monitorings.findOne({ sharingCode: sharingCode });
        if (!monitoring) {
            return { error: 'No sharing code found in any monitoring', status: 404 };
        }

        const user = await Users.findById(userId);
        if (!user) {
            return { error: 'No user found with the given ID', status: 404 };
        }

        if (user.sharingCodeRedeemed && user.sharingCodeRedeemed.includes(sharingCode)) {
            return { error: 'This code has already been redeemed by the user', status: 409 };
        }

        const updatedUser = await Users.findByIdAndUpdate(
            userId,
            { $push: { sharingCodeRedeemed: sharingCode } },
            { new: true }
        );

        if (!updatedUser) {
            return { error: 'Failed to update the user with the new sharing code', status: 500 };
        }

        return { result: updatedUser, status: 200 };
    } catch (error) {
        console.error('Error appending sharing code to user:', error);
        return { error: 'Server error during operation', status: 500 };
    }
};

/**
 * Stops following a monitoring for the current user by removing the monitoring's sharing code
 * from the user's redeemed list. If no users remain with that code, clear it on the monitoring.
 * @param {string} monitoringId
 * @param {string} currentUserId
 * @returns {Promise<Object>} { message } or { error, status }
 */
const stopFollowingMonitoring = async (monitoringId, currentUserId) => {
    try {
        const monitoring = await Monitorings.findById(monitoringId).select('sharingCode');
        if (!monitoring || !monitoring.sharingCode) {
            return { error: 'Monitoring not found or no sharing code', status: 404 };
        }
        const codeToRemove = monitoring.sharingCode;

        const updatedUser = await Users.findByIdAndUpdate(
            currentUserId,
            { $pull: { sharingCodeRedeemed: codeToRemove } },
            { new: true }
        );

        if (!updatedUser) {
            return { error: 'Failed to update the user by removing the sharing code', status: 500 };
        }

        // If no users still have this code, clear it on the monitoring
        const remainingUsers = await Users.countDocuments({ sharingCodeRedeemed: codeToRemove });
        if (remainingUsers === 0) {
            await Monitorings.updateOne(
                { _id: monitoringId },
                { $set: { sharingCode: null } }
            );
        }

        return { message: 'Stopped following successfully', status: 200 };
    } catch (error) {
        console.error('Error in stopFollowingMonitoring:', error);
        return { error: 'Server error during operation', status: 500 };
    }
};
// removeSharingCodeFromUser moved to monitoringService as stopSharingMonitoring


const getUserWithId = async (userId) => {
    try {
        // First, retrieve the user to access their redeemed sharing codes
        const user = await Users.findById(userId);

        if (!user) {
            throw new Error("Users not found");
        }

        return user;
    } catch (error) {
        console.error(error);
        throw new Error("An error occurred while getting the user data");
    }
};


const deleteUser = async (userId) => {
    try {
        // Use findOneAndDelete to ensure the user is found and deleted in a single atomic operation
        const deletedUser = await Users.findOneAndDelete({ _id: userId });

        if (deletedUser) {
            console.log("User deleted successfully:", deletedUser);
            return { message: "User deleted successfully" }; // Return success message
        } else {
            console.log("No user found with the given id:", userId);
            return { error: "No user found with the given id" }; // Return error if user not found
        }
    } catch (error) {
        console.error("Error deleting user:", error);
        throw new Error("An error occurred while deleting the user");
    }
};

module.exports = {
    startFollowingMonitoring,
    stopFollowingMonitoring,
    getUserWithId,
    deleteUser
};