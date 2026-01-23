import React from 'react';
import {
  Box,
  Container,
  Grid,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  useTheme,
  useMediaQuery,
  Avatar,
  CardMedia
} from '@mui/material';
import {
  Announcement as AnnouncementIcon,
  Update as UpdateIcon,
  Event as EventIcon,
  NewReleases as NewReleasesIcon,
  OpenInNew as ExternalLinkIcon
} from '@mui/icons-material';
import { useMessageService } from '../services/MessageService';

const sampleNewsData = [
  {
    id: 1,
    type: 'event',
    title: 'Formation hybride pour les enseignant·e·s de l\'école obligatoire',
    excerpt: 'Le Digital Training Companion : votre allié pour évaluer et accompagner vos élèves. Formation gratuite du 27 octobre au 19 décembre 2025.',
    date: '2025-10-27',
    isNew: true,
    category: 'Formation',
    languages: ['FR'],
    link: 'https://www.roteco.ch/fr/courses/post/innover-dans-levaluation-avec-le-digital-training-companion/'
  }
];

const getNewsIcon = (type) => {
  switch (type) {
    case 'update':
      return <UpdateIcon />;
    case 'event':
      return <EventIcon />;
    case 'announcement':
      return <AnnouncementIcon />;
    default:
      return <NewReleasesIcon />;
  }
};

const getIconColor = (type) => {
  switch (type) {
    case 'update':
      return '#57C1CA'; // teal
    case 'event':
      return '#8AC055'; // green
    case 'announcement':
      return '#E3913C'; // orange
    default:
      return '#F2C24D'; // yellow
  }
};

const NewsCard = ({ newsItem, getMessage }) => {
  const theme = useTheme();
  
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const handleClick = () => {
    if (newsItem.link) {
      window.open(newsItem.link, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <Card
      onClick={handleClick}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 3,
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        cursor: newsItem.link ? 'pointer' : 'default',
        '&:hover': {
          transform: 'translateY(-8px)',
          boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
        },
        border: '1px solid rgba(0,0,0,0.06)',
        position: 'relative',
        overflow: 'visible'
      }}
    >
      {newsItem.isNew && (
        <Chip
          label={getMessage('news_new_badge')}
          size="small"
          sx={{
            position: 'absolute',
            top: 16,
            right: 16,
            backgroundColor: '#E3913C',
            color: 'white',
            fontWeight: 'bold',
            zIndex: 1,
            fontSize: '0.75rem'
          }}
        />
      )}
      
      <CardContent sx={{ flexGrow: 1, p: 3 }}>
        <Box display="flex" alignItems="center" mb={2}>
          <Avatar
            sx={{
              backgroundColor: getIconColor(newsItem.type),
              width: 40,
              height: 40,
              mr: 2
            }}
          >
            {getNewsIcon(newsItem.type)}
          </Avatar>
          <Box>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
              {newsItem.category}
            </Typography>
            {newsItem.languages && (
              <Typography variant="caption" sx={{ color: 'text.secondary', ml: 1 }}>
                • {newsItem.languages.join(', ')}
              </Typography>
            )}
          </Box>
        </Box>
        
        <Typography
          variant="h6"
          component="h3"
          gutterBottom
          sx={{
            fontWeight: 700,
            lineHeight: 1.3,
            color: '#0F2537',
            mb: 1.5
          }}
        >
          {newsItem.title}
        </Typography>
        
        <Typography
          variant="body2"
          sx={{
            color: 'text.secondary',
            lineHeight: 1.6,
            mb: 2
          }}
        >
          {newsItem.excerpt}
        </Typography>
        
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography
            variant="caption"
            sx={{
              color: 'text.secondary',
              fontWeight: 500
            }}
          >
            {formatDate(newsItem.date)}
          </Typography>
          {newsItem.link && (
            <ExternalLinkIcon 
              sx={{ 
                fontSize: 16, 
                color: 'text.secondary',
                opacity: 0.7
              }} 
            />
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

const NewsSection = ({ newsData = sampleNewsData }) => {
  const theme = useTheme();
  const { getMessage } = useMessageService();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Box
      component="section"
      id="news-section"
      sx={{
        py: { xs: 8, md: 12 },
        backgroundColor: '#FAFBFC'
      }}
    >
      <Container maxWidth="xl" sx={{ px: { xs: 2, md: 6, lg: 10 } }}>
        {/* Section Header */}
        <Box textAlign="center" mb={6}>
          <Typography
            variant={isMobile ? "h3" : "h2"}
            component="h2"
            fontWeight={800}
            sx={{
              color: '#0F2537',
              mb: 2,
              fontSize: { xs: '2.5rem', md: '3.5rem' },
              lineHeight: 1.2,
            }}
          >
            {getMessage('news_section_title')}
          </Typography>
          <Typography
            variant="h6"
            sx={{
              color: 'text.secondary',
              maxWidth: 600,
              mx: 'auto',
              fontSize: { xs: '1.1rem', md: '1.3rem' },
              lineHeight: 1.6,
            }}
          >
            {getMessage('news_section_subtitle')}
          </Typography>
        </Box>

        {/* News Cards Grid */}
        <Grid container spacing={4} justifyContent={newsData.length === 1 ? "center" : "flex-start"}>
          {newsData.map((newsItem) => (
            <Grid item xs={12} md={newsData.length === 1 ? 6 : 6} lg={newsData.length === 1 ? 4 : 4} key={newsItem.id}>
              <NewsCard newsItem={newsItem} getMessage={getMessage} />
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
};

export default NewsSection;
