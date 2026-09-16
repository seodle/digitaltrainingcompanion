const cron = require("node-cron");
const Log = require("../models/logModel");
const Monitoring = require("../models/monitoringModel");
const User = require("../models/userModel");
const { sendMail, wrapEmail, ctaButton, escapeHtml, FRONTEND_URL } = require("./emailService");
const { normalizeLang, t } = require("../utils/emailI18n");
const { chatPartnerId } = require("./logService");

const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;
const sendingLocks = new Set();

const messageAuthorId = (message) => String(message?.userId?._id || message?.userId || "");

const waitingUserId = (log, ownerId) => {
    const last = log.chat[log.chat.length - 1];
    const lastAuthor = messageAuthorId(last);
    const partner = chatPartnerId(log, ownerId);
    if (!partner || !lastAuthor) {
        return null;
    }
    if (lastAuthor === partner) {
        return String(ownerId);
    }
    return partner;
};

const personName = (user, fallback) => {
    const name = [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim();
    return name || fallback;
};

const sendPendingChatReminder = async (log, monitoring, lastMessage, recipient, sender) => {
    const lang = normalizeLang(recipient.language);
    const logUrl = `${FRONTEND_URL}/logbooks?monitoring=${log.monitoringId}&log=${log._id}`;
    const senderName = personName(sender, t(lang, "someone"));
    const snippet = String(lastMessage.text || "").trim();
    const preview = snippet.length > 220 ? `${snippet.slice(0, 217)}…` : snippet;

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

    await sendMail({
        to: recipient.email,
        subject: t(lang, "reminder_subject", { name: monitoring.name }),
        html: wrapEmail(inner, lang),
        text: t(lang, "reminder_text", { sender: senderName, name: monitoring.name, url: logUrl }),
    });
};

const processPendingChatReminders = async (now = new Date()) => {
    const threshold = new Date(now.getTime() - THREE_DAYS_MS);
    const logs = await Log.find({ "chat.0": { $exists: true } })
        .select("chat monitoringId userId helpRequestedBy chatReminderSentFor")
        .lean();

    for (const log of logs) {
        const lastMessage = log.chat[log.chat.length - 1];
        if (!lastMessage?.createdAt || new Date(lastMessage.createdAt) > threshold) {
            continue;
        }
        if (log.chatReminderSentFor && String(log.chatReminderSentFor) === String(lastMessage._id)) {
            continue;
        }

        const logId = String(log._id);
        if (sendingLocks.has(logId)) {
            continue;
        }
        sendingLocks.add(logId);

        try {
            const monitoring = await Monitoring.findById(log.monitoringId).select("userId name");
            if (!monitoring) {
                continue;
            }

            const waitingId = waitingUserId(log, monitoring.userId);
            const senderId = messageAuthorId(lastMessage);
            if (!waitingId || !senderId || waitingId === senderId) {
                continue;
            }

            const [recipient, sender] = await Promise.all([
                User.findById(waitingId).select("email firstName lastName language"),
                User.findById(senderId).select("firstName lastName"),
            ]);
            if (!recipient?.email) {
                await Log.updateOne(
                    { _id: log._id },
                    { $set: { chatReminderSentFor: lastMessage._id } }
                );
                continue;
            }

            await sendPendingChatReminder(log, monitoring, lastMessage, recipient, sender);
            await Log.updateOne(
                { _id: log._id },
                { $set: { chatReminderSentFor: lastMessage._id } }
            );
        } catch (error) {
            console.error(`Error sending chat reminder for log ${logId}:`, error);
        } finally {
            sendingLocks.delete(logId);
        }
    }
};

const startChatReminderJob = () => {
    cron.schedule("15 * * * *", async () => {
        try {
            await processPendingChatReminders();
        } catch (error) {
            console.error("Chat reminder job failed:", error);
        }
    });
    console.log("Logbook chat reminder job started (hourly).");
};

module.exports = {
    startChatReminderJob,
    processPendingChatReminders,
};
