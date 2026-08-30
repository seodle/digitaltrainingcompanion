import { AssessmentType, QuestionType } from './enums';
import { getChartChoiceColor } from '../components/styledComponents';

const isStudentAssessmentType = (type) => (
  type === AssessmentType.STUDENT_CHARACTERISTICS || type === AssessmentType.STUDENT_LEARNING_OUTCOMES
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
      values: [String(answers[0])],
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
      values: [String(answers[0])],
      mode: hasCorrect ? 'correctness' : 'values',
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
      const correctSet = new Set(correct);
      const isCorrect =
        selectedSet.size === correct.length && correct.every((choice) => selectedSet.has(choice));
      const selectedChoices = selected.filter((choice) => choices.includes(choice));
      if (selectedChoices.length === 0) {
        return null;
      }
      const choiceResults = selectedChoices.map((choice) => {
        const ok = correctSet.has(choice);
        return {
          label: choice,
          selected: true,
          isCorrectOption: ok,
          participantCorrect: ok,
          color: getChartChoiceColor({
            questionType,
            choices,
            choiceIndex: choices.indexOf(choice),
            correctAnswer,
          }),
        };
      });
      const multi = choiceResults.length > 1;
      return {
        value: multi
          ? choiceResults.filter((choice) => choice.participantCorrect).length / choiceResults.length
          : (isCorrect ? 1 : 0),
        detail: selected.join(', '),
        values: selected.map(String),
        mode: multi ? 'multi' : 'correctness',
        correct: isCorrect,
        color,
        choiceResults: multi ? choiceResults : undefined,
      };
    }
    return {
      value: 0,
      detail: selected.join(', '),
      values: selected.map(String),
      mode: 'values',
      correct: null,
      color,
    };
  }

  return null;
};

const responseRecordId = (response, fallbackIndex) => {
  const raw = response?._id;
  if (raw && typeof raw === 'object') {
    return String(raw._id || raw.$oid || fallbackIndex);
  }
  return String(raw || response?.id || fallbackIndex);
};

const participantIdentity = (response, fallbackIndex) => {
  const displayName = (response.displayName || '').trim();
  return {
    key: responseRecordId(response, fallbackIndex),
    name: displayName,
  };
};

export const buildCriteriaRankings = (assessments, { anonymousLabel = 'Anonymous', hideStudentValues = false } = {}) => {
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

        if (hideStudentValues && isStudentAssessmentType(assessment.type) && scored.mode === 'values') {
          return;
        }

        const mode = scored.mode;

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

        const criterion = questionMap.get(key);
        if (scored.mode === 'multi') {
          criterion.mode = 'multi';
        }
        criterion.scoresByKey.set(identity.key, {
          key: identity.key,
          name: identity.name || anonymousLabel,
          score: scored.value,
          correct: scored.correct,
          color: scored.color,
          detail: scored.detail,
          values: scored.values,
          choiceResults: scored.choiceResults,
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
