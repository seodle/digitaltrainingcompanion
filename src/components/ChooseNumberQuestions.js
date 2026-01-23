import React from 'react';
import { useFormikContext } from 'formik';
import { FormControl, Box, Typography, TextField } from '@mui/material';

const ChooseNumberQuestions = ({ getMessage, sx = {} }) => {
  const { values, setFieldValue } = useFormikContext();

  return (
    <FormControl fullWidth>
      <Box display="flex" alignItems="center">
        <Typography>{getMessage('label_choose_number_questions')} &nbsp; </Typography>
        <TextField
          id="numberOfQuestions"
          type="number"
          name="numberOfQuestions"
          autoFocus
          size="small"
          style={{ width: '70px' }}
          margin="dense"
          inputProps={{ min: '1' }}
          value={values.numberOfQuestions}
          onChange={(e) => {
            const value = parseInt(e.target.value, 10);
            if (value >= 1) {
              setFieldValue('numberOfQuestions', value);
            } else {
              setFieldValue('numberOfQuestions', 1);
            }
          }}
        />
      </Box>
    </FormControl>
  );
};

export default ChooseNumberQuestions;