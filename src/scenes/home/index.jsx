import React from "react";
import {
  Box,
  Button,
  Container,
  Grid,
  IconButton,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { 
  Newspaper as NewsIcon,
  KeyboardArrowDown as ArrowDownIcon,
  LinkedIn as LinkedInIcon,
  YouTube as YouTubeIcon
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useMessageService } from '../../services/MessageService';
import LanguageSelector from '../../components/LanguageSelector';
import NewsSection from '../../components/NewsSection';

// Assets
import logo from "../../assets/medias/logo.svg";
import illustrationHomePage from "../../assets/medias/illustrationHomePage.png";
import logoEpfl from "../../assets/medias/logo-epfl.svg";
import myMonitorings from "../../assets/medias/home-my-monitorings.png";
import editAssessments from "../../assets/medias/home-edit-assessments.png";
import visualizeResults from "../../assets/medias/home-visualize-results.png";
import logbooks from "../../assets/medias/home-logbooks.png";
import "/node_modules/flag-icons/css/flag-icons.min.css";
import { buttonStyle } from '../../components/styledComponents';

// Palette
const palette = {
  teal: "#57C1CA",
  green: "#8AC055",
  orange: "#E3913C",
  yellow: "#F2C24D",
  dark: "#0F2537",
};

const Home = () => {
  const theme = useTheme();
  const { getMessage } = useMessageService();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const navigate = useNavigate();
  const YEAR = new Date().getFullYear();
  const isSandboxMode = true;

  const scrollToNews = () => {
    const newsSection = document.getElementById('news-section');
    if (newsSection) {
      newsSection.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  // Primary Navigation
  const PrimaryNav = () => (
    <Box
      position="relative"
      padding={2}
      sx={{
        boxShadow: "0px 4px 8px rgba(0,0,0,0.1)",
        minHeight: { xs: "160px", md: "100px" },
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      {/* Logo */}
      <Box
        sx={{
          borderRadius: "16px",
          padding: "12px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <img
          alt="logo"
          src={logo}
          style={{
            cursor: "pointer",
            width: isMobile ? "200px" : "200px",
            height: "auto",
          }}
        />
      </Box>

      {/* Right side */}
      <Box display="flex" alignItems="center" gap={2} sx={{ marginRight: 4 }}>
        <IconButton
          component="a"
          href="https://www.linkedin.com/company/the-digital-training-companion/posts/?feedView=all"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="LinkedIn"
          sx={{
            color: '#0A66C2',
            border: '1px solid #0A66C2',
            '&:hover': {
              backgroundColor: 'rgba(10, 102, 194, 0.08)'
            }
          }}
        >
          <LinkedInIcon fontSize="small" />
        </IconButton>
        <IconButton
          component="a"
          href="http://www.youtube.com/@digitaltrainingcompanion"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="YouTube"
          sx={{
            color: '#FF0000',
            border: '1px solid #FF0000',
            '&:hover': {
              backgroundColor: 'rgba(255, 0, 0, 0.08)'
            }
          }}
        >
          <YouTubeIcon fontSize="small" />
        </IconButton>
        {!isMobile && (
          <>
            <Button
              onClick={scrollToNews}
              variant="text"
              startIcon={<NewsIcon />}
              endIcon={<ArrowDownIcon sx={{ fontSize: '16px' }} />}
              sx={{
                fontSize: "0.8rem",
                padding: "8px 16px",
                borderRadius: "12px",
                color: palette.teal,
                fontWeight: "600",
                whiteSpace: "nowrap",
                textTransform: "none",
                border: `1px solid ${palette.teal}`,
                background: 'rgba(87, 193, 202, 0.05)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  backgroundColor: palette.teal,
                  color: 'white',
                  transform: 'translateY(-1px)',
                  boxShadow: '0 4px 12px rgba(87, 193, 202, 0.3)',
                  '& .MuiSvgIcon-root': {
                    transform: 'scale(1.1)',
                  }
                },
                '& .MuiSvgIcon-root': {
                  transition: 'transform 0.2s ease',
                }
              }}
            >
              {getMessage('label_news')}
            </Button>
            <Button
              onClick={() => navigate("/dashboard")}
              variant="contained"
              sx={{
                ...buttonStyle,
                fontSize: "0.8rem",
                padding: "8px 16px",
                borderRadius: "8px",
                color: "white",
                fontWeight: "bold",
                boxShadow: "0px 4px 10px rgba(0,0,0,0.2)",
                whiteSpace: "nowrap",
              }}
            >
              {getMessage('label_go_dashboard')}
            </Button>
          </>
        )}
        <LanguageSelector />
      </Box>
    </Box>
  );

  const Hero = () => (
    <Box
      component="section"
      sx={{
        pt: { xs: 8, md: 18 },
        pb: { xs: 8, md: 18 },
        background: `linear-gradient(135deg, ${palette.teal} 0%, ${palette.green} 100%)`,
        color: "#fff",
      }}
    >
      <Container maxWidth="xl" sx={{ px: { xs: 2, md: 6, lg: 10 } }}>
        <Grid
          container
          alignItems="center"
          direction={isMobile ? "column" : "row"}
        >
          {/* Left column */}
          <Grid item xs={12} md={6}>
            <Box sx={{ textAlign: isMobile ? 'center' : 'left' }}>
            <Typography
              variant={isMobile ? "h2" : "h1"}
              fontWeight={900}
              gutterBottom
              sx={{ lineHeight: 1.2 }}
            >
              {getMessage('dtc_description')}
            </Typography>
            <Typography
              variant={isMobile ? "h4" : "h3"}
              sx={{ opacity: 0.95, mb: 4, maxWidth: 520 }}
            >
              {getMessage('dtc_description_2')}
            </Typography>
          </Box>

            <Box display="flex" flexDirection="column" alignItems={isMobile ? "center" : "flex-start"} gap={2} mb={3}>
              {isMobile && (
                <Box display="flex" justifyContent="center" mb={2}>
                  <Box component="span" title="Digital Training Companion sera bientôt optimisé pour mobile">
                    <Button
                      variant="contained"
                      disabled
                      sx={{
                        ...buttonStyle,
                        fontSize: "0.8rem",
                        padding: "10px 20px",
                        borderRadius: "8px",
                        color: "white",
                        fontWeight: "bold",
                        boxShadow: "0px 4px 10px rgba(0,0,0,0.2)",
                        cursor: "not-allowed",
                      }}
                    >
                      {getMessage('label_go_dashboard')}
                    </Button>
                  </Box>
                </Box>
              )}

              <Button
                variant="contained"
                onClick={() => navigate("/signup", { state: { isSandboxMode }})} 
                sx={{
                  ...buttonStyle,
                  fontSize: isMobile ? "0.8rem" : "1rem",
                  padding: isMobile ? "10px 20px" : "16px 32px",
                  borderRadius: "8px",
                  color: "white",
                  fontWeight: "bold",
                  boxShadow: "0px 4px 10px rgba(0,0,0,0.2)",
                }}
              >
                {getMessage('label_signup')}
              </Button>

              <Box textAlign={isMobile ? "center" : "flex-start"} sx={{ mt: 2, maxWidth: 520 }}>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  {getMessage('label_trial_version')}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  {getMessage('label_deleted_data')}
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  {getMessage('label_contact')} <a href="mailto:contact@digitaltrainingcompanion.ch" style={{ color: "white", textDecoration: "underline" }}>contact@digitaltrainingcompanion.ch</a>.
                </Typography>
              </Box>
            </Box>
          </Grid>

          {/* Right column */}
          <Grid item xs={12} md={6}>
            <Box
              component="img"
              src={illustrationHomePage}
              alt="illustration"
              sx={{
                width: "100%",
                height: "auto",
              }}
            />
          </Grid>
        </Grid>
      </Container>
    </Box>
  );

  const images = [
    {
      src: myMonitorings,
      title: getMessage('dtc_description_4'),
      desc: getMessage('dtc_description_5')
    },
    {
      src: editAssessments,
      title: getMessage('dtc_description_6'),
      desc: getMessage('dtc_description_7')
    },
    {
      src: visualizeResults,
      title: getMessage('dtc_description_8'),
      desc: getMessage('dtc_description_9')
    },
    {
      src: logbooks,
      title: getMessage('dtc_description_10'),
      desc: getMessage('dtc_description_11')
    },
  ];

 const ImagesSection = () => (
  <Container maxWidth="xl" sx={{ py: { xs: 10, md: 14 }, px: { xs: 2, md: 6, lg: 10 } }}>
    <Grid container spacing={10}>
      {images.map((g, index) => (
        <Grid key={index} item xs={12}>
          <Grid
            container
            spacing={4}
            direction={{ xs: "column", md: "column", lg: index % 2 === 0 ? "row" : "row-reverse" }}
            alignItems="center"
            justifyContent="center"
          >
            {/* Text Column */}
            <Grid item xs={12} md={6} sx={{ display: "flex", justifyContent: "center" }}>
              <Box
                sx={{
                  textAlign: {
                    xs: "center",
                    md: "center",
                    lg: index % 2 === 0 ? "left" : "right",
                  },
                  maxWidth: "480px",
                  margin: "0 auto",
                }}
              >
                <Typography
                  variant="h4"
                  fontWeight={800}
                  sx={{
                    color: palette.dark,
                    mb: 2,
                    fontSize: { xs: "2rem", md: "2.2rem" },
                    lineHeight: 1.2,
                  }}
                >
                  {g.title}
                </Typography>
                <Typography
                  variant="h6"
                  sx={{
                    color: palette.dark,
                    opacity: 0.8,
                    fontSize: { xs: "1.2rem", md: "1.4rem" },
                    lineHeight: 1.6,
                  }}
                >
                  {g.desc}
                </Typography>
              </Box>
            </Grid>

            {/* Image Column */}
            <Grid item xs={12} md={6}>
              <Box
                component="img"
                src={g.src}
                alt={g.title}
                sx={{
                  width: "100%",
                  height: "auto",
                  borderRadius: 3,
                  boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
                  display: "block",
                  margin: "0 auto",
                  maxWidth: "550px",
                }}
              />
            </Grid>
          </Grid>
        </Grid>
      ))}
    </Grid>
  </Container>
);





  const Footer = () => (
    <Box sx={{ bgcolor: "#fff", color: palette.dark, py: 8 }}>
      <Container maxWidth="xl" sx={{ px: { xs: 2, md: 6, lg: 10 } }}>
        <Grid
          container
          justifyContent="center"
          alignItems="center"
          direction={{ xs: "column", md: "row" }}
          spacing={3}
        >
          <Grid item>
            <Box component="img" src={logo} alt="logo" sx={{ width: 180 }} />
          </Grid>
          <Grid item>
            <Box component="img" src={logoEpfl} alt="logo epfl" sx={{ width: 110 }} />
          </Grid>
          <Grid item>
            <Typography variant="body2">© {YEAR} The Digital Training Companion</Typography>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );

  return (
    <Box display="flex" flexDirection="column" minHeight="100vh">
      <PrimaryNav />
      <Hero />
      <ImagesSection />
      <NewsSection />
      <Footer />
    </Box>
  );
};

export default Home;
