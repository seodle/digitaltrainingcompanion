import React from 'react';
import { useField } from 'formik';
import { FormControl, InputLabel, Select, MenuItem, FormHelperText } from '@mui/material';
import { LearningType } from '../utils/enums';

const LearningTypeSelector = ({ label, getMessage, learningTypes = [LearningType.KNOWLEDGE, LearningType.SKILL, LearningType.ATTITUDE], sx = {}, ...props }) => {
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
        {learningTypes.map((type, index) => (
          <MenuItem key={index} value={type}>
            {getMessage(`label_${type.toLowerCase()}`)}
          </MenuItem>
        ))}
      </Select>
      <FormHelperText>{meta.touched && meta.error ? meta.error : ' '}</FormHelperText>
    </FormControl>
  );
};

export default LearningTypeSelector;