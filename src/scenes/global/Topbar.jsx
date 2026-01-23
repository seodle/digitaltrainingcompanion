import React, { useState } from 'react';
import { Typography, Box, IconButton, Avatar, Popover, Button, useMediaQuery, Menu, MenuItem } from "@mui/material";
import { useTheme } from '@mui/material/styles';
import PersonOutlinedIcon from "@mui/icons-material/PersonOutlined";
import MenuIcon from '@mui/icons-material/Menu';
import { useNavigate } from "react-router-dom";

import { useMessageService } from '../../services/MessageService';
import LanguageSelector from '../../components/LanguageSelector';

const Topbar = ({ title, logo, boxShadow }) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [openLogoutPopover, setOpenLogoutPopover] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [mobileMenuAnchorEl, setMobileMenuAnchorEl] = useState(null);
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

  const handleOpenMobileMenu = (event) => {
    setMobileMenuAnchorEl(event.currentTarget);
  };

  const handleCloseMobileMenu = () => {
    setMobileMenuAnchorEl(null);
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
    <Box display="flex" justifyContent="space-between" padding={2} sx={{ boxShadow }}>
      <Box display="flex" flexDirection="column" mt={1}>
        <img 
          alt="" 
          src={logo} 
          style={{ 
            cursor: "pointer", 
            borderRadius: "1%", 
            maxWidth: isMobile ? "200px" : "300px", 
            minWidth: isMobile ? "150px" : "300px" 
          }}
        />
        <Typography variant={isMobile ? "h4" : "h2"} fontWeight="bold">{title}</Typography>
      </Box>

      {isMobile ? (
        <Box>
          <IconButton onClick={handleOpenMobileMenu}>
            <MenuIcon />
          </IconButton>
          <Menu
            anchorEl={mobileMenuAnchorEl}
            open={Boolean(mobileMenuAnchorEl)}
            onClose={handleCloseMobileMenu}
          >
            {isLoggedIn ? (
              <MenuItem onClick={handleLogout}>{getMessage('label_logout')}</MenuItem>
            ) : (
              <MenuItem onClick={() => navigate('/signin')}>{getMessage('label_signup')}</MenuItem>
            )}
            <MenuItem>
              <LanguageSelector />
            </MenuItem>
          </Menu>
        </Box>
      ) : (
        <Box display="flex" alignItems="center">
          {isLoggedIn ? (
            <>
              <IconButton onClick={handleOpenLogoutPopover}>
                <Avatar>{initials}</Avatar>
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
              <PersonOutlinedIcon sx={{ mr: '8px' }} />
              <Typography>{getMessage('label_signup')}</Typography>
            </IconButton>
          )}
          <LanguageSelector />
        </Box>
      )}
    </Box>
  );
};

export default Topbar;