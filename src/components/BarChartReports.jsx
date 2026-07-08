import { useState, useEffect, useRef } from 'react';
import { ResponsiveBar } from "@nivo/bar";
import { QuestionType } from "../utils/enums";
import { redYellowGreenPalette } from "../components/styledComponents";
import { useMessageService } from '../services/MessageService';
import './BarChartReports.css';
import { Typography } from '@mui/material';

const BarChartReports = ({ data, hide_students_name, workshopName, showPercentage = false }) => {

  const chartRef = useRef(null);
  const [pinnedTooltipData, setPinnedTooltipData] = useState(null);
  const [pinnedPosition, setPinnedPosition] = useState({ x: 0, y: 0 });
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const { getMessage } = useMessageService();

  // color definition
  const pastelBlue = 'rgb(173, 216, 230)';
  const brightPastelBlue = 'rgb(193, 236, 250)';

  // Calculate the maximum number of choices across all data items
  const maxChoices = data.reduce((max, item) => Math.max(max, item.choices.length), 0);
  const keys = Array.from({ length: maxChoices }, (_, index) => `choice_${index + 1}`);
  
  // Transform data and reverse the order for correct display in horizontal layout
  const transformedData = [...data]
  .reverse()
  .map(item => {
    const total = item.counts.reduce((sum, c) => sum + c, 0);
    const values = showPercentage && total > 0
      ? item.counts.map(c => parseFloat(((c / total) * 100).toFixed(1)))
      : item.counts;
    return {
      ...item,
      shortName: item.shortName || item.question,
      ...Object.fromEntries(values.map((v, index) => [`choice_${index + 1}`, v]))
    };
  });

  // Calculate height based on number of questions
  const chartHeight = Math.max(200, data.length * 30); // 30px per question, minimum 200px

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
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
      <div ref={chartRef} style={{ 
        position: 'relative', 
        height: `${chartHeight}px`, // Fixed height instead of 90%
        // marginBottom: '20px' // Add spacing between charts
      }}>
        <ResponsiveBar
          data={transformedData}
          keys={keys}
          indexBy="shortName"
          margin={{ top: 15, right: 15, bottom: 15, left: 150 }}
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
          enableLabel={true}
          label={d => showPercentage ? `${d.value}%` : `${d.value}`}
          labelSkipWidth={12}
          labelSkipHeight={12}
          axisTop={null}
          axisRight={null}
          axisBottom={null}
          labelTextColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
          role="application"
          onClick={(bar) => {
            const tooltipContent = handleTooltip(bar);
            if (!tooltipContent) return;
            const isSamePinned =
              pinnedTooltipData &&
              pinnedTooltipData.question === tooltipContent.question &&
              pinnedTooltipData.choice === tooltipContent.choice;
            if (isSamePinned) {
              setPinnedTooltipData(null);
            } else {
              setPinnedTooltipData(tooltipContent);
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