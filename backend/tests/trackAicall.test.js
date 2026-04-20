import { beforeAll, afterAll, beforeEach, describe, test, expect } from 'vitest';
const mongoose = require('mongoose');
const { EventEmitter } = require('events');
const User = require('../models/userModel');
const Institution = require('../models/institutionModel');
const { trackAiCall } = require('../middleware/trackAiCall');

const TEST_DB = 'mongodb://localhost:27017/test_digitaltrainingcompanion';

// Helper: build a fake req with a user id in req.user
const makeReq = (userId) => ({ user: userId ? { _id: userId } : undefined });

// Helper: build a fake res that emits 'finish' with a given status code
const makeRes = (statusCode) => {
    const emitter = new EventEmitter();
    emitter.statusCode = statusCode;
    return emitter;
};

// Helper: call the middleware and wait for the finish handler to complete
const runMiddleware = (req, res) => {
    return new Promise((resolve) => {
        const next = () => {
            // Simulate the route sending a response
            res.emit('finish');
            // Give the async finish handler time to complete
            setTimeout(resolve, 100);
        };
        trackAiCall(req, res, next);
    });
};

let testUserId;
let testInstitutionId;

beforeAll(async () => {
    await mongoose.connect(TEST_DB);
});

afterAll(async () => {
    await User.deleteMany({ email: /@tracktest\.com$/ });
    await Institution.deleteMany({ name: /TrackTest/ });
    await mongoose.disconnect();
});

beforeEach(async () => {
    // Fresh user for each test
    const user = await User.create({
        firstName: 'Track',
        lastName: 'Test',
        email: `track-${Date.now()}@tracktest.com`,
        password: 'secret',
        termsAccepted: true,
        subscriptionPlan: 'PRO_TRAINER',
        trialActive: false,
        aiCallsUsedThisMonth: 0,
        aiCallsResetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // future
    });
    testUserId = user._id;
});

// ─── Basic increment ──────────────────────────────────────────────────────────

describe('successful response (2xx)', () => {
    test('increments aiCallsUsedThisMonth by 1', async () => {
        await runMiddleware(makeReq(testUserId), makeRes(200));

        const updated = await User.findById(testUserId).select('aiCallsUsedThisMonth');
        expect(updated.aiCallsUsedThisMonth).toBe(1);
    });

    test('increments again on a second call', async () => {
        await runMiddleware(makeReq(testUserId), makeRes(200));
        await runMiddleware(makeReq(testUserId), makeRes(200));

        const updated = await User.findById(testUserId).select('aiCallsUsedThisMonth');
        expect(updated.aiCallsUsedThisMonth).toBe(2);
    });
});

// ─── Non-2xx responses ────────────────────────────────────────────────────────

describe('error response (non-2xx)', () => {
    test('does NOT increment on 500', async () => {
        await runMiddleware(makeReq(testUserId), makeRes(500));

        const updated = await User.findById(testUserId).select('aiCallsUsedThisMonth');
        expect(updated.aiCallsUsedThisMonth).toBe(0);
    });

    test('does NOT increment on 402', async () => {
        await runMiddleware(makeReq(testUserId), makeRes(402));

        const updated = await User.findById(testUserId).select('aiCallsUsedThisMonth');
        expect(updated.aiCallsUsedThisMonth).toBe(0);
    });
});

// ─── No authenticated user ────────────────────────────────────────────────────

describe('unauthenticated request', () => {
    test('does nothing gracefully when req.user is missing', async () => {
        await runMiddleware(makeReq(null), makeRes(200));
        // No error thrown, nothing written to DB — just passes silently
    });
});

// ─── Monthly reset ────────────────────────────────────────────────────────────

describe('monthly reset', () => {
    test('resets counter to 1 when aiCallsResetDate has passed', async () => {
        // Set the user's reset date in the past
        await User.findByIdAndUpdate(testUserId, {
            $set: {
                aiCallsUsedThisMonth: 42,
                aiCallsResetDate: new Date(Date.now() - 1000), // 1 second ago
            },
        });

        await runMiddleware(makeReq(testUserId), makeRes(200));

        const updated = await User.findById(testUserId).select(
            'aiCallsUsedThisMonth aiCallsResetDate'
        );
        expect(updated.aiCallsUsedThisMonth).toBe(1);
        // New reset date should be in the future
        expect(updated.aiCallsResetDate.getTime()).toBeGreaterThan(Date.now());
    });
});

// ─── Institution pool ─────────────────────────────────────────────────────────

describe('institution user', () => {
    beforeEach(async () => {
        const institution = await Institution.create({
            name: 'TrackTest Institution',
            plan: 'INSTITUTION_XS',
            aiCallsUsedThisMonth: 0,
            aiCallsResetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        });
        testInstitutionId = institution._id;

        // Link the test user to the institution
        await User.findByIdAndUpdate(testUserId, {
            $set: { institutionId: testInstitutionId },
        });
    });

    test('increments both user and institution counters', async () => {
        await runMiddleware(makeReq(testUserId), makeRes(200));

        const user = await User.findById(testUserId).select('aiCallsUsedThisMonth');
        const institution = await Institution.findById(testInstitutionId).select(
            'aiCallsUsedThisMonth'
        );

        expect(user.aiCallsUsedThisMonth).toBe(1);
        expect(institution.aiCallsUsedThisMonth).toBe(1);
    });
});