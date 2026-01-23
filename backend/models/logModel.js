const mongoose = require("mongoose");


// Log Schema
const logSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    monitoringId: { type: mongoose.Schema.Types.ObjectId, ref: "Monitoring" },
    description: String,
    day: String,
    assessment: String,
    logType: String,
    assessmentNames: [String],
    displayNames: [String],
    isCompleted: { type: Boolean, default: false },
    creationDate: { type: Date, default: Date.now },
    lastModificationDate: { type: Date, default: null, required: false },
    completionDate: { type: Date, default: null, required: false }
});


const model = mongoose.model("logSchema", logSchema, "logs");
module.exports = model;