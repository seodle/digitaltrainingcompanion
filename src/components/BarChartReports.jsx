import { useState, useEffect, useRef } from 'react';
import { ResponsiveBar } from "@nivo/bar";
import { QuestionType } from "../utils/enums";
import { redYellowGreenPalette } from "../components/styledComponents";
import { useMessageService } from '../services/MessageService';
import './BarChartReports.css';
import { Typography, useMediaQuery, useTheme } from '@mui/material';

const parseColor = (color) => {
  if (!color) {
    return null;
  }
  const rgb = String(color).match(/\d+/g);
  if (rgb && rgb.length >= 3) {
    return { r: Number(rgb[0]), g: Number(rgb[1]), b: Number(rgb[2]) };
  }
  return null;
};

const getReadableLabelColor = (bar) => {
  const parsed = parseColor(typeof bar === 'string' ? bar : bar?.color);
  if (!parsed) {
    return '#1a1a1a';
  }
  const luminance = (0.299 * parsed.r + 0.587 * parsed.g + 0.114 * parsed.b) / 255;
  return luminance > 0.62 ? '#1a1a1a' : '#ffffff';
};

const BarChartReports = ({ data, hide_students_name, workshopName, showPercentage = false, hideValueLabels = false, showChoiceLabels = false }) => {

  const chartRef = useRef(null);
  const [pinnedTooltipData, setPinnedTooltipData] = useState(null);
  const [pinnedPosition, setPinnedPosition] = useState({ x: 0, y: 0 });
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const { getMessage } = useMessageService();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  useEffect(() => {
    const handleMouseMove = (event) => {
      if (!chartRef.current) return;

      const chartBounds = chartRef.current.getBoundingClientRect();
      const xPosRelative = (event.clientX - chartBounds.x) / chartBounds.width;
      const yPosRelative = (event.clientY - chartBounds.y) / chartBounds.height;
      const xPos = (0.6 * xPosRelative + 0.2) * chartBounds.width;
      const yPos = (0.1 * yPosRelative + 0.4) * chartBounds.height;

      setMousePosition({ x: xPos, y: yPos });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (chartRef.current && !chartRef.current.contains(event.target)) {
        setPinnedTooltipData(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  const pastelBlue = 'rgb(173, 216, 230)';
  const brightPastelBlue = 'rgb(193, 236, 250)';

  if (!Array.isArray(data) || data.length === 0) {
    return null;
  }

  const maxChoices = data.reduce((max, item) => Math.max(max, item.choices?.length || 0), 0);
  if (maxChoices === 0) {
    return null;
  }
  const keys = Array.from({ length: maxChoices }, (_, index) => `choice_${index + 1}`);

  const transformedData = [...data]
  .reverse()
  .map(item => {
    const counts = item.counts || [];
    const total = counts.reduce((sum, c) => sum + c, 0);
    const values = showPercentage && total > 0
      ? counts.map(c => parseFloat(((c / total) * 100).toFixed(1)))
      : counts;
    return {
      ...item,
      shortName: item.shortName || item.question,
      ...Object.fromEntries(values.map((v, index) => [`choice_${index + 1}`, v]))
    };
  });

  const chartHeight = Math.max(200, data.length * 30);

  const getBarColor = (bar) => {
  const choiceNumber = parseInt(bar.id.replace('choice_', ''), 10) - 1;
  const questionData = data.find(item => (item.shortName || item.question) === bar.data.shortName);


  if (!questionData || !Array.isArray(questionData.choices)) return 'grey';

  const { type, correctAnswer, choices } = questionData;
  const choiceIndex = choiceNumber;
  const hasCorrectAnswer = Array.isArray(correctAnswer) ? correctAnswer.length > 0 : correctAnswer !== undefined;

  // Handle radio-ordered questions
  if (type === QuestionType.RADIO_ORDERED) {
    if (choices.length === 1) return redYellowGreenPalette[0];
    const paletteIndex = Math.round((redYellowGreenPalette.length - 1) * (choiceIndex / (choices.length - 1)));
    return redYellowGreenPalette[paletteIndex] || redYellowGreenPalette[0];
  }

  // Handle radio-unordered questions (updated)
  if (type === QuestionType.RADIO_UNORDERED) {
    if (hasCorrectAnswer) {
      // Normalize correct answer format
      const normalizedCorrect = Array.isArray(correctAnswer) ? correctAnswer[0] : correctAnswer;
      const correctIndex = choices.indexOf(normalizedCorrect);
      return choiceIndex === correctIndex ? redYellowGreenPalette[9] : redYellowGreenPalette[0];
    }
    return choiceIndex % 2 === 0 ? pastelBlue : brightPastelBlue;
  }

  // Handle checkbox questions (already handles single/multiple answers)
  if (type === QuestionType.CHECKBOX) {
    if (hasCorrectAnswer) {
      const isCorrect = Array.isArray(correctAnswer) 
        ? correctAnswer.includes(choices[choiceIndex])
        : correctAnswer === choices[choiceIndex];
      return isCorrect ? redYellowGreenPalette[9] : redYellowGreenPalette[0];
    }
    return choiceIndex % 2 === 0 ? pastelBlue : brightPastelBlue;
  }

  // Default case
  return choiceIndex % 2 === 0 ? pastelBlue : brightPastelBlue;
};


  const handleTooltip = ({ id, value, indexValue }) => {
    const choiceIndex = parseInt(id.replace('choice_', ''), 10) - 1;
    const questionData = data.find(item => (item.shortName || item.question) === indexValue);

    if (!questionData) return null;

    const choice = questionData.choices?.[choiceIndex] ?? 'Invalid choice';
    const names = questionData.names?.[choiceIndex]?.join(', ') ?? 'No answers';

    return {
      question: questionData.question,
      choice,
      value,
      names
    };
  };

  return (
    <>
      {workshopName && (
        <Typography align="center" color="rgb(102,102,102)" variant="h6" mt='10px' mb='5px'>
          {workshopName}
        </Typography>
      )}
      <div ref={chartRef} className="bar-chart-reports" style={{ 
        position: 'relative', 
        height: `${chartHeight}px`, // Fixed height instead of 90%
        // marginBottom: '20px' // Add spacing between charts
      }}>
        <ResponsiveBar
          data={transformedData}
          keys={keys}
          indexBy="shortName"
          margin={{ top: 15, right: 8, bottom: 15, left: isMobile ? 88 : 150 }}
          layout="horizontal"
          groupMode="stacked"
          padding={0.1}
          valueScale={{ type: "linear" }}
          indexScale={{ type: "band", round: true }}
          colors={getBarColor}
          borderColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
          axisLeft={{
            tickSize: 5,
            tickPadding: 5,
            tickRotation: 0,
            legend: false,
            legendPosition: "middle",
            legendOffset: -30
          }}
          enableLabel={showChoiceLabels || !hideValueLabels}
          label={(d) => {
            if (d.value === 0 || d.value == null) {
              return '';
            }
            if (showChoiceLabels) {
              const choiceIndex = parseInt(String(d.id).replace('choice_', ''), 10) - 1;
              const questionData = data.find(
                (item) => (item.shortName || item.question) === d.indexValue
              );
              const choice = questionData?.choices?.[choiceIndex] || '';
              const maxChars = d.width ? Math.max(16, Math.floor(d.width / 5.5)) : 42;
              if (choice.length <= maxChars) {
                return choice;
              }
              return `${choice.slice(0, maxChars - 1).trimEnd()}…`;
            }
            return showPercentage ? `${d.value}%` : `${d.value}`;
          }}
          labelSkipWidth={showChoiceLabels ? 8 : 12}
          labelSkipHeight={12}
          axisTop={null}
          axisRight={null}
          axisBottom={null}
          labelTextColor={getReadableLabelColor}
          theme={{
            labels: {
              text: {
                fontSize: 13,
                fontWeight: 700,
                fontFamily: 'inherit',
              },
            },
          }}
          role="application"
          onClick={(bar, event) => {
            const tooltipContent = handleTooltip(bar);
            if (!tooltipContent) return;
            const isSamePinned =
              pinnedTooltipData &&
              pinnedTooltipData.question === tooltipContent.question &&
              pinnedTooltipData.choice === tooltipContent.choice;
            if (isSamePinned) {
              setPinnedTooltipData(null);
              return;
            }
            setPinnedTooltipData(tooltipContent);
            if (chartRef.current && event) {
              const bounds = chartRef.current.getBoundingClientRect();
              const clientX = event.clientX ?? event.changedTouches?.[0]?.clientX ?? bounds.width / 2;
              const clientY = event.clientY ?? event.changedTouches?.[0]?.clientY ?? bounds.height / 2;
              setPinnedPosition({
                x: Math.min(Math.max(clientX - bounds.left, 90), Math.max(bounds.width - 90, 90)),
                y: Math.min(Math.max(clientY - bounds.top, 48), Math.max(bounds.height - 48, 48)),
              });
            } else {
              setPinnedPosition(mousePosition);
            }
          }}
          tooltip={() => null}
          barAriaLabel={e => `${e.indexValue}: ${e.id} - ${e.value}`}
        />
        {pinnedTooltipData && (
          <div
            className="custom-tooltip pinned-tooltip"
            style={{ top: pinnedPosition.y, left: pinnedPosition.x }}
          >
            <strong>{pinnedTooltipData.question}</strong><br />
            <span>{pinnedTooltipData.choice}: {pinnedTooltipData.value}{showPercentage ? '%' : ''}</span><br />
            {!hide_students_name && (
              <span>{getMessage("label_respondents")}: {pinnedTooltipData.names}</span>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default BarChartReports;