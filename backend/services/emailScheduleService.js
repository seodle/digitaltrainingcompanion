const Monitoring = require("../models/monitoringModel");
const Assessment = require("../models/assessmentModel");
const EMAIL_LANGS = ["en", "fr", "de", "it", "es"];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const normalizeEmails = (emails) => {
    const unique = [...new Set(
        (emails || [])
            .map((email) => String(email || "").trim().toLowerCase())
            .filter(Boolean)
    )];
    const invalid = unique.filter((email) => !EMAIL_REGEX.test(email));
    if (invalid.length) {
        const error = new Error(`Invalid email(s): ${invalid.join(", ")}`);
        error.status = 400;
        throw error;
    }
    return unique;
};

const getEmailSchedule = async (monitoringId) => {
    const monitoring = await Monitoring.findById(monitoringId)
        .select("scheduledEmailRecipients scheduledEmailLanguage name");
    if (!monitoring) {
        const error = new Error("Monitoring not found");
        error.status = 404;
        throw error;
    }

    const assessments = await Assessment.find({ monitoringId: String(monitoringId) })
        .select("_id name scheduledSendAt scheduledSendStatus");

    return {
        emails: monitoring.scheduledEmailRecipients || [],
        language: monitoring.scheduledEmailLanguage || "en",
        assessments,
    };
};

const updateEmailSchedule = async (monitoringId, { emails, assessmentIds, scheduledSendAt, language }) => {
    const normalizedEmails = normalizeEmails(emails);
    if (normalizedEmails.length === 0) {
        const error = new Error("At least one email address is required");
        error.status = 400;
        throw error;
    }

    const ids = Array.isArray(assessmentIds)
        ? assessmentIds.map((id) => String(id || "").trim()).filter(Boolean)
        : [];
    if (ids.length === 0) {
        const error = new Error("At least one assessment is required");
        error.status = 400;
        throw error;
    }

    const sendAt = scheduledSendAt ? new Date(scheduledSendAt) : null;
    if (!sendAt || Number.isNaN(sendAt.getTime())) {
        const error = new Error("A valid date and time is required");
        error.status = 400;
        throw error;
    }
    if (sendAt.getTime() <= Date.now()) {
        const error = new Error("The scheduled date must be in the future");
        error.status = 400;
        throw error;
    }

    const monitoring = await Monitoring.findById(monitoringId);
    if (!monitoring) {
        const error = new Error("Monitoring not found");
        error.status = 404;
        throw error;
    }

    const assessments = await Assessment.find({
        _id: { $in: ids },
        monitoringId: String(monitoringId),
    }).select("_id");

    if (assessments.length !== ids.length) {
        const error = new Error("One or more assessments do not belong to this monitoring");
        error.status = 400;
        throw error;
    }

    const scheduledLanguage = String(language || "en").toLowerCase().slice(0, 2);
    if (!EMAIL_LANGS.includes(scheduledLanguage)) {
        const error = new Error("language must be one of: en, fr, de, it, es");
        error.status = 400;
        throw error;
    }

    monitoring.scheduledEmailRecipients = normalizedEmails;
    monitoring.scheduledEmailLanguage = scheduledLanguage;
    await monitoring.save();

    await Assessment.updateMany(
        { _id: { $in: ids }, monitoringId: String(monitoringId) },
        {
            $set: {
                scheduledSendAt: sendAt,
                scheduledSendStatus: "pending",
            },
        }
    );

    const updatedAssessments = await Assessment.find({ _id: { $in: ids } })
        .select("_id name scheduledSendAt scheduledSendStatus");

    return {
        emails: normalizedEmails,
        language: monitoring.scheduledEmailLanguage,
        assessments: updatedAssessments,
    };
};

const cancelEmailSchedule = async (monitoringId, assessmentIds) => {
    const ids = Array.isArray(assessmentIds)
        ? assessmentIds.map((id) => String(id || "").trim()).filter(Boolean)
        : [];
    if (ids.length === 0) {
        const error = new Error("At least one assessment is required");
        error.status = 400;
        throw error;
    }

    const monitoring = await Monitoring.findById(monitoringId).select("_id");
    if (!monitoring) {
        const error = new Error("Monitoring not found");
        error.status = 404;
        throw error;
    }

    const assessments = await Assessment.find({
        _id: { $in: ids },
        monitoringId: String(monitoringId),
    }).select("_id");

    if (assessments.length !== ids.length) {
        const error = new Error("One or more assessments do not belong to this monitoring");
        error.status = 400;
        throw error;
    }

    await Assessment.updateMany(
        {
            _id: { $in: ids },
            monitoringId: String(monitoringId),
            scheduledSendStatus: "pending",
        },
        {
            $set: {
                scheduledSendAt: null,
                scheduledSendStatus: null,
            },
        }
    );

    const updatedAssessments = await Assessment.find({ _id: { $in: ids } })
        .select("_id name scheduledSendAt scheduledSendStatus");

    return {
        assessments: updatedAssessments,
    };
};

module.exports = {
    getEmailSchedule,
    updateEmailSchedule,
    cancelEmailSchedule,
};
