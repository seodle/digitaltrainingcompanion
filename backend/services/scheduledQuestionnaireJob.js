const cron = require("node-cron");
const Assessment = require("../models/assessmentModel");
const Monitoring = require("../models/monitoringModel");
const User = require("../models/userModel");
const { sendMail, FRONTEND_URL, LOGO_URL } = require("./emailService");

const ASSESSMENT_PURPOSE = {
    "Trainee characteristics": "Collects background information about the trainees taking part in this training.",
    "Training characteristics": "Describes the training context, organisation, and setup.",
    "Immediate reactions": "Captures first reactions and satisfaction right after the training.",
    "Sustainability conditions": "Looks at the conditions that support lasting use of what was learned.",
    "Student characteristics": "Collects background information about the students.",
    "Organizational conditions": "Looks at organisational factors that influence the training.",
    "Learning": "Assesses knowledge, skills, and attitudes acquired during the training.",
    "Behavioral changes": "Looks at how practices change after the training.",
    "Student learning outcomes": "Assesses student learning outcomes related to this training.",
};

const sendingLocks = new Set();

const escapeHtml = (value) => String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const buildSurveyUrl = (owner, monitoringId, assessments) => {
    const assessmentsQuery = assessments
        .map((assessment) => `assessment[]=${assessment._id}`)
        .join("&");
    const sandbox = owner && owner.sandbox ? "true" : "false";
    return `${FRONTEND_URL}/completeSurvey?userId=${owner._id}&monitoring=${monitoringId}&${assessmentsQuery}&link=false&lng=en&sandbox=${sandbox}`;
};

const wrapEmail = (innerHtml) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>The Digital Training Companion</title>
</head>
<body style="margin:0;padding:0;background-color:#eef1f6;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#eef1f6;padding:40px 16px;">
        <tr>
            <td align="center">
                <table role="presentation" width="720" cellpadding="0" cellspacing="0" style="max-width:720px;width:100%;background-color:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 8px 24px rgba(20,27,45,0.08);">
                    <tr>
                        <td style="font-size:0;line-height:0;">
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td width="50%" height="10" bgcolor="#4cceac" style="height:10px;background-color:#4cceac;font-size:0;line-height:0;">&nbsp;</td>
                                    <td width="50%" height="10" bgcolor="#6870fa" style="height:10px;background-color:#6870fa;font-size:0;line-height:0;">&nbsp;</td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:40px 48px 16px;text-align:center;">
                            <img src="${LOGO_URL}" alt="The Digital Training Companion" width="280" style="display:block;margin:0 auto;max-width:280px;height:auto;border:0;">
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:8px 48px 48px;font-family:Arial,Helvetica,sans-serif;color:#141b2d;">
                            ${innerHtml}
                        </td>
                    </tr>
                </table>
                <table role="presentation" width="720" cellpadding="0" cellspacing="0" style="max-width:720px;width:100%;">
                    <tr>
                        <td style="padding:20px 16px 0;text-align:center;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:22px;color:#858585;">
                            The Digital Training Companion
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
`;

const questionnaireCard = (assessment, index, total) => {
    const purpose = ASSESSMENT_PURPOSE[assessment.type]
        || "This page is part of the questionnaire.";
    const typeLabel = escapeHtml(assessment.type || "Questionnaire");
    const pageLabel = total > 1
        ? `<div style="font-size:13px;font-weight:bold;letter-spacing:0.4px;text-transform:uppercase;color:#6870fa;margin-bottom:6px;">Page ${index + 1}</div>`
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

const ctaButton = (href, label) => `
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:12px auto 0;">
        <tr>
            <td align="center" bgcolor="#4cceac" style="border-radius:12px;background-color:#4cceac;">
                <a href="${escapeHtml(href)}" target="_blank" style="display:inline-block;padding:18px 36px;font-family:Arial,Helvetica,sans-serif;font-size:18px;font-weight:bold;color:#141b2d;text-decoration:none;">
                    ${escapeHtml(label)}
                </a>
            </td>
        </tr>
    </table>
`;

const buildParticipantHtml = (monitoring, assessments, surveyUrl) => {
    const cards = assessments
        .map((assessment, index) => questionnaireCard(assessment, index, assessments.length))
        .join("");
    const inner = `
        <p style="margin:0 0 10px;font-size:15px;letter-spacing:0.5px;text-transform:uppercase;color:#6870fa;font-weight:bold;">Invitation</p>
        <h1 style="margin:0 0 20px;font-size:28px;line-height:38px;font-weight:bold;color:#141b2d;">You are invited to complete a questionnaire</h1>
        <p style="margin:0 0 28px;font-size:18px;line-height:28px;color:#525252;">
            Please take a few minutes to complete the questionnaire below for
            <strong style="color:#141b2d;">${escapeHtml(monitoring.name)}</strong>.
        </p>
        ${cards}
        <div style="text-align:center;padding:20px 0 8px;">
            ${ctaButton(surveyUrl, "Open the questionnaire")}
        </div>
        <p style="margin:28px 0 0;font-size:14px;line-height:22px;color:#858585;text-align:center;">
            If the button does not work, copy this link into your browser:<br>
            <a href="${escapeHtml(surveyUrl)}" style="color:#535ac8;word-break:break-all;">${escapeHtml(surveyUrl)}</a>
        </p>
    `;
    return wrapEmail(inner);
};

const buildOwnerHtml = (monitoring, assessments, recipients) => {
    const names = assessments.map((assessment) => `
        <tr>
            <td style="padding:12px 0;border-bottom:1px solid #eef1f6;font-size:17px;line-height:26px;color:#141b2d;">
                ${escapeHtml(assessment.name)}
                <span style="color:#858585;"> · ${escapeHtml(assessment.type || "Questionnaire")}</span>
            </td>
        </tr>
    `).join("");
    const emails = recipients.map((email) => `
        <span style="display:inline-block;margin:0 8px 8px 0;padding:6px 14px;background-color:#f7f8fc;border-radius:999px;font-size:15px;color:#141b2d;">${escapeHtml(email)}</span>
    `).join("");
    const inner = `
        <p style="margin:0 0 10px;font-size:15px;letter-spacing:0.5px;text-transform:uppercase;color:#3da58a;font-weight:bold;">Sent</p>
        <h1 style="margin:0 0 20px;font-size:28px;line-height:38px;font-weight:bold;color:#141b2d;">The questionnaire has been sent</h1>
        <p style="margin:0 0 28px;font-size:18px;line-height:28px;color:#525252;">
            The scheduled questionnaire for
            <strong style="color:#141b2d;">${escapeHtml(monitoring.name)}</strong>
            was sent successfully.
        </p>
        <p style="margin:0 0 10px;font-size:14px;font-weight:bold;letter-spacing:0.3px;text-transform:uppercase;color:#858585;">Pages</p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 28px;">
            ${names}
        </table>
        <p style="margin:0 0 12px;font-size:14px;font-weight:bold;letter-spacing:0.3px;text-transform:uppercase;color:#858585;">
            Recipients (${recipients.length})
        </p>
        <div>${emails}</div>
    `;
    return wrapEmail(inner);
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
                .select("name userId scheduledEmailRecipients");
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

            const owner = await User.findById(monitoring.userId).select("email sandbox firstName lastName");
            if (!owner) {
                console.warn(`Skipping scheduled send for monitoring ${monitoringId}: owner not found`);
                continue;
            }

            const surveyUrl = buildSurveyUrl(owner, monitoringId, openAssessments);
            const participantHtml = buildParticipantHtml(monitoring, openAssessments, surveyUrl);
            const participantText = `You are invited to complete a questionnaire for ${monitoring.name}: ${surveyUrl}`;

            for (const recipient of recipients) {
                await sendMail({
                    to: recipient,
                    subject: `Questionnaire for ${monitoring.name}`,
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
                    subject: `Questionnaire sent for ${monitoring.name}`,
                    html: buildOwnerHtml(monitoring, openAssessments, recipients),
                    text: `The questionnaire for ${monitoring.name} was sent to ${recipients.join(", ")}.`,
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
