import React from 'react';
import { useField } from 'formik';
import { FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { QuestionType } from '../utils/enums';
import { localizeQuestionType } from '../utils/ObjectsUtils';

const QuestionTypeSelector = ({ label, getMessage, optionsTypes = [QuestionType.TEXT, QuestionType.SINGLE_TEXT, QuestionType.CHECKBOX], sx = {}, ...props }) => {
  const [field, meta] = useField(props);

  return (
    <FormControl fullWidth error={meta.touched && Boolean(meta.error)} sx={sx}>
      <InputLabel id={`${props.name}-label`}>{getMessage(label)}</InputLabel>
      <Select
        labelId={`${props.name}-label`}
        id={props.name}
        {...field}
        label={getMessage(label)}
      >
        {optionsTypes.map((optionsType, optIndex) => (
          <MenuItem key={optIndex} value={optionsType}>
            {getMessage(localizeQuestionType(optionsType, getMessage))}
          </MenuItem>
        ))}
      </Select>
      {meta.touched && meta.error ? (
        <div style={{ color: 'red', fontSize: '12px' }}>{meta.error}</div>
      ) : null}
    </FormControl>
  );
};

export default QuestionTypeSelector;