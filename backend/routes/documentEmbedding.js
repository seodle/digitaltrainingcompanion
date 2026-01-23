//This route receives a text, generates its embedding, and saves it with an index in the appropriate MongoDB collection.
//The schema used depends on the specified collection name.

const express = require("express");
const mongoose = require('mongoose');
const router = express.Router();
const Schemas = require("../models/embeddingModel.js"); // import the schemas

const { createEmbedding } = require('../utils/createEmbedding');

router.post('/document', async (req, res) => {
  try {
    const { text, collectionName, embeddingIndex } = req.body; // Extract embeddingIndex from the request body



    // Validate the text input
    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: 'Text is required' });
    }


    // Validate the embeddingIndex input
    if (embeddingIndex === undefined || typeof embeddingIndex !== 'number') {
      return res.status(400).json({ error: 'EmbeddingIndex is required and must be a number' });
    }


    // Choose the Schema based on the collectionName
    let DocSchema;
    switch (collectionName) {
      case 'RCNUM OBLIGATOIRE':
        DocSchema = Schemas.EmbeddingRCnumObligatoire;
        break;
      case 'RCNUM POST-OBLIGATOIRE':
        DocSchema = Schemas.EmbeddingRCnumPostObligatoire;
        break;
      case 'DIGCOMPEDU':
        DocSchema = Schemas.EmbeddingDigCompEdu;
        break;
      case 'ESCO':
        DocSchema = Schemas.EmbeddingEsco;
        break;
      case 'PER EN':
        DocSchema = Schemas.EmbeddingPEREN;
        break;
      case 'DIGCOMP':
        DocSchema = Schemas.EmbeddingDigComp;
        break;
      case 'LEHRPLAN MI':
        DocSchema = Schemas.EmbeddingLehrplanMI;
        break;
      case 'RCPFPEE':
        DocSchema = Schemas.EmbeddingRCPFPEE;
        break;
      case 'RCPMPE':
        DocSchema = Schemas.EmbeddingRCPMPE;
        break;
      case 'CRCNEDU':
        DocSchema = Schemas.EmbeddingCRCNedu;
        break;
      case 'CPLLCD':
        DocSchema = Schemas.EmbeddingCPLLCD;
        break;
      default:
        return res.status(400).json({ error: 'Invalid collection name provided' });
    }

    // Create embedding using the provided text and embeddingIndex
    const embedding = await createEmbedding(text);

    // Create a new document instance using the appropriate schema
    const newDoc = new DocSchema({
      description: text,
      embedding: embedding,
      embeddingIndex: embeddingIndex, // Save the embeddingIndex with the document
    });

    // Save the new document to the database
    await newDoc.save();

    // Respond with success message
    res.status(201).json({ message: 'Document saved successfully' });
  } catch (error) {
    // Log and respond with error
    console.error("Error:", error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

module.exports = router;