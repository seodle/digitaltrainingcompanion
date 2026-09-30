/**
 * Temporary mock of the 3 AI Beacon HTTP calls used by runCourseAnalysisJob
 * for course improvements: POST start -> { job_id }, GET job until
 * status=completed, GET analysis by id.
 *
 * Controlled by USE_MOCK_COURSE_IMPROVEMENTS_CLIENT in aiBeacon.service.js.
 *
 * `MOCK_STRUCTURED_OUTPUT` follows the improvement-report response shape:
 * summary, themes[] (open), comprehension[] (graded_choice),
 * graded_responses[] (graded_text), scales[] (scale), coverage.
 * Sections are omitted by the real API when the payload has nothing of that kind.
 */

const MOCK_COURSE_IMPROVEMENTS_JOB_ID = "mock-course-improvements-job";
const MOCK_COURSE_IMPROVEMENTS_ANALYSIS_ID = "mock-course-improvements-analysis";

const MOCK_STRUCTURED_OUTPUT = {
  summary:
    "Participants understood grading only in part, and several open comments point to unclear teaching on slide 10. Intention to apply the course in practice is mixed. Short written answers often miss the requirement that the group must agree unanimously.",
  themes: [
    {
      theme: "Unclear teaching on slide 10",
      prevalence: 0.5,
      quotes: [
        "professor's teaching on slide 10 not clear",
        "bad professor",
      ],
      source: {
        name: "Slide 10",
        section_name: "Grading and group work",
      },
    },
  ],
  comprehension: [
    {
      question: "How is the final grade…?",
      correct_answer_percentage: 50,
      incorrect_choices: [
        {
          option: "Based only on the technical stability…",
          count: 1,
        },
      ],
      slides: [
        {
          name: "Slide 10",
          section_name: "Grading and group work",
        },
      ],
    },
  ],
  graded_responses: [
    {
      question: "How should a group distribute…?",
      shortfalls: [
        "Does not mention that the group must unanimously agree",
      ],
    },
  ],
  scales: [
    {
      question: "To what extent do you intend…?",
      options: [
        { option: "Do not intend to integrate at all", count: 1 },
        { option: "…", count: 0 },
        { option: "Absolutely intend to integrate", count: 0 },
        { option: "Strong intention to integrate", count: 1 },
      ],
    },
  ],
  coverage: {
    assessments: 2,
    questions: 4,
    kinds: {
      graded_choice: 1,
      graded_text: 1,
      scale: 1,
      open: 1,
    },
  },
};

function createMockCourseImprovementsClient() {
  let jobPollCount = 0;

  return {
    async post() {
      return { job_id: MOCK_COURSE_IMPROVEMENTS_JOB_ID, status: "pending" };
    },
    async get(path) {
      if (String(path).includes("/jobs/")) {
        jobPollCount += 1;
        if (jobPollCount === 1) {
          return { status: "pending" };
        }
        return {
          status: "completed",
          results: [
            {
              analysis_id: MOCK_COURSE_IMPROVEMENTS_ANALYSIS_ID,
              result: { structured_output: MOCK_STRUCTURED_OUTPUT },
            },
          ],
        };
      }

      return {
        analysis_id: MOCK_COURSE_IMPROVEMENTS_ANALYSIS_ID,
        analysis_type: "improvement_report",
        structured_output: MOCK_STRUCTURED_OUTPUT,
      };
    },
  };
}

module.exports = {
  createMockCourseImprovementsClient,
  MOCK_STRUCTURED_OUTPUT,
};
