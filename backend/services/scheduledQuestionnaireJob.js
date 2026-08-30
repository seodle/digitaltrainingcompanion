const cron = require("node-cron");
const Assessment = require("../models/assessmentModel");
const Monitoring = require("../models/monitoringModel");
const User = require("../models/userModel");
const { sendMail, wrapEmail, ctaButton, escapeHtml, FRONTEND_URL } = require("./emailService");
const { normalizeLang, t } = require("../utils/emailI18n");

const sendingLocks = new Set();

const buildSurveyUrl = (owner, monitoringId, assessments, lang) => {
    const assessmentsQuery = assessments
        .map((assessment) => `assessment[]=${assessment._id}`)
        .join("&");
    const sandbox = owner && owner.sandbox ? "true" : "false";
    return `${FRONTEND_URL}/completeSurvey?userId=${owner._id}&monitoring=${monitoringId}&${assessmentsQuery}&link=false&lng=${lang}&sandbox=${sandbox}`;
};

const questionnaireCard = (assessment, index, total, lang) => {
    const purpose = t(lang, `purpose_${assessment.type}`) || t(lang, "default_purpose");
    const typeLabel = escapeHtml(t(lang, `type_${assessment.type}`) || assessment.type || t(lang, "questionnaire"));
    const pageLabel = total > 1
        ? `<div style="font-size:13px;font-weight:bold;letter-spacing:0.4px;text-transform:uppercase;color:#6870fa;margin-bottom:6px;">${escapeHtml(t(lang, "page", { n: index + 1 }))}</div>`
        : "";
    return `
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 16px;background-color:#f7f8fc;border-radius:12px;border-left:6px solid #4cceac;">
            <tr>
                <td style="padding:20px 24px;">
                    ${pageLabel}
                    <div style="font-size:18px;font-weight:bold;color:#141b2d;line-height:26px;">${escapeHtml(assessment.name)}</div>
                    <div style="display:inline-block;margin:10px 0 8px;padding:4px 12px;background-color:#e1e2fe;color:#3e4396;font-size:13px;font-weight:bold;letter-spacing:0.3px;border-radius:999px;">${typeLabel}</div>
                    <div style="font-size:16px;line-height:24px;color:#525252;">${escapeHtml(purpose)}</div>
                </td>
            </tr>
        </table>
    `;
};

const buildParticipantHtml = (monitoring, assessments, surveyUrl, lang) => {
    const cards = assessments
        .map((assessment, index) => questionnaireCard(assessment, index, assessments.length, lang))
        .join("");
    const inner = `
        <p style="margin:0 0 10px;font-size:15px;letter-spacing:0.5px;text-transform:uppercase;color:#6870fa;font-weight:bold;">${escapeHtml(t(lang, "invitation"))}</p>
        <h1 style="margin:0 0 20px;font-size:28px;line-height:38px;font-weight:bold;color:#141b2d;">${escapeHtml(t(lang, "invite_title"))}</h1>
        <p style="margin:0 0 28px;font-size:18px;line-height:28px;color:#525252;">
            ${escapeHtml(t(lang, "invite_body"))}
            <strong style="color:#141b2d;">${escapeHtml(monitoring.name)}</strong>.
        </p>
        ${cards}
        <div style="text-align:center;padding:20px 0 8px;">
            ${ctaButton(surveyUrl, t(lang, "open_questionnaire"))}
        </div>
        <p style="margin:28px 0 0;font-size:14px;line-height:22px;color:#858585;text-align:center;">
            ${escapeHtml(t(lang, "copy_link"))}<br>
            <a href="${escapeHtml(surveyUrl)}" style="color:#535ac8;word-break:break-all;">${escapeHtml(surveyUrl)}</a>
        </p>
    `;
    return wrapEmail(inner, lang);
};

const buildOwnerHtml = (monitoring, assessments, recipients, lang) => {
    const names = assessments.map((assessment) => `
        <tr>
            <td style="padding:12px 0;border-bottom:1px solid #eef1f6;font-size:17px;line-height:26px;color:#141b2d;">
                ${escapeHtml(assessment.name)}
                <span style="color:#858585;"> · ${escapeHtml(t(lang, `type_${assessment.type}`) || assessment.type || t(lang, "questionnaire"))}</span>
            </td>
        </tr>
    `).join("");
    const emails = recipients.map((email) => `
        <span style="display:inline-block;margin:0 8px 8px 0;padding:6px 14px;background-color:#f7f8fc;border-radius:999px;font-size:15px;color:#141b2d;">${escapeHtml(email)}</span>
    `).join("");
    const inner = `
        <p style="margin:0 0 10px;font-size:15px;letter-spacing:0.5px;text-transform:uppercase;color:#3da58a;font-weight:bold;">${escapeHtml(t(lang, "sent"))}</p>
        <h1 style="margin:0 0 20px;font-size:28px;line-height:38px;font-weight:bold;color:#141b2d;">${escapeHtml(t(lang, "sent_title"))}</h1>
        <p style="margin:0 0 28px;font-size:18px;line-height:28px;color:#525252;">
            ${escapeHtml(t(lang, "sent_body"))}
            <strong style="color:#141b2d;">${escapeHtml(monitoring.name)}</strong>
            ${escapeHtml(t(lang, "sent_body_end"))}
        </p>
        <p style="margin:0 0 10px;font-size:14px;font-weight:bold;letter-spacing:0.3px;text-transform:uppercase;color:#858585;">${escapeHtml(t(lang, "pages"))}</p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
            ${names}
        </table>
        <p style="margin:0 0 12px;font-size:14px;font-weight:bold;letter-spacing:0.3px;text-transform:uppercase;color:#858585;">
            ${escapeHtml(t(lang, "recipients", { n: recipients.length }))}
        </p>
        <div>${emails}</div>
    `;
    return wrapEmail(inner, lang);
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

            const lang = normalizeLang(monitoring.scheduledEmailLanguage || owner.language);
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
