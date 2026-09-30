import React from "react";
import { Box, Button, Card, CardContent, Chip, CircularProgress, LinearProgress, Typography } from "@mui/material";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import { formatLatestDate } from "../utils/ObjectsUtils";

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

const CourseImprovementsPanel = ({
  courseImprovement,
  isLoading,
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
  const gradedResponses = Array.isArray(result.graded_responses)
    ? result.graded_responses
    : [];
  const scales = Array.isArray(result.scales) ? result.scales : [];

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

      {generateError && (
        <Typography variant="body2" color="error">
          {getMessage("label_course_improvements_generate_error")}
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
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 0.75,
                    pb: index === themes.length - 1 ? 0 : 1.5,
                    borderBottom: index === themes.length - 1 ? "none" : "1px solid #eee",
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                    <Typography sx={{ fontWeight: 600 }}>{theme.theme}</Typography>
                    {theme.source?.name && (
                      <Chip size="small" label={theme.source.name} />
                    )}
                  </Box>
                  {Number.isFinite(Number(theme.prevalence)) && (
                    <Typography variant="body2" color="text.secondary">
                      {getMessage("label_course_improvements_prevalence")}:{" "}
                      {Math.round(Number(theme.prevalence) * 100)}%
                    </Typography>
                  )}
                  {Array.isArray(theme.quotes) && theme.quotes.length > 0 && (
                    <Box sx={{ pl: 1.5, borderLeft: "3px solid #e6e6e6" }}>
                      {theme.quotes.map((quote, quoteIndex) => (
                        <Typography
                          key={`${quote}-${quoteIndex}`}
                          variant="body2"
                          sx={{ fontStyle: "italic", color: "text.secondary" }}
                        >
                          “{quote}”
                        </Typography>
                      ))}
                    </Box>
                  )}
                </Box>
              ))}
            </SectionCard>
          )}

          {comprehension.length > 0 && (
            <SectionCard title={getMessage("label_course_improvements_comprehension")}>
              {comprehension.map((item, index) => (
                <Box
                  key={`${item.question || "comprehension"}-${index}`}
                  sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}
                >
                  <Typography sx={{ fontWeight: 600 }}>{item.question}</Typography>
                  {Number.isFinite(Number(item.correct_answer_percentage)) && (
                    <Typography variant="body2" color="text.secondary">
                      {getMessage("label_course_improvements_correct")}:{" "}
                      {item.correct_answer_percentage}%
                    </Typography>
                  )}
                  {(item.incorrect_choices || []).map((choice, choiceIndex) => (
                    <Typography key={`${choice.option}-${choiceIndex}`} variant="body2">
                      {choice.option}
                      {Number.isFinite(Number(choice.count)) ? ` (${choice.count})` : ""}
                    </Typography>
                  ))}
                  {(item.slides || [])
                    .map((slide) => slide?.name)
                    .filter(Boolean)
                    .map((name) => (
                      <Chip key={name} size="small" label={name} sx={{ alignSelf: "flex-start" }} />
                    ))}
                </Box>
              ))}
            </SectionCard>
          )}

          {gradedResponses.length > 0 && (
            <SectionCard title={getMessage("label_course_improvements_graded_responses")}>
              {gradedResponses.map((item, index) => (
                <Box
                  key={`${item.question || "graded"}-${index}`}
                  sx={{ display: "flex", flexDirection: "column", gap: 0.75 }}
                >
                  <Typography sx={{ fontWeight: 600 }}>{item.question}</Typography>
                  {(item.shortfalls || []).map((shortfall, shortfallIndex) => (
                    <Typography key={`${shortfall}-${shortfallIndex}`} variant="body2">
                      {shortfall}
                    </Typography>
                  ))}
                </Box>
              ))}
            </SectionCard>
          )}

          {scales.length > 0 && (
            <SectionCard title={getMessage("label_course_improvements_scales")}>
              {scales.map((scale, index) => {
                const options = Array.isArray(scale.options) ? scale.options : [];
                const maxCount = Math.max(0, ...options.map((option) => Number(option.count) || 0));
                return (
                  <Box
                    key={`${scale.question || "scale"}-${index}`}
                    sx={{ display: "flex", flexDirection: "column", gap: 1 }}
                  >
                    <Typography sx={{ fontWeight: 600 }}>{scale.question}</Typography>
                    {options.map((option, optionIndex) => (
                      <Box key={`${option.option}-${optionIndex}`}>
                        <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1 }}>
                          <Typography variant="body2">{option.option}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {option.count ?? 0}
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={maxCount > 0 ? ((Number(option.count) || 0) / maxCount) * 100 : 0}
                          sx={{ height: 8, borderRadius: 4, backgroundColor: "#f0f0f0" }}
                        />
                      </Box>
                    ))}
                  </Box>
                );
              })}
            </SectionCard>
          )}
        </>
      )}
    </Box>
  );
};

export default CourseImprovementsPanel;
