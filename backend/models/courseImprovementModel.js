const mongoose = require("mongoose");

const courseImprovementSchema = new mongoose.Schema({
  monitoringId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Monitoring",
    required: true,
  },
  requesterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Users",
    required: true,
  },
  result: {
    summary: { type: String, default: "" },
    themes: { type: [mongoose.Schema.Types.Mixed] },
    comprehension: { type: [mongoose.Schema.Types.Mixed] },
    graded_responses: { type: [mongoose.Schema.Types.Mixed] },
    scales: { type: [mongoose.Schema.Types.Mixed] },
    coverage: { type: mongoose.Schema.Types.Mixed },
  },
  createdAt: { type: Date, default: Date.now },
});

courseImprovementSchema.index({ monitoringId: 1, createdAt: -1 });

const model = mongoose.model("CourseImprovement", courseImprovementSchema);
module.exports = model;
