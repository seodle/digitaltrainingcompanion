import React from 'react';
import { Box, Typography } from '@mui/material';
import DTCLogo from '../../components/DTCLogo';  // Import the new DTCLogo component
import { useMessageService } from '../../services/MessageService';

/**
 * EndSurvey Component
 * 
 * This component displays the survey completion page with the DTC logo and a thank you message.
 * It uses the centralized DTCLogo component for consistent branding across the application.
 * The message is fetched from the MessageService for internationalization support.
 */
const EndSurvey = () => {
  // Get the message translation service for internationalized text
  const { getMessage } = useMessageService();

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="flex-start"
      minHeight="100vh"
      padding="40px 20px"
    >
      {/* The DTCLogo component handles all logo-related styling and behavior */}
      <DTCLogo />
      
      {/* Thank you message container with responsive width */}
      <Box
        display="flex"
        alignItems="center"
        justifyContent="center"
        mt="50px"
        sx={{
          padding: '20px',
          width: {
            xs: '90vw',  // Full width minus margins on mobile
            md: '50vw',  // Half width on medium and larger screens
          },
        }}
      >
        <Typography 
          variant="h3" 
          align="center" 
          sx={{ 
            margin: '10px',
            // Adding responsive font size for better readability
            fontSize: {
              xs: '1.5rem',  // Smaller font size on mobile
              md: '2rem',    // Larger font size on desktop
            }
          }}
        >
          {getMessage('label_message_thanks')}
        </Typography>
      </Box>
    </Box>
  );
};

export default EndSurvey;