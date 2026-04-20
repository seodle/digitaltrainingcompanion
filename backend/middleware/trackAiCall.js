const User = require('../models/userModel');
const Institution = require('../models/institutionModel');

/**
 * Middleware that increments the AI call counter after a successful (2xx) response.
 * - Handles monthly reset if aiCallsResetDate has passed.
 * - If the user belongs to an institution, also increments the institution pool.
 *
 * Must be placed AFTER getUser (so req.user is populated).
 * Does not block the response — the increment happens on the 'finish' event.
 */
const trackAiCall = (req, res, next) => {
    res.on('finish', async () => {
        // Only count successful responses
        if (res.statusCode < 200 || res.statusCode >= 300) return;

        // req.user comes from JWT — may be missing on unauthenticated routes
        const userId = req.user?._id;
        if (!userId) return;

        try {
            const user = await User.findById(userId).select(
                'aiCallsUsedThisMonth aiCallsResetDate institutionId'
            );
            if (!user) return;

            const now = new Date();
            const needsReset = user.aiCallsResetDate && now >= user.aiCallsResetDate;

            if (needsReset) {
                // Reset counter for the new month
                const nextReset = new Date(now);
                nextReset.setMonth(nextReset.getMonth() + 1, 1);
                nextReset.setHours(0, 0, 0, 0);

                await User.findByIdAndUpdate(userId, {
                    $set: {
                        aiCallsUsedThisMonth: 1,
                        aiCallsResetDate: nextReset,
                    },
                });
            } else {
                await User.findByIdAndUpdate(userId, {
                    $inc: { aiCallsUsedThisMonth: 1 },
                });
            }

            // If user belongs to an institution, increment the shared pool too
            if (user.institutionId) {
                const institution = await Institution.findById(user.institutionId).select(
                    'aiCallsUsedThisMonth aiCallsResetDate'
                );
                if (!institution) return;

                const institutionNeedsReset =
                    institution.aiCallsResetDate && now >= institution.aiCallsResetDate;

                if (institutionNeedsReset) {
                    const nextReset = new Date(now);
                    nextReset.setMonth(nextReset.getMonth() + 1, 1);
                    nextReset.setHours(0, 0, 0, 0);

                    await Institution.findByIdAndUpdate(user.institutionId, {
                        $set: {
                            aiCallsUsedThisMonth: 1,
                            aiCallsResetDate: nextReset,
                        },
                    });
                } else {
                    await Institution.findByIdAndUpdate(user.institutionId, {
                        $inc: { aiCallsUsedThisMonth: 1 },
                    });
                }
            }
        } catch (err) {
            // Never crash the app over a tracking failure — just log it
            console.error('[trackAiCall] Failed to record AI call:', err.message);
        }
    });

    next();
};

module.exports = { trackAiCall };