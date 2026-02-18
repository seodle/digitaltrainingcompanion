const express = require("express");
const { fetchAdminStats,
    fetchDatabaseRecords,
    deleteRecord,
    fetchUserHistory,
    fetchUsersWithRegistrationDate,
    getUsersCount,
    fetchMonitoringsWithDetails,
    getMonitoringsCount,
    fetchAssessmentsWithDetails,
    getAssessmentsCount } = require("../services/adminService");
const router = express.Router();


//Get user history
router.get("/user-history", async (req, res) => {
    try {
        const { page = 0, limit = 10 } = req.query;
        const history = await fetchUserHistory(page, limit);
        res.json(history);
    } catch (error) {
        console.error("Error fetching user history:", error);
        res.status(500).json({ error: "Failed to fetch user history" });
    }
});

router.get("/stats", async (req, res) => {
    try {
        const stats = await fetchAdminStats();
        res.json(stats);
    } catch (error) {
        console.error("Error fetching admin stats:", error);
        res.status(500).json({ error: "Failed to fetch admin stats" });
    }
});

// Get users with registration date
router.get("/users", async (req, res) => {
    try {
        const { page = 0, limit = 10 } = req.query;
        const [users, total] = await Promise.all([
            fetchUsersWithRegistrationDate(page, limit),
            getUsersCount()
        ]);
        res.json({
            docs: users,
            total: total,
            page: parseInt(page),
            limit: parseInt(limit)
        });
    } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ error: "Failed to fetch users" });
    }
});

// Get monitorings with details
router.get("/monitorings", async (req, res) => {
    try {
        const { page = 0, limit = 10 } = req.query;
        const [monitorings, total] = await Promise.all([
            fetchMonitoringsWithDetails(page, limit),
            getMonitoringsCount()
        ]);
        res.json({
            docs: monitorings,
            total: total,
            page: parseInt(page),
            limit: parseInt(limit)
        });
    } catch (error) {
        console.error("Error fetching monitorings:", error);
        res.status(500).json({ error: "Failed to fetch monitorings" });
    }
});

// Get assessments with details
router.get("/assessments", async (req, res) => {
    try {
        const { page = 0, limit = 10 } = req.query;
        const [assessments, total] = await Promise.all([
            fetchAssessmentsWithDetails(page, limit),
            getAssessmentsCount()
        ]);
        res.json({
            docs: assessments,
            total: total,
            page: parseInt(page),
            limit: parseInt(limit)
        });
    } catch (error) {
        console.error("Error fetching assessments:", error);
        res.status(500).json({ error: "Failed to fetch assessments" });
    }
});

module.exports = router;