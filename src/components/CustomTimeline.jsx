import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  IconButton,
  TextField,
  Chip,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
import ChatBubbleOutlineRoundedIcon from "@mui/icons-material/ChatBubbleOutlineRounded";
import CheckCircleOutlineRoundedIcon from "@mui/icons-material/CheckCircleOutlineRounded";
import axios from "axios";
import { BACKEND_URL } from "../config";
import { useAuthUser } from "../contexts/AuthUserContext";
import { LogType } from "../utils/enums";
import { useMessageService } from "../services/MessageService";
import LogChatDialog from "./LogChatDialog";
import { ActivityIcon, IconWell, LogTypeGlyph } from "./logbookIcons";

const getAuthorId = (log) => String(log.userId?._id || log.userId || "");

const getPersonName = (person, fallback) => {
  if (person && typeof person === "object") {
    return `${person.firstName || ""} ${person.lastName || ""}`.trim() || fallback;
  }
  return fallback;
};

const formatLogWhen = (value) => {
  if (!value) {
    return "";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return date.toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const isSameMoment = (first, second) => {
  if (!first || !second) {
    return false;
  }
  return Math.abs(new Date(first) - new Date(second)) < 60 * 1000;
};

const CustomTimeline = ({
  logs,
  setLogs,
  isMonitoringOwner = false,
  isTrainer = false,
  currentMonitoringId = "",
  focusLogId = null,
}) => {
  const { currentUser } = useAuthUser();
  const { getMessage } = useMessageService();
  const [editingId, setEditingId] = useState(null);
  const [tempDescription, setTempDescription] = useState("");
  const [chatLog, setChatLog] = useState(null);
  const [typeFilter, setTypeFilter] = useState("all");
  const [visibilityFilter, setVisibilityFilter] = useState("all");
  const [teacherFilter, setTeacherFilter] = useState("all");
  const [teachers, setTeachers] = useState([]);
  const [cardToggles, setCardToggles] = useState({});
  const [logToDelete, setLogToDelete] = useState(null);

  useEffect(() => {
    if (!isTrainer && visibilityFilter === "selected") {
      setVisibilityFilter("all");
    }
    if (isTrainer && visibilityFilter === "trainer") {
      setVisibilityFilter("all");
    }
    if (!isTrainer && teacherFilter !== "all") {
      setTeacherFilter("all");
    }
  }, [isTrainer, visibilityFilter, teacherFilter]);

  useEffect(() => {
    setTeacherFilter("all");
  }, [currentMonitoringId]);

  useEffect(() => {
    const loadTeachers = async () => {
      if (!isTrainer || !currentMonitoringId) {
        setTeachers([]);
        return;
      }
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(
          `${BACKEND_URL}/logs/monitoring/${currentMonitoringId}/followers`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setTeachers(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error("Error fetching teachers for log filter:", error);
        setTeachers([]);
      }
    };
    loadTeachers();
  }, [currentMonitoringId, isTrainer]);

  useEffect(() => {
    if (!focusLogId || !logs.length) {
      return;
    }
    const focused = logs.find((log) => String(log._id) === String(focusLogId));
    const focusedAuthor = focused ? getAuthorId(focused) : "";
    if (
      focused &&
      isTrainer &&
      focused.logType === LogType.ASK_FOR_HELP &&
      focusedAuthor &&
      focusedAuthor !== String(currentUser?._id || "")
    ) {
      setChatLog(focused);
    }
  }, [focusLogId, logs, isTrainer, currentUser?._id]);

  const currentUserId = String(currentUser?._id || "");

  const teacherOptions = (() => {
    const byId = new Map();
    teachers.forEach((teacher) => {
      if (teacher?._id) {
        byId.set(String(teacher._id), teacher);
      }
    });
    logs.forEach((log) => {
      const id = getAuthorId(log);
      if (id && id !== currentUserId && log.userId && typeof log.userId === "object") {
        byId.set(id, log.userId);
      }
    });
    return [...byId.values()].sort((a, b) =>
      getPersonName(a, "").localeCompare(getPersonName(b, ""))
    );
  })();

  const displayLogs = [...logs]
    .filter((log) => typeFilter === "all" || log.logType === typeFilter)
    .filter((log) => visibilityFilter === "all" || (log.visibility || "private") === visibilityFilter)
    .filter((log) => teacherFilter === "all" || getAuthorId(log) === teacherFilter)
    .reverse();

  const getVisibilityLabel = (visibility) => {
    if (visibility === "private") {
      return getMessage(
        isTrainer ? "label_log_visibility_all_trainers" : "label_log_visibility_private"
      );
    }
    if (visibility === "followers") {
      return getMessage("label_log_visibility_followers");
    }
    return getMessage(`label_log_visibility_${visibility}`);
  };

  const getSharedPeople = (log) =>
    (log.sharedWith || [])
      .map((entry) => {
        if (entry && typeof entry === "object" && (entry.firstName || entry.lastName)) {
          return entry;
        }
        const id = String(entry?._id || entry || "");
        return teachers.find((teacher) => String(teacher._id) === id) || null;
      })
      .filter(Boolean);

  const getVisibleByLabel = (log) => {
    const prefix = getMessage("label_log_visible_by");
    const isContactTeacher =
      log.logType === LogType.ASK_FOR_HELP && (log.visibility || "private") !== "trainer";
    if (isContactTeacher) {
      const names = getSharedPeople(log)
        .map((person) => getPersonName(person, ""))
        .filter(Boolean);
      if (names.length) {
        return `${prefix} : ${names.join(", ")}`;
      }
    }
    return `${prefix} : ${getVisibilityLabel(log.visibility || "private")}`;
  };

  const handleDelete = async (logId) => {
    setLogs((prev) => prev.filter((log) => log._id !== logId));
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${BACKEND_URL}/logs/${logId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (error) {
      console.log("An error occurred while deleting the log:", error);
    }
  };

  const handleConfirmDelete = async () => {
    const logId = logToDelete?._id;
    setLogToDelete(null);
    if (logId) {
      await handleDelete(logId);
    }
  };

  const handleStartEdit = (log) => {
    setEditingId(log._id);
    setTempDescription(log.description);
  };

  const handleSave = async (logId) => {
    try {
      const token = localStorage.getItem("token");
      const { data: updated } = await axios.patch(
        `${BACKEND_URL}/logs/${logId}`,
        { description: tempDescription },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setLogs((prev) => prev.map((log) => (log._id === logId ? updated : log)));
      setEditingId(null);
    } catch (error) {
      console.error("Error updating log:", error);
    }
  };

  const handleChangeCompletion = async (log) => {
    try {
      const token = localStorage.getItem("token");
      const { data: updated } = await axios.patch(
        `${BACKEND_URL}/logs/${log._id}/completion`,
        { isCompleted: !log.isCompleted },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setLogs((prev) => prev.map((item) => (item._id === log._id ? updated : item)));
    } catch (error) {
      console.error("Error updating change completion status:", error);
    }
  };

  const isDetailCard = (log) =>
    log.logType === LogType.OBSERVATION || log.logType === LogType.CHANGE;

  const isToggleOn = (log, key) => {
    const stored = cardToggles[`${log._id}:${key}`];
    if (stored !== undefined) {
      return stored;
    }
    if (key === "assessment") {
      return Array.isArray(log.assessmentNames) && log.assessmentNames.length > 0;
    }
    return Array.isArray(log.displayNames) && log.displayNames.length > 0;
  };

  const toggleCardDetail = (log, key) => {
    setCardToggles((prev) => ({
      ...prev,
      [`${log._id}:${key}`]: !isToggleOn(log, key),
    }));
  };

  const handleChatUpdated = (logId, chat) => {
    setLogs((prev) => prev.map((item) => (item._id === logId ? { ...item, chat } : item)));
    setChatLog((prev) => (prev && prev._id === logId ? { ...prev, chat } : prev));
  };

  const filters = (
    <Box
      sx={{
        display: "flex",
        flexWrap: "wrap",
        gap: 2,
        minWidth: "100%",
        justifyContent: { xs: "stretch", md: "flex-start" },
      }}
    >
      <FormControl size="small" sx={{ minWidth: { xs: "100%", sm: 180 } }}>
        <InputLabel id="type-filter-label">{getMessage("label_choose_log_type")}</InputLabel>
        <Select
          labelId="type-filter-label"
          id="type-filter"
          value={typeFilter}
          label={getMessage("label_choose_log_type")}
          onChange={(event) => setTypeFilter(event.target.value)}
        >
          <MenuItem value="all">{getMessage("label_log_filter_all")}</MenuItem>
          {Object.entries(LogType).map(([key, value]) => (
            <MenuItem key={key} value={value}>
              {getMessage(
                key === "ASK_FOR_HELP" && isTrainer
                  ? "label_log_type_ask_for_help_trainer"
                  : `label_log_type_${key.toLowerCase()}`
              )}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <FormControl size="small" sx={{ minWidth: { xs: "100%", sm: 180 } }}>
        <InputLabel id="visibility-filter-label">{getMessage("label_log_filter_visible_to")}</InputLabel>
        <Select
          labelId="visibility-filter-label"
          id="visibility-filter"
          value={visibilityFilter}
          label={getMessage("label_log_filter_visible_to")}
          onChange={(event) => setVisibilityFilter(event.target.value)}
        >
          <MenuItem value="all">{getMessage("label_log_filter_visible_all")}</MenuItem>
          <MenuItem value="private">{getVisibilityLabel("private")}</MenuItem>
          {isTrainer ? (
            <MenuItem value="selected">{getVisibilityLabel("selected")}</MenuItem>
          ) : (
            <MenuItem value="trainer">{getVisibilityLabel("trainer")}</MenuItem>
          )}
          <MenuItem value="followers">{getVisibilityLabel("followers")}</MenuItem>
        </Select>
      </FormControl>
      {isTrainer && (
        <FormControl size="small" sx={{ minWidth: { xs: "100%", sm: 180 } }}>
          <InputLabel id="teacher-filter-label">{getMessage("label_log_filter_teacher")}</InputLabel>
          <Select
            labelId="teacher-filter-label"
            id="teacher-filter"
            value={teacherFilter}
            label={getMessage("label_log_filter_teacher")}
            onChange={(event) => setTeacherFilter(event.target.value)}
          >
            <MenuItem value="all">{getMessage("label_log_filter_author_all")}</MenuItem>
            {teacherOptions.map((teacher) => (
              <MenuItem key={teacher._id} value={String(teacher._id)}>
                {getPersonName(teacher, getMessage("label_log_author"))}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}
    </Box>
  );

  const sectionHeader = (
    <Box
      sx={{
        px: { xs: 2, md: 2.5 },
        pt: 2.25,
        pb: 2.5,
        display: "flex",
        flexDirection: "column",
        alignItems: "stretch",
        gap: 2.5,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, minWidth: 0 }}>
        <IconWell>
          <ActivityIcon />
        </IconWell>
        <Typography variant="h5" fontWeight={700} sx={{ lineHeight: 1.2, minWidth: 0 }}>
          {getMessage("label_my_training_activity")}
        </Typography>
      </Box>
      {logs.length > 0 && filters}
    </Box>
  );

  if (logs.length === 0) {
    return (
      <Paper
        elevation={0}
        sx={{
          width: "100%",
          borderRadius: "16px",
          border: "1px solid",
          borderColor: "divider",
        }}
      >
        {sectionHeader}
        <Typography color="text.secondary" sx={{ px: { xs: 2, md: 2.5 }, pb: 2.5 }}>
          {getMessage("label_no_entries")}
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper
      elevation={0}
      sx={{
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
        width: "100%",
        borderRadius: "16px",
        border: "1px solid",
        borderColor: "divider",
        overflow: "visible",
      }}
    >
      {sectionHeader}

      <Box
        sx={{
          px: { xs: 1.5, md: 2 },
          pt: 1.5,
          pb: 2,
          overflow: "visible",
          maxHeight: "none",
          display: "flex",
          flexDirection: "column",
          gap: 1.25,
        }}
      >
        {displayLogs.length === 0 && (
          <Typography color="text.secondary" sx={{ py: 3, textAlign: "center" }}>
            {getMessage("label_log_filter_empty")}
          </Typography>
        )}
        {displayLogs.map((log) => {
          const isEditing = editingId === log._id;
          const isOwn = getAuthorId(log) === currentUserId;
          const messageCount = (log.chat || []).length;
          const isAskForHelp = log.logType === LogType.ASK_FOR_HELP;
          const isSharedWithMe = (log.sharedWith || []).some((entry) => String(entry?._id || entry) === currentUserId);
          const canOpenChat = isAskForHelp && (isTrainer || isOwn || isSharedWithMe || (log.visibility || "private") === "followers");
          const canResolveHelp = isAskForHelp && (isOwn || isTrainer);
          const highlightHelp = isAskForHelp && !log.isCompleted;
          const isFocused = focusLogId && String(focusLogId) === String(log._id);

          return (
            <Box
              key={log._id}
              id={`log-${log._id}`}
              sx={{
                p: { xs: 1.5, md: 1.75 },
                borderRadius: "12px",
                border: "1px solid",
                borderColor: isFocused || highlightHelp ? "#F7941E" : "divider",
                borderLeft: highlightHelp ? "4px solid #F7941E" : undefined,
                bgcolor: highlightHelp ? "#FFFBF6" : "white",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.25, mb: 1 }}>
                <IconWell size={32}>
                  <LogTypeGlyph logType={log.logType} />
                </IconWell>
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography variant="subtitle1" fontWeight={700} sx={{ lineHeight: 1.3, pr: 1 }}>
                    {getMessage(
                      isAskForHelp && (log.visibility || "private") !== "trainer"
                        ? "label_log_type_ask_for_help_trainer"
                        : `label_log_type_${Object.entries(LogType).find(([, value]) => value === log.logType)?.[0]?.toLowerCase() || "observation"}`
                    )}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {getPersonName(log.userId, getMessage("label_log_author"))}
                    {log.creationDate ? ` · ${new Date(log.creationDate).toLocaleDateString()}` : ""}
                  </Typography>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, mt: 1, alignItems: "center" }}>
                    {log.day ? (
                      <Chip
                        size="small"
                        label={`${getMessage("label_log_session")} ${log.day}`}
                        sx={{ bgcolor: "#FFF6EC", border: "1px solid #F5D4A8" }}
                      />
                    ) : null}
                    <Chip
                      size="small"
                      label={getVisibleByLabel(log)}
                      sx={{ bgcolor: "#FFF6EC", border: "1px solid #F5D4A8" }}
                    />
                    {(log.visibility || "private") === "selected" &&
                      log.logType !== LogType.ASK_FOR_HELP &&
                      getSharedPeople(log).map((person) => {
                        const name = getPersonName(person, "");
                        if (!name) return null;
                        return (
                          <Chip
                            key={String(person._id || name)}
                            size="small"
                            label={name}
                            sx={{ bgcolor: "white", border: "1px solid", borderColor: "divider" }}
                          />
                        );
                      })}
                    {isDetailCard(log) && (
                      <>
                        <Chip
                          size="small"
                          clickable
                          label={getMessage("label_log_toggle_assessment")}
                          onClick={() => toggleCardDetail(log, "assessment")}
                          sx={{
                            border: "1px solid #F5D4A8",
                            bgcolor: isToggleOn(log, "assessment") ? "#F7941E" : "#FFF6EC",
                            color: "#1a1a1a",
                          }}
                        />
                        <Chip
                          size="small"
                          clickable
                          label={getMessage("label_log_toggle_participants")}
                          onClick={() => toggleCardDetail(log, "participants")}
                          sx={{
                            border: "1px solid #F5D4A8",
                            bgcolor: isToggleOn(log, "participants") ? "#F7941E" : "#FFF6EC",
                            color: "#1a1a1a",
                          }}
                        />
                        {isToggleOn(log, "assessment") &&
                          (log.assessmentNames || []).map((assessmentName, index) => (
                            <Chip
                              key={`assessment-name-${index}`}
                              label={assessmentName}
                              size="small"
                              sx={{ bgcolor: "white", border: "1px solid", borderColor: "divider" }}
                            />
                          ))}
                        {isToggleOn(log, "participants") &&
                          (log.displayNames || []).map((displayName, index) => (
                            <Chip
                              key={`display-name-${index}`}
                              label={displayName}
                              size="small"
                              sx={{ bgcolor: "white", border: "1px solid", borderColor: "divider" }}
                            />
                          ))}
                      </>
                    )}
                  </Box>
                </Box>
                {isOwn && (
                  <Box sx={{ display: "flex", flexShrink: 0 }}>
                    <IconButton
                      size="small"
                      onClick={() => (isEditing ? handleSave(log._id) : handleStartEdit(log))}
                      aria-label={isEditing ? `Save log ${log.day}` : `Edit log ${log.day}`}
                    >
                      {isEditing ? <SaveRoundedIcon color="primary" /> : <EditOutlinedIcon fontSize="small" />}
                    </IconButton>
                    <IconButton size="small" onClick={() => setLogToDelete(log)}>
                      <DeleteOutlineRoundedIcon sx={{ color: "#D14A38", fontSize: "1.2rem" }} />
                    </IconButton>
                  </Box>
                )}
              </Box>

              <Box sx={{ pl: "42px", mt: 1.5 }}>
              {!isDetailCard(log) && Array.isArray(log.assessmentNames) && log.assessmentNames.length > 0 && (
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, mb: 1 }}>
                  {log.assessmentNames.map((assessmentName, index) => (
                    <Chip
                      key={`assessment-name-${index}`}
                      label={assessmentName}
                      size="small"
                      sx={{ bgcolor: "white", border: "1px solid", borderColor: "divider" }}
                    />
                  ))}
                </Box>
              )}

              {!isDetailCard(log) && Array.isArray(log.displayNames) && log.displayNames.length > 0 && (
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, mb: 1 }}>
                  {log.displayNames.map((displayName, index) => (
                    <Chip
                      key={`display-name-${index}`}
                      label={displayName}
                      size="small"
                      sx={{ bgcolor: "white", border: "1px solid", borderColor: "divider" }}
                    />
                  ))}
                </Box>
              )}

              {isEditing && isOwn ? (
                <TextField
                  fullWidth
                  multiline
                  minRows={4}
                  value={tempDescription}
                  onChange={(event) => {
                    if (event.target.value.length <= 1000) {
                      setTempDescription(event.target.value);
                    }
                  }}
                  autoFocus
                  inputProps={{ maxLength: 1000 }}
                  helperText={`${tempDescription.length}/1000`}
                    sx={{ mt: 1 }}
                />
              ) : (
                <Typography
                  variant="body1"
                  onClick={() => isOwn && handleStartEdit(log)}
                  sx={{
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                    lineHeight: 1.55,
                    fontSize: "1rem",
                    fontWeight: 600,
                    color: "#1a1a1a",
                    cursor: isOwn ? "pointer" : "default",
                  }}
                >
                  {log.description}
                </Typography>
              )}

              <Box sx={{ display: "flex", flexDirection: "column", gap: 1, mt: 1.5 }}>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, alignItems: "center" }}>
                  {log.logType === LogType.CHANGE && isOwn && !log.isCompleted && (
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => handleChangeCompletion(log)}
                      sx={{ borderColor: "#F5D4A8", color: "#D17A1D" }}
                    >
                      {getMessage("label_log_isCompleted")}
                    </Button>
                  )}
                  {canResolveHelp && !log.isCompleted && (
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => handleChangeCompletion(log)}
                      sx={{ borderColor: "#F5D4A8", color: "#D17A1D" }}
                    >
                      {getMessage("label_log_mark_resolved")}
                    </Button>
                  )}
                  {isAskForHelp && log.isCompleted && (
                    <Chip
                      size="small"
                      icon={<CheckCircleOutlineRoundedIcon sx={{ fontSize: "1rem" }} />}
                      label={`${getMessage("label_log_resolved")} · ${formatLogWhen(log.completionDate)}`}
                      onClick={canResolveHelp ? () => handleChangeCompletion(log) : undefined}
                      sx={{
                        bgcolor: "#EEF6EE",
                        border: "1px solid #C4DCC4",
                        color: "#2F6A32",
                        fontWeight: 600,
                        "& .MuiChip-icon": { color: "#2F6A32" },
                      }}
                    />
                  )}
                  {log.logType === LogType.CHANGE && log.isCompleted && (
                    <Chip
                      size="small"
                      icon={<CheckCircleOutlineRoundedIcon sx={{ fontSize: "1rem" }} />}
                      label={`${getMessage("label_log_completed")} · ${formatLogWhen(log.completionDate)}`}
                      onClick={isOwn ? () => handleChangeCompletion(log) : undefined}
                      sx={{
                        bgcolor: "#EEF6EE",
                        border: "1px solid #C4DCC4",
                        color: "#2F6A32",
                        fontWeight: 600,
                        "& .MuiChip-icon": { color: "#2F6A32" },
                      }}
                    />
                  )}
                  {log.lastModificationDate && !isSameMoment(log.lastModificationDate, log.completionDate) && (
                    <Chip
                      size="small"
                      label={`${getMessage("label_last_modified")} · ${formatLogWhen(log.lastModificationDate)}`}
                      sx={{
                        bgcolor: "transparent",
                        border: "1px solid",
                        borderColor: "divider",
                        color: "text.secondary",
                      }}
                    />
                  )}
                  {canOpenChat && (
                    <Button
                      size="small"
                      variant="text"
                      startIcon={<ChatBubbleOutlineRoundedIcon />}
                      onClick={() => setChatLog(log)}
                      sx={{
                        ml: "auto",
                        fontWeight: 700,
                        color: "#C56A12",
                        textDecoration: "underline",
                        textUnderlineOffset: "3px",
                        "&:hover": {
                          bgcolor: "#FFF6EC",
                          textDecoration: "underline",
                        },
                      }}
                    >
                      {getMessage("label_log_open_discussion")}
                      {messageCount > 0 ? ` (${messageCount})` : ""}
                    </Button>
                  )}
                </Box>
              </Box>
              </Box>
            </Box>
          );
        })}
      </Box>

      <LogChatDialog
        open={Boolean(chatLog)}
        log={chatLog}
        onClose={() => setChatLog(null)}
        onChatUpdated={handleChatUpdated}
      />

      <Dialog open={Boolean(logToDelete)} onClose={() => setLogToDelete(null)}>
        <DialogTitle>{getMessage("label_confirmation")}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {getMessage("label_log_delete_confirm")}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLogToDelete(null)}>
            {getMessage("label_cancel")}
          </Button>
          <Button onClick={handleConfirmDelete} color="error" autoFocus>
            {getMessage("label_delete")}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default CustomTimeline;
