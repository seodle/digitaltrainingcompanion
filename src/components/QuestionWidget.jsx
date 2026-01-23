import React, { useState, useEffect } from 'react';
import { 
    Box,
    Typography,
    RadioGroup,
    FormControlLabel,
    Radio,
    Button,
    CircularProgress,
    Alert
} from '@mui/material';
import axios from 'axios';
import { BACKEND_URL } from '../config';

const EmbedSurveyWidget = ({ questionId, apiKey }) => {
    const [question, setQuestion] = useState(null);
    const [answer, setAnswer] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [submitted, setSubmitted] = useState(false);

    useEffect(() => {
        fetchQuestion();
    }, [questionId, apiKey]);

    const fetchQuestion = async () => {
        try {
            const response = await axios.get(
                `${BACKEND_URL}/embed/questions/${questionId}`,
                {
                    headers: {
                        'x-api-key': apiKey
                    }
                }
            );
            setQuestion(response.data);
        } catch (error) {
            setError('Failed to load survey question');
            console.error('Error fetching question:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async () => {
        if (!answer) {
            setError('Please select an answer');
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            await axios.post(
                `${BACKEND_URL}/embed/question/${questionId}/responses`,
                { answer },
                {
                    headers: {
                        'x-api-key': apiKey
                    }
                }
            );
            setSubmitted(true);
        } catch (error) {
            setError('Failed to submit response');
            console.error('Error submitting response:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" height="200px">
                <CircularProgress />
            </Box>
        );
    }

    if (error && !question) {
        return (
            <Box p={2}>
                <Alert severity="error">{error}</Alert>
            </Box>
        );
    }

    if (!question) {
        return (
            <Box p={2}>
                <Alert severity="error">Question not found</Alert>
            </Box>
        );
    }

    if (submitted) {
        return (
            <Box p={3} textAlign="center">
                <Alert severity="success">
                    Thank you for your response!
                </Alert>
            </Box>
        );
    }

    return (
        <Box 
            sx={{ 
                p: 3,
                bgcolor: 'background.paper',
                borderRadius: 2,
                boxShadow: 1
            }}
        >
            {/* Logo and Header */}
            <Box display="flex" alignItems="center" mb={3}>
                <Box 
                    component="img"
                    src="/logo.png"
                    alt="Digital Training Companion"
                    sx={{ height: 40, mr: 2 }}
                />
                <Typography variant="h6" component="h1">
                    Survey Question
                </Typography>
            </Box>

            {/* Question */}
            <Typography variant="h6" gutterBottom>
                {question.question}
            </Typography>

            {/* Context if available */}
            {question.context && (
                <Typography 
                    variant="body2" 
                    color="text.secondary"
                    sx={{ mb: 2 }}
                >
                    {question.context}
                </Typography>
            )}

            {/* Answer Options */}
            <RadioGroup
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
            >
                {question.choices.map((choice, index) => (
                    <FormControlLabel
                        key={index}
                        value={choice.value}
                        control={<Radio />}
                        label={choice.label}
                        sx={{
                            mb: 1,
                            '&:hover': {
                                bgcolor: 'rgba(0, 0, 0, 0.04)',
                                borderRadius: 1
                            }
                        }}
                    />
                ))}
            </RadioGroup>

            {/* Error Message */}
            {error && (
                <Alert 
                    severity="error" 
                    sx={{ mt: 2, mb: 2 }}
                    onClose={() => setError(null)}
                >
                    {error}
                </Alert>
            )}

            {/* Submit Button */}
            <Box mt={3}>
                <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    variant="contained"
                    fullWidth
                    sx={{
                        bgcolor: '#F7941E',
                        color: 'white',
                        '&:hover': { bgcolor: '#D17A1D' },
                        height: 48
                    }}
                >
                    {isSubmitting ? <CircularProgress size={24} /> : 'Submit'}
                </Button>
            </Box>
        </Box>
    );
};

export default EmbedSurveyWidget;