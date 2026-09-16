const Log = require("../models/logModel");
const Monitoring = require("../models/monitoringModel");
const User = require("../models/userModel");
const { sendMail, wrapEmail, ctaButton, escapeHtml, FRONTEND_URL } = require("./emailService");
const { normalizeLang, t } = require("../utils/emailI18n");

const VISIBILITY = ["private", "trainer", "selected", "followers"];
const AUTHOR_POPULATE = { path: "userId", select: "firstName lastName" };
const CHAT_POPULATE = { path: "chat.userId", select: "firstName lastName" };
const SHARED_POPULATE = { path: "sharedWith", select: "firstName lastName" };

const sharedEntryId = (entry) => String(entry?._id || entry || "").trim();

const httpError = (status, message) => {
    const error = new Error(message);
    error.status = status;
    return error;
};

const authorId = (log) => {
    if (!log || !log.userId) return "";
    return String(log.userId._id || log.userId);
};

const getMonitoringAccess = async (monitoringId, requesterId) => {
    const monitoring = await Monitoring.findById(monitoringId).select("userId sharingCode name");
    if (!monitoring) {
        throw httpError(404, "Monitoring not found");
    }

    const isOwner = String(monitoring.userId) === String(requesterId);
    const requester = await User.findById(requesterId).select("sharingCodeRedeemed userStatus");
    let isFollower = isOwner;
    if (!isFollower && monitoring.sharingCode) {
        isFollower = Array.isArray(requester?.sharingCodeRedeemed)
            && requester.sharingCodeRedeemed.includes(monitoring.sharingCode);
    }
    const isTrainer = isOwner || String(requester?.userStatus) === "Teacher-trainer";
    const trainerIds = [String(monitoring.userId)];
    if (monitoring.sharingCode) {
        const trainers = await User.find(
            { sharingCodeRedeemed: monitoring.sharingCode, userStatus: "Teacher-trainer" },
            "_id"
        ).lean();
        trainers.forEach((user) => trainerIds.push(String(user._id)));
    }

    return { monitoring, isOwner, isFollower, isTrainer, trainerIds: [...new Set(trainerIds)] };
};

const assertCanAccessMonitoring = async (monitoringId, requesterId) => {
    const access = await getMonitoringAccess(monitoringId, requesterId);
    if (!access.isFollower) {
        throw httpError(403, "Forbidden");
    }
    return access;
};

const canViewLog = (log, requesterId, { isOwner, isFollower, isTrainer, monitoring, trainerIds = [] }) => {
    if (authorId(log) === String(requesterId)) {
        return true;
    }
    const visibility = log.visibility || "private";
    if (visibility === "private" && isTrainer && trainerIds.includes(authorId(log))) {
        return true;
    }
    if (visibility === "followers" && isFollower) {
        return true;
    }
    if (visibility === "trainer" && isTrainer) {
        return true;
    }
    if (visibility === "selected") {
        return (log.sharedWith || []).some((entry) => sharedEntryId(entry) === String(requesterId));
    }
    return false;
};

const chatPartnerId = (log, ownerId) => {
    const shared = (log.sharedWith || []).map(sharedEntryId).filter(Boolean);
    if (shared.length) {
        return shared[0];
    }
    const author = authorId(log);
    if (author && author !== String(ownerId)) {
        return author;
    }
    if (log.helpRequestedBy && String(log.helpRequestedBy) !== String(ownerId)) {
        return String(log.helpRequestedBy);
    }
    return null;
};

const isHelpThread = (log) => log.logType === "Ask for help" || Boolean(log.helpRequestedAt);

const canAccessChat = (log, requesterId, access) => {
    if (!isHelpThread(log)) {
        return false;
    }
    if (access.isTrainer) {
        return true;
    }
    const requester = String(requesterId);
    if (authorId(log) === requester) {
        return true;
    }
    if (log.helpRequestedBy && String(log.helpRequestedBy) === requester) {
        return true;
    }
    if ((log.visibility || "private") === "followers" && access.isFollower) {
        return true;
    }
    return (log.sharedWith || []).some((entry) => sharedEntryId(entry) === requester);
};

const getFollowerIds = async (monitoring) => {
    if (!monitoring.sharingCode) {
        return [];
    }
    const followers = await User.find(
        { sharingCodeRedeemed: monitoring.sharingCode },
        "_id"
    ).lean();
    return followers.map((user) => String(user._id));
};

const normalizeSharedWith = (sharedWith, followerIds) => {
    const unique = [...new Set(
        (sharedWith || []).map((id) => String(id || "").trim()).filter(Boolean)
    )];
    const allowed = new Set(followerIds);
    const invalid = unique.filter((id) => !allowed.has(id));
    if (invalid.length) {
        throw httpError(400, "One or more selected teachers do not follow this monitoring");
    }
    return unique;
};

const resolveVisibility = async (logData, { isOwner, isTrainer, monitoring }) => {
    const visibility = VISIBILITY.includes(logData.visibility) ? logData.visibility : "private";
    if (isTrainer) {
        if (visibility === "trainer") {
            throw httpError(400, "Trainers cannot use trainer-only visibility");
        }
        if (visibility === "selected") {
            const followerIds = await getFollowerIds(monitoring);
            const sharedWith = normalizeSharedWith(logData.sharedWith, followerIds);
            if (sharedWith.length === 0) {
                throw httpError(400, "Select at least one teacher");
            }
            return { visibility, sharedWith };
        }
        return { visibility, sharedWith: [] };
    }
    if (visibility === "selected") {
        throw httpError(400, "Teachers cannot share with selected colleagues");
    }
    return { visibility, sharedWith: [] };
};

const populateLog = (query) => query.populate(AUTHOR_POPULATE).populate(CHAT_POPULATE).populate(SHARED_POPULATE);

const notifyOwnerOfHelpRequest = async (log, monitoring, requesterId) => {
    const owner = await User.findById(monitoring.userId).select("email firstName lastName language");
    const teacher = await User.findById(requesterId).select("firstName lastName");
    const lang = normalizeLang(owner?.language);
    const teacherName = [teacher?.firstName, teacher?.lastName].filter(Boolean).join(" ") || t(lang, "a_teacher");
    const logUrl = `${FRONTEND_URL}/logbooks?monitoring=${log.monitoringId}&log=${log._id}`;

    if (!owner?.email) {
        return;
    }

    const inner = `
            <p style="margin:0 0 10px;font-size:15px;letter-spacing:0.5px;text-transform:uppercase;color:#6870fa;font-weight:bold;">${escapeHtml(t(lang, "logbook"))}</p>
            <h1 style="margin:0 0 20px;font-size:28px;line-height:38px;font-weight:bold;color:#141b2d;">${escapeHtml(t(lang, "help_title"))}</h1>
            <p style="margin:0 0 16px;font-size:18px;line-height:28px;color:#525252;">
                <strong style="color:#141b2d;">${escapeHtml(teacherName)}</strong>
                ${escapeHtml(t(lang, "help_body"))}
                <strong style="color:#141b2d;">${escapeHtml(monitoring.name)}</strong>.
            </p>
            <p style="margin:0 0 24px;font-size:16px;line-height:24px;color:#525252;">${escapeHtml(log.description || "")}</p>
            <div style="text-align:center;">${ctaButton(logUrl, t(lang, "open_logbook"))}</div>
        `;
    await sendMail({
        to: owner.email,
        subject: t(lang, "help_subject", { name: monitoring.name }),
        html: wrapEmail(inner, lang),
        text: t(lang, "help_text", { teacher: teacherName, name: monitoring.name, url: logUrl }),
    });
};

const notifyTeachersOfTrainerContact = async (log, monitoring, requesterId, teacherIds) => {
    const trainer = await User.findById(requesterId).select("firstName lastName");
    const teachers = await User.find({ _id: { $in: teacherIds } }).select("email firstName lastName language");
    const logUrl = `${FRONTEND_URL}/logbooks?monitoring=${log.monitoringId}&log=${log._id}`;

    await Promise.all(teachers.map(async (teacher) => {
        if (!teacher?.email) {
            return;
        }
        const lang = normalizeLang(teacher.language);
        const trainerName = [trainer?.firstName, trainer?.lastName].filter(Boolean).join(" ") || t(lang, "a_trainer");
        const inner = `
            <p style="margin:0 0 10px;font-size:15px;letter-spacing:0.5px;text-transform:uppercase;color:#6870fa;font-weight:bold;">${escapeHtml(t(lang, "logbook"))}</p>
            <h1 style="margin:0 0 20px;font-size:28px;line-height:38px;font-weight:bold;color:#141b2d;">${escapeHtml(t(lang, "contact_title"))}</h1>
            <p style="margin:0 0 16px;font-size:18px;line-height:28px;color:#525252;">
                <strong style="color:#141b2d;">${escapeHtml(trainerName)}</strong>
                ${escapeHtml(t(lang, "contact_body"))}
                <strong style="color:#141b2d;">${escapeHtml(monitoring.name)}</strong>.
            </p>
            <p style="margin:0 0 24px;font-size:16px;line-height:24px;color:#525252;">${escapeHtml(log.description || "")}</p>
            <div style="text-align:center;">${ctaButton(logUrl, t(lang, "open_logbook"))}</div>
        `;
        await sendMail({
            to: teacher.email,
            subject: t(lang, "contact_subject", { name: monitoring.name }),
            html: wrapEmail(inner, lang),
            text: t(lang, "contact_text", { trainer: trainerName, name: monitoring.name, url: logUrl }),
        });
    }));
};

const createLog = async (logData, requesterId) => {
    const { monitoring, isOwner, isTrainer } = await assertCanAccessMonitoring(logData.monitoringId, requesterId);
    let { visibility, sharedWith } = await resolveVisibility(logData, { isOwner, isTrainer, monitoring });
    if (logData.logType === "Ask for help") {
        if (isTrainer) {
            const followerIds = await getFollowerIds(monitoring);
            sharedWith = normalizeSharedWith(logData.sharedWith, followerIds);
            if (sharedWith.length === 0) {
                throw httpError(400, "Select at least one teacher");
            }
            visibility = "selected";
        } else if (visibility === "private") {
            visibility = "trainer";
            sharedWith = [];
        }
    }

    const isHelpThreadCreate = logData.logType === "Ask for help";
    const createdLog = await new Log({
        monitoringId: logData.monitoringId,
        userId: requesterId,
        description: logData.description,
        day: isOwner ? logData.day : "",
        assessment: isOwner ? logData.assessment : "",
        logType: logData.logType,
        assessmentNames: isOwner ? (logData.assessmentNames || []) : [],
        displayNames: isOwner ? (logData.displayNames || []) : [],
        isCompleted: logData.isCompleted || false,
        visibility,
        sharedWith,
        helpRequestedAt: isHelpThreadCreate ? new Date() : null,
        helpRequestedBy: isHelpThreadCreate ? requesterId : null,
        creationDate: Date.now(),
        lastModificationDate: null,
    }).save();

    if (isHelpThreadCreate && !isTrainer) {
        try {
            await notifyOwnerOfHelpRequest(createdLog, monitoring, requesterId);
        } catch (error) {
            console.error("Error sending help-request email:", error);
        }
    }
    if (isHelpThreadCreate && isTrainer) {
        try {
            await notifyTeachersOfTrainerContact(createdLog, monitoring, requesterId, sharedWith);
        } catch (error) {
            console.error("Error sending trainer-contact email:", error);
        }
    }

    return populateLog(Log.findById(createdLog._id));
};

const getVisibleLogsForMonitoring = async (monitoringId, requesterId) => {
    const { monitoring, isFollower, isTrainer, trainerIds } = await assertCanAccessMonitoring(monitoringId, requesterId);

    const or = [{ userId: requesterId }];
    if (isFollower) {
        or.push({ visibility: "followers" });
    }
    if (isTrainer) {
        or.push({ visibility: "trainer" });
        or.push({
            userId: { $in: trainerIds },
            $or: [
                { visibility: "private" },
                { visibility: { $exists: false } },
                { visibility: null },
            ],
        });
    }
    or.push({ visibility: "selected", sharedWith: requesterId });

    return populateLog(Log.find({ monitoringId, $or: or })).sort({ creationDate: 1 });
};

const getMonitoringFollowersForLog = async (monitoringId, requesterId) => {
    const { monitoring, isTrainer } = await assertCanAccessMonitoring(monitoringId, requesterId);
    if (!isTrainer) {
        throw httpError(403, "Forbidden");
    }
    if (!monitoring.sharingCode) {
        return [];
    }
    return User.find(
        { sharingCodeRedeemed: monitoring.sharingCode },
        "firstName lastName"
    ).lean();
};

const updateLog = async (logId, userId, updates) => {
    const existing = await Log.findOne({ _id: logId, userId });
    if (!existing) {
        throw httpError(404, "Log not found or not owned by user");
    }

    const allowed = ["description", "day", "assessment", "logType", "assessmentNames", "displayNames", "isCompleted", "visibility", "sharedWith"];
    const body = {};
    for (const key of allowed) {
        if (updates[key] !== undefined) body[key] = updates[key];
    }

    if (body.visibility !== undefined || body.sharedWith !== undefined) {
        const { monitoring, isOwner, isTrainer } = await getMonitoringAccess(existing.monitoringId, userId);
        const resolved = await resolveVisibility(
            {
                visibility: body.visibility !== undefined ? body.visibility : existing.visibility,
                sharedWith: body.sharedWith !== undefined ? body.sharedWith : existing.sharedWith,
            },
            { isOwner, isTrainer, monitoring }
        );
        body.visibility = resolved.visibility;
        body.sharedWith = resolved.sharedWith;
    }

    const nextType = body.logType !== undefined ? body.logType : existing.logType;
    const nextVisibility = body.visibility !== undefined ? body.visibility : existing.visibility;
    if (nextType === "Ask for help" && nextVisibility === "private") {
        body.visibility = "trainer";
        body.sharedWith = [];
    }

    const now = new Date();
    if (Object.keys(body).length > 0) {
        body.lastModificationDate = now;
    }
    if (Object.prototype.hasOwnProperty.call(body, "isCompleted")) {
        body.completionDate = body.isCompleted ? now : null;
    }

    const updated = await Log.findOneAndUpdate(
        { _id: logId, userId },
        { $set: body },
        { new: true }
    );
    if (!updated) {
        throw httpError(404, "Log not found or not owned by user");
    }
    return populateLog(Log.findById(updated._id));
};

const updateCompletion = async (logId, userId, isCompleted) => {
    const log = await Log.findById(logId);
    if (!log) {
        throw httpError(404, "Log not found");
    }

    const isAuthor = authorId(log) === String(userId);
    const access = await assertCanAccessMonitoring(log.monitoringId, userId);

    if (log.logType === "Ask for help") {
        if (!isAuthor && !access.isTrainer) {
            throw httpError(403, "Forbidden");
        }
        if (!canViewLog(log, userId, access)) {
            throw httpError(403, "Forbidden");
        }
    } else if (!isAuthor) {
        throw httpError(403, "Forbidden");
    }

    const now = new Date();
    log.isCompleted = Boolean(isCompleted);
    log.completionDate = log.isCompleted ? now : null;
    log.lastModificationDate = now;
    await log.save();
    return populateLog(Log.findById(log._id));
};

const deleteLog = async (logId, userId) => {
    const result = await Log.deleteOne({ _id: logId, userId });
    if (result.deletedCount === 0) {
        throw httpError(404, "Log not found or not owned by user");
    }
};

const requestHelp = async (logId, requesterId, userStatus) => {
    if (String(userStatus) !== "Teacher") {
        throw httpError(403, "Only teachers can request help");
    }

    const log = await Log.findById(logId);
    if (!log) {
        throw httpError(404, "Log not found");
    }

    const access = await assertCanAccessMonitoring(log.monitoringId, requesterId);
    const { monitoring, isOwner } = access;
    if (isOwner) {
        throw httpError(400, "You cannot request help on your own monitoring");
    }
    if (!canViewLog(log, requesterId, access)) {
        throw httpError(403, "Forbidden");
    }

    if ((log.visibility || "private") === "private") {
        log.visibility = "trainer";
        log.sharedWith = [];
    }

    log.helpRequestedAt = new Date();
    log.helpRequestedBy = requesterId;
    await log.save();
    try {
        await notifyOwnerOfHelpRequest(log, monitoring, requesterId);
    } catch (error) {
        console.error("Error sending help-request email:", error);
    }

    return populateLog(Log.findById(log._id));
};

const getLogChat = async (logId, requesterId) => {
    const log = await populateLog(Log.findById(logId));
    if (!log) {
        throw httpError(404, "Log not found");
    }
    const access = await assertCanAccessMonitoring(log.monitoringId, requesterId);
    if (!canViewLog(log, requesterId, access)) {
        throw httpError(403, "Forbidden");
    }
    if (!canAccessChat(log, requesterId, access)) {
        throw httpError(403, "Forbidden");
    }
    return log.chat || [];
};

const addLogChatMessage = async (logId, requesterId, text) => {
    const trimmed = String(text || "").trim();
    if (!trimmed) {
        throw httpError(400, "Message text is required");
    }
    if (trimmed.length > 2000) {
        throw httpError(400, "Message is too long");
    }

    const log = await Log.findById(logId);
    if (!log) {
        throw httpError(404, "Log not found");
    }
    const access = await assertCanAccessMonitoring(log.monitoringId, requesterId);
    if (!canViewLog(log, requesterId, access)) {
        throw httpError(403, "Forbidden");
    }
    if (!canAccessChat(log, requesterId, access)) {
        throw httpError(403, "Forbidden");
    }

    log.chat.push({
        userId: requesterId,
        text: trimmed,
        createdAt: new Date(),
    });
    await log.save();

    const updated = await populateLog(Log.findById(log._id));
    return updated.chat;
};

module.exports = {
    createLog,
    getVisibleLogsForMonitoring,
    getMonitoringFollowersForLog,
    updateLog,
    updateCompletion,
    deleteLog,
    requestHelp,
    getLogChat,
    addLogChatMessage,
    chatPartnerId,
};
