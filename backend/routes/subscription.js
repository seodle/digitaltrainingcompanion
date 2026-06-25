const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const User = require('../models/userModel');
const { PLANS } = require('../constants/subscriptionPlans');
const { stripePriceIdFromSubscriptionItem } = require('../utils/stripePriceId');
const { subscriptionScheduleFromStripeSub } = require('../utils/stripeSubscriptionSchedule');

const PLAN_PRICE_IDS = {
    PRO_TRAINER:      process.env.STRIPE_PRICE_PRO_TRAINER,
    PRO_PLUS_TRAINER: process.env.STRIPE_PRICE_PRO_PLUS_TRAINER,
    ULTRA_TRAINER:    process.env.STRIPE_PRICE_ULTRA_TRAINER,
    PRO_TEACHER:      process.env.STRIPE_PRICE_PRO_TEACHER,
    INSTITUTION_XS:   process.env.STRIPE_PRICE_INSTITUTION_XS,
    INSTITUTION_S:    process.env.STRIPE_PRICE_INSTITUTION_S,
    INSTITUTION_M:    process.env.STRIPE_PRICE_INSTITUTION_M,
};

/** Map Stripe Price id → app planId (same env vars as checkout). */
function planIdFromStripePriceId(priceId) {
    if (!priceId) return null;
    for (const [planId, envPrice] of Object.entries(PLAN_PRICE_IDS)) {
        if (envPrice && envPrice === priceId) return planId;
    }
    return null;
}

const FRONTEND_URL = process.env.NODE_ENV === 'production'
    ? process.env.FRONTEND_URL_DEPLOYMENT
    : process.env.FRONTEND_URL_DEVELOPMENT;


/** True if customer already has a subscription we should not stack another Checkout on. */
async function customerHasBlockingSubscription(customerId) {
    const { data } = await stripe.subscriptions.list({
        customer: customerId,
        limit: 20,
    });
    return data.some((sub) => sub.status === 'active' || sub.status === 'trialing');
}

router.post('/checkout', async (req, res) => {
    try {
        const { planId } = req.body;
        const priceId = PLAN_PRICE_IDS[planId];
        if (!priceId) return res.status(400).json({ error: 'invalid_plan' });

        const userId = req.user._id;
        const user = await User.findById(userId)
        .select('email userStatus stripeCustomerId subscriptionPlan stripeSubscriptionId')
        .lean();
        if (!user) return res.status(404).json({ error: 'user_not_found' });
        const planConfig = PLANS[planId];
        if (!planConfig) {
            return res.status(400).json({ error: 'invalid_plan' });
        }
        if (planConfig.audience === 'trainer' && user.userStatus !== 'Teacher-trainer') {
            return res.status(403).json({ error: 'plan_role_mismatch' });
        }
        if (planConfig.audience === 'teacher' && user.userStatus !== 'Teacher') {
            return res.status(403).json({ error: 'plan_role_mismatch' });
        }

        // Reuse or create Stripe customer
        let customerId = user.stripeCustomerId;
        if (!customerId) {
            const customer = await stripe.customers.create({
                email: user.email,
                metadata: { userId: String(userId) },
            });
            customerId = customer.id;
            await User.findByIdAndUpdate(userId, { stripeCustomerId: customerId });
        }

        if (await customerHasBlockingSubscription(customerId)) {
            return res.status(409).json({
                error: 'active_subscription_exists',
                message:
                    'You already have an active subscription on this account. Use Settings → subscription / Manage plan (billing portal) to change or cancel before subscribing again.',
            });
        }

        const line_items = [{ price: priceId, quantity: 1 }];

        const session = await stripe.checkout.sessions.create({
            customer: customerId,
            mode: 'subscription',
            line_items: line_items,
            success_url: `${FRONTEND_URL}/settings?tab=1&checkout=success&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${FRONTEND_URL}/?pricingTab=0`,
            metadata: { userId: String(userId), planId },
            subscription_data: {
                trial_period_days: 14,
                metadata: { planId },
            },
        });

        res.json({ url: session.url });
    } catch (err) {
        console.error('[checkout]', err.message);
        res.status(500).json({ error: err.message });
    }
});

router.post('/billing-portal', async (req, res) => {
    try {
        const userId = req.user._id;
        const user = await User.findById(userId)
            .select('stripeCustomerId stripeSubscriptionId')
            .lean();
        if (!user?.stripeCustomerId) {
            return res.status(400).json({ error: 'no_stripe_customer' });
        }

        if (!user.stripeSubscriptionId) {
            const { data } = await stripe.subscriptions.list({
                customer: user.stripeCustomerId,
                status: 'active',
                limit: 1,
            });
            if (data.length === 0) {
                return res.status(400).json({ error: 'no_active_subscription' });
            }
            await User.findByIdAndUpdate(userId, { stripeSubscriptionId: data[0].id });
        }

        const session = await stripe.billingPortal.sessions.create({
            customer: user.stripeCustomerId,
            return_url: `${FRONTEND_URL}/settings?tab=1&billing_sync=1`,
        });

        res.json({ url: session.url });
    } catch (err) {
        console.error('[billing-portal]', err.message);
        res.status(500).json({ error: err.message });
    }
});

router.post('/sync-checkout', async (req, res) => {
    try {
        const { sessionId } = req.body;
        if (!sessionId) {
            return res.status(400).json({ error: 'session_id_required' });
        }

        const session = await stripe.checkout.sessions.retrieve(sessionId);

        if (session.mode !== 'subscription') {
            return res.status(400).json({ error: 'invalid_session_mode' });
        }
        const paymentOk = ['paid', 'no_payment_required'].includes(session.payment_status);
        if (!paymentOk) {
            return res.status(400).json({ error: 'payment_not_complete' });
        }

        const metaUserId = session.metadata?.userId;
        const planId = session.metadata?.planId;
        if (!metaUserId || !planId) {
            return res.status(400).json({ error: 'missing_session_metadata' });
        }

        if (String(req.user._id) !== String(metaUserId)) {
            return res.status(403).json({ error: 'session_user_mismatch' });
        }

        const userPatch = {
            subscriptionPlan: planId,
            stripeCustomerId: session.customer || undefined,
            stripeSubscriptionId: session.subscription || undefined,
            trialActive: false,
            trialExpiresAt: null,
            subscriptionCancelAtPeriodEnd: false,
            subscriptionCurrentPeriodEnd: null,
        };

        if (session.subscription) {
            const sub = await stripe.subscriptions.retrieve(session.subscription);
            userPatch.stripeSubscriptionStatus = sub.status;
            userPatch.stripeTrialEnd =
                sub.trial_end != null ? new Date(sub.trial_end * 1000) : null;
        }

        await User.findByIdAndUpdate(metaUserId, userPatch);

        res.json({ ok: true, planId });
    } catch (err) {
        console.error('[sync-checkout]', err.message);
        res.status(500).json({ error: err.message });
    }
});

router.post('/sync-subscription-from-stripe', async (req, res) => {
    try {
        const userId = req.user._id;
        const user = await User.findById(userId)
            .select('stripeCustomerId stripeSubscriptionId')
            .lean();
        if (!user?.stripeCustomerId) {
            return res.status(400).json({ error: 'no_stripe_customer' });
        }

        let subId = user.stripeSubscriptionId;
        if (!subId) {
            const { data } = await stripe.subscriptions.list({
                customer: user.stripeCustomerId,
                limit: 20,
            });
            const subRow = data.find(
                (s) => s.status === 'active' || s.status === 'trialing',
            );
            if (!subRow) {
                return res.status(400).json({ error: 'no_active_subscription' });
            }
            subId = subRow.id;
            await User.findByIdAndUpdate(userId, { stripeSubscriptionId: subId });
        }

        const sub = await stripe.subscriptions.retrieve(subId);
        const {
            subscriptionCancelAtPeriodEnd: cancelAtEnd,
            subscriptionCurrentPeriodEnd: periodEnd,
        } = subscriptionScheduleFromStripeSub(sub);
        const items = sub.items?.data || [];
        const firstPriceId = stripePriceIdFromSubscriptionItem(items[0]);
        const planFromPrice = planIdFromStripePriceId(firstPriceId);
        const planId = planFromPrice || sub.metadata?.planId;

        const customerId =
        typeof sub.customer === 'string' ? sub.customer : sub.customer?.id;

        const update = {
            stripeSubscriptionId: sub.id,
            subscriptionCancelAtPeriodEnd: cancelAtEnd,
            subscriptionCurrentPeriodEnd: periodEnd,
            stripeSubscriptionStatus: sub.status,
            stripeTrialEnd:
                sub.trial_end != null ? new Date(sub.trial_end * 1000) : null,
            ...(customerId ? { stripeCustomerId: customerId } : {}),
        };
        if (planId) {
            update.subscriptionPlan = planId;
        }

        await User.findByIdAndUpdate(userId, update);

        if (!planId) {
            return res.status(400).json({ error: 'could_not_resolve_plan' });
        }

        res.json({ ok: true, planId });
    } catch (err) {
        console.error('[sync-subscription-from-stripe]', err.message);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;