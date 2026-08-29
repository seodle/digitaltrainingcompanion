const Log = require("../models/logModel");
const Monitoring = require("../models/monitoringModel");
const User = require("../models/userModel");
const { sendMail, wrapEmail, ctaButton, escapeHtml, FRONTEND_URL } = require("./emailService");

const VISIBILITY = ["private", "trainer", "selected", "followers"];
const AUTHOR_POPULATE = { path: "userId", select: "firstName lastName" };
const CHAT_POPULATE = { path: "chat.userId", select: "firstName lastName" };

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

    return { monitoring, isOwner, isFollower, isTrainer };
};

const assertCanAccessMonitoring = async (monitoringId, requesterId) => {
    const access = await getMonitoringAccess(monitoringId, requesterId);
    if (!access.isFollower) {
        throw httpError(403, "Forbidden");
    }
    return access;
};

const canViewLog = (log, requesterId, { isOwner, isFollower, isTrainer, monitoring }) => {
    if (authorId(log) === String(requesterId)) {
        return true;
    }
    const visibility = log.visibility || "private";
    if (visibility === "private" && isTrainer && String(authorId(log)) === String(monitoring?.userId)) {
        return true;
    }
    if (visibility === "followers" && isFollower) {
        return true;
    }
    if (visibility === "trainer" && isOwner) {
        return true;
    }
    if (visibility === "selected") {
        return (log.sharedWith || []).some((id) => String(id) === String(requesterId));
    }
    return false;
};

const chatPartnerId = (log, ownerId) => {
    const author = authorId(log);
    if (author && author !== String(ownerId)) {
        return author;
    }
    if (log.helpRequestedBy) {
        return String(log.helpRequestedBy);
    }
    return null;
};

const canAccessChat = (log, requesterId, ownerId) => {
    const isHelpRequest = log.logType === "Ask for help" || Boolean(log.helpRequestedAt);
    if (!isHelpRequest) {
        return false;
    }
    const partner = chatPartnerId(log, ownerId);
    if (!partner || partner === String(ownerId)) {
        return false;
    }
    const requester = String(requesterId);
    return requester === String(ownerId) || requester === partner;
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

const resolveVisibility = async (logData, { isOwner, monitoring }) => {
    const visibility = VISIBILITY.includes(logData.visibility) ? logData.visibility : "private";
    if (isOwner) {
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

const populateLog = (query) => query.populate(AUTHOR_POPULATE).populate(CHAT_POPULATE);

const notifyOwnerOfHelpRequest = async (log, monitoring, requesterId) => {
    const owner = await User.findById(monitoring.userId).select("email firstName lastName");
    const teacher = await User.findById(requesterId).select("firstName lastName");
    const teacherName = [teacher?.firstName, teacher?.lastName].filter(Boolean).join(" ") || "A teacher";
    const logUrl = `${FRONTEND_URL}/logbooks?monitoring=${log.monitoringId}&log=${log._id}`;

    if (!owner?.email) {
        return;
    }

    const inner = `
            <p style="margin:0 0 10px;font-size:15px;letter-spacing:0.5px;text-transform:uppercase;color:#6870fa;font-weight:bold;">Logbook</p>
            <h1 style="margin:0 0 20px;font-size:28px;line-height:38px;font-weight:bold;color:#141b2d;">A teacher asked for your help</h1>
            <p style="margin:0 0 16px;font-size:18px;line-height:28px;color:#525252;">
                <strong style="color:#141b2d;">${escapeHtml(teacherName)}</strong>
                requested help on a logbook message for
                <strong style="color:#141b2d;">${escapeHtml(monitoring.name)}</strong>.
            </p>
            <p style="margin:0 0 24px;font-size:16px;line-height:24px;color:#525252;">${escapeHtml(log.description || "")}</p>
            <div style="text-align:center;">${ctaButton(logUrl, "Open the logbook")}</div>
        `;
    await sendMail({
        to: owner.email,
        subject: `Help requested in the logbook for ${monitoring.name}`,
        html: wrapEmail(inner),
        text: `${teacherName} requested help on a logbook message for ${monitoring.name}: ${logUrl}`,
    });
};

const createLog = async (logData, requesterId) => {
    const { monitoring, isOwner } = await assertCanAccessMonitoring(logData.monitoringId, requesterId);
    let { visibility, sharedWith } = await resolveVisibility(logData, { isOwner, monitoring });
    if (logData.logType === "Ask for help") {
        if (isOwner) {
            throw httpError(400, "Trainers cannot ask themselves for help");
        }
        if (visibility === "private") {
            visibility = "trainer";
            sharedWith = [];
        }
    }

    const isHelpRequest = logData.logType === "Ask for help" && !isOwner;
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
        helpRequestedAt: isHelpRequest ? new Date() : null,
        helpRequestedBy: isHelpRequest ? requesterId : null,
        creationDate: Date.now(),
        lastModificationDate: null,
    }).save();

    if (isHelpRequest) {
        try {
            await notifyOwnerOfHelpRequest(createdLog, monitoring, requesterId);
        } catch (error) {
            console.error("Error sending help-request email:", error);
        }
    }

    return populateLog(Log.findById(createdLog._id));
};

const getVisibleLogsForMonitoring = async (monitoringId, requesterId) => {
    const { monitoring, isOwner, isFollower, isTrainer } = await assertCanAccessMonitoring(monitoringId, requesterId);

    const or = [{ userId: requesterId }];
    if (isFollower) {
        or.push({ visibility: "followers" });
    }
    if (isOwner) {
        or.push({ visibility: "trainer" });
    }
    if (isTrainer && !isOwner) {
        or.push({
            userId: monitoring.userId,
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
    const { monitoring, isOwner } = await assertCanAccessMonitoring(monitoringId, requesterId);
    if (!isOwner) {
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
        const { monitoring, isOwner } = await getMonitoringAccess(existing.monitoringId, userId);
        const resolved = await resolveVisibility(
            {
                visibility: body.visibility !== undefined ? body.visibility : existing.visibility,
                sharedWith: body.sharedWith !== undefined ? body.sharedWith : existing.sharedWith,
            },
            { isOwner, monitoring }
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
        if (!isAuthor && !access.isOwner) {
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
    if (!canAccessChat(log, requesterId, access.monitoring.userId)) {
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
    if (!canAccessChat(log, requesterId, access.monitoring.userId)) {
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
