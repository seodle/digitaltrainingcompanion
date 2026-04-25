const User = require('../models/userModel');
const Institution = require('../models/institutionModel');
const { getPlan, TRIAL_DURATION_DAYS } = require('../constants/subscriptionPlans');

const TRIAL_MS = TRIAL_DURATION_DAYS * 24 * 60 * 60 * 1000;

const checkAiQuota = async (req, res, next) => {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ error: 'unauthenticated' });

    const user = await User.findById(userId)
        .select('subscriptionPlan trialActive trialStartDate aiCallsUsedThisMonth institutionId')
        .lean();
    if (!user) return res.status(401).json({ error: 'user_not_found' });

    // --- Trial expiry check ---
    if (user.trialActive && Date.now() > new Date(user.trialStartDate).getTime() + TRIAL_MS) {
        return res.status(402).json({ error: 'trial_expired' });
    }

    // --- Institution pool check ---
    if (user.institutionId) {
        const institution = await Institution.findById(user.institutionId)
            .select('plan aiCallsUsedThisMonth')
            .lean();
        if (institution) {
            const plan = getPlan(institution.plan);
            if (plan.monthlyCallQuota > 0 && institution.aiCallsUsedThisMonth >= plan.monthlyCallQuota) {
                return res.status(402).json({ error: 'quota_exceeded' });
            }
            return next(); // institution user within quota — allow
        }
    }

    // --- Individual quota check ---
    const plan = getPlan(user.subscriptionPlan);
    if (plan.monthlyCallQuota > 0 && user.aiCallsUsedThisMonth >= plan.monthlyCallQuota) {
        return res.status(402).json({ error: 'quota_exceeded' });
    }

    // FREE plans (quota === 0) also mean AI is disabled
    if (plan.monthlyCallQuota === 0 && !user.trialActive) {
        return res.status(402).json({ error: 'quota_exceeded' });
    }

    next();
};

module.exports = { checkAiQuota };