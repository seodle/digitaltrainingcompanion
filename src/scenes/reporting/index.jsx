import React, { useState, useEffect, useCallback } from 'react';
import { Box, Button, Typography, TextField } from '@mui/material';
import axios from 'axios';
import { useLocation } from 'react-router-dom';
import { Formik, Form } from 'formik';
import { BACKEND_URL } from "../../config";
import logo_dtc from "../../assets/medias/logo.svg";
import MatrixQuestion from "../../components/MatrixQuestion";
import { getMatrixQuestions } from '../../utils/matrixUtils';
import { groupQuestionsByWorkshop, getWorkshopDetailsById } from '../../utils/SurveyUtils';

const Reporting = () => {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const monitoring = params.get('monitoring');
  const user = params.get('user');
  const sandbox = params.get('sandbox');
  const isLinked = params.get('link') === 'true';
  const [displayName, setDisplayName] = useState('');
  const [nameSubmitted, setNameSubmitted] = useState(false);
  const [codeValidated, setCodeValidated] = useState(false);
  const [authorizationCode, setAuthorizationCode] = useState('');
  const [codeError, setCodeError] = useState('');
  const [assessmentName, setAssessmentName] = useState('');
  const [surveyData, setSurveyData] = useState([]);
  const [responseId, setResponseId] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [currentAssessmentId, setCurrentAssessmentId] = useState('');
  const [currentTextAnswer, setCurrentTextAnswer] = useState('');
  const [selectedChoices, setSelectedChoices] = useState([]);
  const [surveyCompleted, setSurveyCompleted] = useState(false);
  const [loading, setLoading] = useState(false);
  const assessmentIds = params.getAll('assessment[]');
  const [linkingIDValidated, setLinkingIDValidated] = useState(!isLinked);
  const [linkingCode, setLinkingCode] = useState('');
  const [isCodeValid, setIsCodeValid] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isNavigatingBackward, setIsNavigatingBackward] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentQuestionIndex]);

  const generateUniqueAlphanumericCode = () => {
    const concatenatedIds = assessmentIds.sort().join('');
    let checksum = 0;
    for (let i = 0; i < concatenatedIds.length; i++) {
      checksum = (checksum * 31 + concatenatedIds.charCodeAt(i)) & 0xFFFFFFFF;
    }
    const base36String = (checksum >>> 0).toString(36).toUpperCase();
    return base36String.padEnd(6, base36String).slice(0, 6);
  };

  const validateCode = () => {
    const expectedCode = generateUniqueAlphanumericCode();
    if (authorizationCode === expectedCode) {
      setCodeValidated(true);
      setCodeError('');
    } else {
      setCodeError('Wrong code');
    }
  };

  const fetchSurveyData = useCallback(async () => {
    try {
      let allAssessmentData = [];

      for (const assessmentId of assessmentIds) {
        const response = await axios.get(`${BACKEND_URL}/survey`, {
          params: {
            currentAssessmentServerId: assessmentId,
            currentMonitoringServerId: monitoring,
            sandbox: sandbox,
          }
        });

        const { survey, name, type, workshops } = response.data;

        // Order questions by workshops and then by questionId
        let orderedSurvey = [];
        if (workshops.length > 0) {
          const orderedWorkshops = groupQuestionsByWorkshop(workshops, survey);
          orderedSurvey = orderedWorkshops.flatMap(w => (w.questions || []));
        } else {
          orderedSurvey = survey || [];
        }

        const updatedSurvey = orderedSurvey.map(question => ({
          ...question,
          assessmentId,
          assessmentName: name,
          assessmentType: type,
          assessmentWorkshops: workshops || []
        }));

        allAssessmentData.push(...updatedSurvey);
      }

      setSurveyData(allAssessmentData);
    } catch (error) {
      console.error('Error fetching survey data:', error);
    }
  }, [assessmentIds, monitoring, sandbox]);

  useEffect(() => {
    if (codeValidated) {
      fetchSurveyData();
    }
  }, [codeValidated]);

  useEffect(() => {
    if (surveyData.length > 0) {
      const newAssessmentId = surveyData[currentQuestionIndex]?.assessmentId;
      if (newAssessmentId !== currentAssessmentId) {
        setCurrentAssessmentId(newAssessmentId);
        setAssessmentName(surveyData[currentQuestionIndex].assessmentName);
        setResponseId(null);
      }
    }
  }, [currentQuestionIndex, surveyData, currentAssessmentId]);

  const currentQuestion = surveyData[currentQuestionIndex];
  const currentAssessmentType = currentQuestion?.assessmentType;

  const currentWorkshopLabel = (() => {
    const details = getWorkshopDetailsById(currentQuestion?.assessmentWorkshops || [], currentQuestion?.workshopId);
    return details?.label || '';
  })();

  // Helper function to get matrix questions for a given matrixId
  const getMatrixQuestionsForSurvey = useCallback((matrixId) => {
    return getMatrixQuestions(matrixId, surveyData);
  }, [surveyData]);

  const submitAnswer = async (questionId, answer, matrixRowIndex = null) => {
    if (!currentAssessmentId) {
      console.error('No current assessment ID available.');
      return;
    }

    let updatedSurveyData;

    if (currentQuestion.matrixId) {
      // This is a matrix question - distribute answers to all questions in the matrix
      updatedSurveyData = surveyData.map(question => {
        if (question.matrixId === currentQuestion.matrixId) {
          // This is a question in the same matrix
          const matrixPosition = question.matrixPosition;
          let responseValue;
          
          // Extract the specific answer for this matrix position
          const specificAnswer = answer[matrixPosition];
          
          if (currentQuestion.questionType === "checkbox") {
            // For checkbox questions, the answer might be an array
            if (Array.isArray(specificAnswer)) {
              responseValue = specificAnswer; // Already an array
            } else {
              responseValue = [specificAnswer]; // Wrap in array
            }
          } else {
            // For non-checkbox questions
            responseValue = [specificAnswer]; // Wrap in array
          }
          
          return {
            ...question,
            response: responseValue,
            linkingId: linkingCode
          };
        }
        return question;
      });
    } else {
      // Non-matrix question
      if (currentQuestion.questionType === "checkbox") {
        updatedSurveyData = surveyData.map(question => {
          if (question.questionId === questionId) {
            const response = Array.isArray(answer) ? answer.flat() : [answer];
            return {
              ...question,
              response: response,
              linkingId: linkingCode
            };
          }
          return question;
        });
      } else {
        updatedSurveyData = surveyData.map(question => {
          if (question.questionId === questionId) {
            const response = [answer];
            return {
              ...question,
              response: response,
              linkingId: linkingCode
            };
          }
          return question;
        });
      }
    }

    const filteredResponses = updatedSurveyData
      .filter(question => question.assessmentId === currentAssessmentId)
      .map(question => ({
        ...question,
        response: question.response,
        linkingId: linkingCode // Ensure linking code is included for each question
      }));

    const responseData = {
      userId: user,
      assessmentId: currentAssessmentId,
      monitoringId: monitoring,
      assessmentType: currentAssessmentType,
      survey: filteredResponses,
      sandbox: sandbox,
      displayName: displayName || 'Anonymous',
      linkingId: linkingCode // Include linking code at the root level too
    };

    try {
      setLoading(true);
      if (!responseId) {
        const response = await axios.post(`${BACKEND_URL}/response`, responseData);
        if (response.data.success) {
          setResponseId(response.data.id);
          return true; 
        }
      } else {
        // For matrix questions, update each question individually
        if (currentQuestion.matrixId) {
          // Update each matrix question individually
          const matrixQuestions = surveyData.filter(q => q.matrixId === currentQuestion.matrixId);
          let allSuccess = true;
          
          for (const question of matrixQuestions) {
            const matrixPosition = question.matrixPosition;
            const specificAnswer = answer[matrixPosition];
            let questionAnswer;
            
            if (currentQuestion.questionType === "checkbox") {
              questionAnswer = Array.isArray(specificAnswer) ? specificAnswer : [specificAnswer];
            } else {
              questionAnswer = specificAnswer;
            }
            
            try {
              const response = await axios.put(`${BACKEND_URL}/response`, {
                id: responseId,
                questionId: question.questionId,
                answer: questionAnswer,
                linkingId: linkingCode,
                sandbox: sandbox
              });
              
              if (!response.data.success) {
                allSuccess = false;
                break;
              }
            } catch (error) {
              console.error(`Error updating matrix question ${question.questionId}:`, error);
              allSuccess = false;
              break;
            }
          }
          
          if (allSuccess) {
            return true;
          }
        } else {
          const response = await axios.put(`${BACKEND_URL}/response`, {
            id: responseId,
            questionId: questionId,
            answer: currentQuestion.questionType === "checkbox" ? answer.flat() : answer,
            linkingId: linkingCode,
            sandbox: sandbox
          });
          if (response.data.success) {
            return true; 
          }
        }
      }
    } catch (error) {
      console.error(`Error submitting answer for question ${questionId} in assessment ID ${currentAssessmentId}:`, error);
    } finally {
      setLoading(false); 
    }
    return false;
  };

  // Helper function to navigate after matrix questions
  const navigateAfterMatrix = () => {
    if (currentQuestion?.matrixId) {
      setIsNavigatingBackward(false);
      const matrixQuestions = getMatrixQuestionsForSurvey(currentQuestion.matrixId);
      const nextQuestionIndex = currentQuestionIndex + matrixQuestions.length;
      
      if (nextQuestionIndex < surveyData.length) {
        setCurrentQuestionIndex(nextQuestionIndex);
      } else {
        setSurveyCompleted(true);
      }
      return true; // Indicates matrix navigation was handled
    }
    return false; // Indicates no matrix navigation needed
  };

  const handleAnswerClick = async (questionId, answer) => {
    if (loading) return;

    const success = await submitAnswer(questionId, answer);
    if (success) {
      setIsNavigatingBackward(false);
      // For matrix questions, skip to the next question after the matrix
      if (!navigateAfterMatrix()) {
        // Normal navigation for non-matrix questions
        if (currentQuestionIndex < surveyData.length - 1) {
          setCurrentQuestionIndex(prevIndex => prevIndex + 1);
        } else {
          setSurveyCompleted(true);
        }
      }
    }
  };

  const handleTextSubmit = async (questionId) => {
    if (loading) return;

    const success = await submitAnswer(questionId, currentTextAnswer);
    if (success) {
      setIsNavigatingBackward(false);
      if (currentQuestionIndex < surveyData.length - 1) {
        setCurrentQuestionIndex((prevIndex) => prevIndex + 1);
      } else {
        setSurveyCompleted(true);
      }
    }
    setCurrentTextAnswer('');
  };

  const handleCheckboxSubmit = async (questionId) => {
    if (loading) return;

    const success = await submitAnswer(questionId, selectedChoices);
    if (success) {
      setIsNavigatingBackward(false);
      // For matrix questions, skip to the next question after the matrix
      if (!navigateAfterMatrix()) {
        // Normal navigation for non-matrix questions
        if (currentQuestionIndex < surveyData.length - 1) {
          setCurrentQuestionIndex(prevIndex => prevIndex + 1);
        } else {
          setSurveyCompleted(true);
        }
      }
    }
    setSelectedChoices([]);
  };

  const handleMatrixAnswerSelect = (itemIndex, optionValue, setFieldValue) => {
    // Update the survey data for ALL matrix questions, not just the current one
    setSurveyData(prevData => prevData.map(question => {
      if (question.matrixId === currentQuestion.matrixId) {
        // This is a question in the same matrix
        if (question.matrixPosition === itemIndex) {
          // This is the specific question for this row
          let newResponse;
          if (currentQuestion.questionType === "checkbox") {
            // For checkbox questions, optionValue is already an array
            newResponse = Array.isArray(optionValue) ? optionValue : [optionValue];
          } else {
            // For radio questions, optionValue is a single value
            newResponse = [optionValue];
          }
          return {
            ...question,
            response: newResponse
          };
        }
      }
      return question;
    }));
    
    // Also update Formik field value - build the complete matrix response
    const matrixQuestions = getMatrixQuestionsForSurvey(currentQuestion.matrixId);
    const updatedMatrixResponse = matrixQuestions.map((q, index) => {
      if (index === itemIndex) {
        return optionValue;
      } else {
        // Get existing response for this matrix position
        const questionWithResponse = surveyData.find(sq => sq.questionId === q.questionId);
        const existingResponse = questionWithResponse?.response || [];
        return currentQuestion.questionType === "checkbox" ? existingResponse : (Array.isArray(existingResponse) ? existingResponse[0] : existingResponse);
      }
    });
    
    setFieldValue(`q${currentQuestion.questionId}`, updatedMatrixResponse);
  };

  const handleCheckboxSelection = (choice, event) => {
    event.currentTarget.blur();
    setSelectedChoices(prevChoices => {
      if (prevChoices.includes(choice)) {
        return prevChoices.filter(selected => selected !== choice);
      } else {
        return [...prevChoices, choice];
      }
    });
  };

  const handleSkipClick = async () => {
    if (loading) return;

    setIsNavigatingBackward(false);

    // Check if current question is of type "single-text" and skip it
    if (currentQuestion?.questionType === "single-text") {
      if (currentQuestionIndex < surveyData.length - 1) {
        setCurrentQuestionIndex(prevIndex => prevIndex + 1);
        // Recursively call handleSkipClick if the next question is also "single-text"
        const nextQuestion = surveyData[currentQuestionIndex + 1];
        if (nextQuestion?.questionType === "single-text") {
          handleSkipClick();
        }
      } else {
        setSurveyCompleted(true);
      }
      return;
    }

    // For matrix questions, skip to the next question after the matrix
    if (currentQuestion?.matrixId) {
      const matrixQuestions = getMatrixQuestionsForSurvey(currentQuestion.matrixId);
      const nextQuestionIndex = currentQuestionIndex + matrixQuestions.length;
      
      if (nextQuestionIndex < surveyData.length) {
        setCurrentQuestionIndex(nextQuestionIndex);
      } else {
        setSurveyCompleted(true);
      }
      return;
    }

    // Normal skip behavior for other question types
    if (currentQuestionIndex < surveyData.length - 1) {
      setCurrentQuestionIndex(prevIndex => prevIndex + 1);
    } else {
      setSurveyCompleted(true);
    }
  };

  const handleBackClick = () => {
    if (loading) return;

    setIsNavigatingBackward(true);

    // For matrix questions, go back to the question before the matrix
    if (currentQuestion?.matrixId) {
      const matrixQuestions = getMatrixQuestionsForSurvey(currentQuestion.matrixId);
      const prevQuestionIndex = currentQuestionIndex - matrixQuestions.length;
      
      if (prevQuestionIndex >= 0) {
        setCurrentQuestionIndex(prevQuestionIndex);
      }
      return;
    }

    // Check if the previous question is part of a matrix
    if (currentQuestionIndex > 0) {
      const prevQuestion = surveyData[currentQuestionIndex - 1];
      
      if (prevQuestion?.matrixId) {
        // Find the first question of this matrix group
        const matrixQuestions = getMatrixQuestionsForSurvey(prevQuestion.matrixId);
        const firstMatrixQuestionIndex = currentQuestionIndex - 1 - (prevQuestion.matrixPosition || 0);
        
        if (firstMatrixQuestionIndex >= 0) {
          setCurrentQuestionIndex(firstMatrixQuestionIndex);
        } else {
          setCurrentQuestionIndex(0);
        }
      } else {
        setCurrentQuestionIndex(prevIndex => prevIndex - 1);
      }
    }
  };

  // Skip matrix questions that are not the first one in their group
  useEffect(() => {
    if (codeValidated && nameSubmitted && surveyData.length > 0 && currentQuestion && !isNavigatingBackward) {
      if (currentQuestion.matrixId && currentQuestion.matrixPosition !== 0) {
        // Skip to the next question after the matrix
        const matrixQuestions = getMatrixQuestionsForSurvey(currentQuestion.matrixId);
        const nextQuestionIndex = currentQuestionIndex + matrixQuestions.length;
        
        if (nextQuestionIndex < surveyData.length) {
          setCurrentQuestionIndex(nextQuestionIndex);
        } else {
          setSurveyCompleted(true);
        }
      }
    }
    // Reset the backward navigation flag after processing
    if (isNavigatingBackward) {
      setIsNavigatingBackward(false);
    }
  }, [currentQuestionIndex, surveyData, codeValidated, nameSubmitted, currentQuestion, getMatrixQuestionsForSurvey, isNavigatingBackward]);

  // Skip "single-text" questions when they first appear
  useEffect(() => {
    if (codeValidated && nameSubmitted && surveyData.length > 0) {
      if (currentQuestion?.questionType === "single-text") {
        handleSkipClick();
      }
    }
  }, [currentQuestionIndex, surveyData, codeValidated, nameSubmitted]);

  const handleRestartSurvey = () => {
    console.log('Restart Survey - isLinked:', isLinked, 'link param:', params.get('link'));
    setCurrentQuestionIndex(0);
    setResponseId(null);
    setSurveyCompleted(false);
    setCurrentTextAnswer('');
    setSelectedChoices([]);
    setNameSubmitted(false); 
    setDisplayName('');
    setLinkingIDValidated(!isLinked);
    setLinkingCode('');
    setIsCodeValid(false);
    setIsNavigatingBackward(false);
    console.log('Setting linkingIDValidated to:', !isLinked);
    
    // Clear all responses from survey data
    setSurveyData(prevData => prevData.map(question => ({
      ...question,
      response: []
    })));
  };

  const handleGenerateCode = () => {
    const consonantPool = "BCDFGHJKLMNPRSTVWXYZ";
    const vowelPool = "AEIOU";
    const allChars = consonantPool + vowelPool;

    let code = "";
    while (code.split("").filter(c => consonantPool.includes(c)).length < 4 ||
           code.split("").filter(c => vowelPool.includes(c)).length < 4) {
      code = "";
      for (let i = 0; i < 8; i++) {
        code += allChars[Math.floor(Math.random() * allChars.length)];
      }
    }

    setLinkingCode(code.toUpperCase());
    setIsCodeValid(true);
  };

  const handleLinkingCodeChange = (e) => {
    const code = e.target.value.toUpperCase();
    setLinkingCode(code);
    setIsCodeValid(code.length > 0);
    setErrorMessage(code.length === 0 ? "Please enter a linking code." : '');
  };

  const handleSubmitName = (event) => {
    event.preventDefault();
    setNameSubmitted(true);
  };

  return (
    <>
      {!codeValidated ? (
        <Box m="20px" display="flex" alignItems="center" justifyContent="center" flexDirection="column" sx={{ width: '100%', maxWidth: '400px', mx: 'auto' }}>
          <Box>
            <img alt="Logo" width="100%" height="100%" src={logo_dtc} style={{ cursor: 'pointer', borderRadius: '0%' }} />
          </Box>
          <Typography variant="h3" mt="100px" mb="10px">Enter your code</Typography>
          <Typography variant="h6" mb="10px">The code is below the QR code in My Monitorings page</Typography>
          <TextField
            variant="outlined"
            value={authorizationCode}
            onChange={(e) => setAuthorizationCode(e.target.value.toUpperCase())}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                validateCode();
              }
            }}
            inputProps={{
              maxLength: 6,
              style: {
                letterSpacing: '0.5em',
                textAlign: 'center',
                fontSize: '2rem',
                textTransform: 'uppercase'
              }
            }}
            sx={{
              width: '300px',
              mb: 2,
              '& .MuiOutlinedInput-root': {
                backgroundImage: 'url("data:image/svg+xml,<svg xmlns=\\"http://www.w3.org/2000/svg\\" width=\\"300\\" height=\\"24\\"><line x1=\\"0\\" y1=\\"20\\" x2=\\"100%\\" y2=\\"20\\" stroke=\\"#000\\" stroke-width=\\"2\\" stroke-dasharray=\\"6,6\\"/></svg>")',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'center',
              },
              '& input': {
                textAlign: 'center',
                fontWeight: 'bold',
                backgroundColor: 'transparent'
              }
            }}
          />
          {codeError && (
            <Typography variant="body2" color="error" mb="10px">{codeError}</Typography>
          )}
          <Button
            type="submit"
            variant="contained"
            onClick={validateCode}
            sx={{
              backgroundColor: '#F7941E',
              borderRadius: '50px',
              color: 'black',
              '&:hover': { backgroundColor: '#D17A1D' }
            }}
          >
            VALIDATE
          </Button>
        </Box>
      ) : !linkingIDValidated ? (
        <Box m="20px" display="flex" alignItems="center" justifyContent="center" flexDirection="column" sx={{ width: '100%', maxWidth: '400px', mx: 'auto' }}>
          <Box>
            <img alt="Logo" width="100%" height="100%" src={logo_dtc} style={{ cursor: 'pointer', borderRadius: '0%' }} />
          </Box>
          <Typography variant="h3" mt="100px" mb="10px">Enter a linking code</Typography>
          <TextField
            variant="outlined"
            value={linkingCode}
            onChange={handleLinkingCodeChange}
            error={!!errorMessage}
            helperText={errorMessage}
            inputProps={{
              maxLength: 8,
              style: {
                letterSpacing: '0.5em',
                textAlign: 'center',
                fontSize: '2rem',
                textTransform: 'uppercase'
              }
            }}
            sx={{
              width: '300px',
              mb: 2,
              '& .MuiOutlinedInput-root': {
                backgroundImage: 'url("data:image/svg+xml,<svg xmlns=\\"http://www.w3.org/2000/svg\\" width=\\"300\\" height=\\"24\\"><line x1=\\"0\\" y1=\\"20\\" x2=\\"100%\\" y2=\\"20\\" stroke=\\"#000\\" stroke-width=\\"2\\" stroke-dasharray=\\"6,6\\"/></svg>")',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'center',
              },
              '& input': {
                textAlign: 'center',
                fontWeight: 'bold',
                backgroundColor: 'transparent'
              }
            }}
          />
          <Button
            type="submit"
            variant="contained"
            disabled={!isCodeValid}
            onClick={() => setLinkingIDValidated(true)}
            sx={{
              backgroundColor: '#F7941E',
              borderRadius: '50px',
              color: 'black',
              '&:hover': { backgroundColor: '#D17A1D' }
            }}
          >
            Validate Linking Code
          </Button>
          <Typography variant="body1" mt="20px" mb="10px">or</Typography>
          <Button
            type="submit"
            variant="contained"
            onClick={handleGenerateCode}
            sx={{
              backgroundColor: '#F7941E',
              borderRadius: '50px',
              color: 'black',
              '&:hover': { backgroundColor: '#D17A1D' }
            }}
          >
            Generate Linking Code
          </Button>
        </Box>
      ) : !nameSubmitted ? (
        <Box m="20px" display="flex" alignItems="center" justifyContent="center" flexDirection="column" sx={{ width: '100%', maxWidth: '400px', mx: 'auto' }}>
          <Box>
            <img alt="Logo" width="100%" height="100%" src={logo_dtc} style={{ cursor: 'pointer', borderRadius: '0%' }} />
          </Box>
          <Typography variant="h3" mt="50px" mb="20px">Enter the name (optional)</Typography>
          <form onSubmit={handleSubmitName} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
            <TextField
              variant="outlined"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              sx={{ width: '300px', maxWidth: '500px', mb: 2 }}
              inputProps={{
                maxLength: 30,
                style: {
                  letterSpacing: '0.5em',
                  textAlign: 'center',
                  fontSize: '2rem',
                  textTransform: 'uppercase'
                }
              }}
            />
            <Button 
              type="submit" 
              variant="contained"
              sx={{
                backgroundColor: '#F7941E',
                borderRadius: '50px',
                color: 'black',
                '&:hover': { backgroundColor: '#D17A1D' }
              }}
            >
              {displayName.trim() ? 'Submit' : 'Skip'}
            </Button>
          </form>
        </Box>
      ) : (
        <>
          {surveyCompleted ? (
            <Box m="40px" display="flex" alignItems="center" justifyContent="center" flexDirection="column" sx={{ width: '100%', maxWidth: '400px', mx: 'auto' }}>
              <Box>
                <img alt="Logo" width="100%" height="100%" src={logo_dtc} style={{ cursor: 'pointer', borderRadius: '0%' }} />
              </Box>
              <Typography variant="h3" mt="100px" mb="20px">Survey Completed</Typography>
              <Button
                variant="contained"
                onClick={handleRestartSurvey}
                sx={{
                  backgroundColor: '#F7941E',
                  borderRadius: '50px',
                  color: 'black',
                  '&:hover': { backgroundColor: '#D17A1D' }
                }}
              >
                Register Another Copy ?
              </Button>
            </Box>
          ) : (
            <Box m="40px" display="flex" alignItems="center" justifyContent="center" flexDirection="column">
              <Box>
                <img alt="Logo" width="100%" height="100%" src={logo_dtc} style={{ cursor: 'pointer', borderRadius: '0%' }} />
              </Box>
              <Typography variant="h3" m="20px 0" align="center">{assessmentName}</Typography>
              {currentWorkshopLabel && (
                <Typography variant="h5" mb={1} fontStyle="italic" color="rgb(102,102,102)">
                  {currentWorkshopLabel}
                </Typography>
              )}
              {currentQuestion && (
                <Box display="flex" flexDirection="column" alignItems="center" p={4} boxShadow={2} borderRadius="8px" sx={{ width: '100%', maxWidth: '500px', mx: 'auto' }}>
                  <Typography variant="h4" mb={2}>
                    {currentQuestion.matrixTitle || currentQuestion.question}
                  </Typography>
                  {currentQuestion.questionType === "checkbox" && (
                    <Typography variant="h5" mb={2} fontStyle="italic">
                      Several choices possible
                    </Typography>
                  )}
                  {(currentQuestion.questionType === "radio-unordered" || currentQuestion.questionType === "radio-ordered") && (
                    <Typography variant="h5" mb={2} fontStyle="italic">
                      Only one choice possible
                    </Typography>
                  )}
                  {currentQuestion.matrixId ? (
                    <>
                      {(() => {
                        try {
                          const matrixQuestions = getMatrixQuestionsForSurvey(currentQuestion.matrixId);
                          const options = currentQuestion.choices.map((choice, index) => ({ value: choice, label: choice }));
                          // Build selected answers across all rows of the matrix from per-question responses
                          const selectedMatrixAnswers = matrixQuestions.map(q => {
                            const questionWithResponse = surveyData.find(sq => sq.questionId === q.questionId); 
                            const r = questionWithResponse?.response || [];
                            return currentQuestion.questionType === "checkbox" ? r : (Array.isArray(r) ? r[0] : r);
                          });
                          return (
                            <Formik
                              initialValues={{
                                [`q${currentQuestion.questionId}`]: selectedMatrixAnswers
                              }}
                              onSubmit={(values) => {
                                // This won't be called since we handle submission manually
                              }}
                            >
                              {({ setFieldValue }) => (
                                <Form>
                                  <Box sx={{ mb: currentQuestion.questionType === "checkbox" ? 4 : 2 }}>
                                    <MatrixQuestion
                                      questions={matrixQuestions}
                                      options={options}
                                      fieldName={`q${currentQuestion.questionId}`}
                                      selectedAnswers={selectedMatrixAnswers}
                                      questionType={currentQuestion.questionType}
                                      handleAnswerSelect={(itemIndex, optionValue) => handleMatrixAnswerSelect(itemIndex, optionValue, setFieldValue)}
                                      isOptionDisabled={() => loading}
                                      viewType="reporting"
                                    />
                                  </Box>
                                </Form>
                              )}
                            </Formik>
                          );
                        } catch (error) {
                          return <div>Error rendering matrix question</div>;
                        }
                      })()}
                      <Button
                        variant="contained"
                        disabled={(() => {
                          const matrixQuestions = getMatrixQuestionsForSurvey(currentQuestion.matrixId);
                          const hasAnyResponse = matrixQuestions.some(q => {
                            const questionWithResponse = surveyData.find(sq => sq.questionId === q.questionId);
                            const response = questionWithResponse?.response || [];
                            return Array.isArray(response) ? response.length > 0 : response;
                          });
                          return !hasAnyResponse || loading;
                        })()}
                        onClick={() => {
                          const matrixQuestions = getMatrixQuestionsForSurvey(currentQuestion.matrixId);
                          const completeMatrixResponse = matrixQuestions.map(q => {
                            const questionWithResponse = surveyData.find(sq => sq.questionId === q.questionId);
                            const response = questionWithResponse?.response || [];
                            return currentQuestion.questionType === "checkbox" ? response : (Array.isArray(response) ? response[0] : response);
                          });
                          handleAnswerClick(currentQuestion.questionId, completeMatrixResponse);
                        }}
                        sx={{
                          backgroundColor: '#F7941E',
                          borderRadius: '50px',
                          mb: 2,
                          color: 'black',
                          '&:hover': { backgroundColor: '#D17A1D' }
                        }}
                      >
                        Confirm submission
                      </Button>
                    </>
                  ) : currentQuestion.questionType === "text" ? (
                    <>
                      <TextField
                        multiline
                        rows={6}
                        value={currentTextAnswer}
                        onChange={(e) => setCurrentTextAnswer(e.target.value)}
                        placeholder="Enter your response here..."
                        variant="outlined"
                        fullWidth
                        sx={{
                          width: '100%',
                          mb: 2,
                          backgroundColor: '#D3D3D3',
                          '& .MuiOutlinedInput-root': {
                            '& fieldset': {
                              borderColor: '#A9A9A9'
                            },
                            '&:hover fieldset': {
                              borderColor: '#A9A9A9'
                            }
                          }
                        }}
                      />
                      <Button
                        variant="contained"
                        disabled={!currentTextAnswer.trim() || loading}
                        onClick={() => handleTextSubmit(currentQuestion.questionId)}
                        sx={{
                          backgroundColor: '#F7941E',
                          borderRadius: '50px',
                          mb: 2,
                          color: 'black',
                          '&:hover': { backgroundColor: '#D17A1D' }
                        }}
                      >
                        Confirm submission
                      </Button>
                    </>
                  ) : currentQuestion.questionType === "checkbox" ? (
                    <>
                      <Box display="flex" flexDirection="column" flexWrap="wrap" justifyContent="center" mb={2}>
                        {currentQuestion.choices.map((choice, index) => (
                          <Button
                            key={`${choice}-${selectedChoices.includes(choice)}`}
                            variant="contained"
                            onClick={(e) => handleCheckboxSelection(choice, e)}
                            disabled={loading}
                            sx={{
                              m: 1,
                              p: 2,
                              width: 'auto',
                              height: 'auto',
                              textTransform: 'none',
                              fontSize: '1rem',
                              borderRadius: '8px',
                              backgroundColor: selectedChoices.includes(choice) ? '#A9A9A9' : '#D3D3D3',
                              color: 'black',
                              '&:hover': {
                                backgroundColor: '#A9A9A9'
                              }
                            }}
                          >
                            {choice}
                          </Button>
                        ))}
                      </Box>
                      <Button
                        variant="contained"
                        disabled={selectedChoices.length === 0 || loading}
                        onClick={() => handleCheckboxSubmit(currentQuestion.questionId)}
                        sx={{
                          backgroundColor: '#F7941E',
                          borderRadius: '50px',
                          mb: 2,
                          color: 'black',
                          '&:hover': { backgroundColor: '#D17A1D' }
                        }}
                      >
                        Confirm submission
                      </Button>
                    </>
                  ) : (
                    <Box display="flex" flexDirection="column" flexWrap="wrap" justifyContent="center" mb={2}>
                      {currentQuestion.choices.map((choice, index) => (
                        <Button
                          key={index}
                          variant="contained"
                          onClick={() => handleAnswerClick(currentQuestion.questionId, choice)}
                          disabled={loading}
                          sx={{
                            m: 1,
                            p: 2,
                            width: 'auto',
                            height: 'auto',
                            textTransform: 'none',
                            fontSize: '1rem',
                            borderRadius: '8px',
                            backgroundColor: '#D3D3D3',
                            color: 'black',
                            '&:hover': {
                              backgroundColor: '#A9A9A9'
                            }
                          }}
                        >
                          {choice}
                        </Button>
                      ))}
                    </Box>
                  )}
                  <Box display="flex" flexDirection="row" justifyContent="space-between" width="100%">
                    <Button
                      variant="contained"
                      onClick={handleBackClick}
                      disabled={currentQuestionIndex === 0 || loading}
                      sx={{
                        backgroundColor: '#F7941E',
                        borderRadius: '50px',
                        color: 'black',
                        '&:hover': { backgroundColor: '#D17A1D' }
                      }}
                    >
                      BACK
                    </Button>
                    <Button
                      variant="contained"
                      onClick={handleSkipClick}
                      disabled={loading || currentQuestion?.questionType === "single-text"}
                      sx={{
                        backgroundColor: '#F7941E',
                        borderRadius: '50px',
                        color: 'black',
                        '&:hover': { backgroundColor: '#D17A1D' },
                        display: currentQuestion?.questionType === "single-text" ? 'none' : 'inline-flex'
                      }}
                    >
                      SKIP
                    </Button>
                  </Box>
                </Box>
              )}
            </Box>
          )}
        </>
      )}
    </>
  );
};

export default Reporting;