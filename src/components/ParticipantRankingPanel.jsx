import React, { useEffect, useMemo, useState } from 'react';
import { Box, Chip, IconButton, Typography } from '@mui/material';
import CheckCircleOutlineRoundedIcon from '@mui/icons-material/CheckCircleOutlineRounded';
import HighlightOffRoundedIcon from '@mui/icons-material/HighlightOffRounded';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useMessageService } from '../services/MessageService';
import { anonymizeRankings, buildCriteriaRankings } from '../utils/rankingUtils';

const VISIBLE_RANKING_ROWS = 5;
const RANKING_ROW_HEIGHT = 56;

const ParticipantRankingPanel = ({
  assessments,
  highlightedParticipant = '',
  anonymize = false,
  hideStudentValues = false,
}) => {
  const { languageCode } = useLanguage();
  const { getMessage } = useMessageService();
  const [index, setIndex] = useState(0);

  const criteria = useMemo(() => {
    const built = buildCriteriaRankings(assessments, {
      anonymousLabel: getMessage('label_anonymous'),
      hideStudentValues,
    });
    return anonymize
      ? anonymizeRankings(built, getMessage('label_participant'))
      : built;
  }, [assessments, anonymize, hideStudentValues, languageCode]);

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

      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          maxHeight: VISIBLE_RANKING_ROWS * RANKING_ROW_HEIGHT,
          px: 2,
          pb: 2,
        }}
      >
        {[...(current?.ranking || [])]
          .sort((a, b) => {
            if (current?.mode === 'multi') {
              return (b.score - a.score) || (a.name || '').localeCompare(b.name || '');
            }
            if (current?.mode === 'correctness' && a.correct !== b.correct) {
              return a.correct ? -1 : 1;
            }
            return (a.name || '').localeCompare(b.name || '');
          })
          .map((entry) => {
          const highlighted = Boolean(highlightedParticipant) && (
            entry.name.toLowerCase() === String(highlightedParticipant).toLowerCase()
            || entry.key.toLowerCase() === String(highlightedParticipant).toLowerCase()
          );
          const width = `${Math.max(6, Math.round(entry.score * 100))}%`;
          const showChoices = Array.isArray(entry.choiceResults) && entry.choiceResults.length > 0;
          const showValues = !showChoices && current?.mode === 'values' && Array.isArray(entry.values) && entry.values.length > 0;
          const showCorrectness = !showChoices && !showValues && (
            current?.mode === 'correctness' || current?.mode === 'multi' || entry.correct != null
          );
          const inlineStatus = showCorrectness || (showValues && entry.values.length === 1);

          return (
            <Box
              key={entry.key}
              sx={{
                minHeight: RANKING_ROW_HEIGHT - 8,
                py: 1,
                borderBottom: '1px solid',
                borderColor: 'rgba(0,0,0,0.06)',
                bgcolor: highlighted ? 'rgba(247, 148, 30, 0.08)' : 'transparent',
                mx: -1,
                px: 1,
                borderRadius: 1,
                display: 'flex',
                flexDirection: inlineStatus ? 'row' : 'column',
                alignItems: inlineStatus ? 'center' : 'stretch',
                justifyContent: 'space-between',
                gap: inlineStatus ? 1 : 0.5,
              }}
            >
              <Typography noWrap sx={{ fontSize: '0.875rem', fontWeight: highlighted ? 600 : 500, mb: inlineStatus ? 0 : 0.25, minWidth: 0, flex: inlineStatus ? 1 : 'none' }}>
                {entry.name}
              </Typography>
              {showChoices ? (
                <Box sx={{ display: 'flex', flexWrap: 'nowrap', gap: 0.5, overflowX: 'auto' }}>
                  {entry.choiceResults.map((choice, choiceIndex) => {
                    const ok = choice.participantCorrect;
                    return (
                      <Chip
                        key={`${choice.label}-${choiceIndex}`}
                        size="small"
                        title={choice.label}
                        icon={
                          ok
                            ? <CheckCircleOutlineRoundedIcon sx={{ fontSize: '1rem' }} />
                            : <HighlightOffRoundedIcon sx={{ fontSize: '1rem' }} />
                        }
                        label={ok ? getMessage('label_ranking_correct') : getMessage('label_ranking_incorrect')}
                        sx={{
                          fontWeight: 600,
                          flexShrink: 0,
                          bgcolor: ok ? '#EEF6EE' : '#FBECEC',
                          border: '1px solid',
                          borderColor: ok ? '#C4DCC4' : '#E8C4C4',
                          color: ok ? '#2F6A32' : '#A33B3B',
                          '& .MuiChip-icon': { color: ok ? '#2F6A32' : '#A33B3B' },
                        }}
                      />
                    );
                  })}
                </Box>
              ) : showValues ? (
                <Box sx={{ display: 'flex', flexWrap: 'nowrap', gap: 0.5, overflowX: 'auto' }}>
                  {entry.values.map((value, valueIndex) => (
                    <Chip
                      key={`${value}-${valueIndex}`}
                      size="small"
                      title={value}
                      label={value}
                      sx={{
                        fontWeight: 600,
                        flexShrink: 0,
                        maxWidth: 220,
                        bgcolor: '#F4F4F4',
                        border: '1px solid',
                        borderColor: '#E0E0E0',
                        color: 'rgb(80,80,80)',
                        '& .MuiChip-label': {
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: 'block',
                        },
                      }}
                    />
                  ))}
                </Box>
              ) : showCorrectness ? (
                <Chip
                  size="small"
                  icon={
                    entry.correct
                      ? <CheckCircleOutlineRoundedIcon sx={{ fontSize: '1rem' }} />
                      : <HighlightOffRoundedIcon sx={{ fontSize: '1rem' }} />
                  }
                  label={entry.correct ? getMessage('label_ranking_correct') : getMessage('label_ranking_incorrect')}
                  sx={{
                    flexShrink: 0,
                    fontWeight: 600,
                    bgcolor: entry.correct ? '#EEF6EE' : '#FBECEC',
                    border: '1px solid',
                    borderColor: entry.correct ? '#C4DCC4' : '#E8C4C4',
                    color: entry.correct ? '#2F6A32' : '#A33B3B',
                    '& .MuiChip-icon': { color: entry.correct ? '#2F6A32' : '#A33B3B' },
                  }}
                />
              ) : (
                <Box sx={{ height: 4, borderRadius: 99, bgcolor: '#F0F0F0', overflow: 'hidden' }}>
                  <Box
                    sx={{
                      width,
                      height: '100%',
                      borderRadius: 99,
                      bgcolor: entry.color || (highlighted ? '#F7941E' : '#C8C8C8'),
                    }}
                  />
                </Box>
              )}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};

export default ParticipantRankingPanel;
