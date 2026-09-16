const { wrapEmail, ctaButton, escapeHtml, t, LOGO_URL } = require("../services/emailService");

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

const buildLogbookNoticeHtml = ({ titleKey, bodyKey, ctaKey, actorName, monitoringName, description, url, lang }) => {
    const inner = `
            <p style="margin:0 0 10px;font-size:15px;letter-spacing:0.5px;text-transform:uppercase;color:#6870fa;font-weight:bold;">${escapeHtml(t(lang, "logbook"))}</p>
            <h1 style="margin:0 0 20px;font-size:28px;line-height:38px;font-weight:bold;color:#141b2d;">${escapeHtml(t(lang, titleKey))}</h1>
            <p style="margin:0 0 16px;font-size:18px;line-height:28px;color:#525252;">
                <strong style="color:#141b2d;">${escapeHtml(actorName)}</strong>
                ${escapeHtml(t(lang, bodyKey))}
                <strong style="color:#141b2d;">${escapeHtml(monitoringName)}</strong>.
            </p>
            <p style="margin:0 0 24px;font-size:16px;line-height:24px;color:#525252;">${escapeHtml(description || "")}</p>
            <div style="text-align:center;">${ctaButton(url, t(lang, ctaKey))}</div>
        `;
    return wrapEmail(inner, lang);
};

const buildHelpRequestHtml = (monitoring, teacherName, description, logUrl, lang) =>
    buildLogbookNoticeHtml({
        titleKey: "help_title",
        bodyKey: "help_body",
        ctaKey: "open_logbook",
        actorName: teacherName,
        monitoringName: monitoring.name,
        description,
        url: logUrl,
        lang,
    });

const buildTrainerContactHtml = (monitoring, trainerName, description, logUrl, lang) =>
    buildLogbookNoticeHtml({
        titleKey: "contact_title",
        bodyKey: "contact_body",
        ctaKey: "open_logbook",
        actorName: trainerName,
        monitoringName: monitoring.name,
        description,
        url: logUrl,
        lang,
    });

const buildChatReminderHtml = (monitoring, senderName, preview, logUrl, lang) => {
    const inner = `
            <p style="margin:0 0 10px;font-size:15px;letter-spacing:0.5px;text-transform:uppercase;color:#6870fa;font-weight:bold;">${escapeHtml(t(lang, "logbook"))}</p>
            <h1 style="margin:0 0 20px;font-size:28px;line-height:38px;font-weight:bold;color:#141b2d;">${escapeHtml(t(lang, "reminder_title"))}</h1>
            <p style="margin:0 0 16px;font-size:18px;line-height:28px;color:#525252;">
                <strong style="color:#141b2d;">${escapeHtml(senderName)}</strong>
                ${escapeHtml(t(lang, "reminder_body_start"))}
                <strong style="color:#141b2d;">${escapeHtml(monitoring.name)}</strong>.
            </p>
            ${preview ? `<p style="margin:0 0 24px;font-size:16px;line-height:24px;color:#525252;">${escapeHtml(preview)}</p>` : ""}
            <div style="text-align:center;">${ctaButton(logUrl, t(lang, "open_discussion"))}</div>
        `;
    return wrapEmail(inner, lang);
};

const buildVerifyEmailHtml = (verifyUrl, lang) => `${t(lang, "verify_html", { url: verifyUrl })}
                        <p><img src="${LOGO_URL}" alt="The Digital Training Companion" width="200px" height="auto"></p>`;

const buildResetPasswordHtml = (resetUrl, lang) => t(lang, "reset_html", { url: resetUrl });

module.exports = {
    buildParticipantHtml,
    buildOwnerHtml,
    buildHelpRequestHtml,
    buildTrainerContactHtml,
    buildChatReminderHtml,
    buildVerifyEmailHtml,
    buildResetPasswordHtml,
};
