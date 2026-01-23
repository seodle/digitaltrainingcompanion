//This function createEmbedding sends a text input to the OpenAI API to generate its corresponding embedding using the "text-embedding-ada-002" model.
//It returns the embedding vector if the request is successful, or throws an error if the API call fails.

const axios = require('axios');

const API_KEY = process.env.OPENAI_KEY; // API Key for OPENAI API

const createEmbedding = async (text) => {
    if (!text) {
        throw new Error("Text is required for embedding");
    }

    try {
        const response = await axios.post(
            'https://api.openai.com/v1/embeddings',
            {
                input: text,
                model: "text-embedding-ada-002"
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${API_KEY}`
                }
            }
        );

        return response.data.data[0].embedding;

    } catch (error) {
        console.error("Error fetching embedding:", error);
        throw new Error("Failed to create embedding");
    }
}

module.exports = { createEmbedding };
