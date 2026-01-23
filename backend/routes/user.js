const router = require("express").Router();

const {
  appendSharingCodeToUser,
  getUserWithId,
  deleteUser,
  removeSharingCodeFromUser,
  getUsersByRedeemedCode
} = require('../services/userService');
const { deleteAnswersFromUserId } = require('../services/responseService');


/**
 * PUT endpoint for appending a sharing code to a user's redeemed codes list.
 * @param {Object} req - The Express request object, containing the userId in the route parameters and the sharing code in the request body.
 * @param {Object} res - The Express response object used to send back the HTTP response.
 * @return {Promise&lt;Object&gt;} A promise that resolves to a response object containing either the updated user document or an error message.
 */
router.put("/users/:userId/append-code/:sharingCode", async (req, res) => {
  const { userId, sharingCode } = req.params;
  const result = await appendSharingCodeToUser(userId, sharingCode);

  if (result.error) {
    return res.status(result.status).json({ error: result.error });
  }

  res.json(result.result);
});

/**
 * PUT endpoint for removing a sharing code to a user's redeemed codes list.
 * @param {Object} req - The Express request object, containing the userId in the route parameters and the sharing code in the request body.
 * @param {Object} res - The Express response object used to send back the HTTP response.
 * @return {Promise&lt;Object&gt;} A promise that resolves to a response object containing either the updated user document or an error message.
 */
router.put("/users/:userId/remove-code/:sharingCode", async (req, res) => {
  const { userId, sharingCode } = req.params;
  const result = await removeSharingCodeFromUser(userId, sharingCode);

  if (result.error) {
    return res.status(result.status).json({ error: result.error });
  }

  res.json(result.result);
});


router.get("/users/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await getUserWithId(userId);

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


router.delete("/users/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    // Delete answers (assuming deleteAnswersFromUserId is an async function)
    await deleteAnswersFromUserId(userId);

    // Delete user (assuming deleteUser is an async function)
    const deletedUser = await deleteUser(userId);

    if (deletedUser) {
      res.json({ message: "User and associated data deleted successfully" });
    } else {
      res.status(404).json({ error: "User not found" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update the route to use the service
router.get('/users/redeemedCode/:code', async (req, res) => {
  try {
    const { code } = req.params;
    const result = await getUsersByRedeemedCode(code);

    if (result.error) {
      return res.status(result.status).json({ error: result.error });
    }

    res.json(result.result);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Error fetching users' });
  }
});

module.exports = router;