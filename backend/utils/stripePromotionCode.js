const ASSOCIATION_PROMO_DURATION_SECONDS = 365 * 24 * 60 * 60;

const FULL_DISCOUNT_PLANS = new Set(['PRO_TRAINER', 'PRO_TEACHER']);

const ASSOCIATION_ELIGIBLE_PLANS = new Set([
    'PRO_TRAINER',
    'PRO_TEACHER',
    'PRO_PLUS_TRAINER',
    'ULTRA_TRAINER',
    'INSTITUTION_XS',
    'INSTITUTION_S',
    'INSTITUTION_M',
]);

/** Stripe Clover API: coupon lives under promotion.coupon; older responses used top-level coupon. */
function resolvePromotionCouponRef(promo) {
    if (promo.promotion?.type === 'coupon') {
        return promo.promotion.coupon ?? null;
    }
    return promo.coupon ?? null;
}

function getAssociationPoolCouponId() {
    return process.env.STRIPE_ASSOCIATION_COUPON_100PCT || null;
}

/** Stripe coupon for partial discount on Pro+, Ultra, Institution (8.33 CHF/mo × 12). */
function getPartialDiscountCouponId() {
    return process.env.STRIPE_ASSOCIATION_COUPON_8CHF
        || process.env.STRIPE_ASSOCIATION_COUPON_100CHF
        || null;
}

/** Stripe coupon for the plan discount (100% Pro Trainer/Teacher, 8.33 CHF/mo others). */
function getAssociationDiscountCouponId(planId) {
    if (FULL_DISCOUNT_PLANS.has(planId)) {
        const id = getAssociationPoolCouponId();
        if (!id) {
            throw new Error('STRIPE_ASSOCIATION_COUPON_100PCT (100% coupon) is not set');
        }
        return id;
    }
    const id = getPartialDiscountCouponId();
    if (!id) {
        throw new Error('STRIPE_ASSOCIATION_COUPON_8CHF (or STRIPE_ASSOCIATION_COUPON_100CHF) is not set');
    }
    return id;
}

function isAssociationEligiblePlan(planId) {
    return ASSOCIATION_ELIGIBLE_PLANS.has(planId);
}

async function couponAppliesToPrice(stripe, couponId, priceId) {
    const [coupon, price] = await Promise.all([
        stripe.coupons.retrieve(couponId),
        stripe.prices.retrieve(priceId),
    ]);
    const productId = typeof price.product === 'string'
        ? price.product
        : price.product?.id;
    if (!coupon.applies_to?.products?.length || !productId) {
        return true;
    }
    return coupon.applies_to.products.includes(productId);
}

/**
 * Validates an association promotion code and resolves the Stripe coupon to apply for planId.
 * Codes are single-use pool entries; discount coupon is chosen by plan (not the promo's linked coupon).
 */
async function validateAssociationPromotionCode(stripe, promotionCode, planId, priceId) {
    const code = String(promotionCode || '').trim();
    if (!code) {
        return { error: 'promotion_code_required' };
    }

    if (!isAssociationEligiblePlan(planId)) {
        return { error: 'promotion_code_not_applicable' };
    }

    const { data: promoRows } = await stripe.promotionCodes.list({
        code,
        active: true,
        limit: 1,
        expand: ['data.promotion.coupon'],
    });

    const promo = promoRows[0];
    if (!promo) {
        return { error: 'invalid_promotion_code' };
    }

    if (
        promo.max_redemptions != null &&
        promo.times_redeemed >= promo.max_redemptions
    ) {
        return { error: 'promotion_code_exhausted' };
    }

    if (promo.expires_at && promo.expires_at * 1000 <= Date.now()) {
        return { error: 'invalid_promotion_code' };
    }

    const poolCouponId = getAssociationPoolCouponId();
    if (poolCouponId) {
        const linkedRef = resolvePromotionCouponRef(promo);
        const linkedId = typeof linkedRef === 'string' ? linkedRef : linkedRef?.id;
        if (linkedId && linkedId !== poolCouponId) {
            return { error: 'invalid_promotion_code' };
        }
    }

    let discountCouponId;
    try {
        discountCouponId = getAssociationDiscountCouponId(planId);
    } catch (err) {
        console.error('[association-promo]', err.message);
        return { error: 'promotion_code_not_configured' };
    }

    const applies = await couponAppliesToPrice(stripe, discountCouponId, priceId);
    if (!applies) {
        return { error: 'promotion_code_not_applicable' };
    }

    return { promo, discountCouponId };
}

function associationPromoCancelAtUnix() {
    return Math.floor(Date.now() / 1000) + ASSOCIATION_PROMO_DURATION_SECONDS;
}

async function deactivateAssociationPromoCode(stripe, promoCodeId) {
    if (!promoCodeId) return;
    try {
        await stripe.promotionCodes.update(promoCodeId, { active: false });
    } catch (err) {
        console.error('[association-promo] Failed to deactivate promotion code:', err.message);
    }
}

/** Set cancel_at on subscription after Checkout (not supported in subscription_data on Clover API). */
async function applyAssociationPromoCancelAt(stripe, subscriptionId, metadata) {
    if (!subscriptionId || metadata?.associationPromo !== 'true') {
        return null;
    }
    try {
        return await stripe.subscriptions.update(subscriptionId, {
            cancel_at: associationPromoCancelAtUnix(),
        });
    } catch (err) {
        console.error('[association-promo] Failed to set cancel_at:', err.message);
        return null;
    }
}

module.exports = {
    validateAssociationPromotionCode,
    associationPromoCancelAtUnix,
    deactivateAssociationPromoCode,
    applyAssociationPromoCancelAt,
    getAssociationDiscountCouponId,
    isAssociationEligiblePlan,
    ASSOCIATION_PROMO_DURATION_SECONDS,
    FULL_DISCOUNT_PLANS,
    ASSOCIATION_ELIGIBLE_PLANS,
};
