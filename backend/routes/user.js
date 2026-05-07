const router = require("express").Router();
const { requireMonitoringOwnerOrRedeemer } = require('../middleware/authorization');
const Users = require("../models/userModel");

const {
  startFollowingMonitoring,
  stopFollowingMonitoring,
  getUserWithId,
  deleteUser
} = require('../services/userService');
const { deleteAnswersFromUserId } = require('../services/responseService');


/**
 * PUT endpoint for appending a sharing code to a user's redeemed codes list.
 * @param {Object} req - The Express request object, containing the userId in the route parameters and the sharing code in the request body.
 * @param {Object} res - The Express response object used to send back the HTTP response.
 * @return {Promise&lt;Object&gt;} A promise that resolves to a response object containing either the updated user document or an error message.
 */
router.put("/monitorings/code/:sharingCode/startFollowing", async (req, res) => {
  const userId = req.user._id;
  const { sharingCode } = req.params;
  const result = await startFollowingMonitoring(userId, sharingCode);

  if (result.error) {
    return res.status(result.status).json({ error: result.error });
  }

  res.json(result.result);
});

/**
 * PUT endpoint to stop following a monitoring for the current user.
 * Removes the code from the user's redeemed list; clears monitoring code if no users remain.
 */
router.put("/monitorings/:monitoringId/stopFollowing", requireMonitoringOwnerOrRedeemer('monitoringId'), async (req, res) => {
  const currentUserId = req.user._id;
  const { monitoringId } = req.params;
  const result = await stopFollowingMonitoring(monitoringId, currentUserId);

  if (result.error) {
    return res.status(result.status).json({ error: result.error });
  }

  return res.status(200).json({ message: result.message });
});


router.get("/me", async (req, res) => {
  try {
    const userId = req.user && req.user._id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    const user = await getUserWithId(userId);
    return res.json(user);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

router.put("/externalPlatformKeys", async (req, res) => {
  try {
    const userId = req.user && req.user._id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Whitelist: only allow updating fields we explicitly support.
    const allowedFields = ["aiBeaconApiKey"];
    const createdAtFieldForKeyField = {
      aiBeaconApiKey: "aiBeaconApiKeyCreatedAt"
    };
    const incoming = req.body || {};
    const update = {};

    for (const field of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(incoming, field)) {
        const value = incoming[field];
        update[field] = value;

        // If the key is set/rotated, update the "createdAt" stamp.
        // If the key is removed (null/empty), clear the stamp too.
        if (Object.prototype.hasOwnProperty.call(createdAtFieldForKeyField, field)) {
          update[createdAtFieldForKeyField[field]] = value ? new Date() : null;
        }
      }
    }

    // LMS connection is user-scoped and tied to the aiBeacon credentials.
    // Reset cached value whenever the key is rotated/changed.
    if (Object.prototype.hasOwnProperty.call(incoming, "aiBeaconApiKey")) {
      update.lmsConnectionId = null;
    }

    if (Object.keys(update).length === 0) {
      return res.status(400).json({ error: "No updatable fields provided" });
    }

    const updatedUser = await Users.findByIdAndUpdate(
      userId,
      { $set: update },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.json(updatedUser);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

router.delete("/me", async (req, res) => {
  try {
    const userId = req.user && req.user._id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    await deleteAnswersFromUserId(userId);
    const deletedUser = await deleteUser(userId);
    if (deletedUser) {
      return res.json({ message: "User and associated data deleted successfully" });
    }
    return res.status(404).json({ error: "User not found" });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;