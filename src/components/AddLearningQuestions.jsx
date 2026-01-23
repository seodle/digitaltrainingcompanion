import "react-draft-wysiwyg/dist/react-draft-wysiwyg.css";
import { Formik, Form, useFormikContext } from "formik";
import React, { useState, useEffect } from "react";
import * as Yup from "yup";
import { Box, Button, Select, MenuItem, InputLabel, Typography, FormControl, FormControlLabel, Switch, Tooltip, IconButton, Alert, CircularProgress } from "@mui/material";
import InfoIcon from '@mui/icons-material/Info';
import { Editor } from "react-draft-wysiwyg";
import { EditorState } from 'draft-js';

import { useLanguage } from '../contexts/LanguageContext';
import { useMessageService } from '../services/MessageService';
import { buttonStyle, toolbarConfig } from '../components/styledComponents'
import { QuestionType, AssessmentType, LearningType } from '../utils/enums';
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

const AddLearningQuestions = ({ setQuestions, questions, assessmentType, workshops, splitWorkshops }) => {

  const { currentUser } = useAuthUser();
  const [response, setResponse] = useState("");
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false); 
  const [helpWithAI, setHelpWithAI] = useState(false);
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

            {!helpWithAI ? (
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

        {/* Button to submit the form */}
        <Box sx={{mt:"30px"}}>
          <Button
            type="submit"
            variant="contained"
            sx={ buttonStyle }
            disabled={isLoading || hasError} // Disable the button when loading or has error
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
