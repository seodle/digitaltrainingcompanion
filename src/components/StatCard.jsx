import { Typography, Box, CardContent } from "@mui/material";

const StatCard = ({title, value, backgroundColor = "white"}) => {
  return (
    <Box mb="20px" sx={{ minWidth: 100, backgroundColor: backgroundColor,
              boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.1)',
              borderRadius: '15px'
            }}>
      <CardContent>
        <Typography align="center" variant="h3" component="div">
          {title}
        </Typography>
        <Box marginTop={2}>
          <Typography align="center" variant="h5" fontWeight="bold">
            {value}
          </Typography>
        </Box>
      </CardContent>
    </Box>
  );
};

export default StatCard;