import * as Yup from "yup";
import axios from "axios";
import { QuestionType, LearningType, AdoptionType } from '../utils/enums';
import { BACKEND_URL } from "../config";
import draftToHtml from 'draftjs-to-html';
import { convertToRaw } from 'draft-js';
import {
  PERENCompetences, digCompCompetences, RCNumPostObligatoireElementaryCompetences,
  digCompEduElementaryCompetences, RCNumObligatoireElementaryCompetences, digCompEduActivities,
  RCNumPostObligatoireActivities, RCNumObligatoireActivities, PERENActivities, digCompActivities,
  lehrplanMIElementaryCompetences, lehrplanMIActivities, RCPFPEEElementaryCompetences, RCPFPEEActivities,
  RCPMPEElementaryCompetences, RCPMPEActivities, CRCNeduElementaryCompetences, CRCNeduActivities,
  CPLLCDElementaryCompetences, CPLLCDActivities
} from "../assets/frameworksData"
import React, { useState, useEffect, useContext } from "react";
import { Box, Typography, CircularProgress } from "@mui/material";
import { useFormikContext } from "formik";
import { useMessageService } from '../services/MessageService';
import { useAuthUser } from '../contexts/AuthUserContext';

const initialQuestionValues = {
  question: "",
  shortName: "",
  context: "",
  questionType: QuestionType.SINGLE_TEXT,
  isMandatory: false,
  learningType: "",
  correctAnswer: "",
  explanation: "",
  options: ["", "", "", ""],
  framework: "",
  workshopId: "",
  proficiency: "",
  activity: "",
  data: "",
  area: "",
  competency: "",
  day: 0,
  numberOfQuestions: 1,
  autoSuggestionsEnabled: false,
  adoptionType: null,
};


/**
   * Retrieves competency arrays based on the selected educational framework and area.
   * This function helps to provide specific competencies depending on the educational context.
   * 
   * @param {Object} values - An object containing the framework and area selected.
   * @param {string} values.framework - The educational framework identifier.
   * @param {string} values.area - The area within the framework for which competencies are sought.
   * @returns {Array} - An array of competencies related to the specified area within the framework.
  */
function getCompetencies(values) {
  switch (values.framework) {
    case "RCNUM POST-OBLIGATOIRE":
      return RCNumPostObligatoireElementaryCompetences[values.area] || [];
    case "RCNUM OBLIGATOIRE":
      return RCNumObligatoireElementaryCompetences[values.area] || [];
    case "DIGCOMPEDU":
      return digCompEduElementaryCompetences[values.area] || [];
    case "PER EN":
      return PERENCompetences[values.area] || [];
    case "DIGCOMP":
      return digCompCompetences[values.area] || [];
    case "LEHRPLAN MI":
      return lehrplanMIElementaryCompetences[values.area] || [];
    case "RCPFPEE":
      return RCPFPEEElementaryCompetences[values.area] || [];
    case "RCPMPE":
      return RCPMPEElementaryCompetences[values.area] || [];
    case "CRCNEDU":
      return CRCNeduElementaryCompetences[values.area] || [];
    case "CPLLCD":
      return CPLLCDElementaryCompetences[values.area] || [];
    default:
      return [];
  }
}

/**
   * Fetches activities related to a specific competency within a given educational framework.
   * This function provides activities that are aligned with the selected competency to guide educational efforts.
   * 
   * @param {Object} values - An object containing the framework and competency.
   * @param {string} values.framework - The educational framework identifier.
   * @param {string} values.competency - The competency for which activities are sought.
   * @returns {Array} - An array of activities related to the specified competency within the framework.
  */
function getActivities(values) {
  switch (values.framework) {
    case "RCNUM POST-OBLIGATOIRE":
      return RCNumPostObligatoireActivities[values.competency] || [];
    case "RCNUM OBLIGATOIRE":
      return RCNumObligatoireActivities[values.competency] || [];
    case "DIGCOMPEDU":
      return digCompEduActivities[values.competency] || [];
    case "PER EN":
      return PERENActivities[values.competency] || [];
    case "LEHRPLAN MI":
      return lehrplanMIActivities[values.competency] || [];
    case "RCPFPEE":
      return RCPFPEEActivities[values.competency] || [];
    case "RCPMPE":
      return RCPMPEActivities[values.competency] || [];
    case "CRCNEDU":
      return CRCNeduActivities[values.competency] || [];
    case "CPLLCD":
      return CPLLCDActivities[values.competency] || [];
    case "DIGCOMP":
      const activitiesByType = digCompActivities[values.competency];
      if (activitiesByType) {
        return activitiesByType[values.learningType] || [];
      }
    default:
      return [];
  }
}

/**
 * Generates the system prompt content for the LLM assistant based on the learning type.
 * This prompt instructs the assistant to formulate questions aligned with a specific learning objective.
 *
 * @param {string} type - The type of learning objective (e.g., LearningType.KNOWLEDGE, LearningType.SKILL, LearningType.ATTITUDE).
 * @returns {string} - The system prompt content to be sent to the LLM assistant.
 */
const getAssessmentContent = (type) => {
  switch (type) {
    case LearningType.KNOWLEDGE:
      return `Utilize the training material provided to formulate complex questions aimed at evaluating knowledge acquisition. The questions must follow a specific multiple-choice format with one or more correct answers, the question shortname and an explanation of the right answers. Follow this example strictly: \n
      1. [Insert Question Here]
      A) [Option A]
      B) [Option B]
      C) [Option C]
      D) [Option D]

      Correct Answers: [A, B] [List the letters of all correct options]
      ShortName: [Insert Question Shortname of Max 30 Characters Here With Spaces Between Words]
      Explanation: [Full explanation about why each option is correct or incorrect]`;

    case LearningType.SKILL:
      return `Utilize the training material provided to formulate complex questions aimed at evaluating practical skills and application. Each question should present a realistic scenario where the learner must demonstrate their ability to apply multiple concepts with one or more correct answers. Questions must follow this specific format: \n       
      1. [Present a real situation where the student needs to USE the material]
      A) [Action/solution option A]
      B) [Action/solution option B]
      C) [Action/solution option C]
      D) [Action/solution option D]

      Correct Answers: [List letters of all correct options, e.g. A, C]
      ShortName: [Insert Question Shortname of Max 30 Characters Here With Spaces Between Words]
      Explanation: [Full explanation about why each option is correct or incorrect]`;

    case LearningType.ATTITUDE:
      return `Utilize the training material to formulate complex questions that evaluate the learner's ethical approach, personal responsibility, and critical mindset towards the material learned. Each question should present a realistic scenario that tests attitudes and values with one or more correct answers. Follow this format strictly: \n  
      1. [Present an ethical dilemma or situation requiring value judgment about network usage]
      A) [Option A]
      B) [Option B]
      C) [Option C]
      D) [Option D]

      Correct Answers: [List letters of all valid approaches, e.g. B, D]
      ShortName: [Insert Question Shortname of Max 30 Characters Here With Spaces Between Words]
      Explanation: [Full explanation about why each option is correct or incorrect]`;

    default:
      return "";
  }
};

/**
 * Sends a message to the LLM API and returns the assistant's response.
 *
 * @param {string} message - The message content to send to the assistant.
 * @param {string} type - The type of assessment content to generate.
 * @returns {Promise<string>} - The assistant's response content.
 * @throws Will throw an error if the API call fails or if the API key is not defined.
 */
async function processMessageToAPI(message, type) {
  const systemPrompt = getAssessmentContent(type);

  try {
    const response = await axios.post(
      `${BACKEND_URL}/ai-tools/infomaniak/chat`,
      {
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: message,
          },
        ]
      },
      {
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );

    if (!response.data?.choices?.[0]?.message?.content) {
      console.error('Unexpected response format:', response.data);
      throw new Error('Invalid response format from API');
    }

    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('Full error details:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    throw error;
  }
}

/**
 * Generates a validation schema for adding questions based on provided parameters.
 *
 * @param {boolean} splitWorkshops - Determines if we should split the question in workshops
 * @param {boolean} helpWithAI - Specifies if AI assistance is needed
 * @param {QuestionType} questionType - The question type
 * @returns {Yup.ObjectSchema} - Returns a Yup validation schema for the question form.
 */
const addQuestionsSchema = (splitWorkshops, helpWithAI, questionType) => {

  let schema = {
    question: questionType === QuestionType.SINGLE_TEXT ? Yup.string().notRequired() : Yup.string()
      .required("The question is required"),
    shortName: questionType === QuestionType.SINGLE_TEXT ? Yup.string().notRequired() : Yup.string()
      .required('The short name is required')
      .min(5, "The short name must be at least 5 characters long")
      .max(30, "The short name must be at most 30 characters long"),
    learningType: questionType === QuestionType.SINGLE_TEXT ? Yup.string().notRequired() : Yup.string()
      .required("The learning type is required"),
    data: helpWithAI
      ? Yup.string()
        .test('maxLength', "The text is too long", value => !value || value.length <= 10000)
      : Yup.string().notRequired(),
  };

  if (helpWithAI) {
    schema.question = Yup.string().notRequired();
    schema.shortName = Yup.string().notRequired();
    schema.correctAnswer = Yup.string().notRequired();
    schema.learningType = Yup.string().required("The learning type is required");
  };

  if (splitWorkshops) {
    schema.workshopId = Yup.string().required("The section is required");
  } else {
    schema.workshopId = Yup.string().notRequired();
  };

  return Yup.object().shape(schema);
};

/**
 * Event handler for changing the state of automatic encoding.
 * Updates the automatic encoding state and, if enabled, updates the selected competencies based on the question.
 *
 * @param {Object} event - The event object from the checkbox/switch.
 * @param {Function} setAutomaticEncoding - Function to update the automatic encoding state.
 * @param {Function} setSelectedCompetencies - Function to update the selected competencies state.
 * @param {string} question - The text of the question.
 * @param {string} shortName - The short name of the question.
 * @param {string} framework - The framework used for encoding competencies.
 * @param {Function} updateCompetenciesForQuestion - Function to fetch competencies based on the question.
 */
const handleAutomaticEncodingChange = async (
  event,
  setAutomaticEncoding,
  setSelectedCompetencies,
  question,
  shortName,
  framework,
  updateCompetenciesForQuestion,
) => {
  const isChecked = event.target.checked;

  // Update the automaticEncoding state based on the checkbox/switch state
  setAutomaticEncoding(isChecked);

  if (isChecked) {
    try {
      // If automatic encoding is enabled, fetch and update the selected competencies
      const competencies = await updateCompetenciesForQuestion(setSelectedCompetencies, question, shortName, framework);
      setSelectedCompetencies(competencies);
    } catch (error) {
      console.error('Error updating competencies:', error);
      // Optionally, handle the error (e.g., display a notification to the user)
    }
  } else {
    // If automatic encoding is disabled, clear the selected competencies
    setSelectedCompetencies([]);
  }
};


/**
 * Fetches competencies related to a given question and short name from the backend service.
 *
 * @param {string} question - The text of the question.
 * @param {string} shortName - A short name or identifier for the question.
 * @param {string} framework - The name of the framework or collection to query.
 * @returns {Promise<Array|null>} - Returns an array of competencies if successful, or null if the framework is not specified.
 * @throws {Error} - Throws an error if the request fails.
 */
const findCompetencies = async (question, shortName, framework) => {
  if (!framework) {
    console.log('Framework is not specified. Skipping the request.');
    return null;
  }

  try {
    // Construct the query by combining the question and short name
    const query = `${question} ${shortName}`;

    // Prepare the request payload
    const payload = {
      query,
      collectionName: framework,
    };

    // Prepare the request headers with authorization token
    const headers = {
      Authorization: `Bearer ${localStorage.getItem('token')}`,
    };

    // Send a POST request to the backend to query embeddings
    const response = await axios.post(
      `${BACKEND_URL}/semantic/query-embedding-faiss`,
      payload,
      { headers }
    );

    console.log(`${BACKEND_URL}/semantic/query-embedding-faiss`,
      payload,
      { headers });

    // Return the data from the response
    return response.data;
  } catch (error) {
    // Log the error for debugging purposes
    console.error('Error sending query to backend, returning empty array:', error);

    // Return empty array instead of throwing error so question creation can continue
    return [];
  }
};


/**
 * Updates the selected competencies for a question by fetching relevant competencies based on the question details.
 *
 * @param {Function} setSelectedCompetencies - Function to update the selected competencies state.
 * @param {string} question - The text of the question.
 * @param {string} shortName - A short name or identifier for the question.
 * @param {string} framework - The name of the framework or collection to query.
 * @returns {Promise<Array>} - Returns a promise that resolves to an array of competencies.
 * @throws {Error} - Throws an error if fetching competencies fails.
 */
const updateCompetenciesForQuestion = async (
  setSelectedCompetencies,
  question,
  shortName,
  framework
) => {

  try {
    // Fetch competencies from the backend service
    const competencies = await findCompetencies(question, shortName, framework);
    console.log('Competencies fetched:', competencies);

    // Check if competencies were returned
    if (competencies && competencies.length > 0) {
      // Prepend the framework name to each competency for display or identification
      const competenciesWithFramework = competencies.map(
        (competency) => `${framework} ${competency}`
      );

      // Update the selected competencies state
      setSelectedCompetencies(competenciesWithFramework);

      // Return the competencies for further use if needed
      return competenciesWithFramework;
    } else {
      // If no competencies are found, clear the selected competencies state
      setSelectedCompetencies([]);

      // Return an empty array
      return [];
    }
  } catch (error) {
    // Handle any errors that occurred during the fetch
    console.error('Error updating competencies for question:', error);

    // Clear the selected competencies state in case of error
    setSelectedCompetencies([]);

    // Return empty array instead of throwing error so question creation can continue
    return [];
  }
};

// Function to adjust image alignment
const convertImages = (htmlText) => htmlText.replace(/<div style="text-align:none;"><img/g, '<div style="text-align:center;"><img');


/**
 * Handles the submission of the form, either by generating questions with AI assistance or manually.
 * Updates the questions state with the new questions and resets the form.
 *
 * @param {Object} values - The current values of the form fields.
 * @param {Object} formikBag - The Formik bag containing helpers like resetForm.
 * @param {Object} context - Additional context and functions needed for submission.
 * @param {Function} context.handleSend - Function to send messages to the AI service.
 * @param {String} context.languageCode - The current language code.
 * @param {Number} context.numberOfQuestions - The number of questions to generate.
 * @param {Boolean} context.helpWithAI - Whether to use AI assistance.
 * @param {Array} context.questions - The existing list of questions.
 * @param {Function} context.setQuestions - Function to update the questions state.
 * @param {Array} context.selectedCompetencies - The selected competencies.
 * @param {Function} context.setSelectedCompetencies - Function to update selected competencies.
 * @param {Function} context.setAutomaticEncoding - Function to set automatic encoding state.
 * @param {Object} context.editorState - The current state of the editor.
 * @param {Function} context.updateCompetenciesForQuestion - Function to update competencies for a question.
 * @param {Function} context.setIsLoading - Function to set loading state.
 */
const handleSubmit = async (values, { resetForm }, context) => {
  const {
    handleSend,
    languageCode,
    numberOfQuestions,
    data,
    helpWithAI,
    questions,
    setQuestions,
    selectedCompetencies,
    setSelectedCompetencies,
    setAutomaticEncoding,
    editorState,
    setIsLoading,
  } = context;

  const languageMapping = {
    en: 'English',
    de: 'Deutsch',
    es: 'Spanish',
    it: 'Italian',
    fr: 'Français',
  };

  // Convert editorState to HTML and adjust image alignment
  let editorContent = draftToHtml(convertToRaw(editorState.getCurrentContent()));
  editorContent = convertImages(editorContent);

  // Determine the next question ID
  let newQuestionId =
    questions.reduce((maxId, question) => Math.max(maxId, parseInt(question.questionId, 10)), 0) + 1;

  if (helpWithAI) {
    try {
      // Prepare the content to send to the AI service
      let content = `Make sure that the questions are aligned with the following information.\n
          Number of questions: ${numberOfQuestions}.\n
          Description of the activity: ${data}.\n
          Output language: ${languageMapping[languageCode]}
          Keywords should always be in the following language: en`;

      // Send the content to the AI service and get the response
      const response = await handleSend(content, values.learningType);

      // Parse the response to extract individual questions
      const parsedQuestions = await parseAIResponse(
        response,
        newQuestionId,
        values,
        updateCompetenciesForQuestion,
        setSelectedCompetencies,
      );

      // Update the questions state with the new questions
      setQuestions((prevQuestions) => [...prevQuestions, ...parsedQuestions]);

      // Only set loading to false after questions are processed and added
      if (setIsLoading) {
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error:', error);
      if (setIsLoading) {
        setIsLoading(false);
      }
      throw error;
    }
  } else {
    // Manually add the question based on the form values
    const newQuestion = {
      questionId: newQuestionId.toString(),
      question: values.question,
      shortName: values.shortName,
      context: editorContent,
      correctAnswer: values.correctAnswer,
      explanation: values.explanation,
      questionType: values.questionType,
      learningType: values.learningType,
      workshopId: values.workshopId,
      framework: values.framework,
      options:
        values.questionType === QuestionType.TEXT || values.questionType === QuestionType.SINGLE_TEXT
          ? []
          : values.options.map((option, index) => ({ value: `${index + 1}`, label: option })),
      competencies: [...selectedCompetencies],
    };

    // Update the questions state with the new question
    setQuestions((prevQuestions) => [...prevQuestions, newQuestion]);

    // Reset selected competencies and automatic encoding
    setSelectedCompetencies([]);
    setAutomaticEncoding(false);

    if (setIsLoading) {
      setIsLoading(false);
    }
  }

  // Reset the form fields
  resetForm({
    values: {
      ...values,
      question: '',
      shortName: '',
      context: '',
      workshopId: '',
      correctAnswer: '',
      explanation: '',
      learningType: '',
      competencies: [],
      numberOfQuestions: 1,
    },
  });
};

/**
 * Parses the AI response to extract questions and their details.
 *
 * @param {String} response - The response string from the AI service.
 * @param {Number} startingQuestionId - The starting ID for the new questions.
 * @param {Object} values - The current form values.
 * @param {Function} updateCompetenciesForQuestion - Function to update competencies for a question.
 * @returns {Array} - An array of parsed question objects.
 */
const parseAIResponse = async (response, startingQuestionId, values, updateCompetenciesForQuestion, setSelectedCompetencies) => {
  // Regular expression to match individual questions
  const questionsRegex = /(\d+\..+?)(?=\n\d+\.|$)/gs;
  const matches = [...response.matchAll(questionsRegex)];

  let currentQuestionId = startingQuestionId;
  let parsedQuestions = [];

  for (const match of matches) {
    const questionBlock = match[0].trim();

    // Split the question block into lines
    const lines = questionBlock.split('\n');

    // Extract the question text
    const questionText = lines[0].replace(/^\d+\.\s*/, '');

    // Extract the options
    const options = lines
      .filter((line) => /^\s*[A-Z]\)/.test(line))
      .map((line) => {
        const optionText = line.replace(/^\s*[A-Z]\)\s*/, '').trim();
        return optionText;
      });

    // Extract the correct answers (multiple)
    const correctAnswersMatch = questionBlock.match(/Correct Answers:\s*([A-D,\s]+)/i);
    console.log('Raw correct answers match:', correctAnswersMatch);

    // Extract and clean letters
    let correctLetters = [];
    if (correctAnswersMatch && correctAnswersMatch[1]) {
      correctLetters = correctAnswersMatch[1]
        .replace(/[\[\]]/g, '') // Remove any brackets if present
        .split(',')
        .map(letter => letter.trim().toUpperCase()) // Ensure uppercase
        .filter(letter => /^[A-D]$/.test(letter)); // Validate A-D
    }

    // Validate that correctLetters only contains valid option letters
    const validOptionLetters = options.map((_, index) => String.fromCharCode(65 + index));
    correctLetters = correctLetters.filter(letter => validOptionLetters.includes(letter));
    console.log('Validated correct letters:', correctLetters);

    // Extract the short name
    const shortNameMatch = questionBlock.match(/ShortName:\s*(.+)/);
    const shortName = shortNameMatch ? shortNameMatch[1].trim() : '';

    // Extract the explanation
    const explanationMatch = questionBlock.match(/Explanation:\s*(.+)/);
    const explanation = explanationMatch ? explanationMatch[1].trim() : '';

    // Fetch competencies for the question
    let competencies = [];
    try {
      competencies = await updateCompetenciesForQuestion(setSelectedCompetencies, questionText, shortName, values.framework);
    } catch (error) {
      console.error('Error fetching competencies for question, continuing without competencies:', error);
      // Continue with empty competencies array so question creation is not blocked
      competencies = [];
    }

    // Create options array with values and labels
    const optionsWithValues = options.map((option, index) => ({
      value: String.fromCharCode(65 + index), // A, B, C, etc.
      label: option,
    }));

    const correctAnswersText = correctLetters
      .map(letter => {
        const foundOption = optionsWithValues.find(opt => opt.value === letter);
        return foundOption ? foundOption.label : null;
      })
      .filter(text => text !== null); // Remove any invalid entries

    // Construct the question object
    const question = {
      questionId: currentQuestionId.toString(),
      question: questionText,
      shortName: shortName,
      questionType: "checkbox",
      isMandatory: values.isMandatory,
      learningType: values.learningType,
      workshopId: values.workshopId,
      correctAnswer: correctAnswersText,
      explanation: explanation,
      framework: values.framework,
      options: optionsWithValues,
      competencies,
    };

    currentQuestionId++;
    parsedQuestions.push(question);
  }

  return parsedQuestions;
};

/**
 * Updates the state of auto-suggestions for question options
 * 
 * @param {Event} event - The event from the switch component
 * @param {Function} setAutoSuggestions - Function to update the auto suggestions state
 */
export const handleAutoSuggestionsChange = (event, setAutoSuggestions) => {
  const isEnabled = event.target.checked;
  setAutoSuggestions(isEnabled);
};

/**
 * Fetches suggested options from the backend LLM service
 * 
 * @param {string} questionTitle - The title/text of the question
 * @param {number} numberOfOptions - Number of options to generate
 * @param {Array<string>} existingOptions - Any existing options the user has entered
 * @param {Object} currentUser - The current user object
 * @param {string} questionType - The type of question (QuestionType enum value)
 * @param {string} customInstructions - Custom instructions for the AI to follow
 * @returns {Promise<Array<string>>} Array of suggested options
 */
export const fetchSuggestedOptions = async (questionTitle, numberOfOptions, existingOptions = [], currentUser = null, questionType = null, customInstructions = null) => {
  try {

    console.log('questionType', questionType);

    // Get non-empty options to include in the API request
    const nonEmptyOptions = existingOptions.filter(opt => opt && opt.trim() !== '');

    // Calculate total number of options to determine if we need a neutral option
    const totalOptionCount = nonEmptyOptions.length + numberOfOptions;
    const isOdd = totalOptionCount % 2 !== 0;

    // Determine if it's an ordered scale question or unordered/multiple choice
    const isOrderedScale = questionType === QuestionType.RADIO_ORDERED;

    // Format instructions based on question type
    let typeInstructions = "";
    if (isOrderedScale) {
      // For ordered scales (single choice ordered) - options from negative to positive impact
      typeInstructions = "Generate options on a scale from negative to positive impact. ";

      // Add neutral option instruction for odd number of options in ordered scales
      if (isOdd) {
        typeInstructions += "For this odd number of options, include a neutral middle option (neither positive nor negative). ";
      } else {
        typeInstructions += "For this even number of options, do not include a neutral option. ";
      }
    } else {
      // For unordered options (single choice unordered or multiple choice)
      typeInstructions = "Generate distinct, meaningful options that are relevant to the question. Options should be clear, concise, and cover different aspects or choices. ";
    }

    // Use custom instructions if provided
    if (customInstructions) {
      typeInstructions = customInstructions;
    }

    // Make API call to backend with specific instructions based on question type
    const response = await axios.post(
      `${BACKEND_URL}/ai-tools/suggest-options`,
      {
        questionTitle,
        numberOfOptions,
        instructions: typeInstructions,
        questionType: questionType
      },
      {
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );

    if (response.status !== 200) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = response.data;

    // Map through the suggested options
    // If the user has entered text in any option field, preserve it
    return data.suggestions.map((suggestion, index) => {
      if (existingOptions &&
        index < existingOptions.length &&
        existingOptions[index] &&
        existingOptions[index].trim() !== '') {
        return existingOptions[index];
      }
      return suggestion;
    });
  } catch (error) {
    console.error('Error fetching LLM suggestions:', error);
    // Return existing options or empty array on error
    return existingOptions.length > 0 ? existingOptions : Array(numberOfOptions).fill('');
  }
};

/**
 * Component that monitors changes and generates options based on the question
 * 
 * @param {Object} props - Component props
 * @param {boolean} props.autoSuggestionsEnabled - Whether auto-suggestions are enabled
 * @returns {React.ReactElement} Component
 */
export const QuestionOptionGenerator = ({ autoSuggestionsEnabled, questionText }) => {
  const [loading, setLoading] = useState(false);
  const { values, setFieldValue } = useFormikContext();
  const { getMessage } = useMessageService();
  const [prevOptionsLength, setPrevOptionsLength] = useState(values.options.length);
  const [prevOptions, setPrevOptions] = useState([...values.options]);
  const [prevAutoSuggestionsEnabled, setPrevAutoSuggestionsEnabled] = useState(autoSuggestionsEnabled);
  const { currentUser } = useAuthUser();

  // Function to generate options based on the question title
  const generateOptions = async (forceRegenerate = false) => {
    if (!autoSuggestionsEnabled ||
      !questionText ||
      questionText.trim() === '' ||
      values.questionType === QuestionType.TEXT ||
      values.questionType === QuestionType.SINGLE_TEXT ||
      currentUser?.sandbox) {
      return;
    }

    try {
      console.log('Generating options for question type:', values.questionType);
      console.log('Question type from enums:', QuestionType.RADIO_ORDERED, QuestionType.RADIO_UNORDERED, QuestionType.CHECKBOX);

      setLoading(true);

      // Filter out empty options
      const existingOptions = values.options.filter(option => option.trim() !== '');

      // Get all options including empty ones
      const allOptions = values.options;

      // Number of empty options to fill
      const emptyOptionsCount = allOptions.length - existingOptions.length;

      // If all options are already filled and no force regenerate, nothing to do
      if (emptyOptionsCount === 0 && !forceRegenerate) {
        setLoading(false);
        return;
      }

      // Number of options to generate
      const optionsToGenerate = forceRegenerate ? allOptions.length : emptyOptionsCount;

      // If force regenerating, reconsider all options
      const optionsForGeneration = forceRegenerate ? [] : existingOptions;

      // Only apply neutral option logic for RADIO_ORDERED type
      const showNeutralOptions = values.questionType === QuestionType.RADIO_ORDERED;
      console.log('Show neutral options:', showNeutralOptions, 'for question type:', values.questionType);

      if (showNeutralOptions) {
        console.log(`Generating ordered scale options: total options will be ${allOptions.length}, ${allOptions.length % 2 === 0 ? 'EVEN (no neutral)' : 'ODD (with neutral)'}`);
      } else {
        console.log(`Generating unordered/multiple choice options: total options will be ${allOptions.length}`);
      }

      // Get suggestions from AI
      const suggestions = await fetchSuggestedOptions(
        questionText, // Use the passed questionText instead of values.question
        optionsToGenerate,
        optionsForGeneration,
        currentUser,
        values.questionType
      );

      // Update options with suggestions
      if (suggestions && suggestions.length > 0) {
        if (forceRegenerate) {
          // If force regenerating, update all options
          suggestions.forEach((suggestion, index) => {
            if (index < allOptions.length) {
              setFieldValue(`options.${index}`, suggestion);
            }
          });
        } else {
          // Otherwise, update only empty options
          const emptyOptionIndexes = allOptions
            .map((option, index) => option.trim() === '' ? index : -1)
            .filter(index => index !== -1);

          suggestions.forEach((suggestion, index) => {
            if (index < emptyOptionIndexes.length) {
              const targetIndex = emptyOptionIndexes[index];
              setFieldValue(`options.${targetIndex}`, suggestion);
            }
          });
        }
      }
    } catch (error) {
      console.error('Error generating options:', error);
    } finally {
      setLoading(false);
    }
  };

  // Check if options have changed significantly
  const haveOptionsChanged = () => {
    // Arrays have different lengths
    if (prevOptions.length !== values.options.length) {
      return true;
    }

    // Check if content is different
    for (let i = 0; i < prevOptions.length; i++) {
      if (prevOptions[i] !== values.options[i]) {
        return true;
      }
    }

    return false;
  };

  // Monitor option changes
  useEffect(() => {
    if (haveOptionsChanged()) {
      // If number of options increased (option added)
      if (values.options.length > prevOptionsLength) {
        // Force regenerate all options when adding a new option
        generateOptions(true);
      }
      // If number of options decreased (option removed)
      else if (values.options.length < prevOptionsLength) {
        generateOptions(true);
      }

      setPrevOptionsLength(values.options.length);
      setPrevOptions([...values.options]);
    }
  }, [values.options]);

  // Monitor autoSuggestionsEnabled state changes
  useEffect(() => {
    // If user enables auto-suggestions
    if (autoSuggestionsEnabled && !prevAutoSuggestionsEnabled) {
      generateOptions(true);
    }
    setPrevAutoSuggestionsEnabled(autoSuggestionsEnabled);
  }, [autoSuggestionsEnabled]);

  return loading ? (
    <Box display="flex" justifyContent="center" my={2}>
      <CircularProgress size={24} />
      <Typography variant="body2" sx={{ ml: 1 }}>
        {getMessage("label_generating_options")}
      </Typography>
    </Box>
  ) : null;
};

export {
  processMessageToAPI, addQuestionsSchema, handleAutomaticEncodingChange, updateCompetenciesForQuestion,
  handleSubmit, initialQuestionValues, getCompetencies, getActivities, findCompetencies
};