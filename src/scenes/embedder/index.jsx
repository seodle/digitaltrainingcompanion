import React, { useState } from 'react';
import { Alert } from '@mui/material';
import { Box, Typography, TextField, Button } from "@mui/material";
import Sidebar from "../global/Sidebar";
import Topbar from "../global/Topbar";
import axios from "axios";
import { BACKEND_URL } from "../../config";

const Embedder = () => {
    const [text, setText] = useState('');
    const [embedding, setEmbedding] = useState([]);
    const [embeddingIndex, setEmbeddingIndex] = useState(0);
    const [query, setQuery] = useState('');
    const [collectionName, setCollectionName] = useState('');
    const [alertStatus, setAlertStatus] = useState(null);
    const [currentProgress, setCurrentProgress] = useState(0);

    const sendTextsToBackend = async () => {
        const texts = text.trim().split('---').map(item => item.trim());

        setCurrentProgress(0);
        let currentIndex = embeddingIndex; // Use the state value for the initial index

        for (let individualText of texts) {
            let success = false;

            while (!success) {
                try {
                    // Attempt to send the text to the backend
                    const token = localStorage.getItem("token");
                    await axios.post(`${BACKEND_URL}/document`, {
                        text: individualText,
                        collectionName: collectionName,
                        embeddingIndex: currentIndex
                    }, {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    });

                    console.log('Text sent to backend successfully:', individualText);
                    // Show success alert
                    setAlertStatus("success");
                    success = true; // Set flag to true as the embedding was successful
                } catch (error) {
                    console.error('Error sending text to backend:', error);
                    // Show error alert
                    setAlertStatus("error");
                    // No need to increment currentIndex here, as we will retry
                }
            }

            setCurrentProgress(currentProgress => currentProgress + 1);
            currentIndex++; // Increment currentIndex only on success
        }

        // After all texts are processed, update the state to the new index
        setEmbeddingIndex(currentIndex);
    };


    const sendQueryToBackend = async () => {
        try {
            const token = localStorage.getItem("token");
            const response = await axios.post(`${BACKEND_URL}/query-embedding-faiss`, {
                query: query,
                collectionName: collectionName
            }, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            console.log('Query sent to backend successfully');
            setEmbedding(response.data); // Setting the received labels to the state
        } catch (error) {
            console.error('Error sending query to backend:', error);
        }
    };

    return (
        <Box display="flex" style={{ height: '100vh', overflow: 'auto' }}>
            <Sidebar />
            <Box display="flex" flex="1" flexDirection="column">
                <Box mt="10px" ml="10px">
                    <Topbar title="Embedder" />
                </Box>

                <Box display="flex" justifyContent="center" style={{ height: '100vh', overflow: 'auto' }}>
                    <Box display="flex" flexDirection="column" width="calc(100% - 40px)" m="20px" style={{ overflowY: 'auto' }}>
                        <Box style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <TextField
                            variant="outlined"
                            value={collectionName}
                            onChange={e => setCollectionName(e.target.value)}
                            placeholder="Enter collection name..."
                            style={{  width: '200px' }} // Allow the input to grow
                        />
                        <Typography>Index starting from : </Typography>
                        <TextField
                            variant="outlined"
                            value={embeddingIndex}
                            onChange={e => {
                                // Check if the input is empty or not a number, reset to 0 if it is
                                if (e.target.value === '') {
                                setEmbeddingIndex(0);
                                } else {
                                // Parse the value to an integer, ensuring it's not less than 0
                                const newValue = parseInt(e.target.value, 10);
                                setEmbeddingIndex(isNaN(newValue) ? 0 : Math.max(0, newValue));
                                }
                            }}
                            type="number"
                            InputProps={{ inputProps: { min: 0 } }} // Ensures that the HTML5 input element enforces a minimum value of 0
                            style={{ width: '100px' }}
                            />
                            <Typography>
                                Current Embedding: {currentProgress}
                            </Typography>
                        </Box>
                        <Box padding={3}>
                            <Box marginBottom={2}>
                                <TextField
                                    fullWidth
                                    multiline
                                    rows={4}
                                    variant="outlined"
                                    value={text}
                                    onChange={e => setText(e.target.value)}
                                    placeholder="Enter the pieces of text you want to embed separated by ---"
                                />
                                {alertStatus && (
                                    <Box sx={{mt: "15px"}}>
                                        <Alert severity={alertStatus}>
                                            {alertStatus === "success" 
                                                ? "Embedding is done successfully!" 
                                                : "Error embedding the text. Please try again."}
                                        </Alert>
                                    </Box>
                                )}
                            </Box>
                            <Box sx={{mt:"15px"}}>
                                <Button
                                    variant="contained"
                                    onClick={sendTextsToBackend}
                                    sx={{
                                        backgroundColor: "#F7941E",
                                        borderRadius: "50px",
                                        color: "black",
                                        "&:hover": {
                                            backgroundColor: "#D17A1D",
                                        },
                                    }}
                                >
                                    <Typography variant="h5">Create Embeddings</Typography>
                                </Button>
                            </Box>
                            <Box marginTop={4} marginBottom={2}>
                                <TextField
                                    fullWidth
                                    variant="outlined"
                                    value={query}
                                    onChange={e => setQuery(e.target.value)}
                                    placeholder="Enter your query here..."
                                />
                            </Box>
                            <Box sx={{mt:"15px"}}>
                                <Button
                                    variant="contained"
                                    onClick={sendQueryToBackend}
                                    sx={{
                                        backgroundColor: "#F7941E",
                                        borderRadius: "50px",
                                        color: "black",
                                        "&:hover": {
                                            backgroundColor: "#D17A1D",
                                        },
                                    }}
                                >
                                    <Typography variant="h5">Test embeddings</Typography>
                                </Button>
                            </Box>
                        </Box>
                        {/* Displaying the labels received from backend */}
                            {embedding.length > 0 && (
                            <Box marginTop={3}>
                                <Box padding={3}>
                                    <Typography variant="h4">Related labels from highest to lowest:</Typography>
                                    <ul>
                                        {embedding.map((label, index) => (
                                            <li key={index}>{label}</li>
                                        ))}
                                    </ul>
                                </Box>
                            </Box>
                        )}
                    </Box>
                </Box>
            </Box>
        </Box>
    );
}

export default Embedder;
