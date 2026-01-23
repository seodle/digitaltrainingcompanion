import React, { useState } from 'react';
import { Box, Button, Typography } from '@mui/material';

import { useMessageService } from '../services/MessageService';

const CookieConsentBanner = ({ onAccept, lng="en" }) => {

  const [visible, setVisible] = useState(true);
  const { getMessage } = useMessageService();

  const handleAccept = () => {
    onAccept();
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <Box
      position="fixed"
      bottom={0}
      left={0}
      width="100vw"
      bgcolor="rgba(0,0,0,0.85)"
      color="white"
      p={2}
      m={0}
      textAlign="center"
      boxSizing="border-box"
      zIndex="tooltip"
    >
      <Typography variant="body1">
        {getMessage('signup_message_cookie_banner')} 
      </Typography>
      <Button 
        color="primary" 
        onClick={handleAccept}
        sx={{ 
            mt: 1, 
            backgroundColor: 'white', 
            color: 'black', 
            borderColor: 'white',
            '&:hover': {
            backgroundColor: 'white', 
            color: 'black', 
            }
        }}
        >
        {getMessage('signup_text_accept_button_cookie_banner')} 
      </Button>
    </Box>
  );
};

export default CookieConsentBanner;