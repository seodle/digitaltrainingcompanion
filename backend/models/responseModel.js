const mongoose = require("mongoose");
const workshopSchema = require("./workshopSchema");

// Survey schema
const questionSchema = new mongoose.Schema({
    questionId: { type: String, required: true },
    linkingId: { type: String },
    shortName: { type: String },
    context: { type: String },
    question: { type: String },
    questionType: { type: String, required: true },
    organizationalType: { type: String },
    learningType: { type: String },
    adoptionType: { type: String },
    isMandatory: { type: Boolean, default: false },
    choices: [String],
    workshopId: { type: mongoose.Schema.Types.ObjectId, default: null }, // Reference to embedded workshop
    correctAnswer: [String],
    explanation: { type: String },
    framework: { type: String },
    competencies: [String],
    response: [String],
    matrixId: { type: String }, // Matrix unique identifier
    matrixPosition: { type: Number }, // Position of the question within the matrix
    matrixTitle: { type: String } // Title of the matrix group
});

// Response Schema
const responseSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "Users" },
    email: String,
    monitoringId: { type: mongoose.Schema.Types.ObjectId, ref: "Monitoring" },
    assessmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Assessment" },
    assessmentType: String,
    completionDate: { type: Date, default: Date.now },
    survey: [questionSchema],
    displayName: String,
});

const model = mongoose.model("Response", responseSchema, "response");

module.exports = model;