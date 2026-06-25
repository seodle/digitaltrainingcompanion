const User = require('../models/userModel');
const Monitoring = require('../models/monitoringModel');
const Institution = require('../models/institutionModel');
const { getPlan, TRIAL_DURATION_DAYS, canMakeAiCall } = require('../constants/subscriptionPlans');
const TRIAL_MS = TRIAL_DURATION_DAYS * 24 * 60 * 60 * 1000;

const checkAiQuota = async (req, res, next) => {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ error: 'unauthenticated' });

    const user = await User.findById(userId)
        .select('subscriptionPlan trialActive trialStartDate aiCallsUsedThisMonth institutionId sharingCodeRedeemed')
        .lean();
    if (!user) return res.status(401).json({ error: 'user_not_found' });

    // --- Trial expiry check (manual / granted free-AI only; requires trialStartDate) ---
    if (user.trialActive) {
        const expiresAt = user.trialExpiresAt
            ? new Date(user.trialExpiresAt).getTime()
            : user.trialStartDate
                ? new Date(user.trialStartDate).getTime() + TRIAL_MS
                : null;
        if (expiresAt && Date.now() > expiresAt) {
            return res.status(402).json({ error: 'trial_expired' });
        }
    }

    // --- Monitoring pool check (shared monitoring — charge to owner) ---
    const monitoringId = req.body?.monitoringId;
    if (monitoringId) {
        const monitoring = await Monitoring.findById(monitoringId).select('userId sharingCode').lean();
        if (!monitoring) {
            return res.status(400).json({ error: 'monitoring_not_found' });
        }
        if (String(monitoring.userId) !== String(userId)) {
            const shareCode = monitoring.sharingCode;
            const redeemed = user.sharingCodeRedeemed || [];
            if (!shareCode || !redeemed.includes(shareCode)) {
                return res.status(403).json({ error: 'not_monitoring_redeemer' });
            }
            const owner = await User.findById(monitoring.userId)
                .select('subscriptionPlan aiCallsUsedThisMonth trialActive institutionId')
                .lean();
            if (owner) {
                const ownerPlan = getPlan(owner.subscriptionPlan);
                if (!ownerPlan.features?.sharingEnabled) {
                    return res.status(402).json({ error: 'sharing_not_enabled' });
                }
                if (!canMakeAiCall(ownerPlan, owner.aiCallsUsedThisMonth)) {
                    return res.status(402).json({ error: 'quota_exceeded' });
                }
                req.billingUserId = String(monitoring.userId);
                return next();
            }
        }
    }

    // --- Institution pool check ---
    if (user.institutionId) {
        const institution = await Institution.findById(user.institutionId)
            .select('plan aiCallsUsedThisMonth')
            .lean();
        if (institution) {
            const instPlan = getPlan(institution.plan);
            if (instPlan.monthlyCallQuota > 0) {
                if (!canMakeAiCall(instPlan, institution.aiCallsUsedThisMonth)) {
                    return res.status(402).json({ error: 'quota_exceeded' });
                }
            }
            return next();
        }
    }
    
    // --- Individual quota check ---
    const plan = getPlan(user.subscriptionPlan);
    if (plan.monthlyCallQuota > 0) {
        if (!canMakeAiCall(plan, user.aiCallsUsedThisMonth)) {
            return res.status(402).json({ error: 'quota_exceeded' });
        }
    }

    // FREE plans (quota === 0) also mean AI is disabled
    if (plan.monthlyCallQuota === 0 && !user.trialActive) {
        return res.status(402).json({ error: 'quota_exceeded' });
    }

    next();
};

module.exports = { checkAiQuota };