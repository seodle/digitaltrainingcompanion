const Joi = require("joi");
const passwordComplexity = require("joi-password-complexity");

const complexityOptions = {
    min: 8,           // Minimum 8 characters
    max: 255,         // Maximum 255 characters
    lowerCase: 1,     // At least 1 lowercase letter
    upperCase: 1,     // At least 1 uppercase letter
    numeric: 1,       // At least 1 numbers required
    symbol: 1,        // At least 1 special character required
};


/**
 * Validates user input data against predefined validation rules for registering.
 *
 * @param {Object} data - The input data to validate, containing an email and password.
 * @returns {Object} - The result of the validation process.
 */
const validateUserCredentialsRegister = (data) => {

    const schema = Joi.object({
        firstName: Joi.string().required(),
        lastName: Joi.string().required(),
        email: Joi.string().email().required(),
        password: passwordComplexity(complexityOptions).required(),
        sandbox: Joi.boolean(),
        userStatus: Joi.string(),
        termsAccepted: Joi.boolean().valid(true).required()
    });

    return schema.validate(data);
};

/**
 * Validates user input data against predefined validation rules for logging in.
 *
 * @param {Object} data - The input data to validate, containing an email and password.
 * @returns {Object} - The result of the validation process.
 */
const validateUserCredentialsLogin = (data) => {

    const schema = Joi.object({
        email: Joi.string().email().required().label("Email"),
        password: Joi.string()
            .required()
            .label("Password"),
    });

    return schema.validate(data);
};


/**
 * Validates user input data for password reset functionality, ensuring the new password meets defined complexity rules.
 *
 * @param {Object} data - The input data to validate, containing the new password.
 * @returns {Object} - The result of the validation process.
 */
const validateResetPassword = (data) => {
    const schema = Joi.object({
        password: passwordComplexity(complexityOptions)
            .required()
            .label("Password"),
    });

    return schema.validate(data);
};

module.exports = {
    validateUserCredentialsLogin,
    validateUserCredentialsRegister,
    validateResetPassword,
};