require('dotenv').config({ path: `${__dirname}/../.env` });
const mongoose = require('mongoose');
const User = require('../models/userModel');

const isDevelopment = process.env.NODE_ENV === 'development';
const dbURI = isDevelopment
    ? process.env.DB_URI_DEVELOPMENT
    : process.env.DB_URI_PRODUCTION;

function getNextMonthFirstDay() {
    const d = new Date();
    d.setMonth(d.getMonth() + 1, 1);
    d.setHours(0, 0, 0, 0);
    return d;
}

async function migrate() {
    console.log(`Connecting to ${isDevelopment ? 'development' : 'production'} DB…`);
    await mongoose.connect(dbURI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });
    console.log('Connected.');

    const resetDate = getNextMonthFirstDay();
    const commonFields = {
        trialActive: false,
        aiCallsUsedThisMonth: 0,
        aiCallsResetDate: resetDate,
        institutionId: null,
        isResearchProject: false,
        stripeCustomerId: null,
        stripeSubscriptionId: null,
    };

    // Teachers → FREE_TEACHER
    const teachers = await User.updateMany(
        { subscriptionPlan: { $exists: false }, userStatus: 'Teacher' },
        { $set: { subscriptionPlan: 'FREE_TEACHER', ...commonFields } }
    );
    console.log(`Migrated ${teachers.modifiedCount} Teacher(s) → FREE_TEACHER`);

    // Teacher-trainers and everyone else → FREE_TRAINER
    const trainers = await User.updateMany(
        { subscriptionPlan: { $exists: false } },
        { $set: { subscriptionPlan: 'FREE_TRAINER', ...commonFields } }
    );
    console.log(`Migrated ${trainers.modifiedCount} Trainer(s)/other → FREE_TRAINER`);

    // Verify
    const remaining = await User.countDocuments({ subscriptionPlan: { $exists: false } });
    if (remaining > 0) {
        console.warn(`WARNING: ${remaining} user(s) still missing subscriptionPlan!`);
    } else {
        console.log('All users migrated. Migration complete.');
    }

    await mongoose.disconnect();
    process.exit(0);
}

migrate().catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
});