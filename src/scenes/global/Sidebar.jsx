import React, { useState, useEffect} from "react";
import { ProSidebar, Menu, MenuItem } from "react-pro-sidebar";
import { Box, IconButton, Typography, useTheme, useMediaQuery } from "@mui/material";
import { Link } from "react-router-dom";
import "react-pro-sidebar/dist/css/styles.css";
import { tokens } from "../../theme";
import HomeIcon from '@mui/icons-material/Home';
import MenuOutlinedIcon from "@mui/icons-material/MenuOutlined";
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import ConstructionIcon from '@mui/icons-material/Construction';
import PollIcon from '@mui/icons-material/Poll';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import MonitorHeartIcon from '@mui/icons-material/MonitorHeart';
import DirectionsIcon from '@mui/icons-material/Directions';
import logo from "../../assets/medias/logo.svg"; 
import logo_evalution from "../../assets/medias/logo-evalution.png";
import { useMessageService } from '../../services/MessageService';


const Item = ({ title, to, icon, selected, setSelected, disabled, onNavigate }) => {

  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  const handleClick = () => {
    if (!disabled) {
      setSelected(title);
      onNavigate?.();
    }
  };

  // Apply a different style if the item is disabled
  const itemStyle = disabled ? {
    color: colors.grey[800], // This is the disabled color
    cursor: 'not-allowed',
    pointerEvents: 'none' // Prevents all click events on this element
  } : {
    color: selected === title ? colors.grey[100] : colors.grey[100], // Active or default color
    cursor: 'pointer',
  };

  return (
    <MenuItem
      active={selected === title}
      style={itemStyle}
      onClick={handleClick}
      icon={icon}
    >
      <Typography variant="h5">{title}</Typography>
      {/* The Link is also conditional on not being disabled */}
      {!disabled && <Link to={to} />}
    </MenuItem>
  );
};


const Sidebar = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [isCollapsed, setIsCollapsed] = useState(() =>
    typeof window !== "undefined" && window.innerWidth < theme.breakpoints.values.md
  );
  const [selected, setSelected] = useState("Dashboard");
  const { getMessage } = useMessageService();

  useEffect(() => {
    if (isMobile) {
      setIsCollapsed(true);
    }
  }, [isMobile]);

  return (
    <>
      {isMobile && isCollapsed && (
        <IconButton
          onClick={() => setIsCollapsed(false)}
          aria-label="Open menu"
          sx={{
            position: "fixed",
            top: 12,
            left: 12,
            zIndex: 1400,
            bgcolor: "white",
            boxShadow: 2,
            "&:hover": { bgcolor: "white" },
          }}
        >
          <MenuOutlinedIcon />
        </IconButton>
      )}
      {isMobile && !isCollapsed && (
        <Box
          onClick={() => setIsCollapsed(true)}
          sx={{
            position: "fixed",
            inset: 0,
            bgcolor: "rgba(0,0,0,0.35)",
            zIndex: 1299,
          }}
        />
      )}
    {!isMobile && (
      <Box
        aria-hidden
        sx={{
          width: isCollapsed ? 80 : 270,
          flexShrink: 0,
          alignSelf: "stretch",
        }}
      />
    )}
    <Box
      sx={{
        ...(isMobile
          ? {
              position: "fixed",
              left: 0,
              top: 0,
              zIndex: 1300,
              height: "100vh",
              transform: isCollapsed ? "translateX(-110%)" : "translateX(0)",
              transition: "transform 0.2s ease",
            }
          : {
              position: "fixed",
              left: 0,
              top: 0,
              height: "100vh",
              zIndex: 1200,
            }),
        "& .pro-sidebar-inner": {
          background: `${"white"} !important`,
          overflowY: "auto",
          overflowX: "hidden",
        },
        "& .pro-sidebar-inner > .pro-sidebar-layout": {
          height: "auto !important",
          minHeight: "100%",
          overflow: "visible !important",
          display: "flex",
          flexDirection: "column",
        },
        "& .pro-icon-wrapper": {
          backgroundColor: "transparent !important",
        },
        "& .pro-inner-item": {
          padding: "5px 35px 5px 20px !important",
        },
        "& .pro-inner-item:hover": {
          color: "#868dfb !important",
        },
        "& .pro-menu-item.active": {
          color: "#6870fa !important",
        },
        boxShadow: "rgba(0, 0, 0, 0.24) 0px 3px 8px;"
      }}
    >
      <ProSidebar
        collapsed={isMobile ? false : isCollapsed}
        style={{height: "100vh", position: "relative"}}

      >
        
        <Menu
          iconShape="square"
        >
          {/* LOGO AND MENU ICON */}
          <MenuItem
            onClick={() => setIsCollapsed(!isCollapsed)}
            icon={isCollapsed ? <MenuOutlinedIcon /> : undefined}
            style={{
              margin: "0 0 0 0",
              color: "colors.grey[100]",
            }}
          >
            {(isMobile || !isCollapsed) && (
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                ml="15px"
              >
                <IconButton onClick={() => setIsCollapsed(!isCollapsed)}>
                  <MenuOutlinedIcon />
                </IconButton>
              </Box>
            )}
          </MenuItem>

          {(isMobile || !isCollapsed) && (
            <Box
              mb="0px"
              ml="10px"
              mr="10px"
              pb="30px"
            >
              <Box
                display="flex"
                justifyContent="center"
                alignItems="center"
              >
                <img
                  alt=""
                  width="90%"
                  height="100%"
                  src={logo}
                  style={{ cursor: "pointer", borderRadius: "0%" }}
                />
              </Box>
            </Box>
          )}

          <Box paddingLeft={isMobile || !isCollapsed ? "10%" : undefined}>
            <Item
              title={getMessage('label_home')}
              to="/"
              icon={<HomeIcon />}
              selected={selected}
              setSelected={setSelected}
              onNavigate={() => isMobile && setIsCollapsed(true)}
            />

            {(isMobile || !isCollapsed) && (
              <Typography
                variant="h5"
                color={colors.grey[300]}
                sx={{ m: "15px 0 5px 10px" }}
              >
                {getMessage('label_design').toUpperCase()}
              </Typography>
            )}
            
            <Item
              title={getMessage('label_monitoring_title')}
              to="/dashboard"
              icon={< MonitorHeartIcon/>}
              selected={selected}
              setSelected={setSelected}
              onNavigate={() => isMobile && setIsCollapsed(true)}
            />

            {(isMobile || !isCollapsed) && (
              <Typography
                variant="h5"
                color={colors.grey[300]}
                sx={{ m: "15px 0 5px 10px" }}
              >
                {getMessage('label_monitor').toUpperCase()}
              </Typography>
            )}
          
            <Item
              title={getMessage('label_results')}
              to="/reports"
              icon={<PollIcon />}
              selected={selected}
              setSelected={setSelected}
              onNavigate={() => isMobile && setIsCollapsed(true)}
            />

            {(isMobile || !isCollapsed) && (
              <Typography
                variant="h5"
                color={colors.grey[300]}
                sx={{ m: "15px 0 5px 10px" }}
              >
                {getMessage('label_regulate').toUpperCase()}
              </Typography>
            )}

            <Item
              title={getMessage('label_logbooks')}
              to="/logbooks"
              icon={<MenuBookIcon />}
              selected={selected}
              setSelected={setSelected}
              onNavigate={() => isMobile && setIsCollapsed(true)}
            />

             {(isMobile || !isCollapsed) && (
              <Typography
                variant="h5"
                color={colors.grey[300]}
                sx={{ m: "20px 0px 10px 10px" }}
              >
                {getMessage('label_resources').toUpperCase()}
              </Typography>
            )}

            <Item
              title={getMessage('label_tutorial')}
              to="/tutorial"
              icon={<DirectionsIcon />}
              selected={selected}
              setSelected={setSelected}
              disabled={false}
              onNavigate={() => isMobile && setIsCollapsed(true)}
            />

            {(isMobile || !isCollapsed) && (
              <Typography
                variant="h5"
                color={colors.grey[300]}
                sx={{ m: "20px 0px 10px 10px" }}
              >
                {getMessage('label_settings').toUpperCase()}
              </Typography>
            )}

            <Item
              title={getMessage('label_my_account')}
              to="/settings"
              icon={<AccountCircleIcon />}
              selected={selected}
              setSelected={setSelected}
              onNavigate={() => isMobile && setIsCollapsed(true)}
            />

          </Box>
        </Menu>
        {!isCollapsed && (
            <Box
              sx={{
                mt: "auto",
                flexShrink: 0,
                width: "100%",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                pt: 2,
                pb: 4,
              }}
            >
              <img
                alt="evalution"
                src={logo_evalution}
                style={{ cursor: "pointer", borderRadius: "0%", width: "170px", height: "auto" }}
              />
            </Box>
        )}
      </ProSidebar>
    </Box>
    </>
  );
};

export default Sidebar;
