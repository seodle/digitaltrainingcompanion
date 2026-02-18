import { useState, useEffect, useRef } from 'react';
import { ResponsiveBar } from "@nivo/bar";
import { QuestionType } from "../utils/enums";
import { redYellowGreenPalette } from "../components/styledComponents";
import { useMessageService } from '../services/MessageService';
import './BarChartReports.css';
import { Typography } from '@mui/material';

const BarChartReports = ({ data, hide_students_name, workshopName }) => {

  const chartRef = useRef(null);
  const [tooltipData, setTooltipData] = useState(null);
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
    .map(item => ({
      ...item,
      shortName: item.shortName || item.question,
      ...Object.fromEntries(item.counts.map((count, index) => [`choice_${index + 1}`, count]))
    }));

  // Calculate height based on number of questions
  const chartHeight = Math.max(200, data.length * 30); // 30px per question, minimum 200px

  useEffect(() => {
    const handleMouseMove = (event) => {
      if (!chartRef.current || !tooltipData) return;

      const chartBounds = chartRef.current.getBoundingClientRect();
      
      // Calculate relative position with padding
      const xPosRelative = (event.clientX - chartBounds.x) / chartBounds.width;
      const yPosRelative = (event.clientY - chartBounds.y) / chartBounds.height;
      
      // Add padding to keep tooltip within bounds
      const xPos = (0.6 * xPosRelative + 0.2) * chartBounds.width;
      const yPos = (0.1 * yPosRelative + 0.4) * chartBounds.height;

      setMousePosition({ x: xPos, y: yPos });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [tooltipData]);

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
          labelSkipWidth={12}
          labelSkipHeight={12}
          axisTop={null}
          axisRight={null}
          axisBottom={null}
          labelTextColor={{ from: 'color', modifiers: [['darker', 1.6]] }}
          role="application"
          onMouseEnter={(bar) => {
            const tooltipContent = handleTooltip(bar);
            if (tooltipContent) setTooltipData(tooltipContent);
          }}
          onMouseLeave={() => setTooltipData(null)}
          tooltip={() => null}
          barAriaLabel={e => `${e.indexValue}: ${e.id} - ${e.value}`}
        />
        {tooltipData && (
          <div 
            className="custom-tooltip" 
            style={{ 
              top: mousePosition.y, 
              left: mousePosition.x 
            }}
          >
            <strong>{tooltipData.question}</strong><br />
            <span>{tooltipData.choice}: {tooltipData.value}</span><br />
            {!hide_students_name && (
              <span>{getMessage("label_respondents")}: {tooltipData.names}</span>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default BarChartReports;