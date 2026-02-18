import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Formik, Form } from 'formik';
import { 
    Box, 
    Button, 
    Typography, 
    IconButton,
    Alert,
    Tooltip
} from '@mui/material';
import CodeIcon from '@mui/icons-material/Code';
import SurveyQuestion from '../../components/SurveyQuestion';
import DTCLogo from '../../components/DTCLogo';
import { useAuthUser } from '../../contexts/AuthUserContext';
import { BACKEND_URL } from "../../config";
import { useLanguage } from '../../contexts/LanguageContext';
import { useMessageService } from '../../services/MessageService';
import { getMatrixQuestions } from '../../utils/matrixUtils';
import { groupQuestionsByWorkshop } from '../../utils/SurveyUtils';

// Memoize the SurveyQuestion component to prevent unnecessary re-renders
const MemoizedSurveyQuestion = React.memo(SurveyQuestion);

const useLanguageFromUrl = () => {
    const location = useLocation();
    const params = new URLSearchParams(location.search);
    const urlLanguageCode = params.get('lng');
    const { languageCode: contextLanguageCode, setLanguageCode } = useLanguage();

    useEffect(() => {
        if (urlLanguageCode && urlLanguageCode !== contextLanguageCode) {
            setLanguageCode(urlLanguageCode);
        }
    }, [urlLanguageCode, contextLanguageCode, setLanguageCode]);

    return { languageCode: urlLanguageCode || contextLanguageCode };
};

const PreviewSurvey = () => {
  // Router and authentication hooks
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser } = useAuthUser();
  const { languageCode } = useLanguageFromUrl();
  const { getMessage } = useMessageService();

  // State management for API key and notifications
  const [apiKey, setApiKey] = useState(null);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertSeverity, setAlertSeverity] = useState('info');
  const [showAlert, setShowAlert] = useState(false);

  // Survey data management
  const { assessment } = location.state || {};
  const assessmentUserId = assessment?.userId && typeof assessment.userId === 'object' ? assessment.userId?._id : assessment?.userId;
  const isOwner = (!assessmentUserId) || (assessmentUserId === currentUser?._id);
  const [surveyData, setSurveyData] = useState([]);
  const [initialValues, setInitialValues] = useState({});

  // Initialize survey data when assessment is available
  useEffect(() => {
    if (assessment) {
      // Create initial survey data structure
      let initialSurveyData = {
        status: 'success',
        data: {
            survey: assessment.questions,
            type: assessment.type,
            name: assessment.name,
            status: assessment.status
        }
      };

      // Process survey questions to include formatted choices
      const processedData = initialSurveyData.data.survey.map(question => ({
        ...question,
        choices: question.choices.map(choice => ({ value: choice, label: choice }))
      }));

      setSurveyData(processedData);

      // Initialize form values with defaults for each question type
      const initialValues = processedData.reduce((values, question) => {
        let defaultValue = "";
        if (["radio-ordered", "radio-unordered"].includes(question.questionType)) {
          defaultValue = question.choices[0].value;
        }
        return { ...values, [`q${question.questionId}`]: defaultValue };
      }, {});

      setInitialValues(initialValues);
    }
  }, [assessment]);

  // Memoize workshops grouping using shared utility
  const workshopObjects = useMemo(() => groupQuestionsByWorkshop(assessment?.workshops, surveyData), [assessment, surveyData]);

  // Fetch API key when component mounts or user changes
  useEffect(() => {
    const fetchApiKey = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          console.error('No token found');
          return;
        }
      
        const response = await fetch(`${BACKEND_URL}/api-keys`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch API key');
        }

        const apiKey = await response.json();
        
        if (apiKey && apiKey.length > 0) {
          setApiKey(apiKey[0].key);
        }
      } catch (error) {
        console.error('Error fetching API key:', error);
      }
    };

    if (currentUser?._id) {
      fetchApiKey();
    }
  }, [currentUser]);

  // Generate embed code for a survey question (with API key placeholder)
  const generateEmbedCode = (question) => {
    const placeholderKey = 'YOUR_API_KEY_HERE';
    return `<!-- Replace YOUR_API_KEY_HERE with your API key. It is highly recommended not to store the key in plain text but to use a .env file instead. -->
<iframe 
    src="${BACKEND_URL}/embed/assessment/${assessment._id}/question/${question._id}?key=${placeholderKey}&lng=${languageCode}"
    width="100%" 
    height="100%"
    frameborder="0"
    style="border: none; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); background-color: #ffffff; color: #000000;"
></iframe>`;
  };

  // Handle copying embed code to clipboard
  const handleCopyEmbedCode = async (question) => {
    try {
      const embedCode = generateEmbedCode(question);
      await navigator.clipboard.writeText(embedCode);
      
      setAlertMessage(getMessage('label_iframe_code_copied'));
      setAlertSeverity('success');
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
      setAlertMessage('Failed to copy code');
      setAlertSeverity('error');
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 2000);
    }
  };

  // Helper function to get matrix questions for a given matrixId
  const getMatrixQuestionsForSurvey = useCallback((matrixId) => {
    return getMatrixQuestions(matrixId, surveyData);
  }, [surveyData]);

  return (
    <>
      {/* Alert notification system */}
      {showAlert && (
        <Alert 
          severity={alertSeverity}
          sx={{ 
            position: 'fixed', 
            top: 20, 
            left: '50%', 
            transform: 'translateX(-50%)', 
            zIndex: 9999 
          }}
        >
          {alertMessage}
        </Alert>
      )}

      {/* Logo section */}
      <DTCLogo />

      {/* Main survey content */}
      <Box display="flex" alignItems="center" justifyContent="center">
        <Box sx={{
            boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.1)',
            borderRadius: '15px',
            padding: '20px',
            backgroundColor: '#fff',
            width: { xs: '90vw', md: '50vw' },
        }}>
          <Formik initialValues={initialValues}>
            {({ values, setFieldValue }) => (
              <Form style={{ width: '100%' }}>
                {/* Render workshops in order */}
                {workshopObjects.map(workshop => (
                  <Box key={workshop.workshopId} style={{ width: '100%' }}>
                    <Box display="flex" justifyContent="center" alignItems="center">
                      {workshop.label && (
                        <Typography variant="h2" fontWeight="bold" color="rgb(102,102,102)" m="15px 10px 0px 0px">
                          {workshop.label}
                        </Typography>
                      )}
                    </Box>
                    {/* Render questions for each workshop */}
                    {workshop.questions.map((question, index) => (
                      // Skip matrix questions that are not the first one in their group
                      question.matrixId && question.matrixPosition !== 0 ? null : (
                        <Box key={index} position="relative" width="100%">
                          {isOwner && (
                            <Tooltip title="Copy embed code">
                              <IconButton
                                onClick={() => handleCopyEmbedCode(question)}
                                sx={{
                                    position: 'absolute',
                                    right: '1px',
                                    top: '1px',
                                    zIndex: 1,
                                    color: '#F7941E'
                                }}
                              >
                                <CodeIcon />
                              </IconButton>
                            </Tooltip>
                          )}
                          <MemoizedSurveyQuestion
                            question={question.question}
                            context={question.context}
                            correctAnswer={question.correctAnswer}
                            explanation={question.explanation}
                            workshopId={question.workshopId}
                            fieldName={`q${question.questionId}`}
                            type={question.questionType}
                            isMandatory={question.isMandatory}
                            options={question.choices}
                            setFieldValue={setFieldValue}
                            displayCorrectAnswer={false}
                            disabled={false}
                            matrixId={question.matrixId}
                            matrixPosition={question.matrixPosition}
                            matrixTitle={question.matrixTitle}
                            matrixQuestions={question.matrixId ? getMatrixQuestionsForSurvey(question.matrixId) : []}
                            viewType="previewSurvey"
                          />
                        </Box>
                      )
                    ))}
                  </Box>
                ))}

                {/* Navigation button */}
                <Box mt={5} display="flex" justifyContent="center">
                  {surveyData.length > 0 && (
                    <Button onClick={() => navigate('/dashboard')} variant="contained" sx={{
                        backgroundColor: '#F7941E',
                        borderRadius: '50px',
                        color: 'black',
                        '&:hover': { backgroundColor: '#D17A1D' },
                    }}>
                      <Typography variant="h5">{getMessage('label_preview_back')}</Typography>
                    </Button>
                  )}
                </Box>
              </Form>
            )}
          </Formik>
        </Box>
      </Box>
    </>
  );
};

export default PreviewSurvey;