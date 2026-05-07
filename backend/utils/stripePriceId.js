/**
 * Stripe may return subscription item.price as a string id or a Price object.
 */
function stripePriceIdFromSubscriptionItem(item) {
    if (!item?.price) return null;
    const p = item.price;
    return typeof p === 'string' ? p : p.id ?? null;
}

module.exports = { stripePriceIdFromSubscriptionItem };