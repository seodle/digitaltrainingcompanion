const cron = require("node-cron");
const Assessment = require("../models/assessmentModel");
const Monitoring = require("../models/monitoringModel");
const User = require("../models/userModel");
const { sendMail, FRONTEND_URL, t } = require("../services/emailService");
const { buildParticipantHtml, buildOwnerHtml } = require("../utils/emailTemplates");

const sendingLocks = new Set();

const buildSurveyUrl = (owner, monitoringId, assessments, lang) => {
    const assessmentsQuery = assessments
        .map((assessment) => `assessment[]=${assessment._id}`)
        .join("&");
    const sandbox = owner && owner.sandbox ? "true" : "false";
    return `${FRONTEND_URL}/completeSurvey?userId=${owner._id}&monitoring=${monitoringId}&${assessmentsQuery}&link=false&lng=${lang}&sandbox=${sandbox}`;
};

const processDueScheduledEmails = async () => {
    const dueAssessments = await Assessment.find({
        scheduledSendStatus: "pending",
        scheduledSendAt: { $lte: new Date() },
    });

    const unlocked = dueAssessments.filter((assessment) => !sendingLocks.has(String(assessment._id)));
    if (unlocked.length === 0) {
        return;
    }

    const byMonitoring = new Map();
    unlocked.forEach((assessment) => {
        const monitoringId = String(assessment.monitoringId || "");
        if (!monitoringId) {
            return;
        }
        if (!byMonitoring.has(monitoringId)) {
            byMonitoring.set(monitoringId, []);
        }
        byMonitoring.get(monitoringId).push(assessment);
    });

    for (const [monitoringId, assessments] of byMonitoring.entries()) {
        const idsToLock = assessments.map((assessment) => String(assessment._id));
        idsToLock.forEach((id) => sendingLocks.add(id));

        try {
            const closedIds = assessments
                .filter((assessment) => assessment.status === "Close")
                .map((assessment) => assessment._id);
            if (closedIds.length > 0) {
                await Assessment.updateMany(
                    { _id: { $in: closedIds } },
                    { $set: { scheduledSendAt: null, scheduledSendStatus: null } }
                );
            }

            const openAssessments = assessments.filter((assessment) => assessment.status === "Open");
            if (openAssessments.length === 0) {
                continue;
            }

            const monitoring = await Monitoring.findById(monitoringId)
                .select("name userId scheduledEmailRecipients scheduledEmailLanguage");
            if (!monitoring) {
                continue;
            }

            const recipients = (monitoring.scheduledEmailRecipients || [])
                .map((email) => String(email).trim().toLowerCase())
                .filter(Boolean);
            if (recipients.length === 0) {
                console.warn(`Skipping scheduled send for monitoring ${monitoringId}: no recipients`);
                continue;
            }

            const owner = await User.findById(monitoring.userId).select("email sandbox firstName lastName language");
            if (!owner) {
                console.warn(`Skipping scheduled send for monitoring ${monitoringId}: owner not found`);
                continue;
            }

            const lang = monitoring.scheduledEmailLanguage || owner.language;
            const surveyUrl = buildSurveyUrl(owner, monitoringId, openAssessments, lang);
            const participantHtml = buildParticipantHtml(monitoring, openAssessments, surveyUrl, lang);
            const participantText = t(lang, "invite_text", { name: monitoring.name, url: surveyUrl });

            for (const recipient of recipients) {
                await sendMail({
                    to: recipient,
                    subject: t(lang, "invite_subject", { name: monitoring.name }),
                    html: participantHtml,
                    text: participantText,
                });
            }

            const sentIds = openAssessments.map((assessment) => assessment._id);
            await Assessment.updateMany(
                { _id: { $in: sentIds } },
                { $set: { scheduledSendStatus: "sent" } }
            );

            if (owner.email) {
                await sendMail({
                    to: owner.email,
                    subject: t(lang, "sent_subject", { name: monitoring.name }),
                    html: buildOwnerHtml(monitoring, openAssessments, recipients, lang),
                    text: t(lang, "sent_text", { name: monitoring.name, emails: recipients.join(", ") }),
                });
            }
        } catch (error) {
            console.error(`Error sending scheduled questionnaires for monitoring ${monitoringId}:`, error);
        } finally {
            idsToLock.forEach((id) => sendingLocks.delete(id));
        }
    }
};

const startScheduledQuestionnaireJob = () => {
    cron.schedule("* * * * *", async () => {
        try {
            await processDueScheduledEmails();
        } catch (error) {
            console.error("Scheduled questionnaire job failed:", error);
        }
    });
    console.log("Scheduled questionnaire email job started (every minute).");
};

module.exports = {
    startScheduledQuestionnaireJob,
    processDueScheduledEmails,
};
