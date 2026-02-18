const mongoose = require("mongoose");

/* ---------- Workshop (embedded) ---------- */
const workshopSchema = new mongoose.Schema(
  {
    label: { type: String, required: true },
    workshopPosition: { type: Number, required: true }, // Position of the workshop within the assessment
  },
  { _id: true }
);

module.exports = workshopSchema;
