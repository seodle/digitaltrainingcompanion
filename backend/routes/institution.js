const express = require('express');
const router = express.Router();
const Institution = require('../models/institutionModel');
const User = require('../models/userModel');
const { requireAdmin } = require('../middleware/authorization');

// Helper: verify caller is this institution's admin
const requireInstitutionAdmin = async (req, res, next) => {
    const institution = await Institution.findById(req.params.id).lean();
    if (!institution) return res.status(404).json({ error: 'institution_not_found' });
    if (String(institution.adminUserId) !== String(req.user._id))
        return res.status(403).json({ error: 'forbidden' });
    req.institution = institution; // cache for the route handler
    next();
};

// POST /institutions — create (platform admin only)
router.post('/', requireAdmin, async (req, res) => {
    try {
        const { name, plan, authorizedEmailDomains, isResearchProject, adminUserId } = req.body;
        const institution = new Institution({ name, plan, authorizedEmailDomains, isResearchProject, adminUserId });
        await institution.save();
        res.status(201).json(institution);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /institutions/:id/members — list users linked to this institution
router.get('/:id/members', requireInstitutionAdmin, async (req, res) => {
    try {
        const members = await User.find({ institutionId: req.params.id })
            .select('firstName lastName email subscriptionPlan aiCallsUsedThisMonth creationDate')
            .lean();
        res.json({ members, institution: req.institution });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /institutions/:id/members/:userId — unlink a user
router.delete('/:id/members/:userId', requireInstitutionAdmin, async (req, res) => {
    try {
        const user = await User.findById(req.params.userId).select('userStatus').lean();
        const fallbackPlan = user?.userStatus === 'Teacher' ? 'FREE_TEACHER' : 'FREE_TRAINER';

        await User.findByIdAndUpdate(req.params.userId, {
            institutionId: null,
            subscriptionPlan: fallbackPlan,
        });
        res.json({ message: 'user_removed' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;