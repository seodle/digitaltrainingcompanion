import React, { useState, useEffect } from 'react';
import { useTheme } from '@mui/system';
import { Typography, Box } from '@mui/material';
import { ResponsiveBar } from '@nivo/bar';

function SurveyAnswer({ question, data, respondentAnswers = [] }) {
  const theme = useTheme();
  const [smallScreen, setSmallScreen] = useState(window.innerWidth < theme.breakpoints.values.sm);

  useEffect(() => {
    const checkScreenSize = () => {
      setSmallScreen(window.innerWidth < theme.breakpoints.values.sm);
    };
    
    window.addEventListener('resize', checkScreenSize);
    
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const respondentResponse = respondentAnswers;

  return (
    <Box
      display="flex"
      alignItems="center"
      justifyContent="center"
      flexDirection="column"
      m="30px"
      sx={{ height: '500px', width: {
              xs: '90vw', 
              md: '50vw',
            }}}
    >
      <Typography variant="h4" fontWeight="bold" sx={{ maxWidth: '90%' }} align="left">
        {question}
      </Typography>
      <Box sx={{ width: '100%', height: '100%' }}>
        <ResponsiveBar
          data={data}
          keys={['value']}
          indexBy="response"
          margin={{ top: 0, right: 30, bottom: 50, left: 30 }}
          padding={0.3}
          label={({ value, data }) => `${data.response}: ${Math.round(value)} %`}
          groupMode="grouped"
          layout="horizontal"
          valueScale={{ type: 'linear' }}
          indexScale={{ type: 'band', round: true }}
          colors={({ id, data }) => respondentResponse.includes(data.response) ? 'rgb(233, 152, 63)' : 'rgb(50, 103, 152)'}
          borderColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
          borderRadius={5}
          axisTop={null}
          axisRight={null}
          axisBottom={null}
          axisLeft={null}
          labelSkipWidth={12}
          labelSkipHeight={12}
          labelTextColor={'#ffffff'}
          tooltip={() => null}
          animate={true}
          motionStiffness={90}
          motionDamping={15}
        />
      </Box>
    </Box>
  );
}

export default SurveyAnswer;
