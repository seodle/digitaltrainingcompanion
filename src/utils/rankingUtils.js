import { AssessmentType, QuestionType } from './enums';
import { getChartChoiceColor } from '../components/styledComponents';

const isLearningAssessmentType = (type) => (
  type === AssessmentType.LEARNING || type === AssessmentType.STUDENT_LEARNING_OUTCOMES
);

const scoreAnswer = (item) => {
  const { questionType, choices, response, correctAnswer } = item;
  if (!response || !choices?.length) {
    return null;
  }

  const answers = Array.isArray(response) ? response : [response].filter((value) => value != null && value !== '');
  if (answers.length === 0) {
    return null;
  }

  if (questionType === QuestionType.RADIO_ORDERED) {
    const idx = choices.indexOf(answers[0]);
    if (idx < 0) {
      return null;
    }
    const max = Math.max(choices.length - 1, 1);
    return {
      value: idx / max,
      detail: String(answers[0]),
      mode: 'scale',
      correct: null,
      color: getChartChoiceColor({ questionType, choices, choiceIndex: idx, correctAnswer }),
    };
  }

  if (questionType === QuestionType.RADIO_UNORDERED) {
    const correct = Array.isArray(correctAnswer) ? correctAnswer[0] : correctAnswer;
    const hasCorrect = correct != null && correct !== '';
    const isCorrect = hasCorrect && answers[0] === correct;
    const choiceIndex = choices.indexOf(answers[0]);
    return {
      value: isCorrect ? 1 : 0,
      detail: String(answers[0]),
      mode: hasCorrect ? 'correctness' : 'scale',
      correct: hasCorrect ? isCorrect : null,
      color: getChartChoiceColor({
        questionType,
        choices,
        choiceIndex: choiceIndex < 0 ? 0 : choiceIndex,
        correctAnswer,
      }),
    };
  }

  if (questionType === QuestionType.CHECKBOX) {
    const selected = answers;
    const correct = (Array.isArray(correctAnswer) ? correctAnswer : [correctAnswer]).filter(Boolean);
    const firstIndex = choices.indexOf(selected[0]);
    const color = getChartChoiceColor({
      questionType,
      choices,
      choiceIndex: firstIndex < 0 ? 0 : firstIndex,
      correctAnswer,
    });
    if (correct.length > 0) {
      const selectedSet = new Set(selected);
      const isCorrect =
        selectedSet.size === correct.length && correct.every((choice) => selectedSet.has(choice));
      return {
        value: isCorrect ? 1 : 0,
        detail: selected.join(', '),
        mode: 'correctness',
        correct: isCorrect,
        color,
      };
    }
    return {
      value: 0,
      detail: selected.join(', '),
      mode: 'scale',
      correct: null,
      color,
    };
  }

  return null;
};

const participantIdentity = (response, fallbackIndex) => {
  const displayName = (response.displayName || '').trim();
  const user = response.userId;
  const userId = user && typeof user === 'object'
    ? String(user._id || user.id || '')
    : String(user || '');

  return {
    key: displayName || userId || String(response._id || `anon-${fallbackIndex}`),
    name: displayName,
  };
};

export const buildCriteriaRankings = (assessments, { anonymousLabel = 'Anonymous' } = {}) => {
  const criteria = [];

  (assessments || []).forEach((assessment) => {
    const questionMap = new Map();

    (assessment.responses || []).forEach((response, responseIndex) => {
      const identity = participantIdentity(response, responseIndex);

      (response.survey || []).forEach((item) => {
        if (
          item.questionType === QuestionType.TEXT ||
          item.questionType === QuestionType.SINGLE_TEXT ||
          !item.choices?.length
        ) {
          return;
        }

        const scored = scoreAnswer(item);
        if (!scored) {
          return;
        }

        const mode = isLearningAssessmentType(assessment.type) && scored.correct != null
          ? 'correctness'
          : 'scale';

        const key = item.matrixId
          ? `${assessment._id}-${item.shortName || item.question}-#${item.matrixPosition ?? ''}`
          : `${assessment._id}-${item.shortName || item.question}`;

        if (!questionMap.has(key)) {
          questionMap.set(key, {
            id: key,
            title: item.shortName || item.question,
            question: item.question,
            assessmentName: assessment.name,
            choices: item.choices || [],
            mode,
            scoresByKey: new Map(),
          });
        }

        questionMap.get(key).scoresByKey.set(identity.key, {
          key: identity.key,
          name: identity.name || anonymousLabel,
          score: scored.value,
          correct: scored.correct,
          color: scored.color,
        });
      });
    });

    questionMap.forEach((criterion) => {
      const ranking = [...criterion.scoresByKey.values()]
        .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
        .map((entry, index) => ({ ...entry, rank: index + 1 }));

      if (ranking.length > 0) {
        criteria.push({
          id: criterion.id,
          title: criterion.title,
          question: criterion.question,
          assessmentName: criterion.assessmentName,
          mode: criterion.mode,
          ranking,
        });
      }
    });
  });

  return criteria;
};

export const anonymizeRankings = (criteria, labelPrefix) => {
  const names = new Map();
  let n = 0;

  return (criteria || []).map((criterion) => ({
    ...criterion,
    ranking: criterion.ranking.map((entry) => {
      if (!names.has(entry.key)) {
        n += 1;
        names.set(entry.key, `${labelPrefix} ${n}`);
      }
      return { ...entry, name: names.get(entry.key) };
    }),
  }));
};
