const router = require("express").Router();
const { requireMonitoringOwnerOrRedeemer } = require('../middleware/authorization');

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


router.get("/currentUser", async (req, res) => {
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

router.delete("/currentUser", async (req, res) => {
  try {
    const userId = req.user && req.user._id;
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    await deleteAnswersFromUserId(userId);
    const deletedUser = await deleteUser(userId);
    if (deletedUser) {
      return res.json({ message: "User and associated data deleted successfully" });
    } else {
      return res.status(404).json({ error: "User not found" });
    }
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;