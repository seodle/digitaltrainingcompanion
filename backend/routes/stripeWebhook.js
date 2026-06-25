const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const User = require('../models/userModel');
const Institution = require('../models/institutionModel');
const { stripePriceIdFromSubscriptionItem } = require('../utils/stripePriceId');
const { subscriptionScheduleFromStripeSub } = require('../utils/stripeSubscriptionSchedule');

const FREE_PLAN_FOR = (planId) =>
    planId?.includes('TEACHER') ? 'FREE_TEACHER' : 'FREE_TRAINER';

const stripeStatusPatchFromSub = (sub) => ({
    stripeSubscriptionStatus: sub.status,
    stripeTrialEnd:
        sub.trial_end != null ? new Date(sub.trial_end * 1000) : null,
});

router.post('/', express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;
    try {
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        console.error('[webhook] Invalid signature:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object;
                const { userId, planId } = session.metadata;
                const patch = {
                    subscriptionPlan: planId,
                    stripeCustomerId: session.customer,
                    stripeSubscriptionId: session.subscription,
                    trialActive: false,
                    trialExpiresAt: null,
                    subscriptionCancelAtPeriodEnd: false,
                    subscriptionCurrentPeriodEnd: null,
                };
                if (session.subscription) {
                    const sub = await stripe.subscriptions.retrieve(session.subscription);
                    Object.assign(patch, stripeStatusPatchFromSub(sub));
                }
                await User.findByIdAndUpdate(userId, patch);
                break;
            }
            case 'customer.subscription.updated': {
                const sub = event.data.object;
                let user = await User.findOne({ stripeSubscriptionId: sub.id });
                if (!user && sub.customer) {
                    const cid = typeof sub.customer === 'string' ? sub.customer : sub.customer.id;
                    user = await User.findOne({ stripeCustomerId: cid });
                }
                if (user) {
                    const items = sub.items?.data || [];
                    const firstPriceId = stripePriceIdFromSubscriptionItem(items[0]);
                    const PLAN_PRICE_IDS = {
                        PRO_TRAINER: process.env.STRIPE_PRICE_PRO_TRAINER,
                        PRO_PLUS_TRAINER: process.env.STRIPE_PRICE_PRO_PLUS_TRAINER,
                        ULTRA_TRAINER: process.env.STRIPE_PRICE_ULTRA_TRAINER,
                        PRO_TEACHER: process.env.STRIPE_PRICE_PRO_TEACHER,
                        INSTITUTION_XS: process.env.STRIPE_PRICE_INSTITUTION_XS,
                        INSTITUTION_S: process.env.STRIPE_PRICE_INSTITUTION_S,
                        INSTITUTION_M: process.env.STRIPE_PRICE_INSTITUTION_M,
                    };
                    let planFromPrice = null;
                    if (firstPriceId) {
                        for (const [planId, envPrice] of Object.entries(PLAN_PRICE_IDS)) {
                            if (envPrice && envPrice === firstPriceId) {
                                planFromPrice = planId;
                                break;
                            }
                        }
                    }
                    const stripeSchedulePatch = subscriptionScheduleFromStripeSub(sub);
                    const stripeMetaPatch = stripeStatusPatchFromSub(sub);
                    const planId = planFromPrice || sub.metadata?.planId;
                        typeof sub.customer === 'string' ? sub.customer : sub.customer?.id;
                        if (planId) {
                            await User.findByIdAndUpdate(user._id, {
                                subscriptionPlan: planId,
                                stripeSubscriptionId: sub.id,
                                ...stripeSchedulePatch,
                                ...stripeMetaPatch,
                                ...(customerId ? { stripeCustomerId: customerId } : {}),
                            });
                        } else {
                            await User.findByIdAndUpdate(user._id, {
                                ...stripeSchedulePatch,
                                ...stripeMetaPatch,
                            });
                        }
                }
                break;
            }
            case 'customer.subscription.deleted': {
                const sub = event.data.object;
                const user = await User.findOne({ stripeSubscriptionId: sub.id });
                if (user) {
                    await User.findByIdAndUpdate(user._id, {
                        subscriptionPlan: FREE_PLAN_FOR(user.subscriptionPlan),
                        stripeSubscriptionId: null,
                        subscriptionCancelAtPeriodEnd: false,
                        subscriptionCurrentPeriodEnd: null,
                        stripeSubscriptionStatus: null,
                        stripeTrialEnd: null,
                    });
                }
                break;
            }
            case 'invoice.payment_succeeded': {
                const invoice = event.data.object;
                const user = await User.findOne({ stripeCustomerId: invoice.customer });
                if (user) {
                    await User.findByIdAndUpdate(user._id, { aiCallsUsedThisMonth: 0 });    
                }
                const institution = await Institution.findOne({ stripeCustomerId: invoice.customer });
                if (institution) {
                    await Institution.findByIdAndUpdate(institution._id, { aiCallsUsedThisMonth: 0 });
                }
                break;
            }
            case 'invoice.payment_failed': {
                console.warn('[webhook] Payment failed for customer:', event.data.object.customer);
                break;
            }
        }
        res.json({ received: true });
    } catch (err) {
        console.error('[webhook] Handler error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;