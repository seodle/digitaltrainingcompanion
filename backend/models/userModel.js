const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
require('dotenv').config();

// User Schema
const userSchema = new mongoose.Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String, required: true },
    sandbox: { type: Boolean, default: false },
    userStatus: { type: String },
    isVerified: { type: Boolean, default: false },
    verificationToken: { type: String },
    passwordResetToken: { type: String, default: null },
    passwordResetExpires: { type: Date, default: null },
    sharingCodeRedeemed: { type: [String], default: [] },
    termsAccepted: { type: Boolean, required: true, default: false },
});

// methods
userSchema.methods.generateAuthToken = function () {

    const token = jwt.sign(
        {
            _id: this._id,
            firstName: this.firstName,
            lastName: this.lastName,
            email: this.email,
            sandbox: this.sandbox,
            userStatus: this.userStatus
        },

        process.env.JWTPRIVATEKEY,
        {
            expiresIn: "1d",
        }
    );
    return token;
};

// TODO user should be users
const model = mongoose.model("Users", userSchema);
module.exports = model;