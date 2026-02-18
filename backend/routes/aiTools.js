const express = require('express');
const router = express.Router();
const axios = require('axios');

// Get Infomaniak AI endpoint ID from environment variable
const INFOMANIAK_AI_ENDPOINT_ID = process.env.INFOMANIAK_AI_ENDPOINT_ID;
if (!INFOMANIAK_AI_ENDPOINT_ID) {
    console.error('Error: INFOMANIAK_AI_ENDPOINT_ID environment variable is not set');
}

router.post('/infomaniak/chat', async (req, res) => {
    try {
        if (!INFOMANIAK_AI_ENDPOINT_ID) {
            return res.status(500).json({
                error: 'Server configuration error: INFOMANIAK_AI_ENDPOINT_ID is not set'
            });
        }
        // Combine the incoming request with our configuration
        const requestBody = {
            model: 'llama3',
            messages: req.body.messages,
            temperature: 0.1
        };

        const response = await axios.post(
            'https://api.infomaniak.com/1/ai/{INFOMANIAK_AI_ENDPOINT_ID}/openai/chat/completions',
            requestBody,
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.INFOMANIAK_KEY}`,
                    'Accept': 'application/json'
                }
            }
        );

        res.json(response.data);
    } catch (error) {
        console.error('Full error details:', JSON.stringify(error.response?.data, null, 2));
        console.error('Request payload:', JSON.stringify(error.config?.data, null, 2));

        res.status(error.response?.status || 500).json({
            error: 'Error communicating with Infomaniak API',
            details: error.response?.data || error.message
        });
    }
});

router.post('/suggest-options', async (req, res) => {
    try {
        if (!INFOMANIAK_AI_ENDPOINT_ID) {
            return res.status(500).json({
                error: 'Server configuration error: INFOMANIAK_AI_ENDPOINT_ID is not set'
            });
        }
        const { questionTitle, numberOfOptions, instructions, questionType } = req.body;

        if (!questionTitle) {
            return res.status(400).json({ error: 'Question title is required' });
        }

        const count = numberOfOptions || 2; // Default to 2 options if not specified
        const isOrderedScale = questionType === 'radio-ordered';

        // Create the system prompt based on question type
        let systemPrompt = isOrderedScale
            ? 'You are a helpful assistant that generates appropriate scale options for survey questions, from negative to positive impact. Return only JSON array of strings with no additional text.'
            : 'You are a helpful assistant that generates diverse, meaningful options for survey questions. Options should cover different aspects and be relevant to the question. Return only JSON array of strings with no additional text.';

        // Create the prompt for the LLM based on question type
        let prompt = '';

        if (isOrderedScale) {
            prompt = `Generate ${count} appropriate scale options (from negative to positive) for the question: "${questionTitle}". The options should represent a gradual scale from negative to positive opinions or impacts.`;
        } else {
            prompt = `Generate ${count} diverse, meaningful options for the question: "${questionTitle}". The options should be distinct from each other and cover different relevant aspects of the question.`;
        }

        // If specific instructions were provided (like neutral options for odd numbers), include them
        if (instructions) {
            prompt += ` ${instructions}`;
        }

        prompt += ` Return only the options as a JSON array of strings, nothing else.`;

        // Prepare the request to the LLM API
        const requestBody = {
            model: 'llama3',
            messages: [
                {
                    role: 'system',
                    content: systemPrompt
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            temperature: 0.3
        };

        const response = await axios.post(
            'https://api.infomaniak.com/1/ai/{INFOMANIAK_AI_ENDPOINT_ID}/openai/chat/completions',
            requestBody,
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.INFOMANIAK_KEY}`,
                    'Accept': 'application/json'
                }
            }
        );

        // Extract the generated options from the LLM response
        const content = response.data.choices[0].message.content;

        // Try to parse the response as JSON
        let suggestions;
        try {
            // Remove any markdown code formatting if present
            const jsonContent = content.replace(/```json\n?|\n?```/g, '');
            suggestions = JSON.parse(jsonContent);

            // Ensure we have the correct number of options
            if (suggestions.length !== count) {
                suggestions = suggestions.slice(0, count);
                while (suggestions.length < count) {
                    suggestions.push("");
                }
            }
        } catch (parseError) {
            console.error('Error parsing LLM response:', parseError);
            // If parsing fails, extract options using regex as a fallback
            const optionMatches = content.match(/"([^"]+)"/g) || [];
            suggestions = optionMatches.slice(0, count).map(m => m.replace(/"/g, ''));

            // Fill with empty strings if not enough options found
            while (suggestions.length < count) {
                suggestions.push("");
            }
        }

        res.json({ suggestions });
    } catch (error) {
        console.error('Error suggesting options:', error);
        res.status(500).json({
            error: 'Error generating suggested options',
            details: error.response?.data || error.message
        });
    }
});

/**
 * POST endpoint to generate AI summary for text question responses
 * @body {responses} - Array of response strings
 * @body {questionText} - The question text
 * @body {language} - Language code (en, fr, de, it, es)
 * @body {sandbox} - Boolean indicating if user is sandbox (optional, for backward compatibility)
 * @returns {summary} - AI generated summary or null for sandbox users
 */
router.post('/generate-text-summary', async (req, res) => {
    try {
        if (!INFOMANIAK_AI_ENDPOINT_ID) {
            return res.status(500).json({
                error: 'Server configuration error: INFOMANIAK_AI_ENDPOINT_ID is not set'
            });
        }
        const { responses, questionText, language, sandbox } = req.body;

        // Validation
        if (!responses || !Array.isArray(responses)) {
            return res.status(400).json({ error: 'Responses array is required' });
        }

        if (!questionText) {
            return res.status(400).json({ error: 'Question text is required' });
        }

        if (!language) {
            return res.status(400).json({ error: 'Language is required' });
        }

        // Check if user is sandbox - return early if true
        if (sandbox === true) {
            return res.json({
                summary: null,
                message: 'Summary generation not available for sandbox users'
            });
        }

        // Filter out null/empty responses
        const validResponses = responses.filter(r => r !== null && r !== '');

        // If no valid responses, return localized "no comments" message
        if (validResponses.length === 0) {
            const noCommentsMessages = {
                en: "No comments were provided for this question.",
                fr: "Aucun commentaire n'a été fourni pour cette question.",
                de: "Für diese Frage wurden keine Kommentare abgegeben.",
                it: "Non sono stati forniti commenti per questa domanda.",
                es: "No se proporcionaron comentarios para esta pregunta."
            };
            return res.json({
                summary: noCommentsMessages[language] || noCommentsMessages['en']
            });
        }

        // Call Infomaniak API with the exact same prompt as PDF/DOCX exports
        const requestBody = {
            model: 'llama3',
            messages: [{
                role: "user",
                content: `
                    Question: ${questionText}
                    Responses: ${JSON.stringify(validResponses)}
                    Language: ${language}
                    
                    Analyze these text responses very precisely and provide 1-2 sentences max that highlight the key takeaways or common themes for the reader. Do not quote specific responses.

                    IMPORTANT: Write your response in ${language} only.

                    Here are examples of the expected format in each supported language:
                    English (en): "Most participants highlighted the importance of digital tools, particularly focusing on collaboration platforms."
                    French (fr): "La majorité des participants souligne l'importance des outils numériques, avec un accent particulier sur les plateformes collaboratives."
                    German (de): "Die meisten Teilnehmer betonten die Bedeutung digitaler Werkzeuge, insbesondere mit Fokus auf Kollaborationsplattformen."
                    Italian (it): "La maggior parte dei partecipanti ha sottolineato l'importanza degli strumenti digitali, concentrandosi in particolare sur les plateformes collaboratives."
                    Spanish (es): "La mayoría de los participantes destacó la importancia de las herramientas digitales, centrándose especialmente en las plataformas de colaboración."

                    Ensure your response is concise, focused, and directly relevant to the question and responses provided. Do not include any prefix like "Summary:" or "Analysis:" at the beginning of your response.
                `
            }],
            temperature: 0.1
        };

        const response = await axios.post(
            'https://api.infomaniak.com/1/ai/{INFOMANIAK_AI_ENDPOINT_ID}/openai/chat/completions',
            requestBody,
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.INFOMANIAK_KEY}`,
                    'Accept': 'application/json'
                }
            }
        );

        const summary = response.data?.choices?.[0]?.message?.content || null;

        res.json({ summary });

    } catch (error) {
        console.error('Error generating text summary:', error);
        res.status(500).json({
            error: 'Error generating summary',
            details: error.response?.data || error.message
        });
    }
});

module.exports = router;