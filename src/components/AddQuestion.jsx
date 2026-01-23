import "react-draft-wysiwyg/dist/react-draft-wysiwyg.css";
import * as Yup from "yup";
import { Formik, Form, FieldArray, useFormikContext } from "formik";
import { Box, TextField, Button, Select, MenuItem, InputLabel, Typography, FormControl, IconButton, Tooltip, CircularProgress, Alert, Switch, FormControlLabel } from "@mui/material";
import DeleteIcon from '@mui/icons-material/Delete';
import InfoIcon from '@mui/icons-material/Info';
import React, { useState, useEffect, useContext } from "react";
import { v4 as uuidv4 } from 'uuid';
import questionConfig from '../assets/questionsConfig.json';
import { buttonStyle, toolbarConfig } from '../components/styledComponents';
import { Editor } from "react-draft-wysiwyg";
import { EditorState, convertToRaw } from 'draft-js';
import draftToHtml from 'draftjs-to-html';
import { QuestionType } from '../utils/enums';
import { useMessageService } from '../services/MessageService';
import QuestionTypeSelector from './QuestionTypeSelector';
import { handleAutoSuggestionsChange, QuestionOptionGenerator } from '../utils/QuestionUtils';
import { useAuthUser } from '../contexts/AuthUserContext';

const AddQuestion = ({ setQuestions, questions, assessmentType, workshops, splitWorkshops }) => {
  const [editorState, setEditorState] = useState(EditorState.createEmpty());
  const [isUploading, setIsUploading ] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [regroupAsMatrix, setRegroupAsMatrix] = useState(false);

  const [autoSuggestionsEnabled, setAutoSuggestionsEnabled] = useState(false);
  const { currentUser } = useAuthUser();
  const { getMessage } = useMessageService();

  const getAddQuestionSchema = (splitWorkshops, questionType) => {
    let schema = {};

    if (questionType === QuestionType.SINGLE_TEXT) {
      schema.question = Yup.string();
      schema.shortName = Yup.string();
    } else if (regroupAsMatrix && isMatrixRegroupableType(questionType)) {
      schema.questions = Yup.array().of(
        Yup.object().shape({
          question: Yup.string()
            .required("The question is required")
            .min(5, "The question must be at least 5 characters long"),
          shortName: Yup.string()
            .required("The short name is required")
            .min(5, "The short name must be at least 5 characters long")
            .max(30, "The short name must be at most 30 characters long")
        })
      );
      schema.matrixTitle = Yup.string()
        .required("Matrix title is required")
        .min(5, "Matrix title must be at least 5 characters long");
    } else {
      schema.question = Yup.string()
        .required("The question is required")
        .min(5, "The question must be at least 5 characters long");
      schema.shortName = Yup.string()
        .required("The short name is required")
        .min(5, "The short name must be at least 5 characters long")
        .max(30, "The short name must be at most 30 characters long");
    }

    if (splitWorkshops) {
      schema.workshopId = Yup.string().required("The section is required");
    }

    return Yup.object().shape(schema);
  };

  const formConfig = questionConfig[assessmentType] || [];

  const initialQuestion = {
    questionId: "",
    question: "",
    shortName: "",
    context: "",
    questionType: QuestionType.SINGLE_TEXT,
    organizationalType: "",
    isMandatory: false,
    workshopId: "",
    options: ["", ""],
    matrixTitle: "",
    correctAnswer: null,
    explanation: null,
    framework: null,
    competencies: null,
    questions: [{ question: "", shortName: "" }]
  };

  const isMatrixRegroupableType = (type) => {
    return [
      QuestionType.RADIO_ORDERED,
      QuestionType.RADIO_UNORDERED,
      QuestionType.CHECKBOX
    ].includes(type);
  };

  const handleSubmit = (values, { resetForm }) => {
    const newQuestionId = questions.reduce((maxId, question) => 
      Math.max(maxId, parseInt(question.questionId, 10)), 0) + 1;
    let editorContent = draftToHtml(convertToRaw(editorState.getCurrentContent()));
    
    // Handle workshopId when linking to existing workshop
    let workshopId = null;
  
    
    if (splitWorkshops && values.workshopId) {
      // values.workshopId holds the selected workshop _id
      const selectedWorkshop = workshops.find(w => w._id === values.workshopId);
      if (selectedWorkshop) {
        workshopId = selectedWorkshop._id;
      } 
    }

    const newQuestion = {
      ...values,
      questionId: newQuestionId.toString(),
      context: editorContent,
      workshopId: workshopId,
      options: values.questionType === QuestionType.TEXT || values.questionType === QuestionType.SINGLE_TEXT
        ? []
        : values.options.map((option, index) => ({
            value: `${index + 1}`,
            label: option
          }))
    };

    if (regroupAsMatrix && isMatrixRegroupableType(values.questionType)) {
      // Add matrix properties to the base question
      const matrixId = uuidv4();
      newQuestion.matrixId = matrixId;
      newQuestion.matrixTitle = values.matrixTitle;
      newQuestion.matrixPosition = 0;

      // Create all matrix questions using the base question
      const newQuestions = values.questions.map((questionData, index) => {
        // Generate a new unique ID for each matrix question
        const matrixQuestionId = (parseInt(newQuestion.questionId) + index).toString();
        return {
          ...newQuestion,
          questionId: matrixQuestionId,
          question: questionData.question,
          shortName: questionData.shortName,
          matrixPosition: index,
          // Remove context for matrix questions as it's not needed
          context: undefined
        };
      });

      setQuestions(prevQuestions => [...prevQuestions, ...newQuestions]);
    } else {
      setQuestions(prevQuestions => [...prevQuestions, newQuestion]);
    }

    resetForm({
      values: {
        ...initialQuestion,
        questionType: values.questionType,
        options: values.options,
      }
    });
    setEditorState(EditorState.createEmpty());
    setUploadError(null);
    setRegroupAsMatrix(false);
    setAutoSuggestionsEnabled(false);
  };

  return (
    <Box p={2} m={2}>
      <Formik
        initialValues={initialQuestion}
        validationSchema={Yup.lazy(values => getAddQuestionSchema(splitWorkshops, values.questionType))}
        onSubmit={handleSubmit}
      >
        {({ values, errors, touched, handleChange, handleBlur }) => (
          <Form>
            {splitWorkshops && (
              <FormControl fullWidth margin="normal" error={touched.workshopId && Boolean(errors.workshopId)}>
                <InputLabel id="workshop-label">
                  {getMessage("label_choose_workshop")}
                </InputLabel>
                <Select
                  labelId="workshop-label"
                  id="workshopId"
                  name="workshopId"
                  value={values.workshopId || ""}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  label={getMessage("label_choose_workshop")}
                >
                  {workshops.map((workshop) => (
                    <MenuItem key={workshop._id} value={workshop._id}>
                      {workshop.label}
                    </MenuItem>
                  ))}
                </Select>
                {touched.workshopId && errors.workshopId && 
                  <Typography variant="caption" color="error" sx={{ mt: 0 }}>{errors.workshopId}</Typography>
                }
              </FormControl>
            )}

            {values.questionType === QuestionType.SINGLE_TEXT ? (
              <>
                {formConfig
                  .filter(field => field.type !== 'question' && field.type !== 'shortName')
                  .map((field, index) => {
                    switch (field.type) {
                      case 'FormControl':
                        if (field.id === "questionType") {
                          return (
                            <QuestionTypeSelector
                              key={index}
                              name="questionType"
                              label="label_choose_question_type"
                              getMessage={getMessage}
                              sx={{ mb: "15px", mt: "15px" }}
                              optionsTypes={field.options}
                            />
                          );
                        }
                        return null;

                      case 'SingleText':
                        return (
                          <Box key={index} margin="normal">
                            <Box 
                              border={1} 
                              borderColor={uploadError ? "error.main" : "grey.400"} 
                              p={2} 
                              borderRadius={1}
                            >
                              <Editor
                                editorState={editorState}
                                toolbarClassName="toolbarClassName"
                                wrapperClassName="wrapperClassName"
                                editorClassName="editorClassName"
                                onEditorStateChange={setEditorState}
                                toolbar={toolbarConfig}
                              />
                            </Box>
                            {isUploading && (
                              <Typography color="info.main" sx={{ mt: 1 }}>
                                {getMessage("label_uploading_image")}
                              </Typography>
                            )}
                            {uploadError && (
                              <Typography color="error" sx={{ mt: 1 }}>
                                {uploadError}
                              </Typography>
                            )}
                          </Box>
                        );

                      default:
                        return null;
                    }
                  })}
              </>
            ) : (
              <>
                {(!regroupAsMatrix) && (
                  formConfig.map((field, index) => {
                    switch (field.type) {
                      case 'TextField':
                        if (field.name === 'shortName') {
                          return (
                            <Box key={index} display="flex" flexDirection="column" sx={{ mb: '10px' }}>
                              <Box display="flex" alignItems="flex-start">
                                <TextField
                                  fullWidth
                                  margin="normal"
                                  id={field.id}
                                  name={field.name}
                                  label={field.label}
                                  value={values[field.name]}
                                  onChange={handleChange}
                                  onBlur={handleBlur}
                                  error={touched[field.id] && Boolean(errors[field.id])}
                                  helperText={touched[field.id] && errors[field.id]}
                                />
                                <Tooltip title={
                                  <Typography sx={{ fontSize: '0.9rem' }}>
                                    {getMessage("info_shortname_graph_display")}
                                  </Typography>
                                }>
                                  <IconButton size="small" sx={{ ml: 1, mt: 3, color: 'info.main' }}>
                                    <InfoIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </Box>
                            </Box>
                          );
                        }
                        return (
                          <TextField
                            key={index}
                            fullWidth
                            margin="normal"
                            id={field.id}
                            name={field.name}
                            label={field.label}
                            value={values[field.name]}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            error={touched[field.id] && Boolean(errors[field.id])}
                            helperText={touched[field.id] && errors[field.id]}
                          />
                        );

                      case 'FormControl':
                        return (
                          <Box key={index}>
                            <QuestionTypeSelector
                              name={field.id}
                              label={getMessage(field.label)}
                              getMessage={getMessage}
                              sx={{ mb: "15px", mt: "15px" }}
                              optionsTypes={field.options}
                            />
                            {values.questionType && isMatrixRegroupableType(values.questionType) && (
                              <FormControlLabel
                                key={`switch-${index}`}
                                control={
                                  <Switch
                                    checked={regroupAsMatrix}
                                    onChange={(e) => setRegroupAsMatrix(e.target.checked)}
                                    color="primary"
                                  />
                                }
                                label={getMessage("label_regroup_as_matrix")}
                              />
                            )}
                          </Box>
                        );
                      default:
                        return null;
                    }
                  })
                )}

                {(regroupAsMatrix && isMatrixRegroupableType(values.questionType)) && (
                  <>
                    {formConfig.map((field, index) => {
                      if (field.type === 'FormControl') {
                        return (
                          <Box key={index}>
                            <QuestionTypeSelector
                              name={field.id}
                              label={getMessage(field.label)}
                              getMessage={getMessage}
                              sx={{ mb: "15px", mt: "15px" }}
                              optionsTypes={field.options}
                            />
                            {values.questionType && isMatrixRegroupableType(values.questionType) && (
                              <FormControlLabel
                                key={`switch-${index}`}
                                control={
                                  <Switch
                                    checked={regroupAsMatrix}
                                    onChange={(e) => setRegroupAsMatrix(e.target.checked)}
                                    color="primary"
                                  />
                                }
                                label={getMessage("label_regroup_as_matrix")}
                              />
                            )}
                          </Box>
                        );
                      }
                      return null;
                    })}
                    <TextField
                        fullWidth
                        id="matrixTitle"
                        name="matrixTitle"
                        label={getMessage("label_matrix_title")}
                        value={values.matrixTitle}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={touched.matrixTitle && Boolean(errors.matrixTitle)}
                        helperText={touched.matrixTitle && errors.matrixTitle}
                        sx={{ marginTop: '16px' }}
                    />
                    <FieldArray name="questions">
                      {({ push, remove }) => (
                        <Box>
                          {values.questions?.map((_, index) => (
                            <Box key={index} sx={{ mt: 3 }}>
                              <Box display="flex" alignItems="flex-start">
                                <TextField
                                  fullWidth
                                  name={`questions.${index}.question`}
                                  label={getMessage("label_enter_question") + " " + (index + 1)}
                                  value={values.questions[index]?.question || ""}
                                  onChange={handleChange}
                                  onBlur={handleBlur}
                                  error={touched.questions?.[index]?.question && Boolean(errors.questions?.[index]?.question)}
                                  helperText={touched.questions?.[index]?.question && errors.questions?.[index]?.question}
                                />
                              </Box>
                              <Box display="flex" alignItems="flex-start" sx={{ mt: '10px', mb: '16px' }}>
                                <TextField
                                  fullWidth
                                  name={`questions.${index}.shortName`}
                                  label={getMessage("label_enter_question_short_name") + " " + (index + 1)}
                                  value={values.questions[index]?.shortName || ""}
                                  onChange={handleChange}
                                  onBlur={handleBlur}
                                  error={touched.questions?.[index]?.shortName && Boolean(errors.questions?.[index]?.shortName)}
                                  helperText={touched.questions?.[index]?.shortName && errors.questions?.[index]?.shortName}
                                />
                                <Tooltip title={
                                  <Typography sx={{ fontSize: '0.9rem' }}>
                                    {getMessage("info_shortname_graph_display")}
                                  </Typography>
                                }>
                                  <IconButton size="small" sx={{ ml: 1, mt: 3, color: 'info.main' }}>
                                    <InfoIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                <IconButton
                                  onClick={() => remove(index)}
                                  sx={{ ml: 1, mt: 3 }}
                                >
                                  <DeleteIcon />
                                </IconButton>
                              </Box>
                            </Box>
                          ))}
                          <Button 
                            onClick={() => push({ question: "", shortName: "" })} 
                            variant="contained" 
                            sx={{ ...buttonStyle, mt: -1 }}
                          >
                            {getMessage("label_add_matrix_question")}
                          </Button>
                        </Box>
                      )}
                    </FieldArray>
                  </>
                )}
              </>
            )}

            {values.questionType !== QuestionType.TEXT && 
             values.questionType !== QuestionType.SINGLE_TEXT && (
              <>
                {/* Ajouter le composant de génération d'options avec le flag auto-suggestions */}
                <QuestionOptionGenerator 
                  autoSuggestionsEnabled={autoSuggestionsEnabled}
                  questionText={regroupAsMatrix && isMatrixRegroupableType(values.questionType) && values.questions && values.questions[0] 
                    ? values.questions[0].question 
                    : values.question}
                />

                <FormControlLabel
                  control={
                    <Switch
                      checked={autoSuggestionsEnabled}
                      onChange={(e) => handleAutoSuggestionsChange(e, setAutoSuggestionsEnabled)}
                      name="autoSuggestions"
                      color="primary"
                      disabled={currentUser?.sandbox}
                    />
                  }
                  label={getMessage("label_auto_suggestions")}
                  sx={{ mt: 5 }}
                />
                {currentUser?.sandbox && (
                  <Alert severity="info" sx={{ mt: 1 }}>
                    {getMessage("sandbox_user_ai_restriction")}
                  </Alert>
                )}

                <FieldArray name="options">
                  {({ remove, push }) => (
                    <Box>
                      <Box display="flex" alignItems="center">
                        <Typography mt="16px" mb="16px" variant="h4">{getMessage('label_options')}</Typography>
                      </Box>

                      {values.options.map((option, index) => (
                        <Box key={index} display="flex" alignItems="center" sx={{ mb: '15px' }}>
                          <TextField
                            fullWidth
                            multiline
                            name={`options.${index}`}
                            label={`${getMessage("label_option")} ${index + 1}`}
                            value={option}
                            onChange={handleChange}
                            onBlur={handleBlur}
                          />
                          <IconButton 
                            onClick={() => remove(index)}
                            disabled={values.options.length <= 2}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      ))}
                      <Box display="flex" alignItems="center">
                        <Button 
                          onClick={() => push('')} 
                          variant="contained" 
                          sx={buttonStyle}
                        >
                          {getMessage("label_add_option")}
                        </Button>
                      </Box>
                    </Box>
                  )}
                </FieldArray>
              </>
            )}

            <Button 
              type="submit" 
              variant="contained" 
              sx={{ ...buttonStyle, mt: 2 }}
              disabled={isUploading}
            >
              {getMessage("label_submit")}
            </Button>
          </Form>
        )}
      </Formik>
    </Box>
  );
};

export default AddQuestion;