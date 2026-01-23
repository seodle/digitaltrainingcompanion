const express = require("express");
const mongoose = require('mongoose');
const router = express.Router();
const { IndexFlatL2 } = require('faiss-node');
const path = require('path');
const { createEmbedding } = require('../utils/createEmbedding');

// Load the collections. Each collection corresponds to a competency framework. Each collection has chunks of the framework corresponding to different competences.
// Each chunk has the info regarding the competency as well as its numerical represesentation (vector embedding)

const collectionRCnumObligatoire = mongoose.connection.collection('embedding-rcnum-obligatoire');
const collectionEsco = mongoose.connection.collection('embedding-esco');
const collectionRCnumPostObligatoire = mongoose.connection.collection('embedding-rcnum-postobligatoire');
const collectionDigCompEdu = mongoose.connection.collection('embedding-digcompedu');
const collectionPEREN = mongoose.connection.collection('embedding-per-en');
const collectionDigComp = mongoose.connection.collection('embedding-digcomp');
const collectionLehrplanMI = mongoose.connection.collection('embedding-lehrplan-mi');
const collectionRCPFPEE = mongoose.connection.collection('embedding-rcpfpee'); //Référentiel de compétences professionnelles du formateur de personnels enseignants et éducatifs
const collectionRCPMPE = mongoose.connection.collection('embedding-rcpmpe'); // Référentiel des compétences professionnelles des métiers du professorat et de l'éducation
const collectionCRCNedu = mongoose.connection.collection('embedding-crcnedu'); // Cadre de référence des compétences numériques pour l’éducation
const collectionCPLLCD = mongoose.connection.collection('embedding-cpllcd'); // Learning outcomes for the Certified Practitioner for Lifelong Learning and Competency Development of the Singapore Institute of Technology

// Load the FAISS index for all collections
// FAISS index is the list of all vectors embeddings of a given collection. IndexFlatL2.read(...) a method from the faiss-node module that reads a FAISS index from a file.
//It allows loading into memory an index that was previously created with a python script.
const indexes = {
  'RCNUM OBLIGATOIRE': IndexFlatL2.read(path.join(__dirname, '..', 'utils', 'faiss_index_rcnum_obligatoire')),
  'RCNUM POST-OBLIGATOIRE': IndexFlatL2.read(path.join(__dirname, '..', 'utils', 'faiss_index_rcnum_postobligatoire')),
  'DIGCOMPEDU': IndexFlatL2.read(path.join(__dirname, '..', 'utils', 'faiss_index_digcompedu')),
  'ESCO': IndexFlatL2.read(path.join(__dirname, '..', 'utils', 'faiss_index_esco')),
  'PER EN': IndexFlatL2.read(path.join(__dirname, '..', 'utils', 'faiss_index_per_en')),
  'DIGCOMP': IndexFlatL2.read(path.join(__dirname, '..', 'utils', 'faiss_index_digcomp')),
  'LEHRPLAN MI': IndexFlatL2.read(path.join(__dirname, '..', 'utils', 'faiss_index_lehrplan_mi')),
  'RCPFPEE': IndexFlatL2.read(path.join(__dirname, '..', 'utils', 'faiss_index_rcpfpee')),
  'RCPMPE': IndexFlatL2.read(path.join(__dirname, '..', 'utils', 'faiss_index_rcpmpe')),
  'CRCNEDU': IndexFlatL2.read(path.join(__dirname, '..', 'utils', 'faiss_index_crcnedu')),
  'CPLLCD': IndexFlatL2.read(path.join(__dirname, '..', 'utils', 'faiss_index_cpllcd'))
};

//This route handles a POST request to /query-embedding-faiss, where it takes a user query and collection name, creates an embedding for the query, and searches the corresponding FAISS index for the most semantically similar entries.
//It then retrieves the matching documents from MongoDB using the returned embeddingIndex values, extracts relevant information (like code and label), and sends the results back to the client.

router.post('/query-embedding-faiss', async (req, res) => {
  try {
    const { query, collectionName } = req.body;
    // Choose the collection based on the collectionName
    let collection;
    switch (collectionName) {
      case 'RCNUM OBLIGATOIRE':
        collection = collectionRCnumObligatoire;
        break;
      case 'RCNUM POST-OBLIGATOIRE':
        collection = collectionRCnumPostObligatoire;
        break;
      case 'DIGCOMPEDU':
        collection = collectionDigCompEdu;
        break;
      case 'ESCO':
        collection = collectionEsco;
        break;
      case 'PER EN':
        collection = collectionPEREN;
        break;
      case 'DIGCOMP':
        collection = collectionDigComp;
        break;
      case 'LEHRPLAN MI':
        collection = collectionLehrplanMI;
        break;
      case 'RCPFPEE':
        collection = collectionRCPFPEE;
        break;
      case 'RCPMPE':
        collection = collectionRCPMPE;
        break;
      case 'CRCNEDU':
        collection = collectionCRCNedu;
        break;
      case 'CPLLCD':
        collection = collectionCPLLCD;
        break;
      default:
        return res.status(400).json({ error: 'Invalid collection name provided' });
    }

    let indexLoaded;
    indexLoaded = indexes[collectionName];

    try {
      // Use the absolute path to read the FAISS index
      console.log('FAISS index is loaded');
      // If ntotal is a function, call it to get the total number of vectors in the index
      console.log('Number of vectors in the index:', indexLoaded.ntotal());
      // If getDimension is a function, call it to get the dimension of vectors in the index
      console.log('Dimension of the index:', indexLoaded.getDimension());
    } catch (error) {
      console.error('Error loading FAISS index:', error);
    }

    // Check if the FAISS index is loaded
    if (!indexLoaded) {
      return res.status(503).json({ error: 'FAISS index is not loaded' });
    }

    // Create the embedding for the query
    const queryEmbedding = await createEmbedding(query);

    // Check if the length of the query embedding matches the dimensionality of the index
    if (queryEmbedding.length !== 1536) {
      return res.status(400).json({ error: `Query embedding has an invalid length: ${queryEmbedding.length}` });
    }

    // Search for the top 5 nearest neighbors in the FAISS index
    const k = 5; // Number of nearest neighbors to find
    const searchResults = indexLoaded.search(queryEmbedding, k);

    // Assuming searchResults returns an object with labels and distances
    const { labels, distances } = searchResults;

    // Define similarity threshold (lower = more similar)
    // Adjust this value based on your needs (0.3 to 0.5 = very strict;  0.6 to 0.8 = moderate; 0.9 to 1.0 = loose; > 1.0 = very loose)
    const SIMILARITY_THRESHOLD = 0.5;

    // Filter results based on the distance threshold
    const filteredLabels = [];
    for (let i = 0; i < distances.length; i++) {
      if (distances[i] <= SIMILARITY_THRESHOLD) {
        filteredLabels.push(labels[i]);
      }
    }

    // If no results pass the threshold, return empty array
    if (filteredLabels.length === 0) {
      console.log('No results passed the similarity threshold');
      return res.json([]);
    }

    const similarDocuments = await collection
      .find({ embeddingIndex: { $in: labels } }) // Use the 'index' field to match the labels
      .toArray();

    // Assuming 'labels' is an array of indices from the FAISS search results,
    // you'll want to sort the 'similarDocuments' to maintain the order based on 'labels'
    const sortedDocs = labels.map(label =>
      similarDocuments.find(doc => doc.embeddingIndex === label)
    ).filter(doc => doc); // Filter out any undefined entries just in case

    // Extract the desired information from the sorted documents
    const answers = sortedDocs.map(doc => {
      const labelMatch = doc.description.match(/label:\s*(.*)/);
      const codeMatch = doc.description.match(/code:\s*(.*)/);

      const label = labelMatch ? labelMatch[1] : null;
      const code = codeMatch ? codeMatch[1] : null;

      return code ? `${code} : ${label}` : label ? `: ${label}` : 'No label';
    });

    res.json(answers); // Send back the array of answers
  } catch (err) {
    console.error('Error on querying embeddings:', err);
    res.status(500).json({ error: 'Internal server error', message: err.message });
  }
});

module.exports = router;