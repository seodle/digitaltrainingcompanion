import React from 'react';
import { Box,  TextField, Typography, FormControlLabel, RadioGroup, Radio, Checkbox, useTheme} from "@mui/material";
import { QuestionContext } from "../contexts/QuestionnaireContext";
import { useContext } from "react";
import { tokens } from "../theme";


const QuestionList = () => {

    const theme = useTheme();
    const colors = tokens(theme.palette.mode);

    const { questions } = useContext(QuestionContext)

    const displayQuestion = (question) => {
        switch (question.questionType) {
            case 'text':
            return (
                <div style={styles.formGroup}>
                <TextField
                    id="text-answer"
                    name="text-answer"
                    placeholder="Réponse"
                    sx= {{m:"10px"}}
                />
                </div>
            );
            case 'multipleChoice':
            return (
                <div style={styles.formGroup}>
                <RadioGroup name="multiple-choice" style={{display: 'flex', flexDirection: 'row'}}>
                    {question.options.map((option, index) => (
                    <FormControlLabel
                        key={index}
                        value={option}
                        control={<Radio />}
                        label={option}
                        style={{...styles.checkbox, marginLeft: '10px'}}
                    />
                    ))}
                </RadioGroup>
                </div>
            );
            case 'checkboxes':
            return (
                <div style={styles.formGroup}>
                {question.options.map((option, index) => (
                    <FormControlLabel
                    key={index}
                    control={<Checkbox />}
                    label={option}
                    style={{...styles.checkbox, marginLeft: '10px'}}
                    />
                ))}
                </div>
            );
            default:
            return null;
        }
    };
    
    const styles = {
        formGroup: {
            display: "flex",
            marginBottom: "1rem",
        },
        checkbox: {
            marginTop: 0,
            marginBottom: 0,
        },
        invalidFeedback: {
            color: "red",
            marginTop: "0.25rem",
        },
    };

  return (
    <Box>
      
      <ul>
        {questions.map((question, index) => (
          <Box sx={{border: 1, boxShadow: 2,
           borderRadius: '5px',
           borderColor: colors.grey[800],
           listStyleType: 'none',
           mb: "15px", mt: "15px",
        }} >
            <li key={index}>
            <Typography m="15px" variant="h5" fontWeight="bold">{question.question}</Typography>
            {displayQuestion(question)}
          </li>
        </Box>
        ))}
      </ul>

    </Box>
  )
};

export default QuestionList;