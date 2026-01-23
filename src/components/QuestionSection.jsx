import React, { useState, useEffect } from 'react';
import { Typography, Box, IconButton, Grid, TextField, Button, FormControlLabel, Switch, Alert, CircularProgress } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { questionContainerStyle } from './styledComponents';
import { addOption, removeOption, changeOption, saveEdits } from '../utils/SurveyUtils';
import { getMatrixQuestions } from '../utils/matrixUtils';
import SurveyQuestion from './SurveyQuestion';
import QuestionControlsView from './CreateSurveys/QuestionControlsView';
import ContextControlsView from './CreateSurveys/ContextControlsView';
import { QuestionType } from '../utils/enums';
import { fetchSuggestedOptions } from '../utils/QuestionUtils';
import { useAuthUser } from '../contexts/AuthUserContext';
import { useLanguage } from '../contexts/LanguageContext';

// for i18n
import { useMessageService } from '../services/MessageService';
import { buttonStyle } from './styledComponents';

const removeMatrixQuestion = (setQuestions, matrixQuestionId, index, setEditingQuestionId) => {
    setQuestions(prevQuestions => {
        const questionToRemove = prevQuestions.find(q => q.questionId === matrixQuestionId);
        console.log('All questions in prevQuestions:', prevQuestions.map(q => ({
            questionId: q.questionId,
            shortName: q.shortName
        })));
        if (!questionToRemove) return prevQuestions;

        // Check if this is the first question in the matrix group
        const isFirstQuestion = questionToRemove.matrixPosition === 0;
        
        // Remove only the specific question and update positions of remaining questions
        const updatedQuestions = prevQuestions
            .filter(q => q.questionId !== matrixQuestionId)
            .map(q => {
                if (q.matrixId === questionToRemove.matrixId && q.matrixPosition > questionToRemove.matrixPosition) {
                    return { ...q, matrixPosition: q.matrixPosition - 1 };
                }
                return q;
            });

        // If this was the first question, update the editingQuestionId to the new first question
        if (isFirstQuestion) {
            const remainingMatrixQuestions = updatedQuestions.filter(q => q.matrixId === questionToRemove.matrixId);
            if (remainingMatrixQuestions.length > 0) {
                // Find the new first question (with matrixPosition 0)
                const newFirstQuestion = remainingMatrixQuestions.find(q => q.matrixPosition === 0);
                if (newFirstQuestion) {
                    setEditingQuestionId(newFirstQuestion.questionId);
                }
            }
        }

        return updatedQuestions;
    });
};

// Add this component at the top of the file, after the imports
const AutoSuggestionsSwitch = ({ 
  autoSuggestionsEnabled, 
  onToggle, 
  generatingOptions, 
  disabled, 
  getMessage, 
  currentUser 
}) => (
  <Grid item xs={12}>
    <Box sx={{ mt: 1, mb: 1 }}>
      <FormControlLabel
        control={
          <Switch
            checked={autoSuggestionsEnabled}
            onChange={onToggle}
            disabled={disabled}
          />
        }
        label={getMessage("label_auto_suggestions")}
      />
      {generatingOptions && (
        <Box display="flex" alignItems="center" justifyContent="center" sx={{ mt: 1 }}>
          <CircularProgress size={20} sx={{ mr: 1 }} />
          <Typography variant="body2">{getMessage("label_generating_options")}</Typography>
        </Box>
      )}
      {currentUser?.sandbox && (
        <Alert severity="info" sx={{ mt: 1, mb: 1 }}>
          {getMessage("sandbox_user_ai_restriction")}
        </Alert>
      )}
    </Box>
  </Grid>
);

// The view to edit a question
const EditQuestionView = ({ question, matrixQuestions, setQuestions, setEditingQuestionId, saveEdits }) => {
    // for the translations
    const { getMessage } = useMessageService();
    const [isAddingQuestion, setIsAddingQuestion] = useState(false);
    const [newQuestions, setNewQuestions] = useState([]);
    const { currentUser } = useAuthUser();
    const { languageCode } = useLanguage();
    const [autoSuggestionsEnabled, setAutoSuggestionsEnabled] = useState(false);
    const [generatingOptions, setGeneratingOptions] = useState(false);

    const handleChange = (prop, value, matrixQuestionId = null, newQuestionIndex = null) => {
        if (prop === 'shortName' && value.length > 30) {
            return; // Don't update if longer than 30 characters
        }
        
        if (isAddingQuestion && newQuestionIndex !== null) {
            setNewQuestions(prev => {
                const updated = [...prev];
                updated[newQuestionIndex] = { ...updated[newQuestionIndex], [prop]: value };
                return updated;
            });
            return;
        }

        setQuestions(prevQuestions => {
            if (matrixQuestionId) {
                // Handle matrix question changes
                return prevQuestions.map(q => 
                    q.questionId === matrixQuestionId 
                        ? { ...q, [prop]: value }
                        : q
                );
            } else {
                // Handle regular question changes
                return prevQuestions.map(q => 
                    q.questionId === question.questionId 
                        ? { ...q, [prop]: value }
                        : q
                );
            }
        });
    };

    const handleSaveEdits = () => {
        if (isAddingQuestion) {
            const validQuestions = newQuestions.filter(q => q.question && q.shortName && q.shortName.length >= 5);
            if (validQuestions.length > 0) {
                // Find the highest questionId within the current matrix group
                const maxMatrixQuestionId = matrixQuestions.reduce((maxId, q) => 
                    Math.max(maxId, parseInt(q.questionId, 10)), 0);
                
                // Get all questions that have a questionId higher than the max matrix questionId
                // These need to be shifted to make room for new questions
                setQuestions(prevQuestions => {
                    // Calculate how many new questions we're adding
                    const newQuestionCount = validQuestions.length;
                    
                    // Separate questions into three groups
                    const questionsBeforeAndIncludingMatrix = prevQuestions.filter(q => 
                        parseInt(q.questionId, 10) <= maxMatrixQuestionId
                    );
                    
                    const questionsAfterMatrix = prevQuestions.filter(q => 
                        parseInt(q.questionId, 10) > maxMatrixQuestionId
                    ).map(q => ({
                        ...q, 
                        questionId: (parseInt(q.questionId, 10) + newQuestionCount).toString()
                    }));
                    
                    // Create new questions with IDs starting from maxMatrixQuestionId + 1
                    const questionsToAdd = validQuestions.map((newQuestion, index) => ({
                        ...question,
                        questionId: (maxMatrixQuestionId + 1 + index).toString(),
                        matrixPosition: matrixQuestions.length + index,
                        question: newQuestion.question,
                        shortName: newQuestion.shortName
                    }));
                    
                    // Return in correct order: before/including matrix + new questions + after matrix
                    return [
                        ...questionsBeforeAndIncludingMatrix,
                        ...questionsToAdd,
                        ...questionsAfterMatrix
                    ];
                });
            }
            // Exit edit mode after saving (or even if no valid questions to save)
            setIsAddingQuestion(false);
            setNewQuestions([]);
            saveEdits(setQuestions, setEditingQuestionId, question.questionId, question);
        } else {
            saveEdits(setQuestions, setEditingQuestionId, question.questionId, question);
        }
    };

    const handleAutoSuggestToggle = async (event) => {
        const checked = event.target.checked;
        setAutoSuggestionsEnabled(checked);
        if (checked && question.question) {
            setGeneratingOptions(true);
            try {
                const optionCount = question.options?.length || 4; // Default to 4 if no options yet
                let currentQuestionType = QuestionType.RADIO_UNORDERED; // Default
                if (question.questionType === 'radio-ordered') {
                    currentQuestionType = QuestionType.RADIO_ORDERED;
                } else if (question.questionType === 'radio-unordered') {
                    currentQuestionType = QuestionType.RADIO_UNORDERED;
                } // No specific instructions for these types, pass null or rely on backend defaults

                const suggestedOptions = await fetchSuggestedOptions(
                    question.question,
                    optionCount,
                    [], // Not passing existing options, will overwrite
                    currentUser,
                    currentQuestionType,
                    null // No custom instructions for these general types
                );
                
                const formattedOptions = suggestedOptions.map((opt, index) => ({ 
                    label: opt, 
                    value: (index + 1).toString() // Options need a value, using index
                }));
                
                setQuestions(prevQuestions => 
                    prevQuestions.map(q => 
                        q.questionId === question.questionId 
                            ? { ...q, options: formattedOptions } 
                            : q
                    )
                );
            } catch (err) {
                console.error("Error fetching suggested options for QuestionSection:", err);
            } finally {
                setGeneratingOptions(false);
            }
        }
    };

    const enhancedAddOption = () => {
        const originalOptionCount = question.options?.length || 0;
        addOption(setQuestions, question.questionId);
        if (autoSuggestionsEnabled && question.question && !currentUser?.sandbox) {
            setTimeout(async () => {
                // The 'question' prop might be stale here due to closure.
                // We calculate the target count based on the length *before* addOption was called.
                const targetOptionCount = originalOptionCount + 1;
                
                if (!question || !question.question) { // Check question.question for title
                    console.warn("No question title for auto-suggestions after add.");
                    setGeneratingOptions(false);
                    return;
                }

                setGeneratingOptions(true);
                try {
                    let currentQuestionType = QuestionType.RADIO_UNORDERED;
                    if (question.questionType === 'radio-ordered') { // Use question.questionType from closure
                        currentQuestionType = QuestionType.RADIO_ORDERED;
                    }
                    const suggestedOptions = await fetchSuggestedOptions(
                        question.question, // Use question.question from closure
                        targetOptionCount, // Use calculated target count
                        [],
                        currentUser,
                        currentQuestionType,
                        null
                    );
                    const formattedOptions = suggestedOptions.map((opt, index) => ({ 
                        label: opt, 
                        value: (index + 1).toString() 
                    }));
                    // This setQuestions will update the parent. The next render will have the correct options.
                    setQuestions(prevQuestions => 
                        prevQuestions.map(q => 
                            q.questionId === question.questionId 
                                ? { ...q, options: formattedOptions } 
                                : q
                        )
                    );
                } catch (err) {
                    console.error("Error regenerating options after add for QuestionSection:", err);
                } finally {
                    setGeneratingOptions(false);
                }
            }, 100);
        }
    };
    
    const enhancedRemoveOption = (optionIndex) => {
        const originalOptionCount = question.options?.length || 0;
        removeOption(setQuestions, question.questionId, optionIndex);
        if (autoSuggestionsEnabled && question.question && !currentUser?.sandbox) {
            setTimeout(async () => {
                // The 'question' prop might be stale.
                // Calculate target count based on length *before* removeOption.
                const targetOptionCount = originalOptionCount - 1;

                if (targetOptionCount <= 0) {
                    setQuestions(prevQuestions => // Ensure options are cleared if count is zero
                        prevQuestions.map(q => 
                            q.questionId === question.questionId 
                                ? { ...q, options: [] } 
                                : q
                        )
                    );
                    setGeneratingOptions(false); 
                    return; 
                }
                
                if (!question || !question.question) {
                     console.warn("No question title for auto-suggestions after remove.");
                     setGeneratingOptions(false);
                     return;
                }

                setGeneratingOptions(true);
                try {
                    let currentQuestionType = QuestionType.RADIO_UNORDERED;
                    if (question.questionType === 'radio-ordered') { // Use question.questionType from closure
                        currentQuestionType = QuestionType.RADIO_ORDERED;
                    }
                    const suggestedOptions = await fetchSuggestedOptions(
                        question.question, // Use question.question from closure
                        targetOptionCount, // Use calculated target count
                        [],
                        currentUser,
                        currentQuestionType,
                        null
                    );
                    const formattedOptions = suggestedOptions.map((opt, index) => ({ 
                        label: opt, 
                        value: (index + 1).toString() 
                    }));
                    setQuestions(prevQuestions => 
                        prevQuestions.map(q => 
                            q.questionId === question.questionId 
                                ? { ...q, options: formattedOptions } 
                                : q
                        )
                    );
                } catch (err) {
                    console.error("Error regenerating options after remove for QuestionSection:", err);
                } finally {
                    setGeneratingOptions(false);
                }
            }, 100);
        }
    };

    return (
        <Box component="div" sx={{ width: '100%', p: 2, margin: "20px" }}>
            <Typography mb="20px" variant="h4" fontWeight="bold" sx={{ color: "rgb(82,82,82)" }}>
                {question.questionType === 'single-text' 
                    ? getMessage("label_edit_context")
                    : question.matrixId 
                        ? getMessage("label_matrix_question")
                        : getMessage("label_edit_question")
                }
            </Typography>
            <Grid container spacing={2}>
                {(question.questionType !== 'single-text' && !question.matrixId) && (
                    <Grid item xs={12}>
                        <TextField
                            fullWidth
                            label={getMessage("label_question_title")}
                            variant="outlined"
                            value={question.question}
                            onChange={e => handleChange('question', e.target.value)}
                        />
                    </Grid>
                )}
                {(question.questionType !== 'single-text' && !question.matrixId) && (
                    <Grid item xs={12}>
                        <TextField
                            fullWidth
                            label={getMessage("label_short_name")}
                            variant="outlined"
                            value={question.shortName}
                            onChange={e => handleChange('shortName', e.target.value)}
                            inputProps={{ maxLength: 30 }}
                            helperText={`${question.shortName.length}/30 characters (minimum 5)`}
                            error={question.shortName.length < 5}
                        />
                    </Grid>
                )}
                {question.questionType === 'single-text' && (
                    <Grid item xs={12}>
                        <Box>
                            <TextField
                            fullWidth
                            multiline
                            rows={6}
                            variant="outlined"
                            value={question.context}
                            onChange={(e) => {
                                handleChange('context', e.target.value);
                            }}
                            sx={{
                                "& .MuiOutlinedInput-root": {
                                    fontFamily: "monospace"
                                }
                            }}
                        />
                        </Box>
                    </Grid>    
                )}
                {(question.questionType === QuestionType.RADIO_ORDERED || question.questionType === QuestionType.RADIO_UNORDERED || question.questionType === QuestionType.CHECKBOX) && (
                    <AutoSuggestionsSwitch
                        autoSuggestionsEnabled={autoSuggestionsEnabled}
                        onToggle={handleAutoSuggestToggle}
                        generatingOptions={generatingOptions}
                        disabled={!question.question || generatingOptions || currentUser?.sandbox}
                        getMessage={getMessage}
                        currentUser={currentUser}
                    />
                )}
                {question.questionType !== 'text' && question.questionType !== 'single-text' && (
                    <>
                        {question.matrixId && (
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label={getMessage("label_matrix_title")}
                                    variant="outlined"
                                    value={question.matrixTitle || ''}
                                    onChange={(e) => handleChange('matrixTitle', e.target.value)}
                                />
                            </Grid>
                        )}
                        {question.matrixId && matrixQuestions.map((matrixQuestion, index) => (
                            <Grid item xs={12} key={matrixQuestion.questionId}>
                                <Box display="flex" alignItems="center" justifyContent="space-between">
                                    <TextField
                                        fullWidth
                                        label={`${getMessage("label_question_title")} ${index + 1}`}
                                        variant="outlined"
                                        value={matrixQuestion.label}
                                        onChange={(e) => handleChange('question', e.target.value, matrixQuestion.questionId)}
                                    />
                                    <IconButton onClick={() => removeMatrixQuestion(setQuestions, matrixQuestion.questionId, index, setEditingQuestionId)}>
                                        <DeleteIcon />
                                    </IconButton>
                                </Box>
                                <Box display="flex" alignItems="center" justifyContent="space-between" mt={1}>
                                    <TextField
                                        fullWidth
                                        label={`${getMessage("label_short_name")} ${index + 1}`}
                                        variant="outlined"
                                        value={matrixQuestion.shortName}
                                        onChange={(e) => handleChange('shortName', e.target.value, matrixQuestion.questionId)}
                                        inputProps={{ maxLength: 30 }}
                                        helperText={`${matrixQuestion.shortName.length}/30 characters (minimum 5)`}
                                        error={matrixQuestion.shortName.length < 5}
                                    />
                                </Box>
                            </Grid>
                        ))}
                        {isAddingQuestion && newQuestions.map((newQuestion, index) => (
                            <Grid item xs={12} key={`new-question-${index}`}>
                                <Box display="flex" alignItems="center" justifyContent="space-between">
                                    <TextField
                                        fullWidth
                                        label={`${getMessage("label_question_title")} ${matrixQuestions.length + index + 1}`}
                                        variant="outlined"
                                        value={newQuestion.question}
                                        onChange={(e) => handleChange('question', e.target.value, null, index)}
                                    />
                                    <IconButton onClick={() => {
                                        setNewQuestions(prev => prev.filter((_, i) => i !== index));
                                        if (newQuestions.length === 1) {
                                            setIsAddingQuestion(false);
                                        }
                                    }}>
                                        <DeleteIcon />
                                    </IconButton>
                                </Box>
                                <Box display="flex" alignItems="center" justifyContent="space-between" mt={1}>
                                    <TextField
                                        fullWidth
                                        label={`${getMessage("label_short_name")} ${matrixQuestions.length + index + 1}`}
                                        variant="outlined"
                                        value={newQuestion.shortName}
                                        onChange={(e) => handleChange('shortName', e.target.value, null, index)}
                                        inputProps={{ maxLength: 30 }}
                                        helperText={`${newQuestion.shortName.length}/30 characters (minimum 5)`}
                                        error={newQuestion.shortName.length < 5}
                                    />
                                </Box>
                            </Grid>
                        ))}
                        {question.matrixId && (
                            <Grid item xs={12}>
                                <Button 
                                    variant="outlined" 
                                    sx={buttonStyle} 
                                    onClick={() => {
                                        setIsAddingQuestion(true);
                                        setNewQuestions(prev => [...prev, { question: '', shortName: '' }]);
                                    }}
                                >
                                    {getMessage("label_add_matrix_question")}
                                </Button>
                            </Grid>
                        )}
                        {question.matrixId && (
                            <AutoSuggestionsSwitch
                                autoSuggestionsEnabled={autoSuggestionsEnabled}
                                onToggle={handleAutoSuggestToggle}
                                generatingOptions={generatingOptions}
                                disabled={!question.question || generatingOptions || currentUser?.sandbox}
                                getMessage={getMessage}
                                currentUser={currentUser}
                            />
                        )}
                        {question.options.map((option, index) => (
                            <Grid item xs={12} key={index}>
                                <Box display="flex" alignItems="center" justifyContent="space-between">
                                    <TextField
                                        fullWidth
                                        multiline
                                        label={`${getMessage("label_option")} ${index + 1}`}
                                        variant="outlined"
                                        value={option.label}
                                        onChange={(e) => changeOption(setQuestions, e, question.questionId, index)}
                                    />
                                    <IconButton onClick={() => enhancedRemoveOption(index)}>
                                        <DeleteIcon />
                                    </IconButton>
                                </Box>
                            </Grid>
                        ))}
                    </>
                )}
                {question.questionType !== 'text' && question.questionType !== 'single-text' && (
                    <Grid item xs={12}>
                        <Button 
                            variant="outlined" 
                            sx={buttonStyle} 
                            onClick={enhancedAddOption}
                        >
                            {getMessage("label_add_option")}
                        </Button>
                    </Grid>
                )}
                <Grid item xs={12}>
                    <Box display="flex" justifyContent="space-between">
                        <Button 
                            type="button" 
                            variant="contained" 
                            onClick={() => {
                                setEditingQuestionId(null);
                                setIsAddingQuestion(false);
                                setNewQuestions([]);
                            }} 
                            sx={{
                                backgroundColor: "#F7941E", 
                                borderRadius: "50px", 
                                color: "black", 
                                "&:hover": {
                                    backgroundColor: "#D17A1D",
                                }
                            }}
                        >
                            <Typography variant="h5">
                                {getMessage("label_cancel")}
                            </Typography>
                        </Button>
                        
                        <Button 
                            type="button" 
                            variant="contained" 
                            onClick={handleSaveEdits}
                            disabled={isAddingQuestion && newQuestions.length > 0 && !newQuestions.some(q => q.question && q.shortName && q.shortName.length >= 5)}
                            sx={{
                                backgroundColor: "#F7941E", 
                                borderRadius: "50px", 
                                color: "black", 
                                "&:hover": {
                                    backgroundColor: "#D17A1D",
                                }
                            }}
                        >
                            <Typography variant="h5">
                                {getMessage("label_validate")}
                            </Typography>
                        </Button>
                    </Box>
                </Grid>
            </Grid>
        </Box>
    );
};

const QuestionsListSection = ({
    workshop,
    questions,
    setQuestions,
    setEditingQuestionId,
    editingQuestionId,
    setFieldValue,
    allQuestions,
    allWorkshops,
    handleUpdateWorkshopName
}) => {
    const [isEditingWorkshopName, setIsEditingWorkshopName] = useState(false);
    const [editableWorkshopName, setEditableWorkshopName] = useState(workshop?.label || "");
    const { getMessage } = useMessageService();

    // Group questions by matrixId
    const groupedQuestions = questions.reduce((acc, question) => {
        if (question.matrixId) {
            // If this is a matrix question, check if we've already processed its group
            if (!acc.matrixGroups[question.matrixId]) {
                acc.matrixGroups[question.matrixId] = true;
                acc.questionsToRender.push(question);
            }
        } else {
            // For non-matrix questions, add them directly
            acc.questionsToRender.push(question);
        }
        return acc;
    }, { questionsToRender: [], matrixGroups: {} });

    useEffect(() => {
        if (!isEditingWorkshopName) {
            setEditableWorkshopName(workshop?.label || "");
        }
    }, [workshop, isEditingWorkshopName]);

    const handleWorkshopNameClick = () => {
        if (workshop && workshop.label !== "undefined" && workshop.label !== "default") {
            setEditableWorkshopName(workshop.label);
            setIsEditingWorkshopName(true);
        }
    };

    const handleWorkshopNameChange = (event) => {
        setEditableWorkshopName(event.target.value);
    };

    const saveWorkshopName = () => {
        if (editableWorkshopName && editableWorkshopName.trim() !== "" && editableWorkshopName !== workshop?.label) {
            handleUpdateWorkshopName(workshop, editableWorkshopName.trim());
        }
        setIsEditingWorkshopName(false);
    };

    const handleWorkshopNameKeyDown = (event) => {
        if (event.key === 'Enter') {
            saveWorkshopName();
            event.preventDefault();
        } else if (event.key === 'Escape') {
            setEditableWorkshopName(workshop?.label || "");
            setIsEditingWorkshopName(false);
            event.preventDefault();
        }
    };

    const handleWorkshopNameBlur = () => {
        if (editableWorkshopName !== workshop?.label) {
            saveWorkshopName();
        } else {
            setIsEditingWorkshopName(false);
        }
    };

    return (
        <div key={workshop?._id}>
            {workshop && workshop.label !== "undefined" && workshop.label !== "default" ? (
                isEditingWorkshopName ? (
                    <TextField
                        value={editableWorkshopName}
                        onChange={handleWorkshopNameChange}
                        onKeyDown={handleWorkshopNameKeyDown}
                        onBlur={handleWorkshopNameBlur}
                        variant="outlined"
                        size="small"
                        autoFocus
                        sx={{ marginTop: "15px", marginRight: "10px", marginLeft: "10px", fontSize: "h4.fontSize", fontWeight: "bold", color: "rgb(102,102,102)", width: 'auto' }}
                    />
                ) : (
                    <Box onClick={handleWorkshopNameClick} sx={{ cursor: 'pointer', display: 'flex', alignItems: 'center', marginLeft: "10px" }}>
                        <Typography variant="h4" fontWeight="bold" color="rgb(102,102,102)" m="15px 0px 0px 0px">
                            {workshop.label}
                        </Typography>
                        <IconButton onClick={handleWorkshopNameClick} size="small" sx={{ marginLeft: '4px', marginTop: '10px' }}> 
                            <EditIcon fontSize="small" />
                        </IconButton>
                    </Box>
                )
            ) : (
                 workshop?.label === "default" ? null : (
                    <Typography variant="h4" fontWeight="bold" color="rgb(102,102,102)" m="15px 10px 0px 10px">
                        {workshop?.label}
                    </Typography>
                 )
            )}
            
            {groupedQuestions.questionsToRender.map((question, index) => {
                const matrixQuestions = getMatrixQuestions(question.matrixId, questions);

                return (
                    <Box 
                        key={question.questionId} 
                        sx={{
                            ...questionContainerStyle,
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: { xs: 1, md: 2 },
                            overflow: 'hidden'
                        }}
                    >
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                            {editingQuestionId === question.questionId ? (
                                <EditQuestionView
                                    question={question}
                                    matrixQuestions={matrixQuestions}
                                    setQuestions={setQuestions}
                                    setEditingQuestionId={setEditingQuestionId}
                                    saveEdits={saveEdits}/>
                            ) : (
                                <SurveyQuestion
                                    question={question.question}
                                    shortName={question.shortName}
                                    context={question.context}
                                    fieldName={question.fieldName}
                                    options={question.options}
                                    type={question.questionType}
                                    setFieldValue={setFieldValue}
                                    titleFontSize="18px"
                                    optionFontSize="14px"
                                    disabled={true}
                                    matrixTitle={question.matrixTitle}
                                    matrixId={question.matrixId}
                                    matrixPosition={question.matrixPosition}
                                    matrixQuestions={matrixQuestions}
                                />
                            )}
                        </Box>

                        {question.questionType === 'single-text' ? (
                            <ContextControlsView
                                questions={questions}
                                setQuestions={setQuestions}
                                setEditingQuestionId={setEditingQuestionId}
                                question={question}
                                allQuestions={allQuestions}
                                allWorkshops={allWorkshops}
                            />
                        ) : (
                            <QuestionControlsView
                                questions={questions}
                                setQuestions={setQuestions}
                                setEditingQuestionId={setEditingQuestionId}
                                question={question}
                                allQuestions={allQuestions}
                                allWorkshops={allWorkshops}
                            />
                        )}
                    </Box>
                );
            })}
        </div>
    );
};

export default QuestionsListSection;
