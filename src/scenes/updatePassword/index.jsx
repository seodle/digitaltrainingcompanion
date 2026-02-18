import React, { useState } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, TextField, Button, Typography, IconButton, InputAdornment } from "@mui/material";
import Alert from "@mui/material/Alert";
import logo_dtc from "../../assets/medias/logo.svg";
import { BACKEND_URL } from "../../config";
import { useMessageService } from '../../services/MessageService';
import LanguageSelector from '../../components/LanguageSelector';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';

const UpdatePassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState(null);
  const { token } = useParams();
  const [isPasswordChanged, setIsPasswordChanged] = useState(false);
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { getMessage } = useMessageService();

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const handleClickShowConfirmPassword = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const handleMouseDownPassword = (event) => {
    event.preventDefault();
  };
  
  const handlePasswordChange = (event) => {
    setPassword(event.target.value);
  };

  const handleConfirmPasswordChange = (event) => {
    setConfirmPassword(event.target.value);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (password !== confirmPassword) {
      setMessage({ type: 'error', text: getMessage("label_passwords_dont_match") });
      return;
    }
    try {
      const authToken = localStorage.getItem("token");
      // Send a POST request to your backend endpoint
      const res = await axios.post(`${BACKEND_URL}/updatePassword/${token}`, { password }, {
          headers: {
              Authorization: `Bearer ${authToken}`
          }
      });
      setMessage({ type: 'success', text:  getMessage("lael_change_password_success") });
      setIsPasswordChanged(true);
    } catch (error) {
      if (error.response && error.response.data && error.response.data.message) {
        setMessage({ type: 'error', text: error.response.data.message });
      } else {
        setMessage({ type: 'error', text: getMessage("signup_error") });
      }
    }
  };

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      minHeight="100vh"
    >
      <Box
        display="flex"
        flexDirection="row"
        alignItems="center"
        justifyContent="center"
        sx={{
          boxShadow: "0px 4px 20px rgba(0, 0, 0, 0.1)",
          borderRadius: "15px",
          backgroundColor: "#fff",
          width: {
            xs: "90vw",
            md: "50vw",
          },
        }}
        component="form"
        onSubmit={handleSubmit}
      >
       

        <Box padding="60px">

        <LanguageSelector/>

          <Box
            mb="20px"
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            <Box mb="20px">
              <img
                alt=""
                width="100%"
                height="100%"
                src={logo_dtc}
                style={{ borderRadius: "0%" }}
              />
            </Box>
          </Box>

          <Typography variant="h2" mb={2}>
            {getMessage("label_create_new_password")}
          </Typography>

          <TextField
            variant="outlined"
            margin="normal"
            required
            fullWidth
            id="password"
            type={showPassword ? 'text' : 'password'}
            label={getMessage("label_new_password")}
            name="password"
            autoComplete="password"
            value={password}
            onChange={handlePasswordChange}
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
          <TextField
            variant="outlined"
            margin="normal"
            required
            fullWidth
            name="confirmPassword"
            label={getMessage("label_confirm_new_password")}
            type={showConfirmPassword ? 'text' : 'password'}
            id="confirmPassword"
            autoComplete="confirmPassword"
            value={confirmPassword}
            onChange={handleConfirmPasswordChange}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle password visibility"
                    onClick={handleClickShowConfirmPassword}
                    onMouseDown={handleMouseDownPassword}
                    edge="end"
                  >
                    {showConfirmPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <Box mt="10px" mb="10px">
            {message && <Alert severity={message.type}>{message.text}</Alert>}
          </Box>

          <Box mt={5} display="flex" justifyContent="center">
            {isPasswordChanged ? (
              <Button
                variant="contained"
                sx={{
                  backgroundColor: "#F7941E",
                  borderRadius: "50px",
                  color: "black",
                  "&:hover": {
                    backgroundColor: "#D17A1D",
                  },
                }}
                onClick={() => navigate("/signin")}
              >
                <Typography variant="h5">{getMessage("label_signin")}</Typography>
              </Button>
            ) : (
              <Button
                type="submit"
                variant="contained"
                sx={{
                  backgroundColor: "#F7941E",
                  borderRadius: "50px",
                  color: "black",
                  "&:hover": {
                    backgroundColor: "#D17A1D",
                  },
                }}
              >
                <Typography variant="h5">{getMessage("label_submit")}</Typography>
              </Button>
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default UpdatePassword;
