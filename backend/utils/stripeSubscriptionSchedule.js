/**
 * Maps a Stripe Subscription object to DB schedule fields.
 * Covers:
 * - cancel_at_period_end === true (classic)
 * - cancel_at set while status is active (Customer Portal / flexible billing; cancel_at_period_end may be false)
 * - current_period_end on subscription root or on first subscription item
 */
function subscriptionScheduleFromStripeSub(sub) {
    if (!sub || typeof sub !== 'object') {
        return {
            subscriptionCancelAtPeriodEnd: false,
            subscriptionCurrentPeriodEnd: null,
        };
    }

    const items = sub.items?.data || [];
    const firstItem = items[0];

    const cancelAtPeriodEndFlag = sub.cancel_at_period_end === true;

    const cancelAtNum = sub.cancel_at != null ? Number(sub.cancel_at) : null;
    const hasCancelAt = cancelAtNum != null && Number.isFinite(cancelAtNum);

    const scheduledWhileActive =
        hasCancelAt &&
        sub.status === 'active' &&
        sub.canceled_at == null;

    const subscriptionCancelAtPeriodEnd =
        cancelAtPeriodEndFlag || scheduledWhileActive;

    let periodEndUnix =
        sub.current_period_end != null && Number.isFinite(Number(sub.current_period_end))
            ? Number(sub.current_period_end)
            : null;

    if (periodEndUnix == null && firstItem?.current_period_end != null) {
        const pe = Number(firstItem.current_period_end);
        if (Number.isFinite(pe)) periodEndUnix = pe;
    }

    if (periodEndUnix == null && hasCancelAt) {
        periodEndUnix = cancelAtNum;
    }

    const subscriptionCurrentPeriodEnd =
        periodEndUnix != null ? new Date(periodEndUnix * 1000) : null;

    return {
        subscriptionCancelAtPeriodEnd,
        subscriptionCurrentPeriodEnd,
    };
}

module.exports = { subscriptionScheduleFromStripeSub };