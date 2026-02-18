const router = require("express").Router();
const { verifyEmail, registerUser } = require('../services/authenticationService.js');


/**
 * Registers a new user with the provided credentials. 
 * This function validates the user data, checks for an existing user with the same email, hashes the password, generates a verification token, and saves the new user to the database. 
 * It then sends a verification email to the user with a link to verify their email address.
 *
 * @param {Object} userData - The user's registration data. This should include all relevant informations.
 * @returns {Promise<Object>} - An object containing the status of the registration operation and an associated message. 
 * @throws {Error} - Throws an error if there's an unexpected condition encountered during the user registration process.
 */
router.post("/register", async (req, res) => {

  const userData = req.body;
  const result = await registerUser(userData);

  console.log(result)
  res.status(result.status).send({ message: result.message });
});


/**
 * GET endpoint to verify a user's email address.
 *
 * This endpoint is intended to be accessed through a link sent to the user's email.
 * It expects a 'token' as a query parameter, which is used to verify the user's email.
 *
 * @param {Object} req - The Express request object, which should include a 'token' in the query string.
 * @param {Object} res - The Express response object used to send back the HTTP response.
 * @return {Object} The response object, which contains the status of the email verification process and an associated message.
 */
router.get("/verify-email", async (req, res) => {
  const { token } = req.query;
  const result = await verifyEmail(token);

  res.status(result.status).send(result.message);
});

module.exports = router;
