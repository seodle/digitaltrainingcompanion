import { Box, TextField, Button, Typography } from "@mui/material";
import Alert from "@mui/material/Alert";
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { useAuthUser } from "../../contexts/AuthUserContext";
import { BACKEND_URL } from "../../config";

// components
import DTCLogo from '../../components/DTCLogo';
import { useMessageService } from '../../services/MessageService';
import { buttonStyle, authentificationFormStyle } from '../../components/styledComponents'
import LanguageSelector from '../../components/LanguageSelector';

const ResetPassword = () => {

  const [data, setData] = useState({ email: "", password: "" });
  const [message, setMessage] = useState(null);
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthUser();
  const location = useLocation();
  const { getMessage } = useMessageService();


  useEffect(() => {

    if (location.state && location.state.emailVerified) {
      setMessage({ type: "success", text: getMessage('signin_email_success') });
    }
  }, [location, isAuthenticated, navigate]);

  const handleChange = (event) => {
    setData({ ...data, [event.target.name]: event.target.value });
  };

  const handleForgotPassword = async () => {

    try {
      await axios.post(`${BACKEND_URL}/forgot-password`, { email: data.email });
      setMessage({ type: "success", text: getMessage('signin_email_sent') });
    } catch (error) {
      if (error.response && error.response.status === 400) {
        setMessage({ type: "error", text: error.response.data.message });
      } else {
        setMessage({ type: "error", text: getMessage('signin_email_error') });
      }
    }
  };

  return (
    <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="100vh">
      <Box display="flex" flexDirection="row" alignItems="stretch" justifyContent="center" sx={authentificationFormStyle}>
        <Box flexGrow={2} flexBasis={0} padding="60px">

          <LanguageSelector />
          <DTCLogo />

          <Typography variant="h5">{getMessage('label_info_update_password')}</Typography>

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

          <Box mt="10px" mb="10px">
            {message && <Alert severity={message.type}>{message.text}</Alert>}
          </Box>

          <Box mt={5} display="flex" justifyContent="center">
            <Button type="submit" variant="contained" sx={{ ...buttonStyle, width: '30%' }} onClick={() => handleForgotPassword()}>
              <Typography variant="h5">{getMessage('label_next')}</Typography>
            </Button>
          </Box>

        </Box>
      </Box>
    </Box>
  );
};

export default ResetPassword;
