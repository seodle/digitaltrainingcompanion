const router = require("express").Router();
const Monitoring = require("../models/monitoringModel");
const {
  createAiBeaconApiClientForUser,
} = require("../clients/aiBeacon.client");
const {
  extractAvailableCourses,
  extractSyncedCourses,
  extractCourseContents,
  resolveLmsConnectionId,
  waitForCourseProcessingCompletion,
} = require("../services/aiBeacon.service");
const { createAssessment } = require("../services/assessmentService");
const { AiBeaconApiError } = require("../clients/aiBeacon.client");

const AI_BEACON_OUTPUT_LANGUAGES = new Set(["de", "fr", "it", "en", "auto"]);

router.post("/assessments", async (req, res) => {
  const assessmentData = req.body;
  const requesterId = req.user && req.user._id;

  try {
    const result = await createAssessment(assessmentData, {
      requesterId,
      enableAiBeaconEnrichment: true,
    });
    return res.json(result);
  } catch (error) {
    const statusCode = error.message === "Assessment not found" ? 404 : 500;
    return res.status(statusCode).json({ error: error.message });
  }
});

router.get("/courses", async (req, res) => {
  try {
    const userId = req.user && req.user._id;
    const client = await createAiBeaconApiClientForUser(userId);
    const lmsConnectionId = await resolveLmsConnectionId({ userId, client });
    if (!lmsConnectionId) {
      return res.status(404).json({ error: "No LMS connection found" });
    }

    let rawAvailable;
    try {
      rawAvailable = await client.get(
        `/api/courses/${encodeURIComponent(lmsConnectionId)}/available`
      );
    } catch (error) {
      // Cached ID may be stale; refresh once and retry.
      const refreshedLmsConnectionId = await resolveLmsConnectionId({
        userId,
        client,
        forceRefresh: true,
      });
      if (!refreshedLmsConnectionId) {
        return res.status(404).json({ error: "No LMS connection found" });
      }
      rawAvailable = await client.get(
        `/api/courses/${encodeURIComponent(refreshedLmsConnectionId)}/available`
      );
    }

    const courses = extractAvailableCourses(rawAvailable);

    return res.json({ courses });
  } catch (error) {
    return res.status(500).json({
      error: error.message || "Failed to fetch courses",
    });
  }
});

router.put("/courses/:courseId", async (req, res) => {
  try {
    const userId = req.user && req.user._id;
    const courseId = String(req.params?.courseId || "").trim();
    if (!courseId) {
      return res.status(400).json({ error: "courseId is required" });
    }

    const language = String(req.body?.language ?? "").trim();
    if (!language || !AI_BEACON_OUTPUT_LANGUAGES.has(language)) {
      return res.status(400).json({
        error: "language must be one of: de, fr, it, en, auto",
      });
    }

    const client = await createAiBeaconApiClientForUser(userId);
    const updated = await client.put(
      `/api/courses/${encodeURIComponent(courseId)}`,
      { language }
    );

    return res.json(updated ?? { success: true, language });
  } catch (error) {
    if (error instanceof AiBeaconApiError) {
      return res.status(error.status >= 400 && error.status < 600 ? error.status : 500).json({
        error: error.message || "AI Beacon request failed",
        details: error.responseBody,
      });
    }
    return res.status(500).json({
      error: error.message || "Failed to update course language",
    });
  }
});

router.get("/courses/:courseId/contents", async (req, res) => {
  try {
    const userId = req.user && req.user._id;
    const courseId = String(req.params?.courseId || "").trim();
    if (!courseId) {
      return res.status(400).json({ error: "courseId is required" });
    }

    const client = await createAiBeaconApiClientForUser(userId);

    const rawContents = await client.get(
      `/api/courses/${encodeURIComponent(courseId)}/contents`
    );

    const contents = extractCourseContents(rawContents);

    return res.json({ contents });
  } catch (error) {
    if (error instanceof AiBeaconApiError && error.status === 404) {
      return res.status(404).json({
        error: error.message || "Course contents not found",
      });
    }
    return res.status(500).json({
      error: error.message || "Failed to fetch course contents",
    });
  }
});

router.post("/courses/:courseId/sync", async (req, res) => {
  try {
    const userId = req.user && req.user._id;
    const moodleCourseId = String(req.params?.courseId || "").trim();
    if (!moodleCourseId) {
      return res.status(400).json({ error: "courseId is required" });
    }

    const client = await createAiBeaconApiClientForUser(userId);

    const lmsConnectionId = await resolveLmsConnectionId({ userId, client });
    if (!lmsConnectionId) {
      return res.status(404).json({ error: "No LMS connection found" });
    }

    const payload = {
      lms_connection_id: String(lmsConnectionId),
      course_ids: [moodleCourseId],
    };

    const syncResult = await client.post("/api/courses/sync", payload);
    const syncedCourses = extractSyncedCourses(syncResult);

    let processingCompleted = true;
    let processingStatusUnsupported = false;
    const result = await waitForCourseProcessingCompletion({
      client,
      courseId: moodleCourseId,
    });
    if (result.unsupported) {
      processingStatusUnsupported = true;
      processingCompleted = false;
    } else if (!result.done) {
      processingCompleted = false;
    }

    const setDoc = { courseSyncedAt: new Date() };
    const syncedCourse = syncedCourses.find(
      (course) => course.courseMoodleId === moodleCourseId
    );
    if (syncedCourse?.courseAiBeaconId) {
      setDoc.courseAiBeaconId = syncedCourse.courseAiBeaconId;
    }
    await Monitoring.updateMany(
      { userId, courseMoodleId: moodleCourseId },
      { $set: setDoc }
    );

    if (!processingCompleted) {
      return res.status(202).json({
        success: true,
        processingCompleted: false,
        syncedAtPersisted: true,
        syncedCourses,
        message: processingStatusUnsupported
          ? "Sync accepted, but processing-status endpoint is unavailable"
          : "Sync started but processing is still running",
      });
    }

    return res.json({
      success: true,
      processingCompleted: true,
      syncedAtPersisted: true,
      syncedCourses,
    });
  } catch (error) {
    return res.status(500).json({
      error: error.message || "Failed to sync courses",
    });
  }
});

module.exports = router;

