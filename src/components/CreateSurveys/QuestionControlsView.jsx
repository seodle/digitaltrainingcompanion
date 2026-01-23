import React, { useState } from 'react';
import { Delete, ArrowUpward, ArrowDownward, Edit, ContentCopy, SwapHoriz } from "@mui/icons-material";
import { Box, IconButton, Tooltip, Menu, MenuItem } from '@mui/material';
import { duplicateQuestion, reorderQuestionWithinWorkshop, removeQuestion, changeMandatoryStatus, moveQuestionToWorkshop } from '../../utils/SurveyUtils';
import MandatoryToggle from '../MandatoryToogle';

// for i18n
import { useMessageService } from '../../services/MessageService';

// the view with all the elements for the control - edit, delete, up, down, ect...
const QuestionControlsView = ({ questions, setQuestions, setEditingQuestionId, question, allQuestions, allWorkshops }) => {

    // for the translations
    const { getMessage } = useMessageService();

    const [isMandatory, setIsMandatory] = useState(question.isMandatory);
    const [anchorEl, setAnchorEl] = useState(null);

    const toggleMandatory = () => {
        setIsMandatory(!isMandatory);
        
        // If this is a matrix question, update all questions in the matrix group
        if (question.matrixId) {
            setQuestions(prevQuestions => {
                return prevQuestions.map(q => {
                    if (q.matrixId === question.matrixId) {
                        return { ...q, isMandatory: !isMandatory };
                    }
                    return q;
                });
            });
        } else {
            // For non-matrix questions, just update the single question
            changeMandatoryStatus(setQuestions, { target: { checked: !isMandatory } }, question.questionId);
        }
    };

    const handleMenuOpen = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleMoveToWorkshop = (workshopDetails) => {
        if (workshopDetails) {
            moveQuestionToWorkshop(setQuestions, question.questionId, workshopDetails);
        }
        handleMenuClose();
    };

    const questionsToUse = allQuestions || questions;
    const availableWorkshopsToMove = allWorkshops && question ?
        allWorkshops.filter(w => w._id !== question.workshopId) : [];

    return (
        <Box 
            display="flex" 
            flexDirection="column"
            sx={{
                minWidth: { xs: '40px', md: '48px' },
                maxWidth: { xs: '60px', md: '80px' },
                flexShrink: 0,
                alignItems: 'flex-end',
                gap: 0.5,
                paddingRight: { xs: '4px', md: '8px' }
            }}
        >
            <MandatoryToggle isMandatory={isMandatory} toggleMandatory={toggleMandatory} />

            <Tooltip title={getMessage("label_tooltip_duplicate_question")}>
                <IconButton 
                    onClick={() => duplicateQuestion(allQuestions && question ? allQuestions : questions, setQuestions, question.questionId)} 
                    sx={{ 
                        color: 'blue',
                        padding: { xs: '4px', md: '8px' },
                        '& .MuiSvgIcon-root': { fontSize: { xs: '1rem', md: '1.25rem' } }
                    }}
                >
                    <ContentCopy />
                </IconButton>
            </Tooltip>

            <Tooltip title={getMessage("label_tooltip_edit_question")}>
                <IconButton 
                    onClick={() => setEditingQuestionId(question.questionId)} 
                    sx={{ 
                        color: 'green',
                        padding: { xs: '4px', md: '8px' },
                        '& .MuiSvgIcon-root': { fontSize: { xs: '1rem', md: '1.25rem' } }
                    }}
                >
                    <Edit />
                </IconButton>
            </Tooltip>

            <Tooltip title={getMessage("label_tooltip_remove_question")}>
                <IconButton 
                    onClick={() => removeQuestion(setQuestions, question.workshopId, question.questionId)} 
                    sx={{ 
                        color: 'red',
                        padding: { xs: '4px', md: '8px' },
                        '& .MuiSvgIcon-root': { fontSize: { xs: '1rem', md: '1.25rem' } }
                    }}
                >
                    <Delete />
                </IconButton>
            </Tooltip>
            
            <Tooltip title={getMessage("label_tooltip_move_question_up")}>
                <IconButton 
                    onClick={() => reorderQuestionWithinWorkshop(allQuestions && question ? allQuestions : questions, setQuestions, question.workshopId, question.questionId, 'up')} 
                    sx={{ 
                        padding: { xs: '4px', md: '8px' },
                        '& .MuiSvgIcon-root': { fontSize: { xs: '1rem', md: '1.25rem' } }
                    }}
                >
                    <ArrowUpward />
                </IconButton>
            </Tooltip>
            
            <Tooltip title={getMessage("label_tooltip_move_question_down")}>
                <IconButton 
                    onClick={() => reorderQuestionWithinWorkshop(allQuestions && question ? allQuestions : questions, setQuestions, question.workshopId, question.questionId, 'down')} 
                    sx={{ 
                        padding: { xs: '4px', md: '8px' },
                        '& .MuiSvgIcon-root': { fontSize: { xs: '1rem', md: '1.25rem' } }
                    }}
                >
                    <ArrowDownward />
                </IconButton>
            </Tooltip>

            {allWorkshops && allWorkshops.length > 1 && availableWorkshopsToMove.length > 0 && (
                <>
                    <Tooltip title={getMessage("label_tooltip_move_question_to_workshop", "Move question to another workshop")}>
                        <IconButton 
                            onClick={handleMenuOpen} 
                            sx={{ 
                                color: 'purple',
                                padding: { xs: '4px', md: '8px' },
                                '& .MuiSvgIcon-root': { fontSize: { xs: '1rem', md: '1.25rem' } }
                            }}
                        >
                            <SwapHoriz />
                        </IconButton>
                    </Tooltip>
                    <Menu
                        anchorEl={anchorEl}
                        open={Boolean(anchorEl)}
                        onClose={handleMenuClose}
                    >
                        {availableWorkshopsToMove.map((workshop) => {
                            return (
                                <MenuItem key={workshop._id} onClick={() => handleMoveToWorkshop(workshop)}>
                                    {getMessage("label_move_to_workshop", "Move to:")} {workshop.label || getMessage("label_unsectioned_workshop", "(No Section)")}
                                </MenuItem>
                            );
                        })}
                    </Menu>
                </>
            )}
        </Box>
    );
};

export default QuestionControlsView;