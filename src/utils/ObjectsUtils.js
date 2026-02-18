import axios from "axios";
import { BACKEND_URL } from "../config";
import { OptionTypes, AssessmentType, UserType, QuestionType } from '../utils/enums';

// Utility function to transform monitorings
function transformMonitorings(monitorings, userId) {
  return monitorings.map((item, index) => ({
    ...item,
    orderId: item.orderId,
    creationDate: new Date(item.creationDate),
    lastModification: item.lastModificationDate ? new Date(item.lastModificationDate) : new Date(item.creationDate),
    options: item.userId === userId ? [OptionTypes.DELETE, OptionTypes.DELETE_ALL_ANSWERS, OptionTypes.COPY] : [OptionTypes.DELETE_ALL_ANSWERS, OptionTypes.COPY, OptionTypes.UNSHARE],
    imported: item.userId !== userId
  }));
}

// Utility function to transform assessments
function transformAssessments(assessments) {
  return assessments.map((assessment, idx) => {
    let options;
    switch (assessment.status) {
      case 'Draft': options = [OptionTypes.EDIT, OptionTypes.PREVIEW, OptionTypes.OPEN, OptionTypes.COPY, OptionTypes.DELETE, OptionTypes.DELETE_ALL_ANSWERS]; break;
      case 'Open': options = [OptionTypes.CLOSE, OptionTypes.PREVIEW, OptionTypes.EDIT, OptionTypes.COPY, OptionTypes.DELETE, OptionTypes.DELETE_ALL_ANSWERS]; break;
      case 'Close': options = [OptionTypes.OPEN, OptionTypes.COPY, OptionTypes.DELETE, OptionTypes.DELETE_ALL_ANSWERS]; break;
      default: break;
    }
    return {
      ...assessment,
      id: idx + 1,
      creationDate: new Date(assessment.creationDate),
      lastModification: assessment.lastModificationDate ? new Date(assessment.lastModificationDate) : new Date(assessment.creationDate),
      options: options,
    };
  });
}

// TODO change this to better handle the assessments
// find the assessment with the right monitoring and day
function findAssessmentByMonitoringIdAndDay(assessmentsDict, monitoringId, day) {

  const assessments = assessmentsDict[monitoringId];
  if (!assessments) {
    return null; // Return null if no assessment found for the given monitoringId, should never happee
  }

  // Find assessment based on the day
  return assessments.find(assessment => assessment.id === day);
}

// Utility function to format the latest date into a readable string
const formatLatestDate = (date) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const amOrPm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12; // Convert hour '0' to '12'
  const timeString = `${String(hours).padStart(2, '0')}:${minutes} ${amOrPm}`;

  return date.toDateString() === today.toDateString() ? `Today at ${timeString}` : `${date.toLocaleDateString()} at ${timeString}`;
};

const generateSharingCode = () => {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const charactersLength = characters.length;
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};

const loadMonitoringAndAssessments = async (currentUser, setMonitorings, setAssessments, setCurrentMonitoringId) => {
  const token = localStorage.getItem("token");
  if (!token) {
    console.log('No token found');
    return;
  }

  try {
    const monitoringResponse = await axios.get(`${BACKEND_URL}/monitorings`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const monitoringsArray = monitoringResponse.data.monitorings;
    const transformedMonitorings = transformMonitorings(monitoringsArray, currentUser._id);
    setMonitorings(transformedMonitorings);

    // List of all assessments
    let assessments = [];
    let latestModifiedAssessment = null;

    // Loop through each monitoring to fetch and transform its assessments
    for (const monitoring of transformedMonitorings) {
      const response = await axios.get(`${BACKEND_URL}/assessments/monitoring/${monitoring._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data && response.data.length > 0) {
        var transformedAssessments = transformAssessments(response.data);

        // Check for the most recently modified assessment
        transformedAssessments.forEach(assessment => {
          if (!latestModifiedAssessment || new Date(assessment.lastModification) > new Date(latestModifiedAssessment.lastModification)) {
            latestModifiedAssessment = assessment;
          }
        });

        // if the the monitoring is imported, just show the assessment from type student characteristics and student learning outcomes
        if (monitoring.userId !== currentUser._id && currentUser.userStatus === UserType.TEACHER) {

          const allowedTypes = [AssessmentType.STUDENT_CHARACTERISTICS, AssessmentType.STUDENT_LEARNING_OUTCOMES];
          transformedAssessments = transformedAssessments.filter(item => allowedTypes.includes(item.type));
        }

        // Spread transformed assessments into the main assessments array
        assessments = [...assessments, ...transformedAssessments];
      }
    }

    // Save the assessments dictionary in a state variable
    setAssessments(assessments);

    // Set the selected monitoring and update current monitoring server ID based on the most recently modified assessment
    if (latestModifiedAssessment) {
      setCurrentMonitoringId(latestModifiedAssessment.monitoringId);
    }

  } catch (error) {
    console.error("Error fetching monitorings and assessments:", error);
  }
};

/**
   * Localize the type of assessment according to the language
   * @param {Object} type - the assessment type as taken from the enum AssessmentType
   * @returns {String} the localized assessment type
   */
const localizeAssessmentType = (type, getMessage) => {

  switch (type) {
    case AssessmentType.TRAINEE_CHARACTERISTICS:
      return getMessage('label_assessment_type_trainee_characteristics');
    case AssessmentType.TRAINING_CHARACTERISTICS:
      return getMessage('label_assessment_type_training_characteristics');
    case AssessmentType.IMMEDIATE_REACTIONS:
      return getMessage('label_assessment_type_immediate_reactions');
    case AssessmentType.LEARNING:
      return getMessage('label_assessment_type_learning');
    case AssessmentType.ORGANIZATIONAL_CONDITIONS:
      return getMessage('label_assessment_type_organizational_conditions');
    case AssessmentType.BEHAVIORAL_CHANGES:
      return getMessage('label_assessment_type_behavioral_changes');
    case AssessmentType.SUSTAINABILITY_CONDITIONS:
      return getMessage('label_assessment_type_sustainability_conditions');
    case AssessmentType.STUDENT_CHARACTERISTICS:
      return getMessage('label_assessment_type_student_characteristics');
    case AssessmentType.STUDENT_LEARNING_OUTCOMES:
      return getMessage('label_assessment_type_student_learning_outcomes');
    case "General":
      return getMessage('label_type_general');
    default:
      return type;
  };
};

/**
   * Localize the type of questions according to the language
   * @param {Object} type - the question type as taken from the enum QuestionType
   * @returns {String} the localized question type
   */
const localizeQuestionType = (type, getMessage) => {

  switch (type) {
    case QuestionType.TEXT:
      return getMessage('label_question_type_text');
    case QuestionType.RADIO_ORDERED:
      return getMessage('label_question_type_radio_ordered');
    case QuestionType.RADIO_UNORDERED:
      return getMessage('label_question_type_radio_unordered');
    case QuestionType.CHECKBOX:
      return getMessage('label_question_type_checkbox');
    case QuestionType.SINGLE_TEXT:
      return getMessage('label_question_type_single_text');
    default:
      return type;
  };
};


export { loadMonitoringAndAssessments, transformMonitorings, transformAssessments, findAssessmentByMonitoringIdAndDay, formatLatestDate, generateSharingCode, localizeAssessmentType, localizeQuestionType };