import React, { useState, useEffect } from 'react';
import { Switch, FormControlLabel, Typography, Box, IconButton, Grid, TextField, Button, Chip, FormControl, InputLabel, Select, MenuItem, Checkbox, ListItemText, Alert, CircularProgress } from '@mui/material';
import { Delete } from "@mui/icons-material";
import EditIcon from '@mui/icons-material/Edit';

import { questionContainerStyle, formControlStyle } from './styledComponents';
import { changeLearningType, saveEdits, addOption, changeOption, removeOption, changeCorrectAnswer } from '../utils/SurveyUtils';
import { traineeCompetenceAreas, studentCompetenceAreas } from "../assets/frameworksData";
import QuestionControlsView from './CreateSurveys/QuestionControlsView';
import ContextControlsView from '../components/CreateSurveys/ContextControlsView';
import SurveyQuestion from './SurveyQuestion';
import { buttonStyle } from './styledComponents';
import { AssessmentType, QuestionType } from '../utils/enums';
import { useAuthUser } from '../contexts/AuthUserContext';
import { 
    fetchSuggestedOptions, 
    handleAutomaticEncodingChange as utilHandleAutomaticEncodingChange,
    updateCompetenciesForQuestion,
    getCompetencies,
    getActivities
} from '../utils/QuestionUtils';
import { useLanguage } from '../contexts/LanguageContext';

// for i18n
import { useMessageService } from '../services/MessageService';
import FrameworkSelector from './FrameworkSelector';

const EditQuestionView = ({ 
    questions, 
    question, 
    setQuestions, 
    editingQuestionId, 
    setEditingQuestionId, 
    handleCompetencyChange,
    automaticEncoding,
    handleAutomaticEncodingChange,
    selectedArea: initialSelectedArea,
    selectedCompetency: initialSelectedCompetency,
    getCompetencies,
    activity: initialActivity,
    getActivities,
    assessmentType
}) => {
    const { getMessage } = useMessageService();
    const { currentUser } = useAuthUser();
    const { languageCode } = useLanguage();
    const [autoSuggestionsEnabled, setAutoSuggestionsEnabled] = useState(false);
    const [generatingOptions, setGeneratingOptions] = useState(false);
    const [localSelectedArea, setLocalSelectedArea] = useState(question.area || '');
    const [localSelectedCompetency, setLocalSelectedCompetency] = useState(question.competency || '');
    const [localActivity, setLocalActivity] = useState(question.activity || '');
    const [isAutoEncodingActive, setIsAutoEncodingActive] = useState(false);

    useEffect(() => {
        setLocalSelectedArea(question.area || '');
        setLocalSelectedCompetency(question.competency || '');
        setLocalActivity(question.activity || '');
    }, [question.area, question.competency, question.activity]);

    const handleChange = (prop, value) => {
        if (prop === 'shortName' && value.length > 30) {
            return; // Don't update if longer than 30 characters
        }
        if (prop === 'framework') {
            setQuestions(prevQuestions =>
                prevQuestions.map(q => 
                    q.questionId === question.questionId 
                        ? { 
                            ...q, 
                            [prop]: value, 
                            competencies: [], 
                            area: '', 
                            competency: '', 
                            activity: '' 
                          } 
                        : q
                )
            );
            setLocalSelectedArea('');
            setLocalSelectedCompetency('');
            setLocalActivity('');
            if (isAutoEncodingActive && question.question && value) {
                utilHandleAutomaticEncodingChange(
                    null,
                    setIsAutoEncodingActive,
                    (newComps) => setQuestions(prevQs => prevQs.map(q => q.questionId === question.questionId ? {...q, competencies: newComps} : q)),
                    question.question,
                    question.shortName,
                    value,
                    updateCompetenciesForQuestion
                ).catch(err => console.error("Error auto-encoding after framework change:", err));
            }
        } else {
            setQuestions(prevQuestions =>
                prevQuestions.map(q => q.questionId === question.questionId ? { ...q, [prop]: value } : q)
            );
        }
    };

    const handleDeleteCompetency = (questionId, competencyToDelete) => {
        setQuestions(questions.map(question => {
            if (question.questionId === questionId) {
                return {
                    ...question,
                    competencies: question.competencies.filter(competency => competency !== competencyToDelete),
                };
            }
            return question;
        }));
    };

    const handleAutoSuggestToggle = async (event) => {
        const checked = event.target.checked;
        setAutoSuggestionsEnabled(checked);
        if (checked && question.question) {
            setGeneratingOptions(true);
            try {
                const optionCount = question.options.length || 4;
                const instructions = "Generate one correct answer and the rest should be plausible but incorrect alternatives. Make all options believable but ensure only one is truly correct.";
                const suggestedOptions = await fetchSuggestedOptions(
                    question.question,
                    optionCount,
                    [],
                    currentUser,
                    QuestionType.CHECKBOX,
                    instructions
                );
                const formattedOptions = suggestedOptions.map(opt => ({ label: opt, value: opt }));
                setQuestions(prevQuestions => 
                    prevQuestions.map(q => 
                        q.questionId === question.questionId 
                            ? { ...q, options: formattedOptions, correctAnswer: (formattedOptions && formattedOptions.length > 0) ? [formattedOptions[0].label] : [] }
                            : q
                    )
                );
            } catch (err) {
                console.error("Error fetching suggested options:", err);
            } finally {
                setGeneratingOptions(false);
            }
        }
    };

    const enhancedAddOption = async (questionId) => {
        // Store the original length before adding the option
        const originalOptions = questions.find(q => q.questionId === questionId)?.options || [];
        const originalOptionsLength = originalOptions.length;
        const targetOptionCount = originalOptionsLength + 1; // We're adding one option
        
        // Add the option to the state
        addOption(setQuestions, questionId);
        
        // If auto-suggestions enabled, generate new options
        if (autoSuggestionsEnabled && !currentUser?.sandbox) {
            setTimeout(async () => {
                const currentQuestion = questions.find(q => q.questionId === questionId);
                if (currentQuestion && currentQuestion.question) {
                    setGeneratingOptions(true);
                    try {
                        // Use the calculated target count instead of trying to read from the updated state
                        const instructions = "Generate one correct answer and the rest should be plausible but incorrect alternatives. Make all options believable but ensure only one is truly correct.";
                        const suggestedOptions = await fetchSuggestedOptions(
                            currentQuestion.question,
                            targetOptionCount, // Use pre-calculated target count instead
                            [],
                            currentUser,
                            currentQuestion.questionType === 'radio-ordered' ? QuestionType.RADIO_ORDERED : QuestionType.CHECKBOX,
                            instructions
                        );
                        
                        // Map to the format expected by the question model
                        const formattedOptions = suggestedOptions.map((opt, index) => ({ 
                            label: opt, 
                            value: opt 
                        }));
                        
                        // Ensure we have exactly the right number of options
                        if (formattedOptions.length !== targetOptionCount) {
                            console.warn(`Expected ${targetOptionCount} options, but got ${formattedOptions.length}`);
                            // Adjust the array if needed (trim or pad)
                            while (formattedOptions.length < targetOptionCount) {
                                formattedOptions.push({ label: "", value: "" });
                            }
                            if (formattedOptions.length > targetOptionCount) {
                                formattedOptions.length = targetOptionCount;
                            }
                        }
                        
                        // Update the question state with new options
                        setQuestions(prevQuestions => 
                            prevQuestions.map(q => 
                                q.questionId === questionId 
                                    ? { 
                                        ...q, 
                                        options: formattedOptions, 
                                        correctAnswer: (formattedOptions && formattedOptions.length > 0) 
                                            ? [formattedOptions[0].label] 
                                            : [] 
                                      } 
                                    : q
                            )
                        );
                    } catch (err) {
                        console.error("Error regenerating options after add:", err);
                    } finally {
                        setGeneratingOptions(false);
                    }
                }
            }, 100);
        }
    };
    
    const enhancedRemoveOption = async (questionId, index) => {
        // Store the original length before removing the option
        const originalOptions = questions.find(q => q.questionId === questionId)?.options || [];
        const originalOptionsLength = originalOptions.length;
        const targetOptionCount = Math.max(0, originalOptionsLength - 1); // We're removing one option
        
        // Remove the option from the state
        removeOption(setQuestions, questionId, index);
        
        // If auto-suggestions enabled and we'll have options left, generate new options
        if (autoSuggestionsEnabled && !currentUser?.sandbox && targetOptionCount > 0) {
            setTimeout(async () => {
                const currentQuestion = questions.find(q => q.questionId === questionId);
                // Only proceed if the question exists and has a title
                if (currentQuestion && currentQuestion.question) {
                    setGeneratingOptions(true);
                    try {
                        // Use the calculated target count instead of trying to read from the updated state
                        const instructions = "Generate one correct answer and the rest should be plausible but incorrect alternatives. Make all options believable but ensure only one is truly correct.";
                        const suggestedOptions = await fetchSuggestedOptions(
                            currentQuestion.question,
                            targetOptionCount, // Use pre-calculated target count instead
                            [],
                            currentUser,
                            currentQuestion.questionType === 'radio-ordered' ? QuestionType.RADIO_ORDERED : QuestionType.CHECKBOX,
                            instructions
                        );
                        
                        // Map to the format expected by the question model
                        const formattedOptions = suggestedOptions.map((opt, index) => ({ 
                            label: opt, 
                            value: opt 
                        }));
                        
                        // Ensure we have exactly the right number of options
                        if (formattedOptions.length !== targetOptionCount) {
                            console.warn(`Expected ${targetOptionCount} options, but got ${formattedOptions.length}`);
                            // Adjust the array if needed (trim or pad)
                            while (formattedOptions.length < targetOptionCount) {
                                formattedOptions.push({ label: "", value: "" });
                            }
                            if (formattedOptions.length > targetOptionCount) {
                                formattedOptions.length = targetOptionCount;
                            }
                        }
                        
                        // Update the question state with new options
                        setQuestions(prevQuestions => 
                            prevQuestions.map(q => 
                                q.questionId === questionId 
                                    ? { 
                                        ...q, 
                                        options: formattedOptions, 
                                        correctAnswer: (formattedOptions && formattedOptions.length > 0) 
                                            ? [formattedOptions[0].label] 
                                            : [] 
                                      } 
                                    : q
                            )
                        );
                    } catch (err) {
                        console.error("Error regenerating options after remove:", err);
                    } finally {
                        setGeneratingOptions(false);
                    }
                }
            }, 100);
        } else if (targetOptionCount === 0) {
            // If all options are removed, clear correct answer
            setQuestions(prevQuestions => 
                prevQuestions.map(q => 
                    q.questionId === questionId 
                        ? { ...q, correctAnswer: [] } 
                        : q
                )
            );
        }
    };

    const handleLocalAutomaticEncodingChange = async (event) => {
        const newCheckedState = event.target.checked;
        setIsAutoEncodingActive(newCheckedState);

        if (newCheckedState && question.framework && question.question) {
            try {
                await utilHandleAutomaticEncodingChange(
                    event,
                    setIsAutoEncodingActive,
                    (newComps) => {
                        setQuestions(prevQs => 
                            prevQs.map(q => 
                                q.questionId === question.questionId 
                                    ? { ...q, competencies: newComps } 
                                    : q
                            )
                        );
                    },
                    question.question, 
                    question.shortName,
                    question.framework,
                    updateCompetenciesForQuestion
                );
            } catch (error) {
                console.error("Error during automatic competency encoding:", error);
                setIsAutoEncodingActive(false);
            }
        } else if (!newCheckedState) {
            // If unchecking, clear competencies (optional, or let manual take over)
            // setQuestions(prevQs => prevQs.map(q => q.questionId === question.questionId ? {...q, competencies: []} : q));
        }
    };

    return (
            <Box component="div" sx={{ width: '98%', p: 2, margin: "10px 5px 10px 5px", borderRadius: '8px' }}>            <Typography mb="20px" variant="h4" fontWeight="bold">
                {question.questionType === 'single-text' 
                    ? getMessage("label_edit_context")
                    : getMessage("label_edit_question")
                }
            </Typography>
            <Grid container spacing={2}>
                {question.questionType === 'single-text' ? (
                    <Grid item xs={12}>
                        <Box>
                            <TextField
                                fullWidth
                                multiline
                                rows={6}
                                variant="outlined"
                                value={question.context}
                                onChange={e => handleChange('context', e.target.value)}
                                InputProps={{
                                    style: { 
                                        backgroundColor: 'white',
                                        fontFamily: "monospace"
                                    }
                                }}
                            />
                        </Box>
                    </Grid>
                ) : (
                    <>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label={getMessage("label_question_title")}
                                variant="outlined"
                                value={question.question}
                                InputProps={{style: { backgroundColor: 'white' }}}
                                onChange={e => handleChange('question', e.target.value)}
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label={getMessage("label_short_name")}
                                variant="outlined"
                                value={question.shortName}
                                InputProps={{style: { backgroundColor: 'white' }}}
                                onChange={e => handleChange('shortName', e.target.value)}
                                inputProps={{ maxLength: 30 }}
                                helperText={`${question.shortName.length}/30 characters (minimum 5)`}
                                error={question.shortName.length < 5}
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <FormControl fullWidth variant="outlined">
                                <InputLabel id="learningType">
                                    {getMessage("label_learning_type")}
                                </InputLabel>
                                <Select
                                    labelId="learningType"
                                    id="learningType"
                                    value={question.learningType || ''}
                                    label={getMessage("label_learning_type")}
                                    sx={{ backgroundColor: 'white' }}
                                    onChange={(event) => changeLearningType(setQuestions, event, question.questionId)}
                                >
                                    <MenuItem value={'Knowledge'}>
                                        {getMessage("label_knowledge")}
                                    </MenuItem>
                                    <MenuItem value={'Skill'}>
                                        {getMessage("label_skill")}
                                    </MenuItem>
                                    <MenuItem value={'Attitude'}>
                                        {getMessage("label_attitude")}
                                    </MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>

                        {/* Auto-suggestion */}
                        {question.questionType === 'checkbox' && (
                            <Grid item xs={12}>
                                <Box sx={{ mt: 1, mb: 1 }}>
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                checked={autoSuggestionsEnabled}
                                                onChange={handleAutoSuggestToggle}
                                                disabled={!question.question || generatingOptions || currentUser?.sandbox}
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
                        )}

                        {question.questionType !== 'text' && (
                            <>
                                <Grid container spacing={2} style={{ marginLeft: '10px', marginTop: '10px' }}> 
                                    {question.options.map((option, index) => (
                                        <Grid item xs={12} key={index}> 
                                            <Box display="flex" alignItems="center" justifyContent="space-between">
                                                <TextField
                                                    fullWidth
                                                    multiline
                                                    label={`${getMessage("label_option")} ${index + 1}`}
                                                    variant="outlined"
                                                    InputProps={{style: { backgroundColor: 'white' }}}
                                                    value={option.label}
                                                    onChange={(e) => changeOption(setQuestions, e, question.questionId, index)}
                                                />
                                                <IconButton onClick={() => enhancedRemoveOption(question.questionId, index)}>
                                                    <Delete />
                                                </IconButton>
                                            </Box>
                                        </Grid>
                                    ))}
                                </Grid>

                                <Grid container spacing={2} style={{ marginLeft: '10px', marginTop: '10px', justifyContent: "center" }}>
                                    <Grid item xs={6}>
                                        <Button variant="outlined" sx={buttonStyle} onClick={() => enhancedAddOption(question.questionId)} fullWidth>
                                            {getMessage("label_add_option")}
                                        </Button>
                                    </Grid>
                                </Grid>

                                <Grid item xs={12}>
                                    <FormControl fullWidth variant="outlined" sx={formControlStyle}>
                                        <InputLabel id="selectedCorrectAnswer">
                                            {getMessage("label_choose_correct_answer")}
                                        </InputLabel>
                                        <Select
                                            labelId="selectedCorrectAnswer"
                                            id="selectedCorrectAnswer"
                                            multiple
                                            value={Array.isArray(question.correctAnswer) ? question.correctAnswer : []}
                                            label={getMessage("label_choose_correct_answer")}
                                            onChange={(event) => changeCorrectAnswer(setQuestions, event, question.questionId)}
                                            renderValue={(selected) => selected.join(', ')}
                                        >
                                            {question.options.length > 0 && 
                                                question.options.map((option, index) => 
                                                    (option.label !== "" && (
                                                        <MenuItem key={index} value={option.label}>
                                                            <Checkbox checked={Array.isArray(question.correctAnswer) && 
                                                                            question.correctAnswer.includes(option.label)} />
                                                            <ListItemText primary={option.label} />
                                                        </MenuItem>
                                                    ))
                                                )
                                            }
                                        </Select>
                                    </FormControl>
                                </Grid>

                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        label={getMessage("label_explanation")}
                                        variant="outlined"
                                        multiline
                                        rows={4}
                                        InputProps={{style: { backgroundColor: 'white' }}}
                                        value={question.explanation}
                                        onChange={e => handleChange('explanation', e.target.value)}
                                    />
                                </Grid>
                            </>
                        )}
                    </>
                )}

                {/* Only show competency section for non-single-text questions */}
                {question.questionType !== 'single-text' && (
                    <>
                        <Grid item xs={12}>
                            <Box display="flex" justifyContent="center">
                                <FormControlLabel
                                    control={<Switch 
                                        checked={isAutoEncodingActive} 
                                        onChange={handleLocalAutomaticEncodingChange} 
                                        disabled={currentUser?.sandbox || !question.framework || !question.question}
                                    />}
                                    label={getMessage("label_automatically_recode_competencies")}
                                />
                            </Box>
                            {currentUser?.sandbox && (
                                <Alert severity="info" sx={{ mt: 1, mb: 1, mr:1 }}>
                                    {getMessage("sandbox_user_ai_restriction")}
                                </Alert>
                            )}
                             {!question.question && isAutoEncodingActive && (
                                 <Alert severity="warning" sx={{ mt: 1, mb: 1, mr:1 }}>
                                    {getMessage("enter_question_title_for_auto_encoding")}
                                </Alert>
                            )}
                        </Grid>

                        <Grid item xs={12}>
                            <Typography sx={{ mb: "15px", mt: "15px" }}>
                                {getMessage("label_add_competencies_manually")}
                            </Typography>
                            
                            <FormControl fullWidth variant="outlined" sx={formControlStyle}>
                                <InputLabel id="selectedAreaEdit">
                                    {getMessage("label_choose_competency_area")}
                                </InputLabel>
                                <Select
                                    labelId="selectedAreaEdit"
                                    id="selectedAreaEdit"
                                    label={getMessage("label_choose_competency_area")}
                                    value={localSelectedArea}
                                    onChange={(e) => {
                                        setLocalSelectedArea(e.target.value);
                                        setLocalSelectedCompetency('');
                                        setLocalActivity('');
                                    }}
                                    name="area"
                                    sx={{ mb: "15px" }}
                                    disabled={!question.framework}
                                >
                                    {(
                                        (assessmentType === AssessmentType.STUDENT_LEARNING_OUTCOMES
                                            ? studentCompetenceAreas
                                            : traineeCompetenceAreas)[question.framework] || []
                                    ).map((areaItem, index) => (
                                        <MenuItem key={index} value={areaItem}>
                                            {areaItem}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            {localSelectedArea && (
                                <FormControl fullWidth variant="outlined" sx={formControlStyle}>
                                    <InputLabel id="selectedCompetencyEdit">{getMessage("label_choose_competency")}</InputLabel>
                                    <Select
                                        labelId="selectedCompetencyEdit"
                                        id="selectedCompetencyEdit"
                                        label={getMessage("label_choose_competency")}
                                        value={localSelectedCompetency}
                                        onChange={(e) => {
                                            setLocalSelectedCompetency(e.target.value);
                                            setLocalActivity('');
                                        }}
                                        name="competency"
                                        sx={{ mb: "15px" }}
                                        disabled={!localSelectedArea}
                                    >
                                        {getCompetencies({ area: localSelectedArea, framework: question.framework }).map((competencyItem, index) => (
                                            <MenuItem key={index} value={competencyItem}>{competencyItem}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            )}

                            {localSelectedCompetency && (
                                <FormControl fullWidth variant="outlined" sx={formControlStyle}>
                                    <InputLabel id="selectedActivityEdit">{getMessage("label_choose_activity")}</InputLabel>
                                    <Select
                                        labelId="selectedActivityEdit"
                                        id="selectedActivityEdit"
                                        label={getMessage("label_choose_activity")}
                                        value={localActivity}
                                        onChange={(e) => {
                                            setLocalActivity(e.target.value);
                                            if (typeof handleCompetencyChange === 'function') {
                                                handleCompetencyChange(question.questionId, e.target.value, 'activity');
                                            } else {
                                                // If handleCompetencyChange not provided, update competencies directly
                                                const activityValue = e.target.value;
                                                setQuestions(prevQuestions => 
                                                    prevQuestions.map(q => 
                                                        q.questionId === question.questionId 
                                                            ? { 
                                                                ...q, 
                                                                competencies: [...(q.competencies || []), activityValue] 
                                                              } 
                                                            : q
                                                    )
                                                );
                                            }
                                        }}
                                        name="activity"
                                        sx={{ mb: "15px" }}
                                        disabled={!localSelectedCompetency}
                                    >
                                        {getActivities({ competency: localSelectedCompetency, framework: question.framework }).map((activityItem, index) => (
                                            <MenuItem key={index} value={activityItem}>{activityItem}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            )}

                            <Grid item xs={12}>
                                <Box sx={{display: 'flex', flexWrap: 'wrap', gap: 0.5, maxWidth: '100%', overflow: 'hidden'}}>
                                    {question.competencies && question.competencies.map((c, index) => (
                                        <Chip 
                                            key={index} 
                                            label={c} 
                                            onDelete={() => handleDeleteCompetency(question.questionId, c)}
                                        />
                                    ))}
                                </Box>
                            </Grid>
                        </Grid>
                    </>
                )}

                <Grid item xs={12}>
                    <Box display="flex" justifyContent="space-between">
                        <Button 
                            type="button" 
                            variant="contained" 
                            onClick={() => setEditingQuestionId(null)} 
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
                            onClick={() => saveEdits(setQuestions, setEditingQuestionId, question.questionId, question)} 
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

const QuestionsListSectionLearning = ({
    workshop,
    questions,
    setQuestions,
    setEditingQuestionId,
    editingQuestionId,
    setFieldValue,
    handleCompetencyChange,
    handleAutomaticEncodingChange,
    automaticEncoding,
    selectedArea,
    selectedCompetency,
    activity,
    assessmentType,
    allQuestions,
    allWorkshops,
    handleUpdateWorkshopName
}) => {
    const [isEditingWorkshopName, setIsEditingWorkshopName] = useState(false);
    const [editableWorkshopName, setEditableWorkshopName] = useState(workshop?.label || "");
    const { getMessage } = useMessageService();

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

            {questions.map((question, index) => {
              // Skip rendering if this is a matrix question that's not the first one
              if (question.matrixId && question.matrixPosition !== 0) {
                return null;
              }

              // For matrix questions, find all questions with the same matrixId
              const matrixQuestions = question.matrixId ? 
                questions.filter(q => q.matrixId === question.matrixId)
                  .sort((a, b) => a.matrixPosition - b.matrixPosition)
                  .map(q => ({ label: q.question, shortName: q.shortName, questionId: q.questionId }))
                : [];

              return (
                <Box 
                    key={index} 
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
                                questions={questions}
                                question={question}
                                setQuestions={setQuestions}
                                editingQuestionId={editingQuestionId}
                                setEditingQuestionId={setEditingQuestionId}
                                handleCompetencyChange={handleCompetencyChange}
                                automaticEncoding={automaticEncoding}
                                handleAutomaticEncodingChange={handleAutomaticEncodingChange}
                                selectedArea={selectedArea}
                                selectedCompetency={selectedCompetency}
                                getCompetencies={getCompetencies}
                                getActivities={getActivities}
                                activity={activity}
                                assessmentType={assessmentType}
                            />
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
                                correctAnswer={question.correctAnswer}
                                explanation={question.explanation}
                                competencies={question.competencies || []}
                                assessmentType={assessmentType}
                                displayCorrectAnswer={true}
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

export default QuestionsListSectionLearning;
