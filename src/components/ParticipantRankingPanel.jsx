import React, { useEffect, useMemo, useState } from 'react';
import { Box, IconButton, Typography } from '@mui/material';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useMessageService } from '../services/MessageService';
import { anonymizeRankings, buildCriteriaRankings } from '../utils/rankingUtils';

const ParticipantRankingPanel = ({
  assessments,
  highlightedParticipant = '',
  anonymize = false,
}) => {
  const { getMessage } = useMessageService();
  const [index, setIndex] = useState(0);

  const criteria = useMemo(() => {
    const built = buildCriteriaRankings(assessments, {
      anonymousLabel: getMessage('label_anonymous'),
    });
    return anonymize
      ? anonymizeRankings(built, getMessage('label_participant'))
      : built;
  }, [assessments, anonymize, getMessage]);

  const signature = criteria.map((criterion) => criterion.id).join('|');

  useEffect(() => {
    setIndex(0);
  }, [signature]);

  const safeIndex = criteria.length === 0 ? 0 : Math.min(index, criteria.length - 1);
  const current = criteria[safeIndex];
  const canGoPrev = safeIndex > 0;
  const canGoNext = safeIndex < criteria.length - 1;

  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        minHeight: 0,
        boxShadow: '0px 8px 24px rgba(0, 0, 0, 0.06)',
        borderRadius: '16px',
        backgroundColor: '#fff',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <Box sx={{ px: 2, pt: 1.5, pb: 1.5, flexShrink: 0 }}>
        {current ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <IconButton
              size="small"
              onClick={() => setIndex((value) => Math.max(0, value - 1))}
              disabled={!canGoPrev}
              aria-label="previous criterion"
            >
              <ChevronLeft size={18} />
            </IconButton>
            <Box sx={{ flex: 1, minWidth: 0, textAlign: 'center' }}>
              <Typography
                sx={{
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  lineHeight: 1.35,
                  color: 'rgb(102,102,102)',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
                title={current.question || current.title}
              >
                {current.title}
              </Typography>
              <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
                {safeIndex + 1}/{criteria.length}
              </Typography>
            </Box>
            <IconButton
              size="small"
              onClick={() => setIndex((value) => Math.min(criteria.length - 1, value + 1))}
              disabled={!canGoNext}
              aria-label="next criterion"
            >
              <ChevronRight size={18} />
            </IconButton>
          </Box>
        ) : (
          <Typography variant="body2" color="text.secondary">
            {getMessage('label_ranking_no_criteria')}
          </Typography>
        )}
      </Box>

      <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto', px: 2, pb: 2 }}>
        {[...(current?.ranking || [])]
          .sort((a, b) => (a.name || '').localeCompare(b.name || ''))
          .map((entry) => {
          const highlighted = Boolean(highlightedParticipant) && (
            entry.name.toLowerCase() === String(highlightedParticipant).toLowerCase()
            || entry.key.toLowerCase() === String(highlightedParticipant).toLowerCase()
          );
          const width = `${Math.max(6, Math.round(entry.score * 100))}%`;

          return (
            <Box
              key={entry.key}
              sx={{
                py: 1,
                borderBottom: '1px solid',
                borderColor: 'rgba(0,0,0,0.06)',
                bgcolor: highlighted ? 'rgba(247, 148, 30, 0.08)' : 'transparent',
                mx: -1,
                px: 1,
                borderRadius: 1,
              }}
            >
              <Typography noWrap sx={{ fontSize: '0.875rem', fontWeight: highlighted ? 600 : 500, mb: 0.5 }}>
                {entry.name}
              </Typography>
              <Box sx={{ height: 4, borderRadius: 99, bgcolor: '#F0F0F0', overflow: 'hidden' }}>
                <Box
                  sx={{
                    width,
                    height: '100%',
                    borderRadius: 99,
                    bgcolor: highlighted ? '#F7941E' : '#C8C8C8',
                  }}
                />
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};

export default ParticipantRankingPanel;
