const mongoose = require("mongoose");

const chatMessageSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "Users" },
    text: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
}, { _id: true });

const logSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "Users" },
    monitoringId: { type: mongoose.Schema.Types.ObjectId, ref: "Monitoring" },
    description: String,
    day: String,
    assessment: String,
    logType: String,
    assessmentNames: [String],
    displayNames: [String],
    isCompleted: { type: Boolean, default: false },
    visibility: {
        type: String,
        enum: ["private", "trainer", "selected", "followers"],
        default: "private",
    },
    sharedWith: [{ type: mongoose.Schema.Types.ObjectId, ref: "Users" }],
    helpRequestedAt: { type: Date, default: null },
    helpRequestedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Users", default: null },
    chat: { type: [chatMessageSchema], default: [] },
    chatReminderSentFor: { type: mongoose.Schema.Types.ObjectId, default: null },
    creationDate: { type: Date, default: Date.now },
    lastModificationDate: { type: Date, default: null, required: false },
    completionDate: { type: Date, default: null, required: false }
});

const model = mongoose.model("logSchema", logSchema, "logs");
module.exports = model;
