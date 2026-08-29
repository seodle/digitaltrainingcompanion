import React, { useEffect, useRef, useState } from "react";
import {
  Box,
  Typography,
  Dialog,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  IconButton,
  useMediaQuery,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import { ChatHeaderIcon, IconWell } from "./logbookIcons";
import axios from "axios";
import { BACKEND_URL } from "../config";
import { useAuthUser } from "../contexts/AuthUserContext";
import { useMessageService } from "../services/MessageService";
import { localizeAssessmentType } from "../utils/ObjectsUtils";
import { buttonStyle } from "./styledComponents";

const POLL_MS = 2500;

const getPersonName = (person, fallback) => {
  if (person && typeof person === "object") {
    return `${person.firstName || ""} ${person.lastName || ""}`.trim() || fallback;
  }
  return fallback;
};

const LogChatDialog = ({ open, log, onClose, onChatUpdated }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const { currentUser } = useAuthUser();
  const { getMessage } = useMessageService();
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const listRef = useRef(null);
  const stickToBottom = useRef(true);
  const onChatUpdatedRef = useRef(onChatUpdated);
  const lastStampRef = useRef("");
  const currentUserId = String(currentUser?._id || "");

  useEffect(() => {
    onChatUpdatedRef.current = onChatUpdated;
  }, [onChatUpdated]);

  useEffect(() => {
    if (open && log) {
      const initial = log.chat || [];
      setMessages(initial);
      setDraft("");
      stickToBottom.current = true;
      lastStampRef.current = `${initial.length}:${initial[initial.length - 1]?._id || ""}`;
    }
  }, [open, log?._id]);

  useEffect(() => {
    if (!open || !log?._id) {
      return undefined;
    }

    let cancelled = false;
    const fetchChat = async () => {
      if (document.hidden) {
        return;
      }
      try {
        const token = localStorage.getItem("token");
        const { data } = await axios.get(`${BACKEND_URL}/logs/${log._id}/chat`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (cancelled || !Array.isArray(data)) {
          return;
        }
        const stamp = `${data.length}:${data[data.length - 1]?._id || ""}`;
        if (stamp === lastStampRef.current) {
          return;
        }
        lastStampRef.current = stamp;
        setMessages(data);
        onChatUpdatedRef.current?.(log._id, data);
      } catch (error) {
        console.error("Error polling chat:", error);
      }
    };

    fetchChat();
    const intervalId = setInterval(fetchChat, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [open, log?._id]);

  useEffect(() => {
    if (!stickToBottom.current || !listRef.current) {
      return;
    }
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages]);

  const handleSend = async () => {
    const text = draft.trim();
    if (!text || !log?._id || busy) {
      return;
    }
    setBusy(true);
    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.post(
        `${BACKEND_URL}/logs/${log._id}/chat`,
        { text },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const next = Array.isArray(data) ? data : [];
      lastStampRef.current = `${next.length}:${next[next.length - 1]?._id || ""}`;
      setMessages(next);
      setDraft("");
      stickToBottom.current = true;
      onChatUpdated?.(log._id, next);
    } catch (error) {
      console.error("Error sending chat message:", error);
    } finally {
      setBusy(false);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      handleSend();
    }
  };

  if (!log) {
    return null;
  }

  const subtitle = [
    getPersonName(log.userId, getMessage("label_log_author")),
    log.day ? `${getMessage("label_log_session")} ${log.day}` : "",
    localizeAssessmentType(log.assessment, getMessage),
  ].filter(Boolean).join(" · ");

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{
        sx: {
          display: "flex",
          flexDirection: "column",
          borderRadius: { xs: 0, sm: "16px" },
          height: { xs: "100%", sm: "auto" },
          maxHeight: { xs: "100%", sm: "88vh" },
        },
      }}
      fullScreen={isMobile}
    >
      <Box
        sx={{
          px: { xs: 2, sm: 3 },
          py: 2,
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          bgcolor: "#FFF6EC",
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        <IconWell>
          <ChatHeaderIcon />
        </IconWell>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography variant="h5" fontWeight={700} sx={{ lineHeight: 1.2 }}>
            {getMessage("label_log_chat_title")}
          </Typography>
          <Typography variant="body2" color="text.secondary" noWrap>
            {subtitle}
          </Typography>
        </Box>
        <IconButton onClick={onClose} aria-label={getMessage("label_cancel")}>
          <CloseRoundedIcon />
        </IconButton>
      </Box>

      <DialogContent
        sx={{
          px: { xs: 2, sm: 3 },
          py: 2,
          display: "flex",
          flexDirection: "column",
          flex: 1,
          minHeight: 0,
        }}
      >
        <Box
          ref={listRef}
          onScroll={(event) => {
            const el = event.currentTarget;
            stickToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
          }}
          sx={{
            flex: 1,
            minHeight: { xs: 0, sm: 280 },
            maxHeight: { xs: "none", sm: 360 },
            overflowY: "auto",
            py: 0.5,
            px: 0.5,
          }}
        >
          {messages.length === 0 ? (
            <Box sx={{ py: 6, textAlign: "center" }}>
              <Typography variant="body1" color="text.secondary">
                {getMessage("label_log_chat_empty")}
              </Typography>
            </Box>
          ) : (
            messages.map((message) => {
              const isMine = String(message.userId?._id || message.userId) === currentUserId;
              return (
                <Box
                  key={message._id}
                  sx={{
                    mb: 1.25,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: isMine ? "flex-end" : "flex-start",
                  }}
                >
                  <Typography variant="body2" fontWeight={700} color="text.secondary" sx={{ mb: 0.25 }}>
                    {getPersonName(message.userId, getMessage("label_log_author"))}
                    {message.createdAt
                      ? ` · ${new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
                      : ""}
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{
                      px: 1.75,
                      py: 1.25,
                      borderRadius: "12px",
                      maxWidth: "86%",
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                      bgcolor: isMine ? "#FFF6EC" : "white",
                      border: "1px solid",
                      borderColor: isMine ? "#F5D4A8" : "divider",
                    }}
                  >
                    {message.text}
                  </Typography>
                </Box>
              );
            })
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: { xs: 2, sm: 3 }, py: 2, gap: 1, alignItems: "stretch", flexDirection: { xs: "column", sm: "row" } }}>
        <TextField
          fullWidth
          multiline
          minRows={1}
          maxRows={4}
          placeholder={getMessage("label_log_chat_placeholder")}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={handleKeyDown}
        />
        <Button
          variant="contained"
          disabled={busy || !draft.trim()}
          onClick={handleSend}
          endIcon={<SendRoundedIcon />}
          sx={{ ...buttonStyle, mr: 0, minWidth: 110, minHeight: 48 }}
        >
          {getMessage("label_log_send_message")}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default LogChatDialog;
