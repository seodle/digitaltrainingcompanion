import React from 'react';
import { Box } from '@mui/material';
import logo_dtc from "../assets/medias/logo.svg";

const DTCLogo = () => {
  return (
    <Box mt="20px" mb="20px" display="flex" alignItems="center" justifyContent="center">
      <Box sx={{ maxWidth: '300px', width: '100%' }}>
        <img 
          src={logo_dtc} 
          alt="DTC Logo"
          style={{ 
            width: '100%',
            height: 'auto',
            maxHeight: '200px',
            cursor: "pointer",
            borderRadius: "0%",
            objectFit: 'contain'
          }} 
        />
      </Box>
    </Box>
  );
};

export default DTCLogo;