import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Grid,
  Tab,
  Tabs,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import { useNavigate } from 'react-router-dom';
import { useSearchParams } from 'react-router-dom';
import { useMessageService } from '../../services/MessageService';

// Palette matches Home page
const palette = {
  teal:   '#57C1CA',
  green:  '#8AC055',
  orange: '#E3913C',
  dark:   '#0F2537',
  purple: '#7B5EA7',
};

// All plan data — i18n keys used for every displayed string
const AUDIENCES = [
  {
    id: 'trainer',
    labelKey: 'pricing_audience_trainer_label',
    descKey:  'pricing_audience_trainer_desc',
    plans: [
      {
        id: 'FREE_TRAINER',
        name: 'Free',
        price: 0,
        color: palette.green,
        callQuota: null,
        featureKeys: [
          'pricing_free_trainer_f1',
          'pricing_free_trainer_f2',
          'pricing_free_trainer_f3',
          'pricing_free_trainer_f4',
          'pricing_free_trainer_f5',
          'pricing_free_trainer_f6',
        ],
        ctaKey: 'pricing_cta_free',
        ctaVariant: 'outlined',
        highlighted: false,
      },
      {
        id: 'PRO_TRAINER',
        name: 'Pro',
        price: 9.90,
        color: palette.teal,
        callQuota: 1500,
        overageKey: 'pricing_overage_005_max3',
        featureKeys: [
          'pricing_pro_trainer_f1',
          'pricing_pro_trainer_f2',
          'pricing_pro_trainer_f3',
          'pricing_pro_trainer_f4',
        ],
        ctaKey: 'pricing_cta_choose_pro',
        ctaVariant: 'contained',
        highlighted: false,
      },
      {
        id: 'PRO_PLUS_TRAINER',
        name: 'Pro+',
        price: 17.90,
        color: palette.purple,
        callQuota: 5000,
        overageKey: 'pricing_overage_005_max10',
        featureKeys: [
          'pricing_pro_plus_trainer_f1',
          'pricing_pro_trainer_f2',
          'pricing_pro_trainer_f3',
          'pricing_pro_trainer_f4',
        ],
        ctaKey: 'pricing_cta_choose_pro_plus',
        ctaVariant: 'contained',
        highlighted: true,
      },
      {
        id: 'ULTRA_TRAINER',
        name: 'Ultra',
        price: 79.90,
        color: palette.dark,
        callQuota: 30000,
        overageKey: 'pricing_overage_005_max60',
        featureKeys: [
          'pricing_ultra_trainer_f1',
          'pricing_pro_trainer_f2',
          'pricing_pro_trainer_f3',
          'pricing_pro_trainer_f4',
        ],
        ctaKey: 'pricing_cta_choose_ultra',
        ctaVariant: 'contained',
        highlighted: false,
      },
    ],
  },
  {
    id: 'teacher',
    labelKey: 'pricing_audience_teacher_label',
    descKey:  'pricing_audience_teacher_desc',
    plans: [
      {
        id: 'FREE_TEACHER',
        name: 'Free',
        price: 0,
        color: palette.green,
        callQuota: null,
        featureKeys: [
          'pricing_free_teacher_f1',
          'pricing_free_teacher_f2',
          'pricing_free_teacher_f3',
        ],
        ctaKey: 'pricing_cta_free',
        ctaVariant: 'outlined',
        highlighted: false,
      },
      {
        id: 'PRO_TEACHER',
        name: 'Pro',
        price: 4.90,
        color: palette.teal,
        callQuota: 750,
        overageKey: 'pricing_overage_005_max150',
        featureKeys: [
          'pricing_pro_teacher_f1',
          'pricing_pro_teacher_f2',
          'pricing_pro_teacher_f3',
        ],
        ctaKey: 'pricing_cta_choose_pro',
        ctaVariant: 'contained',
        highlighted: true,
      },
    ],
  },
  {
    id: 'institution',
    labelKey: 'pricing_audience_institution_label',
    descKey:  'pricing_audience_institution_desc',
    plans: [
      {
        id: 'INSTITUTION_XS',
        name: 'XS',
        price: 249,
        color: palette.teal,
        callQuota: 30000,
        overageKey: 'pricing_overage_004_max60',
        featureKeys: [
          'pricing_institution_f1_xs',
          'pricing_institution_f2',
          'pricing_institution_f3',
          'pricing_institution_f4',
        ],
        ctaKey: 'pricing_cta_contact',
        ctaVariant: 'outlined',
        highlighted: false,
      },
      {
        id: 'INSTITUTION_S',
        name: 'S',
        price: 490,
        color: palette.orange,
        callQuota: 80000,
        overageKey: 'pricing_overage_004_max160',
        featureKeys: [
          'pricing_institution_f1_s',
          'pricing_institution_f2',
          'pricing_institution_f3',
          'pricing_institution_f4',
        ],
        ctaKey: 'pricing_cta_contact',
        ctaVariant: 'contained',
        highlighted: true,
      },
      {
        id: 'INSTITUTION_M',
        name: 'M',
        price: 990,
        color: palette.dark,
        callQuota: 200000,
        overageKey: 'pricing_overage_0035_max400',
        featureKeys: [
          'pricing_institution_f1_m',
          'pricing_institution_f2',
          'pricing_institution_f3',
          'pricing_institution_f4',
        ],
        ctaKey: 'pricing_cta_contact',
        ctaVariant: 'contained',
        highlighted: false,
      },
    ],
  },
  {
    id: 'research',
    labelKey: 'pricing_audience_research_label',
    descKey:  'pricing_audience_research_desc',
    plans: [
      {
        id: 'RESEARCH',
        name: 'Research',
        price: null,
        color: palette.dark,
        callQuota: null,
        featureKeys: [
          'pricing_research_f1',
          'pricing_research_f2',
          'pricing_research_f3',
          'pricing_research_f4',
          'pricing_research_f5',
        ],
        ctaKey: 'pricing_cta_contact',
        ctaVariant: 'contained',
        highlighted: false,
      },
    ],
  },
];

const PlanCard = ({ plan, getMessage }) => {
  const navigate = useNavigate();

  const priceDisplay = plan.price === null
    ? getMessage('pricing_on_quote')
    : plan.price === 0
      ? getMessage('pricing_cta_free_label')
      : `${plan.price.toFixed(2)} CHF`;

  return (
    <Card
      elevation={plan.highlighted ? 8 : 2}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 3,
        border: plan.highlighted ? `2px solid ${plan.color}` : '1px solid #e0e0e0',
        position: 'relative',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: `0 12px 32px rgba(0,0,0,0.12)`,
        },
      }}
    >
      {/* Coloured top bar */}
      <Box sx={{ height: 6, bgcolor: plan.color, borderRadius: '12px 12px 0 0' }} />

      {/* Popular badge */}
      {plan.highlighted && (
        <Chip
          label={getMessage('pricing_badge_popular')}
          size="small"
          sx={{
            position: 'absolute',
            top: 18,
            right: 16,
            bgcolor: plan.color,
            color: '#fff',
            fontWeight: 700,
            fontSize: '0.7rem',
          }}
        />
      )}

      <CardContent sx={{ flexGrow: 1, pt: 3, px: 3 }}>
        {/* Plan name */}
        <Typography variant="h5" fontWeight={800} sx={{ color: plan.color, mb: 1 }}>
          {plan.name}
        </Typography>

        {/* Price */}
        <Box display="flex" alignItems="baseline" gap={0.5} mb={0.5}>
          <Typography variant="h4" fontWeight={900} sx={{ color: palette.dark }}>
            {priceDisplay}
          </Typography>
          {plan.price !== null && plan.price > 0 && (
            <Typography variant="body2" sx={{ color: '#888' }}>
              {getMessage('pricing_per_month')}
            </Typography>
          )}
        </Box>

        {/* Overage info */}
        {plan.overageKey && (
          <Typography variant="caption" sx={{ color: '#999', display: 'block', mb: 2 }}>
            {getMessage(plan.overageKey)}
          </Typography>
        )}

        {/* Features */}
        <Box component="ul" sx={{ listStyle: 'none', p: 0, m: 0, mt: 2 }}>
          {plan.featureKeys.map((key) => (
            <Box
              component="li"
              key={key}
              display="flex"
              alignItems="flex-start"
              gap={1}
              mb={1}
            >
              <CheckIcon sx={{ fontSize: 16, color: plan.color, mt: '3px', flexShrink: 0 }} />
              <Typography variant="body2" sx={{ color: palette.dark, lineHeight: 1.5 }}>
                {getMessage(key)}
              </Typography>
            </Box>
          ))}
        </Box>
      </CardContent>

      {/* CTA */}
      <Box sx={{ px: 3, pb: 3, pt: 1 }}>
        <Button
          fullWidth
          variant={plan.ctaVariant}
          onClick={() => navigate('/signup')}
          sx={{
            borderRadius: 2,
            fontWeight: 700,
            textTransform: 'none',
            borderColor: plan.ctaVariant === 'outlined' ? plan.color : undefined,
            color: plan.ctaVariant === 'outlined' ? plan.color : '#fff',
            bgcolor: plan.ctaVariant === 'contained' ? plan.color : undefined,
            '&:hover': {
              bgcolor: plan.ctaVariant === 'contained' ? plan.color : undefined,
              opacity: 0.88,
            },
          }}
        >
          {getMessage(plan.ctaKey)}
        </Button>
      </Box>
    </Card>
  );
};

const PricingSection = () => {
  const { getMessage } = useMessageService();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(() => {
      const tab = parseInt(searchParams.get('pricingTab'), 10);
      return isNaN(tab) ? 0 : Math.min(tab, AUDIENCES.length - 1);
  });

  const audience = AUDIENCES[activeTab];

  return (
    <Box sx={{ bgcolor: '#f8f9fa', py: { xs: 8, md: 12 } }} id="pricing-section">
      <Container maxWidth="xl" sx={{ px: { xs: 2, md: 6, lg: 10 } }}>

        {/* Section title */}
        <Typography
          variant={isMobile ? 'h4' : 'h3'}
          fontWeight={900}
          textAlign="center"
          sx={{ color: palette.dark, mb: 1 }}
        >
          {getMessage('pricing_section_title')}
        </Typography>
        <Typography
          variant="h6"
          textAlign="center"
          sx={{ color: '#666', mb: 5, maxWidth: 600, mx: 'auto' }}
        >
          {getMessage('pricing_section_subtitle')}
        </Typography>

        {/* Audience tabs */}
        <Box display="flex" justifyContent="center" mb={6}>
          <Tabs
            value={activeTab}
            onChange={(_, v) => setActiveTab(v)}
            variant={isMobile ? 'scrollable' : 'standard'}
            scrollButtons={isMobile ? 'auto' : false}
            sx={{
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.95rem',
              },
              '& .Mui-selected': { color: palette.teal },
              '& .MuiTabs-indicator': { bgcolor: palette.teal },
            }}
          >
            {AUDIENCES.map((a) => (
              <Tab key={a.id} label={getMessage(a.labelKey)} />
            ))}
          </Tabs>
        </Box>

        {/* Audience description */}
        <Typography
          variant="body1"
          textAlign="center"
          sx={{ color: '#555', mb: 5, maxWidth: 700, mx: 'auto' }}
        >
          {getMessage(audience.descKey)}
        </Typography>

        {/* Plan cards */}
        <Grid container spacing={3} justifyContent="center">
          {audience.plans.map((plan) => (
            <Grid
              key={plan.id}
              item
              xs={12}
              sm={6}
              md={audience.plans.length <= 2 ? 4 : 3}
            >
              <PlanCard plan={plan} getMessage={getMessage} />
            </Grid>
          ))}
        </Grid>

      </Container>
    </Box>
  );
};

export default PricingSection;