const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
require('dotenv').config();

const algorithm = "aes-256-cbc";
const key = crypto.createHash("sha256")
    .update(process.env.ENCRYPTION_KEY || "")
    .digest();

function encrypt(text) {
    if (!text) return text;
    if (typeof text === "string" && text.includes(":")) return text;

    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, key, iv);

    let encrypted = cipher.update(String(text), "utf8", "hex");
    encrypted += cipher.final("hex");

    return `${iv.toString("hex")}:${encrypted}`;
}

function decrypt(text) {
    if (!text) return text;

    const [ivHex, encrypted] = String(text).split(":");
    if (!ivHex || !encrypted) return text;

    const iv = Buffer.from(ivHex, "hex");
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
}

// User Schema
const userSchema = new mongoose.Schema({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String, required: true, select: false },
    sandbox: { type: Boolean, default: false },
    userStatus: { type: String },
    isVerified: { type: Boolean, default: false },
    verificationToken: { type: String, select: false },
    passwordResetToken: { type: String, default: null, select: false },
    passwordResetExpires: { type: Date, default: null, select: false },
    aiBeaconApiKey: { type: String, default: null, select: false },
    aiBeaconApiKeyCreatedAt: { type: Date, default: null },
    lmsConnectionId: { type: String, default: null },
    sharingCodeRedeemed: { type: [String], default: [] },
    termsAccepted: { type: Boolean, required: true, default: false }
});

userSchema.pre("save", function (next) {
    if (this.isModified("aiBeaconApiKey")) {
        this.aiBeaconApiKey = encrypt(this.aiBeaconApiKey);
    }
    next();
});

userSchema.pre(["findOneAndUpdate", "updateOne"], function (next) {
    const update = this.getUpdate() || {};
    const set = update.$set || update;

    if (Object.prototype.hasOwnProperty.call(set, "aiBeaconApiKey")) {
        set.aiBeaconApiKey = encrypt(set.aiBeaconApiKey);
    }

    if (update.$set) update.$set = set;
    this.setUpdate(update);
    next();
});

userSchema.methods.getAiBeaconApiKey = function () {
    return decrypt(this.aiBeaconApiKey);
};

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