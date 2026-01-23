const axios = require('axios');

const OPENAI_ENDPOINT = "https://api.openai.com/v1/chat/completions";
const MODEL = "gpt-4o-mini";
const API_KEY = process.env.OPENAI_KEY;

async function hitOpenAiApi(prompt) {
  const apiRequestBody = {
    model: MODEL,
    messages: [
      {
        role: 'system',
        content: 'You are a helpful assistant.'
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    temperature: 0,
    max_tokens: 150
  };

  try {
    const response = await axios.post(OPENAI_ENDPOINT, apiRequestBody, {
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json"
      }
    });

    return response.data.choices[0].message.content;
  } catch (error) {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error(`OpenAI API returned status: ${error.response.status}`);
      console.error(`Response data:`, error.response.data);
    } else if (error.request) {
      // The request was made but no response was received
      console.error("No response received from OpenAI API");
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error("Error processing message:", error.message);
    }
    throw error;
  }
}

module.exports = { hitOpenAiApi };