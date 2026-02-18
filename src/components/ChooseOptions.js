import React from 'react';
import { useFormikContext, FieldArray } from 'formik';
import {
  TextField,
  IconButton,
  Button,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  ListItemText,
  Checkbox,
  Box
} from '@mui/material';
import { Delete } from '@mui/icons-material';

const ChooseOptions = ({ getMessage, buttonStyle }) => {
  const { values, touched, errors, handleChange, handleBlur } = useFormikContext();

  return (
    <>
      <Typography mb="10px" variant="h4">{getMessage('label_answer_options')}</Typography>

      <FieldArray name="options">
        {({ remove, push }) => (
          <>
            {values.options.map((option, index) => (
              <Box key={index} display="flex" alignItems="flex-start" sx={{ mb: '15px' }}>
                <TextField
                  id={`options.${index}`}
                  name={`options.${index}`}
                  placeholder={`${getMessage('label_option')} ${index + 1}`}
                  value={option}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={
                    touched.options &&
                      touched.options[index] &&
                      errors.options &&
                      errors.options[index]
                      ? true
                      : false
                  }
                  helperText={
                    touched.options &&
                      touched.options[index] &&
                      errors.options &&
                      errors.options[index]
                      ? errors.options[index]
                      : ''
                  }
                  fullWidth
                  multiline
                />
                <IconButton onClick={() => remove(index)} sx={{ ml: 1 }}>
                  <Delete />
                </IconButton>
              </Box>
            ))}

            <Button
              onClick={() => push('')}
              variant="contained"
              sx={{ ...buttonStyle, mb: 5 }}
            >
              <Typography variant="h5">{getMessage('label_add_option')}</Typography>
            </Button>

            <FormControl fullWidth>
              <InputLabel id="selectedCorrectAnswer">
                {getMessage('label_choose_correct_answer')}
              </InputLabel>
              <Select
                labelId="selectedCorrectAnswer"
                id="selectedCorrectAnswer"
                name="correctAnswer"
                multiple  // This is what we need - it's already set up for multiple selection
                value={Array.isArray(values.correctAnswer) ? values.correctAnswer : []}
                label={getMessage('label_choose_correct_answer')}
                onChange={handleChange}
                onBlur={handleBlur}
                renderValue={(selected) => selected.join(', ')}
                error={touched.correctAnswer && Boolean(errors.correctAnswer)}
                sx={{ mb: '15px' }}
              >
                {values.options.length > 0 &&
                  values.options.map((answer, index) =>
                    answer !== '' && (
                      <MenuItem key={index} value={answer}>
                        <Checkbox
                          checked={Array.isArray(values.correctAnswer) &&
                            values.correctAnswer.includes(answer)}
                        />
                        <ListItemText primary={answer} />
                      </MenuItem>
                    )
                  )}
              </Select>
            </FormControl>
          </>
        )}
      </FieldArray >
    </>
  );
};

export default ChooseOptions;