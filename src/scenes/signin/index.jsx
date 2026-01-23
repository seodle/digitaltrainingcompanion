import { Box, TextField, Button, Typography, IconButton, InputAdornment } from "@mui/material";
import Alert from "@mui/material/Alert";
import React, { useState, useEffect } from "react";
import jwt_decode from 'jwt-decode';
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { useAuthUser } from "../../contexts/AuthUserContext";
import { BACKEND_URL } from "../../config";
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';

// components
import DTCLogo from '../../components/DTCLogo';
import { useMessageService } from '../../services/MessageService';
import { buttonStyle, authentificationFormStyle } from '../../components/styledComponents'
import LanguageSelector from '../../components/LanguageSelector';

const Signin = () => {

  const [data, setData] = useState({ email: "", password: "" });
  const [message, setMessage] = useState(null);
  const navigate = useNavigate();
  const { isAuthenticated, setIsAuthenticated, fetchUserDetails } = useAuthUser();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const { getMessage } = useMessageService();


  useEffect(() => {

    if (location.state && location.state.emailVerified) {
        setMessage({ type: "success", text: getMessage('signin_email_success')});
    }
  }, [location, isAuthenticated, navigate]);

  const handleChange = (event) => {
    setData({ ...data, [event.target.name]: event.target.value });
  };

const handleClickShowPassword = () => {
  setShowPassword(!showPassword);
};

const handleMouseDownPassword = (event) => {
  event.preventDefault();
};

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      const response = await axios.post(`${BACKEND_URL}/signin`, data);
      localStorage.setItem("token", response.data.token);
      setIsAuthenticated(true);
      // Immediately fetch user details after authentication
      const decoded = jwt_decode(response.data.token);
      await fetchUserDetails(response.data.token, decoded._id);
      navigate("/dashboard");
    } catch (error) {
      setMessage({ type: "error", text: error.response?.data.message || "Error logging in" });
    }
  };

  return (
    <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="100vh">
      <Box display="flex" flexDirection="row" alignItems="stretch" justifyContent="center" sx={authentificationFormStyle} component="form" onSubmit={handleSubmit}>
        <Box flexGrow={2} flexBasis={0} padding="60px">
          
          <LanguageSelector/>
          <DTCLogo/>

          <Typography variant="h2" mb={2}>
            {getMessage('label_signin')}
          </Typography>

          <TextField
            variant="outlined"
            margin="normal"
            required
            fullWidth
            id="email"
            label={getMessage('label_email')}
            name="email"
            autoComplete="email"
            value={data.email}
            onChange={handleChange}
          />

          <TextField
            variant="outlined"
            margin="normal"
            required
            fullWidth
            name="password"
            label={getMessage('label_password')}
            type={showPassword ? 'text' : 'password'}
            id="password"
            autoComplete="current-password"
            value={data.password}
            onChange={handleChange}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle password visibility"
                    onClick={handleClickShowPassword}
                    onMouseDown={handleMouseDownPassword}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <Box mt="10px" mb="10px">
            {message && <Alert severity={message.type}>{message.text}</Alert>}
          </Box>

          <Typography 
            style={{ textDecoration: "underline", cursor: "pointer" }} 
            onClick={() => navigate("/resetPassword")}
          >
            {getMessage('signin_forgot_password')}
          </Typography>

          <Box mt={5} display="flex" justifyContent="center">
            <Button type="submit" variant="contained" sx={{...buttonStyle, width: '30%'}}>
              <Typography variant="h5">{getMessage('label_next')}</Typography>
            </Button>
          </Box>


          <Box mt={5} display="inline-flex" alignItems="center">
            <Typography>
              {getMessage('label_no_account_yet')}
            </Typography>

            <Typography 
              style={{ textDecoration: "underline", cursor: "pointer", marginLeft: '5px' }} 
              onClick={() => navigate("/signup")}
              color="primary"
            >
              {getMessage('label_signup')}
            </Typography>
          </Box>

        </Box>
      </Box>
    </Box>
  );
};

export default Signin;
