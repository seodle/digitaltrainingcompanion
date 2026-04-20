const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
require('dotenv').config();

// User Schema
const userSchema = new mongoose.Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String, required: true },
    sandbox: { type: Boolean, default: false }, // deprecated — kept for backward compat
    userStatus: { type: String },
    isVerified: { type: Boolean, default: false },
    verificationToken: { type: String },
    passwordResetToken: { type: String, default: null },
    passwordResetExpires: { type: Date, default: null },
    sharingCodeRedeemed: { type: [String], default: [] },
    termsAccepted: { type: Boolean, required: true, default: false },

    // Subscription
    subscriptionPlan: { type: String, default: 'FREE_TRAINER' },
    trialStartDate: { type: Date, default: Date.now },
    trialActive: { type: Boolean, default: true },

    // AI call tracking
    aiCallsUsedThisMonth: { type: Number, default: 0 },
    aiCallsResetDate: {
        type: Date,
        default: () => {
            const d = new Date();
            d.setMonth(d.getMonth() + 1, 1);
            d.setHours(0, 0, 0, 0);
            return d;
        }
    },

    // Institution / research
    institutionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Institution', default: null },
    isResearchProject: { type: Boolean, default: false },

    // Stripe
    stripeCustomerId: { type: String, default: null },
    stripeSubscriptionId: { type: String, default: null },
});

// methods
userSchema.methods.generateAuthToken = function () {

    const token = jwt.sign(
        {
            _id: this._id,
            firstName: this.firstName,
            lastName: this.lastName,
            email: this.email,
            sandbox: this.sandbox, // deprecated, kept for URL compat
            userStatus: this.userStatus,
            subscriptionPlan: this.subscriptionPlan,
            trialActive: this.trialActive
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