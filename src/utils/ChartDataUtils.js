import { QuestionType } from './enums'


/**
 * Processes assessment responses to organize chart data specific to a given response type.
 * The function filters data to include only items of the specified type and then constructs a structured
 * object where each key represents a workshop or a default category.
 * This structured data facilitates easier generation and rendering of charts.
 *
 * @param {Array} assessmentsWithResponses - A collection of assessments that include responses to be analyzed.
 * @param {String} responseType - The type of responses to filter and process for chart data.
 * @returns {Object} chartData - An object containing processed data ready for charting, organized by workshop keys.
 * Each workshop key maps to an array of question data, each question includes details like question text, response counts, and metadata.
 */
const prepareChartData = (assessmentsWithResponses, responseType) => {
  const chartData = {};

  const filteredData = assessmentsWithResponses.filter(
    item => item.type === responseType
  );

  filteredData.forEach(assessment => {
    assessment.responses.forEach(response => {
      response.survey.forEach(surveyItem => {

        const {
          shortName,
          response: surveyResponse,
          choices,
          question,
          questionType,
          workshopId,
          correctAnswer,
          competencies,
          matrixId,
          matrixPosition
        } = surveyItem;

        if (questionType === QuestionType.TEXT || questionType === QuestionType.SINGLE_TEXT) {
          return;
        }

        const workshopKey = workshopId ? String(workshopId) : "default";
        const label = shortName;
        // Ensure uniqueness for matrix rows by including matrix position in the key
        const uniqueQuestionKey = matrixId
          ? `${assessment.name} ${label} #${typeof matrixPosition === 'number' ? matrixPosition : ''}`
          : `${assessment.name} ${label}`;

        if (!chartData[workshopKey]) {
          chartData[workshopKey] = [];
        }

        let questionData = chartData[workshopKey].find(q => q.uniqueQuestionKey === uniqueQuestionKey);

        if (!questionData) {
          // Stocker correctAnswer sous forme de tableau pour les checkboxes
          const normalizedCorrectAnswer = questionType === QuestionType.CHECKBOX
            ? Array.isArray(correctAnswer) ? correctAnswer : [correctAnswer]
            : correctAnswer;

          questionData = {
            uniqueQuestionKey,
            question,
            shortName: label,
            choices,
            type: questionType,
            assessmentName: assessment.name,
            workshop: workshopKey,
            counts: new Array(choices.length).fill(0),
            names: new Array(choices.length).fill([]).map(() => []),
            correctAnswer: normalizedCorrectAnswer,
            competencies: competencies ? competencies.map(competency => competency.split(':')[0]) : []
          };

          chartData[workshopKey].push(questionData);
        }

        // Utiliser les choix de questionData pour tous les traitements
        if ([QuestionType.RADIO_ORDERED, QuestionType.RADIO_UNORDERED].includes(questionType)) {
          const choiceIndex = questionData.choices.indexOf(surveyResponse[0]);
          if (choiceIndex !== -1) {
            questionData.counts[choiceIndex]++;
            questionData.names[choiceIndex].push(response.displayName);
          }
        } else if (questionType === QuestionType.CHECKBOX) {
          surveyResponse.forEach(responseValue => {
            const index = questionData.choices.indexOf(responseValue);
            if (index !== -1) {
              // Vérifier si l'index est valide avant de pusher
              if (questionData.names[index]) {
                questionData.counts[index]++;
                questionData.names[index].push(response.displayName);
              }
            }
          });
        }
      });
    });
  });

  return chartData;
};

/**
 * Prepares comment data for assessments filtered by a specific response type. This function focuses on text-type responses, organizing comments by workshops and assessment questions.
 * Each unique question within a workshop is stored with its associated comments, facilitating easier access and review of qualitative data.
 *
 * @param {Array} assessmentsWithResponses - Collection of assessments including responses.
 * @param {String} responseType - Type of responses to process, e.g., 'Trainee characteristics'.
 * @returns {Object} commentData - An object with workshops as keys, each containing an array of questions with their respective comments.
*/
const prepareCommentData = (assessmentsWithResponses, responseType) => {
  let commentData = {};

  // Filter data to only keep the right assessment type
  const filteredData = assessmentsWithResponses.filter(item => item.type === responseType);

  filteredData.forEach(({ name: assessmentName, responses }) => {

    responses.forEach(({ survey, displayName }) => {

      survey.forEach(({ question, response, questionType, workshopId, shortName }) => {
        const key = workshopId ? String(workshopId) : "default";
        const uniqueQuestionKey = `${assessmentName}-${shortName || question}`;

        // Check if the question is of type 'text' and process if it is
        if (questionType === QuestionType.TEXT) {
          if (!commentData[key]) {
            commentData[key] = {};
          }

          // If the uniqueQuestionKey hasn't been seen yet, initialize
          if (!commentData[key][uniqueQuestionKey]) {
            commentData[key][uniqueQuestionKey] = {
              uniqueQuestionKey: uniqueQuestionKey,
              question: question,
              shortName: shortName,
              assessmentName: assessmentName,
              responses: [],
              displayName: []
            };
          }

          // Add the response to the array of responses for this question
          commentData[key][uniqueQuestionKey].responses.push(response[0]);
          commentData[key][uniqueQuestionKey].displayName.push(displayName);
        }
      });
    });
  });

  // Convert nested results object into nested array
  Object.keys(commentData).forEach(key => {
    commentData[key] = Object.values(commentData[key]);
  });

  return commentData;
};

export { prepareChartData, prepareCommentData };