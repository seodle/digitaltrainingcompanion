import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableRow, Radio, Checkbox, Typography, Box } from '@mui/material';
import { Field } from 'formik';
import './MatrixQuestion.css';

const MatrixQuestion = ({
  questions,
  options,
  fieldName,
  selectedAnswers,
  handleAnswerSelect,
  isOptionDisabled,
  viewType = 'default', // Prop to specify the view type
  questionType = "radio" // Default to radio, can be "checkbox"
}) => {
  const getFontSize = () => {
    const baseSize = 18; // base font size
    const reductionFactor = 0.8; // factor to reduce the size
    const columns = options.length;
    return `${Math.max(baseSize * reductionFactor ** (columns - 1), 14)}px`; // ensure minimum font size of 14px
  };

  const fontSize = getFontSize();

  const handleSelection = (itemIndex, optionValue) => {
    if (questionType === "checkbox") {
      // For checkbox questions, handle multiple selections
      const currentSelections = selectedAnswers[itemIndex] || [];
      let newSelections;
      
      if (currentSelections.includes(optionValue)) {
        // Remove if already selected
        newSelections = currentSelections.filter(val => val !== optionValue);
      } else {
        // Add if not selected
        newSelections = [...currentSelections, optionValue];
      }
      
      handleAnswerSelect(itemIndex, newSelections);
    } else {
      // For radio questions, single selection
      handleAnswerSelect(itemIndex, optionValue);
    }
  };

  const isOptionSelected = (itemIndex, optionValue) => {
    if (questionType === "checkbox") {
      const currentSelections = selectedAnswers[itemIndex] || [];
      return currentSelections.includes(optionValue);
    } else {
      return selectedAnswers[itemIndex] === optionValue;
    }
  };

  // Helper function to get maxWidth based on viewType
  const getMaxWidth = () => {
    switch (viewType) {
      case 'createSurvey':
        return '500px'; // Normal screen size 500px, responsive not needed
      case 'previewSurvey':
      case 'completeSurvey':
        return { xs: '300px', sm: '100%' }; // Normal screen size 100%, responsive 300px
      case 'reporting':
        return { xs: '300px', sm: '450px' }; // Normal screen size 450px, responsive 300px
      default:
        return { xs: '300px', sm: '700px' };
    }
  };

  return (
    <Box sx={{ 
      overflowX: 'auto', 
      width: '100%', 
      maxWidth: getMaxWidth(),
      margin: '0 auto' // Center the matrix
    }}>
      <Table className="table-container" sx={{ 
        minWidth: '600px', // Increased minimum width for wider columns
        '& .MuiTableCell-root': {
          padding: '8px',
          fontSize: fontSize,
          minWidth: '120px', // Set minimum width for option columns
          '&:first-of-type': {
            minWidth: '200px', // Wider first column for questions
            width: '200px'
          }
        }
      }}>
        <TableHead>
          <TableRow>
            <TableCell style={{ width: '150px' }}></TableCell>
            {options.map((option, index) => (
              <TableCell key={index} align="center">
                <Typography variant="body1" style={{ fontSize }}>{option.label}</Typography>
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {questions.map((question, itemIndex) => (
            <TableRow key={itemIndex}>
              <TableCell style={{ width: '150px' }}>
                <Typography variant="body1" style={{ fontSize }}>{question.label}</Typography>
              </TableCell>
              {options.map((option, optionIndex) => (
                <TableCell key={optionIndex} align="center">
                  <Field
                    as={questionType === "checkbox" ? Checkbox : Radio}
                    type={questionType === "checkbox" ? "checkbox" : "radio"}
                    name={`${fieldName}-${itemIndex}`}
                    value={option.value}
                    checked={isOptionSelected(itemIndex, option.value)}
                    onChange={() => handleSelection(itemIndex, option.value)}
                    disabled={isOptionDisabled()}
                  />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  );
};

export default MatrixQuestion;
