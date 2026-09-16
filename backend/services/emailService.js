const nodemailer = require("nodemailer");
require("dotenv").config();

const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;
const FRONTEND_URL = process.env.NODE_ENV === "production"
    ? process.env.FRONTEND_URL_PRODUCTION
    : process.env.FRONTEND_URL_DEVELOPMENT;
const LOGO_URL = "https://digitaltrainingcompanion.ch/static/media/logo.f1c87519c7fdc5afd373433868125e44.svg";

const createTransporter = () => nodemailer.createTransport({
    host: "mail.infomaniak.com",
    port: 465,
    secure: true,
    requireTLS: true,
    auth: { user: EMAIL_USER, pass: EMAIL_PASS },
});

const sendMail = async ({ to, subject, html, text }) => {
    const transporter = createTransporter();
    await transporter.sendMail({
        from: `"The Digital Training Companion" <${EMAIL_USER}>`,
        to,
        subject,
        html,
        text,
    });
};

const escapeHtml = (value) => String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const wrapEmail = (innerHtml, lang = "en") => `
<!DOCTYPE html>
<html lang="${lang}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>The Digital Training Companion</title>
</head>
<body style="margin:0;padding:0;background-color:#eef1f6;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#eef1f6;padding:40px 16px;">
        <tr>
            <td align="center">
                <table role="presentation" width="720" cellpadding="0" cellspacing="0" style="max-width:720px;width:100%;background-color:#ffffff;border-radius:20px;overflow:hidden;">
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
            </td>
        </tr>
    </table>
</body>
</html>
`;

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

module.exports = {
    sendMail,
    wrapEmail,
    ctaButton,
    escapeHtml,
    FRONTEND_URL,
    LOGO_URL,
    EMAIL_USER,
};
