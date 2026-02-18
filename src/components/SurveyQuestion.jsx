import React, {useState, useCallback} from 'react';
import { Box, Button, Radio, Checkbox, FormControl, FormLabel, FormControlLabel, RadioGroup, Typography, TextField, Slider } from '@mui/material';
import { Field } from 'formik';
import TipsAndUpdatesIcon from '@mui/icons-material/TipsAndUpdates';
import draftToHtml from 'draftjs-to-html';
import { useMessageService } from '../services/MessageService';
import { buttonStyle } from './styledComponents';
import MatrixQuestion from './MatrixQuestion';

const SurveyQuestion = ({
  question,
  shortName = "",
  context,
  options,
  fieldName,
  type,
  isMandatory = false,
  competencies = [],
  min = 0,
  max = 10, 
  titleFontSize = '24px',
  optionFontSize = '18px',
  disabled = false,
  correctAnswer = [],
  explanation,
  assessmentType = "",
  displayCorrectAnswer = true,
  onQuestionValidated,
  matrixQuestions = [],
  matrixId,
  matrixPosition,
  matrixTitle,
  viewType = 'default',
}) => {

  const { getMessage } = useMessageService();

  // State for tracking selected answers and their correctness
  const [selectedAnswers, setSelectedAnswers] = useState([]); // Stores user's selected answer(s)
  const [isAnswerCorrect, setIsAnswerCorrect] = useState(null); // Tracks if answer is correct (true/false/null)
  const [isAnswered, setIsAnswered] = useState(false); // Tracks if question has been answered
  const [showExplanation, setShowExplanation] = useState(false); // Controls visibility of explanation
  const [showValidateButton, setShowValidateButton] = useState(false); // Controls visibility of validate button
  const [isValidated, setIsValidated] = useState(false); // Tracks if question has been validated

  const isOptionDisabled = useCallback(() => {
    const assessmentTypesToDisable = ["Learning", "Student learning outcomes"];
    // Return a boolean explicitly
    return Boolean(disabled || (assessmentTypesToDisable.includes(assessmentType) && explanation && showExplanation));
  }, [disabled, assessmentType, showExplanation, explanation]);

  const handleAnswerSelect = useCallback((event, option) => {
    if (!isOptionDisabled()) {
      if (type === "checkbox") {
        // Handle multiple answers
        const updatedAnswers = event.target.checked 
          ? [...selectedAnswers, option.value]
          : selectedAnswers.filter(ans => ans !== option.value);
        
        setSelectedAnswers(updatedAnswers);

            // Check if any selected answer is wrong
            const hasWrongAnswer = updatedAnswers.some(ans => !correctAnswer.includes(ans));
            
            // Check if all correct answers are selected
            const hasAllCorrectAnswers = correctAnswer.length === updatedAnswers.length && 
                correctAnswer.every(ans => updatedAnswers.includes(ans));
            
            setIsAnswerCorrect(hasAllCorrectAnswers);
            
            if (assessmentType === "Learning") {
              if (explanation) {
                  setShowValidateButton(true);
                  setShowExplanation(false);
              } else {
                  setShowExplanation(hasWrongAnswer || hasAllCorrectAnswers);
              }
            }
        } else {
            // Handle single answer
            setSelectedAnswers([option.value]);
            const isCorrect = correctAnswer.includes(option.value);
            setIsAnswerCorrect(isCorrect);
            
            if (assessmentType === "Learning") {
              if (explanation) {
                  setShowValidateButton(true);
                  setShowExplanation(false);
              } else {
                  setShowExplanation(true);
              }
            }
        }
        setIsAnswered(true);
    }
}, [isOptionDisabled, correctAnswer, selectedAnswers, type, assessmentType, explanation]);

  const handleValidateAnswer = useCallback(() => {
    setShowValidateButton(false);
    setShowExplanation(true);
    setIsValidated(true);
    
    // Notify parent component that this question has been validated
    if (onQuestionValidated) {
      onQuestionValidated(fieldName, true);
    }
  }, [onQuestionValidated, fieldName]);

  const isCorrectAnswer = useCallback((option) => {
    if (!displayCorrectAnswer || !correctAnswer) return false;
    return correctAnswer.includes(option.label);
  }, [displayCorrectAnswer, correctAnswer, type]);

  const correctAnswerCreateSurvey = {
    backgroundColor: '#e6ffe6', // Light green background
    borderRadius: '4px',
    padding: '4px 8px',
  };

  const htmlContent = typeof context === 'object' ? draftToHtml(context) : context;

  return (
    <Box margin="20px" display="flex" flexDirection="column" width="95%" maxWidth="95%" alignSelf="center">
      <FormControl component="fieldset" fullWidth disabled={disabled} sx={{ width: '100%' }}>
        <FormLabel sx={{ fontSize: titleFontSize, m: "0px 10px 10px 0px", fontWeight: "bold", width: '100%', wordWrap: 'break-word', overflowWrap: 'break-word', display: 'block' }}>
          {matrixId ? matrixTitle : question}
          {isMandatory && <span style={{ color: 'red' }}> *</span>}
          {disabled && shortName && !matrixId && (
            <>
              {" - "}
              <span style={{ fontStyle: 'italic' }}>{shortName}</span>
            </>
          )}
        </FormLabel>

        {type === "single-text" ? (
          <Box sx={{ fontSize: optionFontSize, mt: 2, width: '100%' }} dangerouslySetInnerHTML={{ __html: htmlContent }} />
        ): matrixId ? (
          <Field name={fieldName}>
            {({ form }) => (
              <MatrixQuestion
                questions={matrixQuestions.length > 0 ? matrixQuestions : [{ label: question, shortName }]}
                options={options}
                fieldName={fieldName}
                selectedAnswers={selectedAnswers}
                questionType={type}
                handleAnswerSelect={(itemIndex, optionValue) => {
                  // Update local state for UI
                  const newSelectedAnswers = [...selectedAnswers];
                  newSelectedAnswers[itemIndex] = optionValue;
                  setSelectedAnswers(newSelectedAnswers);
                  
                  // Update Formik values
                  form.setFieldValue(fieldName, newSelectedAnswers);
                }}
                isOptionDisabled={isOptionDisabled}
                viewType={viewType}
              />
            )}
          </Field>
        ) : type === "radio-unordered" || type === "radio-ordered" ? (
          <RadioGroup 
            aria-label={fieldName} 
            name={fieldName}
            onChange={(event) => handleAnswerSelect(event, event.target.value)}
            sx={{ width: '100%' }}>
            
            {options.map((option, index) => {
              const averageCharsPerLine = 75;
              const estimatedLines = Math.ceil(option.label.length / averageCharsPerLine);

              return (
                <FormControlLabel
                  key={index}
                  value={option.value}
                  control={<Field as={Radio} type="radio" name={fieldName} />}
                  sx={{
                    ...(estimatedLines > 2 && { mb: '15px' }),
                  }}
                  label={
                    <Typography
                      sx={{
                        fontSize: optionFontSize,
                        ...(disabled && correctAnswer && isCorrectAnswer(option) ? correctAnswerCreateSurvey : {}),
                      }}
                    >
                      {option.label}
                    </Typography>
                  }
                  disabled={isOptionDisabled()}
                />
              );
            })}
          </RadioGroup>
        ) : type === "checkbox" ? (
          <Field name={fieldName}>
            {({ form }) => (
              options.map((option, index) => (
                <FormControlLabel
                  key={index}
                  value={option.value}
                  control={
                    <Checkbox 
                      checked={selectedAnswers.includes(option.value)}
                      onChange={(event) => {
                        // Update local state for UI
                        handleAnswerSelect(event, option);
                        
                        // Get current form values
                        const currentValues = form.values[fieldName] || [];
                        
                        // Update Formik values
                        const newValues = event.target.checked
                          ? [...currentValues, option.value]
                          : currentValues.filter(v => v !== option.value);
                        
                        form.setFieldValue(fieldName, newValues);
                      }}
                    />
                  }
                  label={
                    <Typography 
                      sx={{ 
                        fontSize: optionFontSize,
                        ...(disabled && correctAnswer && isCorrectAnswer(option) ? correctAnswerCreateSurvey : {}),
                      }}
                    >
                      {option.label}
                    </Typography>
                  }
                  disabled={isOptionDisabled()}
                />
              ))
            )}
          </Field>
        ) : type === "slider" && (
          <Field name={fieldName}>
            {({ field, form }) => (
              <Slider
                value={field.value || min}
                onChange={(e, newValue) => {
                  form.setFieldValue(field.name, newValue);
                }}
                valueLabelDisplay="auto"
                min={min}
                max={max}
                sx={{ m: "0px 0px 0px 0px"}}
                disabled={disabled}
              />
            )}
          </Field>
        )}

        {type === "text" && (
          <Field
            multiline
            as={TextField}
            name={fieldName}
            sx={{ m: "0px 20px 0px 0px", width: '100%' }}
            disabled={isOptionDisabled()}
            value={disabled ? "" : undefined}
            rows={4}
          />
        )}

        {/* Display validate button for Learning type assessments */}
        {showValidateButton && assessmentType === "Learning" && explanation && (
          <Box display="flex" gap="10px" marginTop="20px">
            <Button 
              variant="contained"
              size="small"
              onClick={handleValidateAnswer}
              sx={buttonStyle}
            >
              {getMessage('label_validate')}
            </Button>
          </Box>
        )}

        {/* Display explanation with color based on answer correctness */}
        <Box display="flex" gap="10px" marginTop="20px">
          {(showExplanation || disabled) && explanation && (
            <Box display="flex" maxWidth="95%">
              <span>
                <Button 
                  variant="outlined"
                  size="small"
                  style={{
                    color: disabled ? "#666666" : (isAnswerCorrect ? "green" : "red"),
                    borderColor: disabled ? "#666666" : (isAnswerCorrect ? "green" : "red"),
                    backgroundColor: "white",  
                    borderRadius: '20px',
                    padding: '5px 10px',
                  }}
                  aria-label="explanation"
                >
                  <TipsAndUpdatesIcon style={{ color: disabled ? "#666666" : (isAnswerCorrect ? "green" : "red"), marginRight: '5px' }} />
                  <Typography style={{ fontSize: optionFontSize, color: disabled ? "#666666" : (isAnswerCorrect ? "green" : "red") }}>
                    {explanation}
                  </Typography>
                </Button>
              </span>
            </Box>
          )}
        </Box>

        <Box display="flex" flexWrap="wrap" gap="10px" marginTop="20px">
          {competencies.map((competency, index) => (
            <Box key={index} display="flex" alignItems="center">
              <Button 
                variant="outlined"
                size="small"
                style={{color: "rgb(102,102,102)", borderColor: "lightgrey", backgroundColor: "white", borderRadius: '20px', padding: '5px 10px',}}>
                <Typography style={{ fontSize: '0.7rem', padding: '0 5px' }}>
                  {competency}
                </Typography>
              </Button>
            </Box>
          ))}
        </Box>

      </FormControl>
    </Box>
  );
};

export default SurveyQuestion;