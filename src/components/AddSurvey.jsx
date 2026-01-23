import { Box, Typography, FormControlLabel, Switch } from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";
import { Formik, Form } from 'formik';
import React, { useState, useEffect, useRef} from "react";

import { AssessmentType, QuestionType } from '../utils/enums';
import AddLearningQuestions from "./AddLearningQuestions";
import AddQuestion from "./AddQuestion";
import AddWorkshop from "./AddWorkshop";
import QuestionsListSectionLearning from './QuestionSectionLearning';
import QuestionsListSection from './QuestionSection';
import FormActions from './FormActions';
import { saveSurveyToAssessment, fetchExistingSurvey, groupQuestionsByWorkshop as groupByWorkshopShared } from '../utils/SurveyUtils';
import { localizeAssessmentType } from '../utils/ObjectsUtils';
import { useLanguage } from '../contexts/LanguageContext';
import { getCompetencies, getActivities, findCompetencies } from '../utils/QuestionUtils';

// for i18n
import { useMessageService } from '../services/MessageService';

// the assessment types of type "learning"
const learningTypes = [
    AssessmentType.LEARNING,
    AssessmentType.STUDENT_LEARNING_OUTCOMES,
];

const AddSurvey = ({ currentAssessmentServerId, predifinedQuestionIds }) => {
    
    const location = useLocation();
    const navigate = useNavigate();


    // States declaration
    const { assessmentType, assessmentName } = location.state || {};
    const [initialQuestions, setInitialQuestions] = useState([]);
    const [questions, setQuestions] = useState([]);
    const [workshops, setWorkshops] = useState([]);
    const [splitWorkshops, setSplitWorkshops] = useState(false);
    const [editingQuestionId, setEditingQuestionId] = useState(null);

    const [automaticEncoding, setAutomaticEncoding] = useState(false);
    const [selectedArea, setSelectedArea] = useState('');
    const [selectedCompetency, setSelectedCompetency] = useState('');
    const [activity, setActivity] = useState(''); 

    const prevQuestionsLengthRef = useRef(questions.length);
    const formActionsRef = useRef(null);

    // for the translations
    const { getMessage } = useMessageService();
    const { languageCode } = useLanguage();

    // Add useEffect to watch for questions changes
    useEffect(() => {
        // Only scroll if questions were added (current length > previous length)
        if (questions.length > prevQuestionsLengthRef.current && formActionsRef.current) {
            formActionsRef.current.scrollIntoView({ behavior: 'smooth' });
        }
        // Update the previous length reference
        prevQuestionsLengthRef.current = questions.length;
    }, [questions]);

    useEffect(() => {

        console.log("-----", assessmentType, predifinedQuestionIds);

        fetchExistingSurvey(setQuestions, setSplitWorkshops, setWorkshops, setInitialQuestions, 
                            currentAssessmentServerId, predifinedQuestionIds, languageCode);

    }, [currentAssessmentServerId, predifinedQuestionIds, assessmentType, languageCode]);

    /**
     * Handles changes to competency-related selections and updates the corresponding state.
     * This function manages different select elements for areas, competencies, and activities.
     * Based on the name attribute of the select element, it updates the state accordingly.
     * For the 'activity' selection, it also adds the selected activity to the competencies of the current question.
     *
     * @param {Object} event - The event object from the select element, containing 'name' and 'value' properties.
     */
    const handleCompetencyChange = (event) => {
        const { name, value } = event.target;
        if (name === 'area') {
            setSelectedArea(value);
        } else if (name === 'competency') {
            setSelectedCompetency(value);
        } else if (name === 'activity') {
            setActivity(value);
            const updatedCompetencies = [...questions.find(question => question.questionId === editingQuestionId).competencies, value];
            setQuestions(questions.map(question => question.questionId === editingQuestionId ? { ...question, competencies: updatedCompetencies } : question));
        }
    };

    const handleAutomaticEncodingChange = async (event) => {
        const isAutomaticEncodingEnabled = event.target.checked;
        setAutomaticEncoding(isAutomaticEncodingEnabled);

        // Only proceed if automatic encoding is enabled and a question is currently being edited
        if (isAutomaticEncodingEnabled && editingQuestionId !== null) {
            const updatedQuestion = questions.find(question => question.questionId === editingQuestionId);
            
            if (updatedQuestion) {
                try {
                    // Simulate the logic from saveEdits for updating competencies
                    const competencies = await findCompetencies(updatedQuestion.question, updatedQuestion.shortName, updatedQuestion.framework);
                    if (competencies && competencies.length > 0) {
                        const updatedCompetencies = competencies.map(comp => `${updatedQuestion.framework} ${comp}`);
                        // Update the question with the new competencies
                        setQuestions(prevQuestions => prevQuestions.map(question =>
                            question.questionId === editingQuestionId ? { ...question, competencies: updatedCompetencies } : question
                        ));
                        console.log("Competencies automatically updated for question:", editingQuestionId);
                    } else {
                        console.log("No competencies found for automatic recoding.");
                    }
                } catch (error) {
                    console.error("Failed to automatically update competencies for question:", editingQuestionId, error);
                }
            }
        }
    };


    // Event handler for changing the state of helpWithAI
    const handleSplitWorkshopsChange = (event) => {
        const enabled = event.target.checked;
        setSplitWorkshops(enabled);

        if (!enabled) {
            // Clear the actual field used everywhere else
            setQuestions(prevQuestions =>
                prevQuestions.map(q => ({ ...q, workshopId: null }))
            );
            setWorkshops([]);
        }
    };

    const handleReset = () => {
        setQuestions([]);
        setWorkshops([]);
        setSplitWorkshops(false);
    };

    const handleUpdateWorkshopName = (workshopToUpdate, newWorkshopName) => {
        // Validate inputs
        if (!workshopToUpdate || !newWorkshopName || newWorkshopName.trim() === "") {
            console.error("Invalid workshop or name");
            return;
        }

        // Check if new name already exists (excluding the current workshop)
        const workshopNames = workshops.map(w => w.label);
        const nameExists = workshopNames.some(name => 
            name === newWorkshopName && name !== workshopToUpdate.label
        );
        
        if (nameExists) {
            console.error("Workshop name already exists.");
            return;
        }

        // Update the workshop object directly by ID
        setWorkshops(prevWorkshops =>
            prevWorkshops.map(workshop => {
                if (workshop._id === workshopToUpdate._id) {
                    return { ...workshop, label: newWorkshopName.trim() };
                }
                return workshop;
            })
        );
    };

    /**
     * Renders sections for each workshop with its respective questions.
     *
     * @param {Array} questions - Array of questions to be displayed.
     * @param {Object} props - Additional props to pass to the QuestionSection component.
     * @returns {Array} Array of QuestionSection components.
     */
    const renderQuestionSections = (currentQuestions, sectionDisplayProps) => {
        const workshopObjects = groupByWorkshopShared(workshops, currentQuestions);
        const finalSectionsToRender = workshopObjects.map(wk => ({
            workshop: wk.workshopId === 'unassigned' ? null : workshops.find(w => w._id === wk.workshopId),
            questionsList: wk.questions
        }));

        return finalSectionsToRender.map(sectionData => {
            const { workshop: workshopFromData, questionsList: workshopQuestionsToList } = sectionData;
    
            const commonPropsForSection = {
                workshop: workshopFromData,
                questions: workshopQuestionsToList,
                allQuestions: currentQuestions, 
                allWorkshops: workshops,     
                handleUpdateWorkshopName,
                ...sectionDisplayProps 
            };
    
            if (learningTypes.includes(assessmentType)) {
                return (
                    <QuestionsListSectionLearning
                        key={workshopFromData ? workshopFromData._id : "default"}
                        {...commonPropsForSection}
                        handleCompetencyChange={sectionDisplayProps.handleCompetencyChange}
                        handleAutomaticEncodingChange={sectionDisplayProps.handleAutomaticEncodingChange}
                        selectedArea={sectionDisplayProps.selectedArea}
                        automaticEncoding={automaticEncoding} 
                        activity={sectionDisplayProps.activity}
                        getActivities={sectionDisplayProps.getActivities}
                        selectedCompetency={sectionDisplayProps.selectedCompetency}
                        getCompetencies={sectionDisplayProps.getCompetencies}
                        assessmentType={assessmentType} 
                    />
                );
            } else {
                return (
                    <QuestionsListSection
                        key={workshopFromData ? workshopFromData._id : "default"}
                        {...commonPropsForSection}
                    />
                );
            }
        });
    };

    /**
     * Prepares the survey data for submission 
     * @param {Array} questions - An array of question objects
     * @param {String} assessmentType - The type of assessment, used to determine how to prepare the data.
     * @returns {Object} An object with a single key, questions, containing an array of
     *                   transformed question objects ready for API submission.
     */
    const prepareSurveyData = (questions) => {

        return {
            questions: questions.map((question, index) => {
                const baseQuestionData = {
                    _id: question._id, // keep existing subdoc id if present
                    questionId: index,
                    shortName: question.shortName,
                    context: question.context,
                    question: question.question,
                    workshopId: question.workshopId,
                    questionType: question.questionType,
                    isMandatory: question.isMandatory,
                    choices: question.options.map(option => option.label),
                    matrixTitle: question.matrixId ? question.matrixTitle : undefined,
                    matrixId: question.matrixId ? question.matrixId : undefined,
                    matrixPosition: question.matrixId ? question.matrixPosition : undefined
                };

                if (learningTypes.includes(assessmentType)) {
                    return {
                        ...baseQuestionData,
                        correctAnswer: question.correctAnswer,
                        explanation: question.explanation,
                        learningType: question.learningType,
                        framework: question.framework,
                        competencies: question.competencies,
                    };
                } else {
                    return baseQuestionData;
                }
            }),
            workshops: workshops, // Include workshops in the data sent to backend
        };
    };

    
 
   return (
            
        <Box display="flex" flexDirection="column" alignItems="center" minHeight="100vh" ml="10px" backgroundColor="white">  
                <Box display="flex" flexDirection="column" justifyContent="space-between" minHeight="5vh" sx={{backgroundColor: "#fff", width: {xs: "90vw", md: "75vw",}, }}>
                    <Box display="flex" flexDirection="row" alignItems="baseline" ml="10px" mb="20px">
                        <Typography variant="h3" fontWeight="bold">
                            {getMessage("label_evaluate")} {localizeAssessmentType(assessmentType, getMessage)}
                        </Typography>
                        {assessmentName && (
                            <Typography variant="h4" color="text.secondary" ml="10px">
                                - {assessmentName}
                            </Typography>
                        )}
                    </Box>
                </Box>                            
            <Box display="flex" flexDirection="column" justifyContent="space-between" minHeight="80vh" sx={{boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.1)", borderRadius: "15px", backgroundColor: "#fff", width: {xs: "90vw", md: "75vw",},}}>
                <Box display="flex" flexDirection="row" justifyContent="space-between" minHeight="80vh" sx={{backgroundColor: "#fff", width: {xs: "90vw", md: "75vw",},}}>

                <Box sx={{ display: "flex", flexDirection: "column", bgcolor: "#fff", width: { xs: "45vw", md: "37vw" }, height: '78vh', overflowY: 'auto', }}>
                    <Box sx={{ display: "flex", flexDirection: "column", mt: "20px", pl: "20px",}}>
                        <FormControlLabel
                            control={<Switch checked={splitWorkshops} onChange={handleSplitWorkshopsChange} />}
                            label={getMessage("label_create_sections")} 
                        /> 
                    </Box>
                
                    {splitWorkshops && (
                        <Box sx={{ display: "flex", flexDirection: "column", mt: "20px", }} >
                            <Typography mb="20px" variant="h4" fontWeight="bold" textAlign="center">
                                {getMessage("label_add_workshop")}
                            </Typography>
                            <AddWorkshop setQuestions={setQuestions} initialQuestions={initialQuestions} workshops={workshops} setWorkshops={setWorkshops}/>
                        </Box>
                    )}

                    <Box sx={{ display: "flex", flexDirection: "column", mt: "30px", ml: "20px", }} >
                        <Typography mb= "20px" variant="h4" fontWeight="bold">
                            {getMessage("label_create_new_question")}
                        </Typography>

                        {(learningTypes.includes(assessmentType)) ? (
                            <AddLearningQuestions
                                setQuestions={setQuestions}
                                questions={questions}
                                assessmentType={assessmentType}
                                splitWorkshops={splitWorkshops}
                                workshops={workshops}
                            />
                         ) : (
                            <AddQuestion
                                setQuestions={setQuestions}
                                questions={questions}
                                assessmentType={assessmentType}
                                splitWorkshops={splitWorkshops}
                                workshops={workshops}
                            />
                        )}

                    </Box>
                </Box>

                <Box flexDirection="column" display="flex" sx={{backgroundColor: "#fff",width: {xs: "45vw", md: "37vw",}, height: '78vh', overflowY: 'auto',}} >
                    
                    <Formik
                        initialValues={{}}
                        onSubmit={async (values, { setSubmitting }) => {
                            try {
                                const surveyData = prepareSurveyData(questions);
                                await saveSurveyToAssessment(currentAssessmentServerId, surveyData);
                                navigate('/dashboard');
                            } catch (error) {
                                console.error('Failed to submit the survey:', error);
                            } finally {
                                setSubmitting(false);
                            }
                        }}
                    >
                            
                        {({ setFieldValue, handleSubmit }) => (

                            // All the questions are here -> should work for each type
                            <Form>
                                {renderQuestionSections(questions, {
                                    setQuestions,
                                    setEditingQuestionId,
                                    editingQuestionId,
                                    setFieldValue,
                                })}
                                <div ref={formActionsRef}>
                                    <FormActions 
                                        handleReset={handleReset} 
                                        handleSubmit={handleSubmit} 
                                        questionsExist={questions.length > 0} 
                                    />
                                </div>
                            </Form>
                        )}
                    </Formik>
                </Box>
            </Box>
        </Box>
    </Box>);
};

export default AddSurvey;



