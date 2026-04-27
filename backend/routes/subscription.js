const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const User = require('../models/userModel');

const PLAN_PRICE_IDS = {
    PRO_TRAINER:      process.env.STRIPE_PRICE_PRO_TRAINER,
    PRO_PLUS_TRAINER: process.env.STRIPE_PRICE_PRO_PLUS_TRAINER,
    ULTRA_TRAINER:    process.env.STRIPE_PRICE_ULTRA_TRAINER,
    PRO_TEACHER:      process.env.STRIPE_PRICE_PRO_TEACHER,
    INSTITUTION_XS:   process.env.STRIPE_PRICE_INSTITUTION_XS,
    INSTITUTION_S:    process.env.STRIPE_PRICE_INSTITUTION_S,
    INSTITUTION_M:    process.env.STRIPE_PRICE_INSTITUTION_M,
};

const FRONTEND_URL = process.env.NODE_ENV === 'production'
    ? process.env.FRONTEND_URL_DEPLOYMENT
    : process.env.FRONTEND_URL_DEVELOPMENT;

router.post('/checkout', async (req, res) => {
    try {
        const { planId } = req.body;
        const priceId = PLAN_PRICE_IDS[planId];
        if (!priceId) return res.status(400).json({ error: 'invalid_plan' });

        const userId = req.user._id;
        const user = await User.findById(userId).select('email stripeCustomerId').lean();
        if (!user) return res.status(404).json({ error: 'user_not_found' });

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

        const session = await stripe.checkout.sessions.create({
            customer: customerId,
            mode: 'subscription',
            line_items: [{ price: priceId, quantity: 1 }],
            success_url: `${FRONTEND_URL}/settings?tab=1&checkout=success`,
            cancel_url: `${FRONTEND_URL}/?pricingTab=0`,
            metadata: { userId: String(userId), planId },
        });

        res.json({ url: session.url });
    } catch (err) {
        console.error('[checkout]', err.message);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;