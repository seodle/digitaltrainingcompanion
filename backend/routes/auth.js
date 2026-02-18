const router = require("express").Router();
const { authenticateUser, initiatePasswordReset, resetPassword } = require('../services/authenticationService.js');
const { validateUserCredentialsLogin, validateResetPassword } = require('../utils/passwordValidationUtils.js');

/**
 * POST endpoint for signing in a user.
 *
 * @param {Object} req - The Express request object, which should include an 'email' and 'password' in the body
 * @param {Object} res - The Express response object used to send back the HTTP response
 * @return {Object} The response object
 */
router.post("/signin", async (req, res) => {

  const { email, password } = req.body;

  // validate the email/password before authentification
  const { error } = validateUserCredentialsLogin(req.body);
  if (error) {
    return res.status(400).send({ message: error.details[0].message });
  }

  // try to authentificate the user 
  const result = await authenticateUser(email, password);

  if (result.status === 'error') {
    return res.status(401).send({ message: result.message });
  }

  res.status(200).send({ token: result.token, message: result.message });
});

/**
 * POST endpoint for sending a mail to reset the password
 *
 * @param {Object} req - The Express request object, which should include an 'email' and 'password' in the body
 * @param {Object} res - The Express response object used to send back the HTTP response
 * @return {Object} The response object
 */
router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;
  const result = await initiatePasswordReset(email);

  res.status(result.status === 'success' ? 201 : 500).send({ message: result.message });
});

/**
 * POST endpoint to reset the password
 *
 * @param {Object} req - The Express request object, which should include an 'email' and 'password' in the body
 * @param {Object} res - The Express response object used to send back the HTTP response
 * @return {Object} The response object
 */
router.post("/updatePassword/:token", async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  try {
    // validate the email/password before authentification
    const { error } = validateResetPassword(req.body);
    if (error) {
      return res.status(400).send({ message: error.details[0].message });
    }

    // reset the password
    const result = await resetPassword(token, password);

    res.status(result.status === 'success' ? 200 : 400).send({ message: result.message });
  } catch (error) {

    console.error(error);
    res.status(500).send({ message: "Internal Server Error" });
  }
});


module.exports = router;
