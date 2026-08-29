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

module.exports = {
    sendMail,
    FRONTEND_URL,
    LOGO_URL,
    EMAIL_USER,
};
