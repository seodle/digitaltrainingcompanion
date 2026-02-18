import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Formik, Form } from 'formik';
import { Box, Button, Typography, TextField, Tooltip } from '@mui/material';
import { LoadingButton } from '@mui/lab';
import axios from 'axios';
import SurveyQuestion from '../../components/SurveyQuestion';
import DTCLogo from '../../components/DTCLogo';
import { BACKEND_URL } from "../../config";
import { buttonStyle } from '../../components/styledComponents'
import { useMessageService } from '../../services/MessageService';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuthUser } from '../../contexts/AuthUserContext';
import { getMatrixQuestions } from '../../utils/matrixUtils';
import { groupQuestionsByWorkshop } from '../../utils/SurveyUtils';

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

const CompleteSurvey = () => {
    const location = useLocation();

    const params = new URLSearchParams(location.search);
    const monitoring = params.get('monitoring');
    const sandbox = params.get('sandbox');
    const link = params.get('link') === 'true';
    const userId = params.get('userId');
    const email = params.get('email');
    const { languageCode } = useLanguageFromUrl();

    // states for the displayName
    const [displayName, setDisplayName] = useState('');
    const [nameSubmitted, setNameSubmitted] = useState(false);
    // states for the assessments
    const [assessmentType, setAssessmentType] = useState(""); 
    const [assessmentName, setAssessmentName] = useState("");
    const [assessmentStatus, setAssessmentStatus] = useState("");

    const [isSubmitting, setIsSubmitting] = useState(false);

    // State to track which questions have been validated
    const [validatedQuestions, setValidatedQuestions] = useState(new Set());


    const navigate = useNavigate();
    const [surveyData, setSurveyData] = useState([]);
    const [assessmentWorkshops, setAssessmentWorkshops] = useState([]);
    const [initialValues, setInitialValues] = useState({});
    const [currentAssessmentIndex, setCurrentAssessmentIndex] = useState(0);
    const assessmentIds = params.getAll('assessment[]');
    const [showGlobalError, setShowGlobalError] = useState(false);
    const [linkingIDValidated, setLinkingIDValidated] = useState(!link);
    const [linkingCode, setLinkingCode] = useState('');
    const [isCodeValid, setIsCodeValid] = useState(false); 
    const [errorMessage, setErrorMessage] = useState('');

    const { getMessage } = useMessageService();
    const { currentUser } = useAuthUser();

    const fetchSurveyData = useCallback(async () => {
        const currentAssessmentId = assessmentIds[currentAssessmentIndex];
        try {
            const response = await axios.get(`${BACKEND_URL}/survey`, {
                params: { 
                    currentAssessmentServerId: currentAssessmentId, 
                    currentMonitoringServerId: monitoring,
                    sandbox: sandbox 
                },
            });
    
            const { survey, type, name, status, workshops } = response.data;
            setSurveyData(survey.map(question => ({
                ...question,
                choices: question.choices.map(choice => ({ value: choice, label: choice })),
            })));
            setAssessmentWorkshops(Array.isArray(workshops) ? workshops : []);
    
            setAssessmentType(type); 
            setAssessmentName(name); 
            setAssessmentStatus(status); 
    
            const initialValues = survey.reduce((values, question) => {
                // Set default values based on question type and mandatory flag
                let defaultValue = question.isMandatory ? '' : question.choices[0];
                return { ...values, [`q${question.questionId}`]: defaultValue };
            }, {});
    
            setInitialValues(initialValues);
            setValidatedQuestions(new Set()); // Reset validation state when survey data changes
        } catch (error) {
            console.error('Error fetching survey data:', error);
        }
    }, [assessmentIds, currentAssessmentIndex, monitoring]);
    
    // Additional useEffect to ensure data is fetched when the name is submitted
    useEffect(() => {
        if (nameSubmitted) {
            fetchSurveyData();
        }
    }, [nameSubmitted, currentAssessmentIndex]);


    const handleSubmitName = (event) => {
        event.preventDefault();
        setNameSubmitted(true); // Proceed to the survey
    };


    const handleSubmit = useCallback(async (values, { setSubmitting }) => {

        const isAnyMandatoryUnanswered = surveyData.some(question => {
            if (question.isMandatory) {
                if (question.matrixId) {
                    // For matrix questions, only check the first question in the matrix (matrixPosition === 0)
                    // since that's the only one that gets rendered and has a form field
                    if (question.matrixPosition === 0) {
                        const matrixAnswers = values[`q${question.questionId}`];
                        // Check if the matrix answers array exists and has valid answers
                        if (!Array.isArray(matrixAnswers) || matrixAnswers.length === 0) {
                            return true; // Mandatory matrix question is unanswered
                        }
                        
                        // Get all questions in this matrix to know how many positions should be answered
                        const matrixQuestions = surveyData.filter(q => q.matrixId === question.matrixId);
                        
                        // For checkbox questions, check if at least one option is selected for each matrix position
                        if (question.questionType === "checkbox") {
                            // Check that all matrix positions have at least one answer selected
                            for (let i = 0; i < matrixQuestions.length; i++) {
                                const answer = matrixAnswers[i];
                                if (!Array.isArray(answer) || answer.length === 0) {
                                    return true; // This position is unanswered
                                }
                            }
                        } else {
                            // For radio questions, check if each position has a value
                            for (let i = 0; i < matrixQuestions.length; i++) {
                                const answer = matrixAnswers[i];
                                if (!answer || answer === '') {
                                    return true; // This position is unanswered
                                }
                            }
                        }
                        
                        return false; // All positions are answered
                    }
                    // Skip matrix questions that are not the first one (they don't have form fields)
                    return false;
                } else {
                    // Non-matrix question
                    return !values[`q${question.questionId}`] || values[`q${question.questionId}`] === '';
                }
            }
            return false;
        });

        if (isAnyMandatoryUnanswered) {
            setShowGlobalError(true);
            setSubmitting(false); // should be set to false to allow re-submit
            setIsSubmitting(false);
            return;
        }

        setShowGlobalError(false); 
        setIsSubmitting(true);

        const currentAssessmentId = assessmentIds[currentAssessmentIndex];
        
        const responses = surveyData.map(question => {
            let responseValue;
            
            if (question.matrixId) {
                // This is a matrix question - get the specific answer for this position
                const firstQuestionId = surveyData.find(q => q.matrixId === question.matrixId && q.matrixPosition === 0)?.questionId;
                const matrixAnswers = values[`q${firstQuestionId}`];
                
                // matrixAnswers may be stored per-row (q.response) now; compute from surveyData rows when missing
                let effectiveMatrixAnswers = matrixAnswers;
                if (!Array.isArray(effectiveMatrixAnswers)) {
                    const rows = surveyData.filter(q => q.matrixId === question.matrixId).sort((a,b)=>a.matrixPosition-b.matrixPosition);
                    effectiveMatrixAnswers = rows.map(r => (question.questionType === "checkbox" ? (r.response || []) : ((r.response || [])[0])));
                }

                if (Array.isArray(effectiveMatrixAnswers) && effectiveMatrixAnswers[question.matrixPosition] !== undefined) {
                    // Extract the specific answer for this position
                    const specificAnswer = effectiveMatrixAnswers[question.matrixPosition];
                    
                    // For checkbox questions, the answer might be an array, so we need to handle it properly
                    if (question.questionType === "checkbox" && Array.isArray(specificAnswer)) {
                        responseValue = specificAnswer; // Already an array, no need to wrap
                    } else {
                        responseValue = [specificAnswer]; // Wrap single value in array
                    }
                } else {
                    responseValue = [undefined];
                }
            } else {
                // Non-matrix question
                responseValue = values[`q${question.questionId}`];
                if (!Array.isArray(responseValue)) {
                    responseValue = [responseValue];
                }
            }
            
            return {
                _id: question._id, // preserve subdocument id so response.survey[i]._id === assessment.questions[i]._id
                questionId: question.questionId,
                linkingId: linkingCode,
                shortName: question.shortName,
                question: question.question,
                context: question.context,
                correctAnswer: question.correctAnswer,
                workshopId: question.workshopId,
                questionType: question.questionType,
                learningType: question.learningType,
                adoptionType: question.adoptionType,
                organizationalType: question.organizationalType,
                choices: question.choices.map(choice => choice.value),
                competencies: question.competencies,
                response: responseValue,
                matrixId: question.matrixId,
                matrixPosition: question.matrixPosition,
                matrixTitle: question.matrixTitle,
            };
        });

        const responseData = {
            userId: userId, // we cannot use currentUser since this can be used from a different navigator - the object currentUser might not be defined
            email: email,
            assessmentId: currentAssessmentId,
            monitoringId: monitoring,
            assessmentType: assessmentType,
            survey: responses,
            sandbox: sandbox,
            displayName: displayName,
        };

        try {
            // TODO CHANGE THIS
            await axios.post(`${BACKEND_URL}/response`, responseData);

            if (currentAssessmentIndex < assessmentIds.length - 1) {
                setCurrentAssessmentIndex(prevIndex => prevIndex + 1);
                setInitialValues({});
                setValidatedQuestions(new Set()); // Reset validation state for next assessment
                
                window.scrollTo({
                    top: 0,
                    left: 0,
                    behavior: 'smooth'
                });
            } else {
                navigate(`/endSurvey?lng=${languageCode}`);
            }
        } catch (error) {
            console.error('Error submitting survey data:', error);
        }

        setSubmitting(false);
        setIsSubmitting(false);
    }, [surveyData, assessmentIds, currentAssessmentIndex, languageCode, navigate, fetchSurveyData]);

    const workshopObjects = useMemo(() => {
        return groupQuestionsByWorkshop(assessmentWorkshops, surveyData);
    }, [assessmentWorkshops, surveyData]);

    // Helper function to get matrix questions for a given matrixId from surveyData
    const getMatrixQuestionsForSurvey = useCallback((matrixId) => {
        return getMatrixQuestions(matrixId, surveyData);
    }, [surveyData]);

    const handleGenerateCode = () => {
    const consonantPool = "BCDFGHJKLMNPRSTVWXYZ"; 
    const vowelPool = "AEIOU";
    const allChars = consonantPool + vowelPool;

    let code = "";
    // Ensure at least 4 consonants and 4 vowels
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
    setErrorMessage(code.length === 0 ? "Please enter a linking code." : ''); // Set error message if empty
  };

  const handleQuestionValidated = useCallback((questionId, isValidated) => {
        setValidatedQuestions(prev => {
            const newSet = new Set(prev);
            if (isValidated) {
                newSet.add(questionId);
            } else {
                newSet.delete(questionId);
            }
            return newSet;
        });
    }, []);

    // Check if all Learning type questions with explanations have been validated
    const canSubmit = useMemo(() => {
        if (assessmentType !== "Learning") return true;
        
        const learningQuestionsWithExplanations = surveyData.filter(
            question => question.explanation && question.explanation.trim() !== ""
        );
        
        if (learningQuestionsWithExplanations.length === 0) return true;
        
        return learningQuestionsWithExplanations.every(
            question => validatedQuestions.has(`q${question.questionId}`)
        );
    }, [assessmentType, surveyData, validatedQuestions]);

  const preventEnterKey = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
    }
  };

   return (
        <>
            <Box>
               <DTCLogo />
            </Box>
            {!linkingIDValidated ? (
                <Box m="20px" display="flex" alignItems="center" justifyContent="center" flexDirection="column" sx={{ width: '100%', maxWidth: '400px', mx: 'auto' }}>
                    <Typography variant="h3" mt="50px" mb="10px">{getMessage('complete_survey_linking_code')}</Typography>
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
                        {getMessage('complete_survey_validate_linking_code')}
                    </Button>
                    <Typography variant="body1" mt="20px" mb="10px">{getMessage('complete_survey_or')}</Typography>
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
                        {getMessage('complete_survey_generate_linking_code')}
                    </Button>
                </Box>
            ) : !nameSubmitted ? (
                 <Box m="20px" display="flex" alignItems="center" justifyContent="center" flexDirection="column" sx={{ width: '100%', maxWidth: '400px', mx: 'auto' }}>
                    <Typography variant="h3" mt="50px" mb="20px">{getMessage("label_enter_displayname")}</Typography>
                    <form onSubmit={handleSubmitName} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                        <TextField
                            variant="outlined"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            required
                            sx={{ width: '100%', maxWidth: '500px', mb: 2 }}
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
                        <Box display="flex" flexDirection="column" gap="10px" alignItems="center" sx={{ width: '100%' }}>
                            <Button type="submit" variant="contained" sx={buttonStyle}>
                                {getMessage("label_submit")}
                            </Button>

                            <Tooltip title={getMessage("tooltip_anonymous")} arrow>
                                <Button 
                                    type="submit" 
                                    variant="outlined" 
                                    sx={buttonStyle} 
                                    onClick={() => {
                                        setDisplayName('anonymous');
                                    }}
                                >
                                    {getMessage("label_anonymous")}
                                </Button>
                            </Tooltip>
                        </Box>
                    </form>
                </Box>
            ) : (
        // Existing survey rendering logic goes here
        <div>
            <Box display="flex" alignItems="center" justifyContent="center" flexDirection="column">
                <Box display="flex" alignItems="center" justifyContent="center" sx={{padding: '20px', width: {xs: '90vw', md: '50vw',},}}>

                    {assessmentStatus === "Close" ? (
                        <Typography variant="h3" align="justify" style={{ margin: '10px' }}>
                            {getMessage('label_survey_no_longer_available')}
                        </Typography>
                        ) : assessmentStatus === "Draft" ? (
                        <Typography variant="h3" align="justify" style={{ margin: '10px' }}>
                            {getMessage('label_survey_not_yet_available')}
                        </Typography>
                    ) : null}
                </Box>
            </Box>

            {assessmentStatus !== "Close" && assessmentStatus !== "Draft" && (
                <Box display="flex" alignItems="center" justifyContent="center">
                    <Box sx={{ boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.1)', borderRadius: '15px', padding: '20px', backgroundColor: '#fff', width: { xs: '90vw', md: '50vw' }, }}>
                        <Formik key={currentAssessmentIndex} initialValues={initialValues} onSubmit={handleSubmit}>
                            {({ setFieldValue }) => (
                                <Form style={{ width: '100%' }}>
                                    {workshopObjects.map((workshop) => (
                                        <div key={workshop.workshopId} style={{ width: '100%' }}>
                                            <Box display="flex" justifyContent="center" alignItems="center">
                                                {workshop.label && (
                                                    <Typography variant="h2" fontWeight="bold" color="rgb(102,102,102)" m="15px 10px 0px 0px"> 
                                                        {workshop.label}
                                                    </Typography>
                                                )}
                                            </Box>

                                            {workshop.questions.map((question, index) => (
                                                // Skip matrix questions that are not the first one in their group
                                                question.matrixId && question.matrixPosition !== 0 ? null : (
                                                    <MemoizedSurveyQuestion
                                                        key={index}
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
                                                        assessmentType={assessmentType} 
                                                        displayCorrectAnswer={false}
                                                        matrixId={question.matrixId}
                                                        matrixPosition={question.matrixPosition}
                                                        matrixTitle={question.matrixTitle}
                                                        matrixQuestions={question.matrixId ? getMatrixQuestionsForSurvey(question.matrixId) : []}
                                                        viewType="completeSurvey"
                                                        onQuestionValidated={handleQuestionValidated}
                                                    />
                                                )
                                            ))}
                                        </div>
                                    ))}
                                    {showGlobalError && (
                                        <Box mt={2} display="flex" justifyContent="center">
                                            <Typography color="error">{getMessage('label_questions_required_in_survey')}</Typography>
                                        </Box>
                                    )}
                                    
                                    {/* Show validation progress for Learning type assessments */}
                                    {assessmentType === "Learning" && (
                                        <Box mt={2} display="flex" justifyContent="center">
                                            <Typography variant="body2" color="textSecondary">
                                                {(() => {
                                                    const totalQuestions = surveyData.filter(q => q.explanation && q.explanation.trim() !== "").length;
                                                    const validatedCount = validatedQuestions.size;
                                                    if (totalQuestions > 0) {
                                                        return `${validatedCount}/${totalQuestions} ${getMessage('label_questions_validated')}`;
                                                    }
                                                    return null;
                                                })()}
                                            </Typography>
                                        </Box>
                                    )}
                                    
                                    <Box mt={2} display="flex" justifyContent="center">
                                        {surveyData.length > 0 && (
                                            <Tooltip 
                                                title={!canSubmit && assessmentType === "Learning" ? getMessage('tooltip_validate_before_submit') : ""}
                                                arrow
                                            >
                                                <span>
                                                    <LoadingButton
                                                        type="submit"
                                                        variant="contained"
                                                        loading={isSubmitting}
                                                        sx={buttonStyle}
                                                        disabled={!canSubmit}
                                                    >
                                                        <Typography variant="h5">
                                                            {currentAssessmentIndex < assessmentIds.length - 1 ? getMessage('label_next') : getMessage('label_submit')}
                                                        </Typography>
                                                    </LoadingButton>
                                                </span>
                                            </Tooltip>
                                        )}
                                    </Box>
                                </Form>
                            )}
                        </Formik>
                    </Box>
                </Box>
            )}
        </div>
        )}
    </>
    );
};

export default CompleteSurvey;

