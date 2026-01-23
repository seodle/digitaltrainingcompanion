const Users = require("../models/userModel");
const Monitorings = require("../models/monitoringModel");

const { doesSharingCodeExist } = require("./monitoringService");

/**
 * Appends a new sharing code to the sharingCodeRedeemed array of a user.
 * 
 * @param {string} userId - The unique identifier of the user to update.
 * @param {string} newCode - The new sharing code to append.
 * @returns {Promise&lt;Object&gt;} The updated user document.
 * @throws {Error} If no user is found with the given ID or if there's a database error.
 */
const appendSharingCodeToUser = async (userId, newCode) => {
    try {
        // Check if the sharing code exists in any monitoring document
        const codeExists = await doesSharingCodeExist(newCode);
        if (!codeExists) {
            return { error: 'No sharing code found in any monitoring', status: 404 };
        }

        const user = await Users.findById(userId);
        if (!user) {
            return { error: 'No user found with the given ID', status: 404 };
        }

        if (user.sharingCodeRedeemed && user.sharingCodeRedeemed.includes(newCode)) {
            return { error: 'This code has already been redeemed by the user', status: 409 };
        }

        const updatedUser = await Users.findByIdAndUpdate(
            userId,
            { $push: { sharingCodeRedeemed: newCode } },
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
 * Removes a sharing code from the sharingCodeRedeemed array of a user.
 * 
 * @param {string} userId - The unique identifier of the user to update.
 * @param {string} codeToRemove - The sharing code to remove.
 * @returns {Promise&lt;Object&gt;} The updated user document.
 * @throws {Error} If no user is found with the given ID, if the code doesn't exist, or if there's a database error.
 */
const removeSharingCodeFromUser = async (currentUserId, codeToRemove) => {
    try {
        const monitoring = await Monitorings.findOne({ sharingCode: codeToRemove });

        if (!monitoring) {
            return { error: 'No monitoring found with the given sharing code', status: 404 };
        }

        if (monitoring.userId.toString() === currentUserId) {
            // If the current user is the owner, remove the code from all users
            const result = await Users.updateMany(
                { sharingCodeRedeemed: codeToRemove },
                { $pull: { sharingCodeRedeemed: codeToRemove } }
            );

            // Also set the sharing code to null in the monitoring document
            await Monitorings.updateOne(
                { _id: monitoring._id },
                { $set: { sharingCode: null } }
            );

            if (result.modifiedCount > 0) {
                return { message: 'Sharing code removed from all users successfully', status: 200 };
            } else {
                return { message: 'No users found with the given sharing code', status: 404 };
            }
        } else {
            // If the current user is not the owner, remove the code only from this user
            const updatedUser = await Users.findByIdAndUpdate(
                currentUserId,
                { $pull: { sharingCodeRedeemed: codeToRemove } },
                { new: true }
            );

            if (!updatedUser) {
                return { error: 'Failed to update the user by removing the sharing code', status: 500 };
            }

            // Check if there are any users left who have redeemed this code
            const remainingUsers = await Users.countDocuments({ sharingCodeRedeemed: codeToRemove });

            // If no users have this code anymore, set the sharing code to null in the monitoring document
            if (remainingUsers === 0) {
                await Monitorings.updateOne(
                    { _id: monitoring._id },
                    { $set: { sharingCode: null } }
                );
            }

            return { message: 'Sharing code removed from the user successfully', status: 200 };
        }
    } catch (error) {
        console.error('Error removing sharing code:', error);
        return { error: 'Server error during operation', status: 500 };
    }
};


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

/**
 * Gets all users who have redeemed a specific sharing code.
 * 
 * @param {string} code - The sharing code to look up
 * @returns {Promise<Array>} Array of users with their first and last names
 */
const getUsersByRedeemedCode = async (code) => {
    try {
        // Get users who redeemed the code
        const usersRedeemed = await Users.find(
            { sharingCodeRedeemed: code },
            'firstName lastName'
        );

        // Find the monitoring with this sharing code to get the owner's ID
        const monitoring = await Monitorings.findOne({ sharingCode: code });

        if (!monitoring) {
            return { error: 'Monitoring not found', status: 404 };
        }

        // Get the owner's information
        const owner = await Users.findById(monitoring.userId, 'firstName lastName');

        return {
            result: {
                usersRedeemed,
                owner: owner ? {
                    firstName: owner.firstName,
                    lastName: owner.lastName,
                    isOwner: true
                } : null
            },
            status: 200
        };
    } catch (error) {
        console.error('Error fetching users by redeemed code:', error);
        return { error: 'Server error during operation', status: 500 };
    }
};

module.exports = {
    appendSharingCodeToUser,
    getUserWithId,
    deleteUser,
    removeSharingCodeFromUser,
    getUsersByRedeemedCode
};