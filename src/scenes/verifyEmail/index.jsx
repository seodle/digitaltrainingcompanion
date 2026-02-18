import React, { useState } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';
import { Box, Button, Typography } from "@mui/material";
import Alert from "@mui/material/Alert";
import logo_dtc from "../../assets/medias/logo.svg";
import { BACKEND_URL } from "../../config";

const VerifyEmail = () => {
  const [message, setMessage] = useState(null);
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const token = searchParams.get('token');  const navigate = useNavigate();

  const handleSubmit = async (event) => {
  event.preventDefault();

  try {
    const resVerify = await axios.get(`${BACKEND_URL}/verify-email`, { params: { token } });

    if (resVerify.data.includes('Your email has been verified')) {
      navigate('/signin', { state: { emailVerified: true } });
    }
  } catch (error) {
    if (error.response && error.response.status === 400) {
      setMessage({
        type: 'error',
        text: 'Invalid verification token'
      });
    } else {
      setMessage({
        type: 'error',
        text: 'Email verification failed'
      });
      console.error("Email verification failed.", error);
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
            xs: "50vw",
            md: "30vw",
          },
        }}
      >
        <Box padding="60px">
          <Box
            mb="20px"
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            <img
              alt=""
              width="80%"
              height="80%"
              src={logo_dtc}
              style={{ borderRadius: "0%" }}
            />
          </Box>

          <Box mt={5} display="flex" justifyContent="center">
            <Button
              onClick={handleSubmit}
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
              <Typography variant="h5">CONFIRM EMAIL ADDRESS</Typography>
            </Button>
          </Box>
          <Box mt="20px">
              {message && <Alert severity={message.type}>{message.text}</Alert>}
            </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default VerifyEmail;
