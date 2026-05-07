const mongoose = require("mongoose");

const institutionSchema = new mongoose.Schema({
    name: { type: String, required: true },
    plan: { type: String, required: true },
    authorizedEmailDomains: { type: [String], default: [] },
    isResearchProject: { type: Boolean, default: false },

    // AI call pool (shared across all institution members)
    aiCallsUsedThisMonth: { type: Number, default: 0 },
    aiCallsResetDate: {
        type: Date,
        default: () => {
            const d = new Date();
            d.setMonth(d.getMonth() + 1, 1);
            d.setHours(0, 0, 0, 0);
            return d;
        },
    },

      // Stripe (institution billing)
    stripeCustomerId: { type: String, default: null },
    stripeSubscriptionId: { type: String, default: null },

    adminUserId: { type: mongoose.Schema.Types.ObjectId, ref: "Users", default: null },

    creationDate: { type: Date, default: Date.now },
});

institutionSchema.index({ stripeCustomerId: 1 }, { sparse: true });
institutionSchema.index({ stripeSubscriptionId: 1 }, { sparse: true });

const model = mongoose.model("Institution", institutionSchema);
module.exports = model;