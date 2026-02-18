/**
 * Get matrix questions for a given matrixId from a questions array
 * @param {string} matrixId - The matrix ID to filter by
 * @param {Array} questionsArray - Array of questions to search in
 * @returns {Array} Array of matrix questions with label, shortName, and questionId
 */
export const getMatrixQuestions = (matrixId, questionsArray) => {
  if (!matrixId || !questionsArray) return [];
  
  return questionsArray
    .filter(q => q.matrixId === matrixId)
    .sort((a, b) => a.matrixPosition - b.matrixPosition)
    .map(q => ({ 
      label: q.question, 
      shortName: q.shortName,
      questionId: q.questionId 
    }));
}; 