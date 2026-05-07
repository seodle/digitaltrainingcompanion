import "react-draft-wysiwyg/dist/react-draft-wysiwyg.css";
import { Formik, Form, useFormikContext } from "formik";
import React, { useState, useEffect } from "react";
import * as Yup from "yup";
import { Box, Button, Select, MenuItem, InputLabel, Typography, FormControl, FormControlLabel, Switch, Tooltip, IconButton, Alert, CircularProgress, TableContainer, Paper, Table, TableBody, TableRow, TableCell, Checkbox } from "@mui/material";
import InfoIcon from '@mui/icons-material/Info';
import { Globe2 } from 'lucide-react';
import { Editor } from "react-draft-wysiwyg";
import { EditorState } from 'draft-js';
import axios from 'axios';

import { useLanguage } from '../contexts/LanguageContext';
import { useMessageService } from '../services/MessageService';
import { buttonStyle, toolbarConfig } from '../components/styledComponents'
import { QuestionType, AssessmentType, LearningType } from '../utils/enums';
import { BACKEND_URL } from '../config';
import { processMessageToAPI, addQuestionsSchema, handleAutomaticEncodingChange, handleSubmit, 
         initialQuestionValues, getCompetencies, getActivities, updateCompetenciesForQuestion,
         fetchSuggestedOptions } from '../utils/QuestionUtils';
import { traineeCompetenceAreas, studentCompetenceAreas } from "../assets/frameworksData";
import { useAuthUser } from '../contexts/AuthUserContext';

import QuestionTypeSelector from './QuestionTypeSelector';
import LearningTypeSelector from './LearningTypeSelector';
import TextFieldWrapper from './TextFieldWrapper';
import FrameworkSelector from './FrameworkSelector';
import CompetenciesSelector from './CompetenciesSelector';
import ChooseNumberQuestions from './ChooseNumberQuestions';
import AdoptionTypeSelector from './AdoptionTypeSelector';
import ChooseOptions from './ChooseOptions';

const AddLearningQuestions = ({
  setQuestions,
  questions,
  assessmentType,
  workshops,
  splitWorkshops,
  aiBeaconEligible = false,
  courseAiBeaconId = null,
  currentAssessmentServerId = null,
}) => {

  const { currentUser } = useAuthUser();
  const [response, setResponse] = useState("");
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false); 
  const [helpWithAI, setHelpWithAI] = useState(false);
  const [helpWithAiBeacon, setHelpWithAiBeacon] = useState(false);
  const [moodleCourseContents, setMoodleCourseContents] = useState([]);
  const [isLoadingMoodleCourseContents, setIsLoadingMoodleCourseContents] = useState(false);
  const [moodleCourseContentsError, setMoodleCourseContentsError] = useState('');
  const [selectedMoodleContentIds, setSelectedMoodleContentIds] = useState([]);
  const [aiBeaconOutputLanguage, setAiBeaconOutputLanguage] = useState('auto');
  const [aiBeaconLanguageError, setAiBeaconLanguageError] = useState('');
  const [aiBeaconLanguageSaving, setAiBeaconLanguageSaving] = useState(false);
  const [automaticEncoding, setAutomaticEncoding] = useState(false);
  const [selectedCompetencies, setSelectedCompetencies] = useState([]);
  const [hasError, setHasError] = useState(false);
  const [generatingOptions, setGeneratingOptions] = useState(false);
  const { languageCode } = useLanguage();
  const [editorState, setEditorState] = useState(EditorState.createEmpty());
  const { getMessage } = useMessageService();

  const FormResetWatcher = ({ splitWorkshops, initialQuestionValues }) => {
    const { values, setFieldValue } = useFormikContext();
    useEffect(() => {
      if (!splitWorkshops) {
        // Reset only the category field
        setFieldValue('workshopId', initialQuestionValues.workshopId);
      }
    }, [splitWorkshops, setFieldValue, initialQuestionValues]);

    return null;
  };

  // Event handler for changing the state of helpWithAI
  const handleHelpWithAIChange = (event) => {
    setHelpWithAI(event.target.checked);
    setAutomaticEncoding(event.target.checked);
    setSelectedCompetencies([]);
  };

  const handleHelpWithAiBeaconChange = (event) => {
    const checked = event.target.checked;
    setHelpWithAiBeacon(checked);
    if (!checked) {
      setSelectedMoodleContentIds([]);
      setAiBeaconOutputLanguage('auto');
      setAiBeaconLanguageError('');
    }
  };

  const handleAiBeaconOutputLanguageChange = async (event) => {
    const language = event.target.value;
    const previous = aiBeaconOutputLanguage;
    if (!courseAiBeaconId || aiBeaconLanguageSaving) return;

    const token = localStorage.getItem('token');
    if (!token) {
      setAiBeaconLanguageError('Could not save language.');
      return;
    }

    setAiBeaconOutputLanguage(language);
    setAiBeaconLanguageError('');
    setAiBeaconLanguageSaving(true);
    try {
      await axios.put(
        `${BACKEND_URL}/aiBeacon/courses/${encodeURIComponent(courseAiBeaconId)}`,
        { language },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (e) {
      setAiBeaconOutputLanguage(previous);
      const msg = e?.response?.data?.error || e?.response?.data?.message;
      setAiBeaconLanguageError(typeof msg === 'string' ? msg : 'Could not save language.');
    } finally {
      setAiBeaconLanguageSaving(false);
    }
  };

  const toggleMoodleContentSelected = (contentId) => {
    if (contentId == null) return;
    setSelectedMoodleContentIds((prev) =>
      prev.includes(contentId)
        ? prev.filter((id) => id !== contentId)
        : [...prev, contentId]
    );
  };

  useEffect(() => {
    if (!aiBeaconEligible || !helpWithAiBeacon || !courseAiBeaconId) {
      setMoodleCourseContents([]);
      setMoodleCourseContentsError('');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      setMoodleCourseContents([]);
      setMoodleCourseContentsError('No authentication token available.');
      return;
    }

    let cancelled = false;
    const loadCourseContents = async () => {
      setIsLoadingMoodleCourseContents(true);
      setMoodleCourseContentsError('');
      try {
        const response = await axios.get(
          `${BACKEND_URL}/aiBeacon/courses/${encodeURIComponent(courseAiBeaconId)}/contents`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const contents = Array.isArray(response?.data?.contents)
          ? response.data.contents
          : [];
        if (!cancelled) {
          setMoodleCourseContents(contents);
        }
      } catch (e) {
        if (!cancelled) {
          setMoodleCourseContents([]);
          setMoodleCourseContentsError('Failed to load Moodle course contents.');
        }
      } finally {
        if (!cancelled) {
          setIsLoadingMoodleCourseContents(false);
        }
      }
    };

    loadCourseContents();
    return () => {
      cancelled = true;
    };
  }, [aiBeaconEligible, helpWithAiBeacon, courseAiBeaconId]);
 
  const handleSend = async (message, type) => {
    setResponse("");
    setIsLoading(true);
    setIsLoaded(false);
    setError(null);

    try {
      const response = await processMessageToAPI(message, type);
      console.log("response: ", response);
      setResponse(response);
      return response;
    } catch (error) {
      console.error('Error:', error);
      setError(error.message || "An unexpected error occurred");
      setIsLoading(false);
      throw error;
    }
  };

  const handleCompetencyChange = (event) => {
    setSelectedCompetencies([...selectedCompetencies, event.target.value]);
  };

  const handleDeleteCompetency = (competencyToRemove) => {
    setSelectedCompetencies(selectedCompetencies.filter(competency => competency !== competencyToRemove));
  };

  // Function to handle option generation directly
  const handleGenerateOptions = async (values, setFieldValue) => {
    if (!values.question || values.question.trim() === '' || currentUser?.sandbox) {
      return;
    }

    setGeneratingOptions(true);
    try {
      const optionCount = values.options.length || 4;
      
      // Determine question type based on the selected question type from form
      let questionType = QuestionType.RADIO_UNORDERED;
      if (values.questionType === 'radio-ordered') {
        questionType = QuestionType.RADIO_ORDERED;
      } else if (values.questionType === 'checkbox') {
        questionType = QuestionType.CHECKBOX;
      }

      const suggestedOptions = await fetchSuggestedOptions(
        values.question,
        optionCount,
        [],
        currentUser,
        questionType,
        null // custom instructions
      );

      // Update form values with suggested options
      if (suggestedOptions && suggestedOptions.length > 0) {
        // Update each option in the form
        suggestedOptions.forEach((option, index) => {
          if (index < values.options.length) {
            setFieldValue(`options.${index}`, option);
          }
        });

        // Set first option as default correct answer if it's not set already
        if (!values.correctAnswer || values.correctAnswer.length === 0) {
          setFieldValue('correctAnswer', [suggestedOptions[0]]);
        }
        
        // Ensure auto-suggestions remain enabled
        setFieldValue('autoSuggestionsEnabled', true);
      }
    } catch (err) {
      console.error("Error generating options:", err);
      // Don't disable auto-suggestions on error
    } finally {
      setGeneratingOptions(false);
    }
  };

  // This component adds auto-suggestion functionality to ChooseOptions
  const OptionsWithAutoSuggestions = () => {
    const { values, setFieldValue } = useFormikContext();
    // Initialize from form value if it exists, otherwise false
    const [localAutoSuggestionsEnabled, setLocalAutoSuggestionsEnabled] = useState(values.autoSuggestionsEnabled || false);
    const [prevOptionsLength, setPrevOptionsLength] = useState(values.options.length);
    const [prevQuestionTitle, setPrevQuestionTitle] = useState(values.question || '');
    const generationInProgress = React.useRef(false);
    const optionsChangeTimeoutRef = React.useRef(null);
    const questionChangeTimeoutRef = React.useRef(null);

    // Handle toggling auto-suggestions
    const handleAutoSuggestionsToggle = async (event) => {
      const checked = event.target.checked;
      setLocalAutoSuggestionsEnabled(checked);
      setFieldValue('autoSuggestionsEnabled', checked);
      
      if (checked && !generationInProgress.current) {
        generationInProgress.current = true;
        try {
          await handleGenerateOptions(values, setFieldValue);
        } finally {
          generationInProgress.current = false;
        }
      }
    };

    // Keep state in sync with form value
    useEffect(() => {
      if (values.autoSuggestionsEnabled !== undefined && values.autoSuggestionsEnabled !== localAutoSuggestionsEnabled) {
        setLocalAutoSuggestionsEnabled(values.autoSuggestionsEnabled);
      }
    }, [values.autoSuggestionsEnabled, localAutoSuggestionsEnabled]);

    // Only regenerate when question title changes significantly and auto-suggestions are enabled
    useEffect(() => {
      // Clear any pending timeout
      if (questionChangeTimeoutRef.current) {
        clearTimeout(questionChangeTimeoutRef.current);
      }

      // Only proceed if auto-suggestions are enabled and question has changed significantly
      if (localAutoSuggestionsEnabled && 
          values.question && 
          prevQuestionTitle !== values.question && 
          !generationInProgress.current) {
        
        // Debounce the generation to avoid multiple rapid calls
        questionChangeTimeoutRef.current = setTimeout(() => {
          generationInProgress.current = true;
          handleGenerateOptions(values, setFieldValue)
            .finally(() => {
              generationInProgress.current = false;
              setPrevQuestionTitle(values.question);
            });
        }, 500); // Wait 500ms after user stops typing
      }
      
      // Cleanup
      return () => {
        if (questionChangeTimeoutRef.current) {
          clearTimeout(questionChangeTimeoutRef.current);
        }
      };
    }, [values.question]); // Only depend on question, not questionType

    // Monitor options array changes to trigger auto-suggestions
    useEffect(() => {
      // If options length changed and auto-suggestions are enabled
      if (localAutoSuggestionsEnabled && 
          values.question && 
          values.options.length !== prevOptionsLength && 
          !generationInProgress.current) {
        
        // Clear any pending timeout
        if (optionsChangeTimeoutRef.current) {
          clearTimeout(optionsChangeTimeoutRef.current);
        }
        
        // Small delay to allow the options array to fully update
        optionsChangeTimeoutRef.current = setTimeout(() => {
          generationInProgress.current = true;
          handleGenerateOptions(values, setFieldValue)
            .finally(() => {
              generationInProgress.current = false;
              setPrevOptionsLength(values.options.length);
            });
        }, 50);
      } else {
        // Update the previous length without triggering generation
        setPrevOptionsLength(values.options.length);
      }
      
      // Cleanup
      return () => {
        if (optionsChangeTimeoutRef.current) {
          clearTimeout(optionsChangeTimeoutRef.current);
        }
      };
    }, [values.options.length]); // Only trigger when options length changes

    return (
      <>
        {/* Auto-suggestions for options */}
        <Box sx={{ mb: "15px" }}>
          <FormControlLabel
            control={
              <Switch
                checked={localAutoSuggestionsEnabled}
                onChange={handleAutoSuggestionsToggle}
                disabled={!values.question || generatingOptions || currentUser?.sandbox || generationInProgress.current}
              />
            }
            label={
              <Box display="flex" alignItems="center">
                {getMessage("label_auto_suggestions")}
              </Box>
            }
          />
          {currentUser?.sandbox && (
            <Alert severity="info" sx={{ mt: 1 }}>
              {getMessage("sandbox_user_ai_restriction")}
            </Alert>
          )}
        </Box>
        
        {(generatingOptions || generationInProgress.current) && (
          <Box display="flex" alignItems="center" justifyContent="center" sx={{ mt: 1, mb: 2 }}>
            <CircularProgress size={20} sx={{ mr: 1 }} />
            <Typography variant="body2">{getMessage("label_generating_options")}</Typography>
          </Box>
        )}

        <ChooseOptions 
          getMessage={getMessage} 
          buttonStyle={buttonStyle}
        />
      </>
    );
  };

  // Define the onSubmit function
  const onSubmit = async (values, formikBag) => {
    if (helpWithAiBeacon) {
      setError(null);
      if (selectedMoodleContentIds.length === 0) {
        setError(getMessage('label_select_your_content'));
        return;
      }

      setIsLoading(true);
      try {
        const token = localStorage.getItem('token');
        const response = await axios.post(
          `${BACKEND_URL}/aiBeacon/assessments/${encodeURIComponent(currentAssessmentServerId)}/generate-questions`,
          {
            courseId: courseAiBeaconId,
            content_ids: selectedMoodleContentIds,
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const mappedQuestions = Array.isArray(response?.data?.questions)
          ? response.data.questions
          : [];
        if (mappedQuestions.length === 0) {
          setError('No questions were generated.');
          return;
        }

        const startQuestionId =
          questions.reduce(
            (maxId, question) => Math.max(maxId, parseInt(question.questionId, 10)),
            0
          ) + 1;

        const frontendQuestions = mappedQuestions.map((question, index) => ({
          ...question,
          questionId: String(startQuestionId + index),
          workshopId: values.workshopId || '',
          options: (question.choices || []).map((choice) => ({
            label: choice,
            value: choice,
          })),
          correctAnswer: Array.isArray(question.correctAnswer)
            ? question.correctAnswer
            : question.correctAnswer
              ? [question.correctAnswer]
              : [],
        }));

        setQuestions((prevQuestions) => [...prevQuestions, ...frontendQuestions]);
      } catch (submitError) {
        const msg =
          submitError?.response?.data?.error ||
          submitError?.message ||
          'Failed to generate questions.';
        setError(typeof msg === 'string' ? msg : 'Failed to generate questions.');
      } finally {
        setIsLoading(false);
      }
      return;
    }

    try {
        await handleSubmit(values, formikBag, {
            handleSend,
            languageCode,
            numberOfQuestions: values.numberOfQuestions,
            data: values.data,
            helpWithAI,
            questions,
            setQuestions,
            selectedCompetencies,
            setSelectedCompetencies,
            setAutomaticEncoding,
            editorState,
            setIsLoading,
        });
    } catch (error) {
        console.error('Error in onSubmit:', error);
        setIsLoading(false);
    }
  };

  return (
    <>
    <Box flexDirection="column" display="flex" sx={{backgroundColor: "#fff", marginBottom: "20px", paddingLeft: "20px",}} >
      <Box display="flex" alignItems="center">
        {aiBeaconEligible ? (
          <FormControlLabel
            control={
              <Switch
                checked={helpWithAiBeacon}
                onChange={handleHelpWithAiBeaconChange}
                disabled={currentUser?.sandbox}
              />
            }
            label={getMessage("label_create_questions_with_ai")}
          />
        ) : (
          <FormControlLabel
            control={<Switch checked={helpWithAI} onChange={handleHelpWithAIChange} disabled={currentUser?.sandbox} />}
            label={
              <Box display="flex" alignItems="center">
                {getMessage("label_create_questions_with_ai")}
                <Tooltip title={
                    <Typography sx={{ fontSize: '0.9rem' }}>
                      {getMessage("info_create_questions_with_ai")}
                    </Typography>
                  }>
                  <IconButton size="small" sx={{ ml: 0.5, color: 'info.main' }}>
                    <InfoIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            }
          />
        )}
      </Box>
      {currentUser?.sandbox && (
        <Alert severity="info" sx={{ mt: 1, mr:3 }}>
          {getMessage("sandbox_user_ai_restriction")}
        </Alert>
      )}
    </Box>

    <Box ml="20px" mr="20px">
      <Box sx={{p: "10px", borderRadius: "4px",}}>

          <Formik
            initialValues={initialQuestionValues}
            validationSchema={Yup.lazy(values => addQuestionsSchema(splitWorkshops, helpWithAI, values.questionType))}
            onSubmit={onSubmit}
          >   

          {({ values, errors, touched, handleChange, handleBlur }) => (
          <Form>
            <FormResetWatcher splitWorkshops={splitWorkshops} initialQuestionValues={initialQuestionValues} />
            {splitWorkshops && (
              <FormControl fullWidth margin="normal" error={touched.workshopId && Boolean(errors.workshopId)}>
                  <InputLabel id="selectedWorkshop">{getMessage("label_choose_workshop")}</InputLabel>
                  <Select
                  labelId="selectedWorkshop"
                  id="selectedWorkshop"
                  name="workshopId"
                  value={values.workshopId}
                  label={getMessage("label_choose_workshop")}
                  onChange={handleChange}
                  onBlur={handleBlur}
                >
                  {workshops.length > 0 && 
                    workshops.map((workshop) => (
                      <MenuItem key={workshop._id} value={workshop._id}>
                        {workshop.label}
                      </MenuItem>
                    ))
                  }
                </Select>
                {touched.workshopId && errors.workshopId && 
                  <Typography variant="caption" color="error" sx={{ mt: 0 }}>{errors.workshopId}</Typography>
                }
              </FormControl>
            )}

            {helpWithAiBeacon ? (
              <Box sx={{ mt: '15px' }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 2,
                    flexWrap: 'wrap',
                    mb: 2,
                  }}
                >
                  <Typography
                    component="span"
                    variant="body2"
                    color="text.secondary"
                    sx={{ whiteSpace: 'nowrap' }}
                  >
                    {getMessage('label_language')}
                  </Typography>
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-end',
                      gap: 0.5,
                      minWidth: 120,
                    }}
                  >
                    <Select
                      size="small"
                      value={aiBeaconOutputLanguage}
                      onChange={handleAiBeaconOutputLanguageChange}
                      disabled={!courseAiBeaconId || aiBeaconLanguageSaving || isLoading}
                      inputProps={{
                        'aria-label': getMessage('label_language'),
                      }}
                      sx={{
                        minWidth: 148,
                        boxShadow: 'none',
                        '.MuiOutlinedInput-notchedOutline': { borderColor: 'divider' },
                      }}
                      renderValue={(value) => {
                        if (value === 'auto') {
                          return (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                              <Globe2 size={18} aria-hidden />
                              {getMessage('label_ai_beacon_auto_detect')}
                            </Box>
                          );
                        }
                        const flagClass =
                          value === 'en'
                            ? 'fi fi-gb'
                            : value === 'de'
                              ? 'fi fi-de'
                              : value === 'fr'
                                ? 'fi fi-fr'
                                : 'fi fi-it';
                        const native =
                          value === 'en'
                            ? 'English'
                            : value === 'fr'
                              ? 'Français'
                              : value === 'de'
                                ? 'Deutsch'
                                : 'Italiano';
                        return (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <span className={flagClass} aria-hidden />
                            {native}
                          </Box>
                        );
                      }}
                    >
                      <MenuItem value="auto">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Globe2 size={18} aria-hidden />
                          {getMessage('label_ai_beacon_auto_detect')}
                        </Box>
                      </MenuItem>
                      <MenuItem value="en">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <span className="fi fi-gb" aria-hidden />
                          English
                        </Box>
                      </MenuItem>
                      <MenuItem value="fr">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <span className="fi fi-fr" aria-hidden />
                          Français
                        </Box>
                      </MenuItem>
                      <MenuItem value="de">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <span className="fi fi-de" aria-hidden />
                          Deutsch
                        </Box>
                      </MenuItem>
                      <MenuItem value="it">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <span className="fi fi-it" aria-hidden />
                          Italiano
                        </Box>
                      </MenuItem>
                    </Select>
                    {aiBeaconLanguageError ? (
                      <Typography variant="caption" color="error" sx={{ textAlign: 'right' }}>
                        {aiBeaconLanguageError}
                      </Typography>
                    ) : null}
                  </Box>
                </Box>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  {getMessage('label_select_your_content')}
                </Typography>
                {isLoadingMoodleCourseContents ? (
                  <Box display="flex" justifyContent="center" py={2}>
                    <CircularProgress size={22} />
                  </Box>
                ) : moodleCourseContentsError ? (
                  <Alert severity="error">{moodleCourseContentsError}</Alert>
                ) : moodleCourseContents.length === 0 ? (
                  <Typography color="text.secondary">No course contents found.</Typography>
                ) : (
                  <TableContainer component={Paper} variant="outlined" sx={{ mt: 1, maxHeight: 220 }}>
                    <Table size="small" stickyHeader>
                      <TableBody>
                        {moodleCourseContents.map((content, index) => {
                          const contentId =
                            content.id != null && content.id !== ''
                              ? Number(content.id)
                              : null;
                          return (
                            <TableRow key={String(contentId ?? index)}>
                              <TableCell padding="checkbox" sx={{ width: 48 }}>
                                <Checkbox
                                  size="small"
                                  checked={contentId != null && selectedMoodleContentIds.includes(contentId)}
                                  disabled={!contentId || isLoading}
                                  onChange={() => toggleMoodleContentSelected(contentId)}
                                />
                              </TableCell>
                              <TableCell>{content.name || '-'}</TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Box>
            ) : !helpWithAI ? (
            <>
              {/* choose the question type */}
              <QuestionTypeSelector
                name="questionType"
                label="label_choose_question_type"
                getMessage={getMessage}
                sx={{ mb: "15px", mt: "15px" }}
              />

              {/* type single text */}
              {values.questionType === QuestionType.SINGLE_TEXT && (
                <Box margin="normal">
                  <Box border={1} borderColor="grey.400" p={2} mb={2} borderRadius={1}>
                    <Editor
                      editorState={editorState}
                      toolbarClassName="toolbarClassName"
                      wrapperClassName="wrapperClassName"
                      editorClassName="editorClassName"
                      onEditorStateChange={setEditorState}
                      toolbar={toolbarConfig}
                    />
                  </Box>
                </Box>
              )}

              {/* other types */}
              {values.questionType !== QuestionType.SINGLE_TEXT && (
                <>

                {/* question */}
                <TextFieldWrapper
                  name="question"
                  getMessage={getMessage}
                  label={getMessage("label_enter_question")}
                  fullWidth
                  sx={{ mb: '10px' }}
                  hideCharCount={true}
                />

                {/* question short name */}
                <Box display="flex" alignItems="flex-start" sx={{ mb: '10px' }}>
                  <TextFieldWrapper
                    name="shortName"
                    getMessage={getMessage}
                    label={getMessage("label_enter_question_short_name")}
                    fullWidth
                    hideCharCount={true}
                  />
                  <Tooltip title={
                    <Typography sx={{ fontSize: '0.9rem' }}>
                      {getMessage("info_shortname_graph_display")}
                    </Typography>
                  }>
                    <IconButton size="small" sx={{ ml: 1, mt: 1.5, color: 'info.main' }}>
                      <InfoIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>

              {/* choose the learning type */}
              <LearningTypeSelector
                  name="learningType"
                  label="label_learning_type"
                  getMessage={getMessage}
                  learningTypes={[LearningType.KNOWLEDGE, LearningType.SKILL, LearningType.ATTITUDE]}
                  sx={{ mb: "15px" }}
                />

              {values.questionType !== QuestionType.TEXT && (
                <OptionsWithAutoSuggestions />
              )}
              
              {values.questionType !== QuestionType.TEXT && (
                /* give the explanation */
                <TextFieldWrapper
                  name="explanation"
                  label="label_give_explanation"
                  getMessage={getMessage}
                  fullWidth
                  multiline
                  rows={5}
                  sx={{ mb: '15px' }}
                />
              )}

              {/* choose the framework */}
              <Box display="flex" alignItems="center" sx={{ mb: "15px" }}>
                <FrameworkSelector
                  name="framework"
                  label="label_choose_framework"
                  getMessage={getMessage}
                  competenceAreas={assessmentType === AssessmentType.STUDENT_LEARNING_OUTCOMES ? studentCompetenceAreas : traineeCompetenceAreas }
                  sx={{ flex: 1 }}
                />
                <Tooltip title={
                  <Typography sx={{ fontSize: '0.9rem' }}>
                    {getMessage("tooltip_framework_selector")}
                  </Typography>
                }>
                  <IconButton size="small" sx={{ ml: 1, color: 'info.main' }}>
                    <InfoIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>

              {/* choose the competencies */}
              <CompetenciesSelector
                getMessage={getMessage}
                competenceAreas={assessmentType === AssessmentType.STUDENT_LEARNING_OUTCOMES ? studentCompetenceAreas : traineeCompetenceAreas }
                getCompetencies={getCompetencies}
                getActivities={getActivities}
                automaticEncoding={automaticEncoding}
                setAutomaticEncoding={setAutomaticEncoding}
                selectedCompetencies={selectedCompetencies}
                setSelectedCompetencies={setSelectedCompetencies}
                handleAutomaticEncodingChange={handleAutomaticEncodingChange}
                handleCompetencyChange={handleCompetencyChange}
                handleDeleteCompetency={handleDeleteCompetency}
                helpWithAI={helpWithAI}
                updateCompetenciesForQuestion={updateCompetenciesForQuestion}
                framework={values.framework}
              />

              </>
            )}

            </>

          ) : (

          helpWithAI && (
            <>
            
            {/* textfield to enter ai instruction */}
            <TextFieldWrapper
              name="data"
              label="instruction_ai_prompt"
              getMessage={getMessage}
              fullWidth
              multiline
              rows={7}
              sx={{ mb: "15px" }}
              placeholder={assessmentType === AssessmentType.STUDENT_LEARNING_OUTCOMES ? 
              getMessage("placeholder_ai_prompt_student") :
              getMessage("placeholder_ai_prompt_learning")
            }></TextFieldWrapper>

            {/* learning type */}
            <LearningTypeSelector
              name="learningType"
              label="label_learning_type"
              getMessage={getMessage}
              learningTypes={[LearningType.KNOWLEDGE, LearningType.SKILL, LearningType.ATTITUDE]}
              sx={{ mb: "15px" }}
            />

            {/* choose framework */}
            <Box display="flex" alignItems="center" sx={{ mb: "15px" }}>
              <FrameworkSelector
                name="framework"
                label="label_choose_framework"
                getMessage={getMessage}
                competenceAreas={assessmentType === AssessmentType.STUDENT_LEARNING_OUTCOMES ? studentCompetenceAreas: traineeCompetenceAreas }
                sx={{ flex: 1 }}
              />
              <Tooltip title={
                <Typography sx={{ fontSize: '0.9rem' }}>
                  {getMessage("tooltip_framework_selector")}
                </Typography>
              }>
                <IconButton size="small" sx={{ ml: 1, color: 'info.main' }}>
                  <InfoIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>

            {/* Wether to automatically encode competencies or not - mandatory if with AI */}
            <FormControlLabel
              control={<Switch 
              checked={automaticEncoding} 
              onChange={(event) => handleAutomaticEncodingChange(values.question, values.shortName, values.framework, event)}
              disabled={helpWithAI} />}
              label={getMessage("label_automatic_encoding_competencies")}
              sx={{mb:"15px"}}
            /> 

            {/* Choose number of question */}
            <ChooseNumberQuestions getMessage={getMessage} />

          </>
        ))}

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}

        {/* Button to submit the form */}
        <Box sx={{mt:"30px"}}>
          <Button
            type="submit"
            variant="contained"
            sx={ buttonStyle }
            disabled={isLoading || hasError}
          >
            {isLoading ? <CircularProgress size={24} /> : <Typography variant="h5">{getMessage("label_add")}</Typography>}

          </Button>
        </Box>

      </Form>
      )}
    </Formik>
  </Box>
</Box>
</>
)};

export default AddLearningQuestions;
