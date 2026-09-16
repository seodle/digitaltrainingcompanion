import React from "react";
import { Box } from "@mui/material";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import SwapHorizRoundedIcon from "@mui/icons-material/SwapHorizRounded";
import ContactSupportOutlinedIcon from "@mui/icons-material/ContactSupportOutlined";
import NoteAltOutlinedIcon from "@mui/icons-material/NoteAltOutlined";
import AutoStoriesOutlinedIcon from "@mui/icons-material/AutoStoriesOutlined";
import ChatBubbleOutlineRoundedIcon from "@mui/icons-material/ChatBubbleOutlineRounded";
import { LogType } from "../utils/enums";

export const IconWell = ({ children, size = 36 }) => (
  <Box
    sx={{
      width: size,
      height: size,
      borderRadius: "10px",
      bgcolor: "#FFF6EC",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    }}
  >
    {children}
  </Box>
);

const iconSx = { fontSize: 20, color: "#D17A1D" };

export const LogTypeGlyph = ({ logType }) => {
  if (logType === LogType.OBSERVATION) {
    return <VisibilityOutlinedIcon sx={iconSx} />;
  }
  if (logType === LogType.ASK_FOR_HELP) {
    return <ContactSupportOutlinedIcon sx={iconSx} />;
  }
  return <SwapHorizRoundedIcon sx={iconSx} />;
};

export const AddLogIcon = () => <NoteAltOutlinedIcon sx={iconSx} />;
export const ActivityIcon = () => <AutoStoriesOutlinedIcon sx={iconSx} />;
export const ChatHeaderIcon = () => <ChatBubbleOutlineRoundedIcon sx={iconSx} />;
