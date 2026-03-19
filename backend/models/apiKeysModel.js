const mongoose = require('mongoose');
const crypto = require('crypto');

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

const apiKeySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    name: {
        type: String,
        required: true
    },
    key: {
        type: String,
        required: true,
        unique: true,
        select: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

apiKeySchema.pre("save", function (next) {
    if (this.isModified("key")) {
        this.key = encrypt(this.key);
    }
    next();
});

apiKeySchema.pre(["findOneAndUpdate", "updateOne"], function (next) {
    const update = this.getUpdate() || {};
    const set = update.$set || update;

    if (Object.prototype.hasOwnProperty.call(set, "key")) {
        set.key = encrypt(set.key);
    }

    if (update.$set) update.$set = set;
    this.setUpdate(update);
    next();
});

apiKeySchema.methods.getDecryptedKey = function () {
    return decrypt(this.key);
};

apiKeySchema.statics.findByPlainKey = async function (plainKey) {
    const candidates = await this.find({}).select("+key");
    return candidates.find((item) => item.getDecryptedKey() === plainKey) || null;
};

const model = mongoose.model('ApiKey', apiKeySchema);
module.exports = model;