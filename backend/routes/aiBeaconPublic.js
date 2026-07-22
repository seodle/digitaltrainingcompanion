const router = require("express").Router();
const { AiBeaconApiError } = require("../clients/aiBeacon.client");
const { requirePublicCoachFeedbackContext } = require("../middleware/authorization");
const { enrichCoachFeedbackFromAiBeacon } = require("../services/aiBeacon.service");

router.post(
  "/assessments/:assessmentId/coach-feedback",
  requirePublicCoachFeedbackContext,
  async (req, res) => {
    const {
      userId,
      courseId,
      feedbackText,
      question,
    } = req.coachFeedbackContext;

    try {
      const { summary } = await enrichCoachFeedbackFromAiBeacon({
        userId,
        courseId,
        feedbackText,
        question,
      });
      return res.json({ summary });
    } catch (error) {
      if (error instanceof AiBeaconApiError) {
        return res.status(
          error.status >= 400 && error.status < 600 ? error.status : 500
        ).json({
          error: error.message || "AI Beacon request failed",
          details: error.responseBody,
        });
      }
      return res.status(500).json({
        error: error.message || "Failed to enrich coach feedback",
      });
    }
  }
);

module.exports = router;
