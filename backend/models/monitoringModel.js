const mongoose = require("mongoose");

// Monitoring Schema
const monitoringSchema = new mongoose.Schema({
    orderId: Number,
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    name: String,
    description: String,
    creationDate: { type: Date, default: Date.now }, // should be createdAt
    lastModificationDate: { type: Date, default: Date.now }, // should be updatedAt
    sharingCode: { type: String, default: null }
});

const model = mongoose.model("Monitoring", monitoringSchema);
// const monitoringSandbox = mongoose.model("MonitoringSandbox", monitoringSchema, "monitoring-sandbox");

module.exports = model;