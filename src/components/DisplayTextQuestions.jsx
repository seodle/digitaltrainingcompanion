import React from 'react';
import { Box, Divider, Typography, CircularProgress, Alert } from '@mui/material';
import CommentIcon from '@mui/icons-material/Comment';
import { useAuthUser } from '../contexts/AuthUserContext';
import { useMessageService } from '../services/MessageService';

const DisplayTextQuestion = ({ title, content, displayName, comment = false, aiSummary, loadingSummary = false }) => {

    const { currentUser } = useAuthUser();
    const { getMessage } = useMessageService();

    return (
        <Box bgcolor="background.paper" m={2} p={2}>
            <Box display="flex" justifyContent="space-between">
                <Typography 
                    color="rgb(102,102,102)" 
                    variant="h5" 
                    fontWeight="bold" 
                    component="div" 
                    gutterBottom
                    sx={{
                        wordBreak: 'break-word',
                        overflowWrap: 'break-word'
                    }}
                >
                    {title}
                </Typography>
                {comment && <CommentIcon/>}
            </Box>
            
            <Divider />

            {/* AI Summary Section */}
            {content && content.length > 0 && (
                <Box mt={2} mb={2}>
                    <Typography 
                        variant="subtitle2" 
                        color="primary" 
                        fontWeight="bold" 
                        gutterBottom
                    >
                        {getMessage('label_ai_summary') || 'AI Summary'}
                    </Typography>
                    
                    {currentUser?.sandbox ? (
                        <Alert severity="info">
                            {getMessage("sandbox_user_ai_restriction")}
                        </Alert>
                    ) : loadingSummary ? (
                        <Box display="flex" alignItems="center" gap={1}>
                            <CircularProgress size={16} />
                            <Typography variant="body2" color="text.secondary">
                                {getMessage('label_generating_summary') || 'Generating summary...'}
                            </Typography>
                        </Box>
                    ) : aiSummary ? (
                        <Typography 
                            variant="h6" 
                            sx={{
                                wordBreak: 'break-word',
                                overflowWrap: 'break-word',
                                fontStyle: 'italic',
                                color: 'text.secondary'
                            }}
                        >
                            {aiSummary}
                        </Typography>
                    ) : (
                        <Typography variant="body2" color="text.secondary" fontStyle="italic">
                            {getMessage('label_no_summary_available') || 'No summary available'}
                        </Typography>
                    )}
                </Box>
            )}

            {/* Responses Section */}
            <Box mt={2}>
                {content && content.length > 0 && (
                    <Typography 
                        variant="subtitle2" 
                        color="text.secondary" 
                        fontWeight="bold" 
                        gutterBottom
                    >
                        {getMessage('label_all_responses') || 'All Responses'}:
                    </Typography>
                )}
                {content.map((item, index) => (
                    <Typography key={index} 
                        variant="h6" 
                        component="div" 
                        gutterBottom
                        sx={{
                            wordBreak: 'break-word',
                            overflowWrap: 'break-word'
                        }}
                    >
                        {displayName[index]}: {item}
                    </Typography>
                ))}
            </Box>
        </Box>
    );
};

export default DisplayTextQuestion;