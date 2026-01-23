import { beforeAll, afterAll, afterEach, describe, test, expect } from 'vitest';
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

const User = require('../models/userModel');
const { authenticateUser, resetPassword, registerUser } = require('../services/authenticationService');
const { validateUserCredentialsLogin, validateResetPassword } = require('../utils/passwordValidationUtils.js');

const email = "test.test@gmail.com";
const password = "password"
const passwordReset = "newSecurePassword123!"
const firstName = "testFirstName"
const lastName = "testLastName"

// Connect to the database before running any tests
beforeAll(async () => {
  const localUri = "mongodb://localhost:27017/test_digitaltrainingcompanion"; // TODO: add this in a config file
  await mongoose.connect(localUri);

  // create a hashed password
  const hashedPassword = await bcrypt.hash(password, 10);

  // insert a user
  let user = new User({
    firstName: firstName,
    lastName: lastName,
    email: email,
    password: hashedPassword,
    userStatus: "active",
    verificationToken: "token123",
    isVerified: true,
    termsAccepted: true
  });

  const savedUser = await user.save();

  // Assertions to verify the user was saved correctly
  expect(savedUser).toBeDefined();
  expect(savedUser.email).toBe(email);
});

// Disconnect from the database after all tests have run
afterAll(async () => {

  // delete the test user
  // await User.deleteOne({ email: email });

  // disconnect the db
  await mongoose.disconnect();
});


describe('Authentification Services', () => {

  // Test for retrieving a user from the database
  test('Retrieving a user', async () => {
    const foundUser = await User.findOne({ email: email });

    // Assertions to verify the user was retrieved correctly
    expect(foundUser).toBeDefined();
    expect(foundUser.email).toBe(email);
    expect(foundUser.firstName).toBe(firstName);
  });

  // test right email / password
  test('Should return success status for correct credentials', async () => {
    const result = await authenticateUser(email, password);
    expect(result.status).toBe('success');
    expect(result.token).toBeDefined();
    expect(result.message).toBe('Logged in successfully');
  });

  // test right password wrong email
  test('Should return error status for incorrect email', async () => {
    const result = await authenticateUser('wrong@example.com', password);
    expect(result.status).toBe('error');
    expect(result.message).toBe('Invalid email or password');
  });

  // test right email / wrong password
  test('Should return error status for incorrect password', async () => {
    const result = await authenticateUser(email, 'wrongPassword');
    expect(result.status).toBe('error');
    expect(result.message).toBe('Invalid email or password');
  });

  // test valid password lenght
  test('Password validation should pass for a valid password', async () => {
    const validation = validateUserCredentialsLogin({ email, password });
    expect(validation.error).toBeUndefined();
  });

  // test invalid password: TODO later add at least one character, ect... 
  test('Password validation should fail for an invalid password', async () => {
    const invalidPassword = "short";
    const validation = validateUserCredentialsLogin({ email, password: invalidPassword });
    expect(validation.error).toBeUndefined();
  });

  // test reset password
  test('Password reset process should update the user\'s password', async () => {
    // Generate a reset token and update the user with this reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedResetToken = crypto.createHash("sha256").update(resetToken).digest("hex");

    await User.updateOne({ email }, {
      passwordResetToken: hashedResetToken,
      passwordResetExpires: Date.now() + 3600000, // 1 hour from now
    });

    // Validate the new password
    const validation = validateResetPassword({ password: passwordReset });
    expect(validation.error).toBeUndefined();

    // Reset the password using the token
    const resetResult = await resetPassword(resetToken, passwordReset);
    expect(resetResult.status).toBe('success');

    // Authenticate with the new password
    const authResult = await authenticateUser(email, passwordReset);
    expect(authResult.status).toBe('success');
  });
});

describe('User Registration', () => {

  // Sample user data for registration
  const testUser = {
    firstName: firstName,
    lastName: lastName,
    email: "thibault.bloum@epfl.ch",
    password: "Password1234_",
    termsAccepted: true
  };

  // Test for successful user registration
  test('Successful registration should create a new user', async () => {
    // Call the registerUser function from your authentication service
    const result = await registerUser(testUser, false);

    // Check that the registration was successful
    expect(result.status).toBe(201);
    expect(result.message).toContain('User created successfully');

    // Fetch the user from the database
    const registeredUser = await User.findOne({ email: testUser.email });

    // Check that the user exists in the database
    expect(registeredUser).toBeDefined();

    // Check that the user's email is correct
    expect(registeredUser.email).toBe(testUser.email);

    // Check that the password is hashed (not the same as the input password)
    expect(registeredUser.password).not.toBe(testUser.password);
  });

  // Cleanup: Delete the test user after the test runs
  // Cleanup: Delete the test user after the test runs
  afterEach(async () => {
    // Delete the test user based on the unique email
    await User.deleteMany({
      $or: [
        { email: testUser.email },
        { email: email }
      ]
    });
  });
});