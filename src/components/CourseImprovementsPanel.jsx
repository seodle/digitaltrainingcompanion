import React from "react";
import { Alert, Box, Button, Card, CardContent, Chip, CircularProgress, LinearProgress, Typography } from "@mui/material";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import { formatLatestDate, localizeAssessmentType } from "../utils/ObjectsUtils";
import { CourseImprovementStatus, ComprehensionKind } from "../utils/enums";

const SectionCard = ({ title, children }) => (
  <Card
    elevation={0}
    sx={{
      border: "1px solid #e6e6e6",
      borderRadius: 2,
      backgroundColor: "#fff",
    }}
  >
    <CardContent sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
        {title}
      </Typography>
      {children}
    </CardContent>
  </Card>
);

const itemBorderSx = (index, count) => ({
  display: "flex",
  flexDirection: "column",
  gap: 0.75,
  pb: index === count - 1 ? 0 : 1.5,
  borderBottom: index === count - 1 ? "none" : "1px solid #eee",
});

// "Immediate reactions · Day 1"
const formatSource = ({ assessment, day }, getMessage) =>
  [
    assessment ? localizeAssessmentType(assessment, getMessage) : null,
    day ? `${getMessage("label_day")} ${day}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

const ItemHeader = ({ item, getMessage }) => (
  <Box>
    <Typography sx={{ fontWeight: 600 }}>{item.question}</Typography>
    <Typography variant="caption" color="text.secondary">
      {formatSource(item, getMessage)}
    </Typography>
  </Box>
);

const BulletList = ({ title, items }) => {
  const entries = (items || []).filter(Boolean);
  if (entries.length === 0) return null;
  return (
    <Box>
      <Typography variant="body2" sx={{ fontWeight: 600 }}>
        {title}
      </Typography>
      <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
        {entries.map((entry, index) => (
          <Typography component="li" variant="body2" key={`${entry}-${index}`}>
            {entry}
          </Typography>
        ))}
      </Box>
    </Box>
  );
};

const CourseImprovementsPanel = ({
  courseImprovement,
  isLoading,
  courseImprovementJob,
  isGenerating,
  canGenerate,
  generateError,
  getMessage,
  onGenerate,
}) => {
  const result = courseImprovement?.result || {};
  const createdAt = courseImprovement?.createdAt
    ? formatLatestDate(new Date(courseImprovement.createdAt))
    : null;

  const themes = Array.isArray(result.themes) ? result.themes : [];
  const comprehension = Array.isArray(result.comprehension) ? result.comprehension : [];
  const coverage = result.coverage || {};
  const scales = Array.isArray(result.scales) ? result.scales : [];

  const isPending = courseImprovementJob?.status === CourseImprovementStatus.PENDING;
  const errorMessageKey = (() => {
    if (courseImprovementJob?.status === CourseImprovementStatus.TIMEOUT) {
      return "label_course_improvements_error_timeout";
    }
    if (courseImprovementJob?.status === CourseImprovementStatus.FAILED || generateError) {
      return "label_course_improvements_generate_error";
    }
    return null;
  })();

  if (isLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 1.5,
        }}
      >
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {getMessage("label_ai_course_improvements")}
          </Typography>
          {createdAt && (
            <Typography variant="body2" color="text.secondary">
              {getMessage("label_course_improvements_last_generated")}: {createdAt}
            </Typography>
          )}
        </Box>
        <Button
          variant="contained"
          startIcon={
            isGenerating ? (
              <CircularProgress size={16} color="inherit" />
            ) : (
              <AutoAwesomeIcon />
            )
          }
          onClick={onGenerate}
          disabled={isGenerating || !canGenerate}
          sx={{ textTransform: "none", borderRadius: 2 }}
        >
          {courseImprovement
            ? getMessage("label_course_improvements_refresh")
            : getMessage("label_course_improvements_generate")}
        </Button>
      </Box>

      {isPending && (
        <Alert severity="info" icon={<CircularProgress size={18} />}>
          {getMessage("label_course_improvements_generating")}
        </Alert>
      )}

      {!isPending && errorMessageKey && (
        <Typography variant="body2" color="error">
          {getMessage(errorMessageKey)}
        </Typography>
      )}

      {!courseImprovement ? (
        <Box
          sx={{
            py: 8,
            textAlign: "center",
            border: "1px dashed #d0d0d0",
            borderRadius: 2,
            backgroundColor: "#fff",
          }}
        >
          <Typography color="text.secondary">
            {getMessage("label_course_improvements_empty")}
          </Typography>
        </Box>
      ) : (
        <>
          {result.summary && (
            <SectionCard title={getMessage("label_course_improvements_summary")}>
              <Typography variant="body1" sx={{ lineHeight: 1.6 }}>
                {result.summary}
              </Typography>
            </SectionCard>
          )}

          {themes.length > 0 && (
            <SectionCard title={getMessage("label_course_improvements_themes")}>
              {themes.map((theme, index) => (
                <Box
                  key={`${theme.theme || "theme"}-${index}`}
                  sx={itemBorderSx(index, themes.length)}
                >
                  <Typography sx={{ fontWeight: 600 }}>{theme.theme}</Typography>
                  {Number.isFinite(Number(theme.prevalence)) && (
                    <Typography variant="body2" color="text.secondary">
                      {getMessage("label_course_improvements_prevalence")}: {theme.prevalence}
                    </Typography>
                  )}
                  {Array.isArray(theme.quotes) && theme.quotes.length > 0 && (
                    <Box sx={{ pl: 1.5, borderLeft: "3px solid #e6e6e6", display: "flex", flexDirection: "column", gap: 0.5 }}>
                      {theme.quotes.map((quote, quoteIndex) => (
                        <Box key={`${quote.text}-${quoteIndex}`}>
                          <Typography variant="body2" sx={{ fontStyle: "italic", color: "text.secondary" }}>
                            “{quote.text}”
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatSource(quote, getMessage)}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  )}
                  <BulletList
                    title={getMessage("label_course_improvements_recommendations")}
                    items={theme.recommendations}
                  />
                </Box>
              ))}
            </SectionCard>
          )}

          {comprehension.length > 0 && (
            <SectionCard title={getMessage("label_course_improvements_comprehension")}>
              {comprehension.map((item, index) => (
                <Box
                  key={`${item.question || "comprehension"}-${index}`}
                  sx={itemBorderSx(index, comprehension.length)}
                >
                  <ItemHeader item={item} getMessage={getMessage} />
                  {item.kind === ComprehensionKind.GRADED_CHOICE && (
                    <>
                      <Typography variant="body2" color="text.secondary">
                        {getMessage("label_course_improvements_correct")}: {item.correct}/{item.total} ({item.percentage}%)
                      </Typography>
                      <LinearProgress
                        variant="determinate"
                        value={Number(item.percentage) || 0}
                        sx={{ height: 8, borderRadius: 4, backgroundColor: "#f0f0f0" }}
                      />
                      <BulletList
                        title={getMessage("label_course_improvements_common_errors")}
                        items={(item.common_errors || []).map((error) => `${error.answer} (${error.count})`)}
                      />
                    </>
                  )}
                  {item.kind === ComprehensionKind.GRADED_TEXT && (
                    <>
                      <Typography variant="body2" color="text.secondary">
                        {getMessage("label_course_improvements_responses")}: {item.responses}
                      </Typography>
                      <BulletList
                        title={getMessage("label_course_improvements_common_shortfalls")}
                        items={item.common_shortfalls}
                      />
                      <BulletList
                        title={getMessage("label_course_improvements_frequently_correct")}
                        items={item.frequently_correct}
                      />
                    </>
                  )}
                  <BulletList
                    title={getMessage("label_course_improvements_recommendations")}
                    items={[item.recommendation]}
                  />
                </Box>
              ))}
            </SectionCard>
          )}

          {scales.length > 0 && (
            <SectionCard title={getMessage("label_course_improvements_scales")}>
              {scales.map((scale, index) => {
                const options = Array.isArray(scale.options) ? scale.options : [];
                const counts = Array.isArray(scale.counts) ? scale.counts : [];
                return (
                  <Box
                    key={`${scale.question || "scale"}-${index}`}
                    sx={{ ...itemBorderSx(index, scales.length), gap: 1 }}
                  >
                    <ItemHeader item={scale} getMessage={getMessage} />
                    {options.map((option, optionIndex) => {
                      const count = Number(counts[optionIndex]) || 0;
                      const isModal = option === scale.modal_option;
                      return (
                        <Box key={`${option}-${optionIndex}`}>
                          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 1 }}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                              <Typography variant="body2" sx={{ fontWeight: isModal ? 700 : 400 }}>
                                {option}
                              </Typography>
                              {isModal && (
                                <Chip size="small" label={getMessage("label_course_improvements_most_chosen")} />
                              )}
                            </Box>
                            <Typography variant="body2" color="text.secondary">
                              {count}
                            </Typography>
                          </Box>
                          <LinearProgress
                            variant="determinate"
                            value={scale.total > 0 ? (count / scale.total) * 100 : 0}
                            sx={{ height: 8, borderRadius: 4, backgroundColor: "#f0f0f0" }}
                          />
                        </Box>
                      );
                    })}
                    {scale.unmatched > 0 && (
                      <Typography variant="caption" color="text.secondary">
                        {getMessage("label_course_improvements_unmatched")}: {scale.unmatched}
                      </Typography>
                    )}
                  </Box>
                );
              })}
            </SectionCard>
          )}

          {(coverage.answers_received > 0 || coverage.quotes_suppressed_small_n > 0) && (
            <Box>
              {coverage.answers_received > 0 && (
                <Typography variant="caption" color="text.secondary" display="block">
                  {getMessage("label_course_improvements_answers_analyzed")}: {coverage.answers_used}/{coverage.answers_received}
                </Typography>
              )}
              {coverage.quotes_suppressed_small_n > 0 && (
                <Typography variant="caption" color="text.secondary" display="block">
                  {getMessage("label_course_improvements_quotes_hidden")}
                </Typography>
              )}
            </Box>
          )}
        </>
      )}
    </Box>
  );
};

export default CourseImprovementsPanel;
