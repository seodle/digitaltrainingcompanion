// First, we import mongoose to use its methods.
const mongoose = require("mongoose");

const Schema = mongoose.Schema;

//Defines a reusable Mongoose schema for documents that include text metadata and a vector embedding, and then creates separate models for each collection(e.g., RCNUM, DigCompEdu) by associating them with specific MongoDB collection names.
//Each model allows storing documents with a title, description, optional file name, upload date, embedding vector, and embedding index in its corresponding collection.
const embeddingSchema = new Schema({
  title: String,
  description: String,
  fileName: String,
  uploadDate: {
    type: Date,
    default: Date.now,
  },
  embedding: [Number], // Represents the vector embedding, 1536 numbers in array
  embeddingIndex: Number
});

const EmbeddingRCnumObligatoire = mongoose.model("Embedding", embeddingSchema, "embedding-rcnum-obligatoire");
const EmbeddingRCnumPostObligatoire = mongoose.model("Embedding", embeddingSchema, "embedding-rcnum-postobligatoire");
const EmbeddingEsco = mongoose.model("Embedding", embeddingSchema, "embedding-esco");
const EmbeddingDigCompEdu = mongoose.model("Embedding", embeddingSchema, "embedding-digcompedu");
const EmbeddingPEREN = mongoose.model("Embedding", embeddingSchema, "embedding-per-en");
const EmbeddingDigComp = mongoose.model("Embedding", embeddingSchema, "embedding-digcomp");
const EmbeddingLehrplanMI = mongoose.model("Embedding", embeddingSchema, "embedding-lehrplan-mi");
const EmbeddingRCPFPEE = mongoose.model("Embedding", embeddingSchema, "embedding-rcpfpee"); // Référentiel de compétences professionnelles du formateur de personnels enseignants et éducatifs
const EmbeddingRCPMPE = mongoose.model("Embedding", embeddingSchema, "embedding-rcpmpe");  // Référentiel des compétences professionnelles des métiers du professorat et de l'éducation
const EmbeddingCRCNedu = mongoose.model("Embedding", embeddingSchema, "embedding-crcnedu"); // Cadre de référence des compétences numériques pour l’éducation
const EmbeddingCPLLCD = mongoose.model("Embedding", embeddingSchema, "embedding-cpllcd"); // Learning outcomes for the Certified Practitioner for Lifelong Learning and Competency Development of the Singapore Institute of Technology



// Finally, we export the model so that it can be used in other parts of the application.
const mySchemas = {
  EmbeddingRCnumObligatoire,
  EmbeddingRCnumPostObligatoire,
  EmbeddingEsco,
  EmbeddingDigCompEdu,
  EmbeddingPEREN,
  EmbeddingDigComp,
  EmbeddingLehrplanMI,
  EmbeddingRCPFPEE,
  EmbeddingRCPMPE,
  EmbeddingCRCNedu,
  EmbeddingCPLLCD,
};
module.exports = mySchemas;
