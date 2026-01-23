const mongoose = require("mongoose");
const workshopSchema = require("./workshopSchema");

// Question Schema
const questionSchema = new mongoose.Schema({
    questionId: { type: String, required: true }, // used for the position of a question within the assessment
    shortName: { type: String }, // used to identify the question. Should be replaced by a unique identifier!!!
    question: { type: String },
    context: { type: String },
    questionType: { type: String },
    organizationalType: { type: String },
    learningType: { type: String },
    adoptionType: { type: String },
    isMandatory: { type: Boolean, default: false },
    choices: [String],
    workshopId: { type: mongoose.Schema.Types.ObjectId, default: null }, // Reference to embedded workshop
    correctAnswer: { type: [String], default: [] },
    explanation: { type: String },
    framework: { type: String },
    competencies: [String],
    response: [String],
    matrixId: { type: String }, // Matrix unique identifier
    matrixPosition: { type: Number }, // Position of the question within the matrix
    matrixTitle: { type: String }
});

// Assessment Schema
const assessmentSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    monitoringId: String,
    name: String,
    day: String,
    type: String,
    status: String,
    creationDate: { type: Date, default: Date.now() }, // should be createdAt
    lastModificationDate: Date, // should be updatedAt
    position: Number,
    workshops: { type: [workshopSchema], default: [] },
    questions: [questionSchema],
});

const model = mongoose.model("Assessment", assessmentSchema);
module.exports = model;