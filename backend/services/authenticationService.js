const bcrypt = require('bcrypt');
const crypto = require("crypto");
const nodemailer = require("nodemailer");

const User = require("../models/userModel");
const { validateUserCredentialsRegister } = require('../utils/passwordValidationUtils.js');
require('dotenv').config();

// TODO add all this in config
const FRONTEND_URL = process.env.NODE_ENV === "production" ? process.env.FRONTEND_URL_PRODUCTION : process.env.FRONTEND_URL_DEVELOPMENT;
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;
const imageUrl = "https://digitaltrainingcompanion.ch/static/media/logo.f1c87519c7fdc5afd373433868125e44.svg";

/**
 * Asynchronously authenticates a user by their email and password.
 *
 * @param {string} email - The user's email address
 * @param {string} password - The user's password
 * @return {Promise<Object>} the authentication status, message, and, if successful, the authentication token
 * @throws {Error} Throws an error if an unexpected condition is encountered during the authentication process
 */
const authenticateUser = async (email, password) => {

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return { status: 'error', message: 'Invalid email or password' };
        }

        if (!user.isVerified) {
            return { status: 'error', message: 'Your account is not verified.' };
        }

        const validPassword = await bcrypt.compare(password, user.password);

        if (!validPassword) {
            return { status: 'error', message: 'Invalid email or password' };
        }

        const token = user.generateAuthToken();
        return { status: 'success', token, message: 'Logged in successfully' };
    }
    catch (error) {
        console.error('Unexpected error during authentication:', error);
        return { status: 'error', message: 'Internal Server Error' };
    }
};

/**
 * Register a new user with the provided credentials and send a verification email.
 *
 * @param {Object} userData - The user's registration data, including email and password.
 * @returns {Promise<Object>} - An object containing the status and message of the registration process.
 * @throws {Error} Throws an error if an unexpected condition is encountered during the registration process.
 */
const registerUser = async (userData, sendEmailForVerification = true) => {
    try {
        const { error } = validateUserCredentialsRegister(userData);
        if (error) {
            return { status: 400, message: error.details[0].message };
        }

        // check if the email already exist
        const existingUser = await User.findOne({ email: userData.email });
        if (existingUser) {
            return { status: 409, message: "User with given email already exists" };
        }

        // hash the password
        const salt = await bcrypt.genSalt(Number(process.env.SALT));
        const hashPassword = await bcrypt.hash(userData.password, salt);

        const verificationToken = crypto.randomBytes(64).toString("hex");

        // create an save a new user
        const newUser = new User({
            ...userData,
            password: hashPassword,
            verificationToken,
            isVerified: false,
        });
        await newUser.save();

        if (sendEmailForVerification) {
            // send an email to verify the account
            let transporter = nodemailer.createTransport({
                host: "mail.infomaniak.com",
                port: 465,
                secure: true,
                requireTLS: true,
                auth: { user: EMAIL_USER, pass: EMAIL_PASS },
            });

            // TODO add this in localizable
            await transporter.sendMail({
                from: `"The Digital Training Companion" <${EMAIL_USER}>`,
                to: userData.email,
                subject: "Please verify your email",
                html: `<p>Hello,</p><p>Please click the link below to verify your email:</p>
                        <p><a href="${FRONTEND_URL}/verifyEmail?token=${verificationToken}" target="_blank">Verify Your Email</a></p>
                        <p>If you did not request this, please ignore this email.</p>
                        <p>Best regards,<br><br><img src="${imageUrl}" alt="The Digital Training Companion" width="200px" height="auto"></p>`,
            });
        }

        return { status: 201, message: "User created successfully. Please check your email to verify your account." };

    } catch (error) {
        console.error('Unexpected error during user registration:', error);
        return { status: 500, message: 'Internal Server Error' };
    }
};

/**
 * Initiates the password reset process for a user by their email.
 *
 * @param {string} email - The user's email address
 * @return {Promise<Object>} the status and message of the operation
 * @throws {Error} Throws an error if an unexpected condition is encountered
 */
const initiatePasswordReset = async (email) => {



    try {
        // get the user associated to the given email address
        const user = await User.findOne({ email });

        if (!user) {
            return { status: 'error', message: "No user registered with this email" };
        }

        // Generate the random reset token
        const resetToken = crypto.randomBytes(32).toString("hex");

        // Hash the token for security
        const passwordResetToken = crypto.createHash("sha256").update(resetToken).digest("hex");

        user.passwordResetToken = passwordResetToken;
        user.passwordResetExpires = Date.now() + 10 * 60 * 1000; // Token valid for 10 minutes -> TODO add this in the confog files
        await user.save();

        // Email URL for resetting password
        const resetURL = `${FRONTEND_URL}/updatePassword/${resetToken}`;

        let transporter = nodemailer.createTransport({
            host: "mail.infomaniak.com",
            port: 465,
            secure: true,
            auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
        });

        // send the email to reset the password
        // TODO all the text in localizable
        await transporter.sendMail({
            from: `"The Digital Training Companion" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: "Forgot Password - Password Reset Instructions",
            text: `To reset your password, please click the following link: ${resetURL}`,
            html: `<p>To reset your password, please click the link below:</p><a href="${resetURL}">Reset Password</a>`,
        });

        return { status: 'success', message: "An email with password reset instructions has been sent." };
    } catch (error) {
        console.error('Unexpected error during password reset initiation:', error);
        return { status: 'error', message: 'Internal Server Error' };
    }
};

/**
 * Resets a user's password given a reset token and a new password.
 *
 * @param {string} token - The password reset token
 * @param {string} newPassword - The new password
 * @return {Promise<Object>} The status and message of the operation
 * @throws {Error} Throws an error if an unexpected condition is encountered
 */
const resetPassword = async (token, newPassword) => {
    try {
        const passwordResetToken = crypto.createHash("sha256").update(token).digest("hex");

        const user = await User.findOne({
            passwordResetToken: passwordResetToken,
            passwordResetExpires: { $gt: Date.now() },
        });

        if (!user) {
            return { status: 'error', message: "Invalid or expired token." };
        }

        // Hash the new password and save it to the user's database record
        user.password = await bcrypt.hash(newPassword, 10);
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save();

        return { status: 'success', message: "Password has been reset." };
    } catch (error) {
        console.error('Unexpected error during password reset:', error);
        throw new Error('Internal Server Error');
    }
};

/**
 * Verifies a user's email using a verification token.
 *
 * @param {string} token - The verification token sent to the user's email.
 * @returns {Promise<Object>} - An object containing the status and message of the verification process.
 */
const verifyEmail = async (token) => {
    try {
        if (!token) {
            return { status: 400, message: "No verification token provided" };
        }

        const user = await User.findOne({ verificationToken: token });
        if (!user) {
            return { status: 400, message: "Invalid verification token" };
        }

        user.isVerified = true;
        user.verificationToken = undefined;
        await user.save();

        return { status: 200, message: "Your email has been verified" };
    } catch (error) {
        console.error('Unexpected error during email verification:', error);
        return { status: 500, message: "Internal Server Error" };
    }
};


module.exports = {
    authenticateUser,
    initiatePasswordReset,
    resetPassword,
    verifyEmail,
    registerUser,
};