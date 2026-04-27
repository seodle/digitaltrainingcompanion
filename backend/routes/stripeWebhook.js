const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const User = require('../models/userModel');

const FREE_PLAN_FOR = (planId) =>
    planId?.includes('TEACHER') ? 'FREE_TEACHER' : 'FREE_TRAINER';

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
                await User.findByIdAndUpdate(userId, {
                    subscriptionPlan: planId,
                    stripeCustomerId: session.customer,
                    stripeSubscriptionId: session.subscription,
                    trialActive: false,
                });
                break;
            }
            case 'customer.subscription.updated': {
                const sub = event.data.object;
                const user = await User.findOne({ stripeSubscriptionId: sub.id });
                if (user) {
                    // planId stored in subscription metadata
                    const planId = sub.metadata?.planId;
                    if (planId) await User.findByIdAndUpdate(user._id, { subscriptionPlan: planId });
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