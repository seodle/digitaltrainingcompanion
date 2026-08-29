import React, { useState } from 'react';
import { Typography, Box, IconButton, Avatar, Popover, Button, useMediaQuery } from "@mui/material";
import { useTheme } from '@mui/material/styles';
import PersonOutlinedIcon from "@mui/icons-material/PersonOutlined";
import { useNavigate } from "react-router-dom";

import { useMessageService } from '../../services/MessageService';
import LanguageSelector from '../../components/LanguageSelector';

const Topbar = ({ title, logo, boxShadow }) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [openLogoutPopover, setOpenLogoutPopover] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const { getMessage } = useMessageService();

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.reload();
  };

  const handleOpenLogoutPopover = (event) => {
    setAnchorEl(event.currentTarget);
    setOpenLogoutPopover(true);
  };

  const handleCloseLogoutPopover = () => {
    setOpenLogoutPopover(false);
  };

  let initials = "";
  let isLoggedIn = false;
  let token = localStorage.getItem('token');
  
  if (token) {
    const decodedPayload = JSON.parse(atob(token.split('.')[1]));
    if (decodedPayload.firstName && decodedPayload.lastName) {
      initials = `${decodedPayload.firstName.charAt(0).toUpperCase()}${decodedPayload.lastName.charAt(0).toUpperCase()}`;
      isLoggedIn = true;
    }
  }

  return (
    <Box display="flex" justifyContent="space-between" alignItems="flex-start" sx={{ boxShadow, px: { xs: 2, md: 2 }, py: { xs: 1.5, md: 2 }, pl: { xs: 7, md: 2 } }}>
      <Box display="flex" flexDirection="column" mt={{ xs: 0.5, md: 1 }} sx={{ minWidth: 0, pr: 1 }}>
        {logo && (
        <img 
          alt="" 
          src={logo} 
          style={{ 
            cursor: "pointer", 
            borderRadius: "1%", 
            maxWidth: isMobile ? "160px" : "300px", 
            minWidth: isMobile ? "120px" : "300px" 
          }}
        />
        )}
        <Typography variant={isMobile ? "h5" : "h2"} fontWeight="bold" sx={{ wordBreak: "break-word" }}>{title}</Typography>
      </Box>

      <Box display="flex" alignItems="center" sx={{ flexShrink: 0 }}>
        {isLoggedIn ? (
          <>
            <IconButton onClick={handleOpenLogoutPopover} size={isMobile ? "small" : "medium"}>
              <Avatar sx={{ width: isMobile ? 32 : 40, height: isMobile ? 32 : 40, fontSize: isMobile ? "0.85rem" : "1rem" }}>{initials}</Avatar>
            </IconButton>
            <Popover
              open={openLogoutPopover}
              onClose={handleCloseLogoutPopover}
              anchorEl={anchorEl}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
              transformOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
              <Box p={2}>
                <Button onClick={handleLogout} color="error">{getMessage('label_logout')}</Button>
              </Box>
            </Popover>
          </>
        ) : (
          <IconButton onClick={() => navigate('/signin')}>
            <PersonOutlinedIcon sx={{ mr: { xs: 0, md: '8px' } }} />
            <Typography sx={{ display: { xs: "none", sm: "block" } }}>{getMessage('label_signup')}</Typography>
          </IconButton>
        )}
        <LanguageSelector />
      </Box>
    </Box>
  );
};

export default Topbar;