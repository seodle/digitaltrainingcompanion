import React, { useState, useEffect} from "react";
import { ProSidebar, Menu, MenuItem } from "react-pro-sidebar";
import { Box, IconButton, Typography, useTheme } from "@mui/material";
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
import SummarizeIcon from '@mui/icons-material/Summarize';
import DirectionsIcon from '@mui/icons-material/Directions';
import logo from "../../assets/medias/logo.svg"; 
import logo_epfl from "../../assets/medias/logo-epfl.svg";
import { useMessageService } from '../../services/MessageService';


const Item = ({ title, to, icon, selected, setSelected, disabled }) => {

  const theme = useTheme();
  const colors = tokens(theme.palette.mode);

  const handleClick = () => {
    if (!disabled) {
      setSelected(title);
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
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [selected, setSelected] = useState("Dashboard");
  const { getMessage } = useMessageService();

  // Create a state to hold the window height
  const [windowHeight, setWindowHeight] = useState(window.innerHeight);

  // Update the window height on resize
  useEffect(() => {
    const handleResize = () => setWindowHeight(window.innerHeight);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Determine if the logo should be displayed
  const showLogo = windowHeight >= 875;


  return (
    <Box
      sx={{
        "& .pro-sidebar-inner": {
          background: `${"white"} !important`,
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
        collapsed={isCollapsed}
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
            {!isCollapsed && (
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

          {!isCollapsed && (
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

          <Box paddingLeft={isCollapsed ? undefined : "10%"}>
            <Item
              title={getMessage('label_home')}
              to="/"
              icon={<HomeIcon />}
              selected={selected}
              setSelected={setSelected}
            />

            {!isCollapsed && (
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
            />

            {!isCollapsed && (
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
            />

            {/* <Item
              title={getMessage('label_summaries')}
              to="/summaries"
              icon={<SummarizeIcon />}
              selected={selected}
              setSelected={setSelected}
              disabled={false}
            /> */}

            {!isCollapsed && (
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
            />

             {!isCollapsed && (
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
            />

            {!isCollapsed && (
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
            />

          </Box>
        </Menu>
        {!isCollapsed && showLogo && (
            <Box mt={20} position="absolute" bottom={0} width="100%" display="flex" justifyContent="center" alignItems="center">
              <img
                alt=""
                src={logo_epfl}
                style={{ cursor: "pointer", borderRadius: "0%", width: "150px", height: "150px" }}
              />
            </Box>
        )}
      </ProSidebar>
    </Box>
  );
};

export default Sidebar;
