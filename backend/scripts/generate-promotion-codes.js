/**
 * Generate single-use Stripe promotion codes for the association Pro Trainer offer.
 *
 * Prerequisites (backend/.env):
 *   STRIPE_SECRET_KEY
 *   STRIPE_ASSOCIATION_COUPON_100PCT — 100% / 12 mo (Pro Trainer + Pro Teacher); also used for code pool
 *   STRIPE_ASSOCIATION_COUPON_8CHF   — 8.33 CHF/mo × 12 (Pro+, Ultra, Institution)
 *   STRIPE_ASSOCIATION_COUPON_100CHF — legacy alias for COUPON_8CHF
 *
 * Usage:
 *   cd backend
 *   node scripts/generate-promotion-codes.js --count 50
 *   node scripts/generate-promotion-codes.js --count 50 --prefix ASSOC
 *
 * Output: CSV on stdout (code,promotion_code_id) — share codes with the association platform.
 */
require('dotenv').config({ path: `${__dirname}/../.env` });
const crypto = require('crypto');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

function parseArgs() {
    const args = process.argv.slice(2);
    let count = 10;
    let prefix = 'ASSOC';
    for (let i = 0; i < args.length; i++) {
        if (args[i] === '--count' && args[i + 1]) {
            count = Math.min(500, Math.max(1, parseInt(args[i + 1], 10) || 10));
            i++;
        } else if (args[i] === '--prefix' && args[i + 1]) {
            prefix = String(args[i + 1]).replace(/[^A-Za-z0-9]/g, '').slice(0, 8) || 'ASSOC';
            i++;
        }
    }
    return { count, prefix };
}

function randomCodeSegment(len = 4) {
    return crypto.randomBytes(Math.ceil(len / 2))
        .toString('hex')
        .slice(0, len)
        .toUpperCase();
}

function buildCode(prefix) {
    return `${prefix}-${randomCodeSegment(4)}-${randomCodeSegment(4)}`;
}

async function main() {
    const couponId = process.env.STRIPE_ASSOCIATION_COUPON_100PCT;
    if (!couponId) {
        console.error('Error: STRIPE_ASSOCIATION_COUPON_100PCT (100% coupon) must be set in backend/.env');
        process.exit(1);
    }
    if (!process.env.STRIPE_SECRET_KEY) {
        console.error('Error: STRIPE_SECRET_KEY must be set in backend/.env');
        process.exit(1);
    }

    const { count, prefix } = parseArgs();
    console.error(`Creating ${count} promotion code(s) for coupon ${couponId}…`);
    console.log('code,promotion_code_id');

    for (let i = 0; i < count; i++) {
        let code;
        let promo;
        for (let attempt = 0; attempt < 5; attempt++) {
            code = buildCode(prefix);
            try {
                promo = await stripe.promotionCodes.create({
                    promotion: {
                        type: 'coupon',
                        coupon: couponId,
                    },
                    code,
                    max_redemptions: 1,
                });
                break;
            } catch (err) {
                if (attempt === 4) throw err;
            }
        }
        console.log(`${promo.code},${promo.id}`);
    }

    console.error('Done.');
}

main().catch((err) => {
    console.error('Failed:', err.message);
    process.exit(1);
});
