import React from 'react';
import { useField } from 'formik';
import { FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { AdoptionType } from '../utils/enums';

const AdoptionTypeSelector = ({ label, getMessage, sx = {}, ...props }) => {
  const [field, meta] = useField({
    ...props,
    // Convert null to empty string to avoid MUI "out-of-range" errors
    value: props.value === null ? '' : props.value
  });

  return (
    <FormControl fullWidth error={meta.touched && Boolean(meta.error)} sx={sx}>
      <InputLabel id={`${props.name}-label`}>{getMessage(label)}</InputLabel>
      <Select
        labelId={`${props.name}-label`}
        id={props.name}
        {...field}
        label={getMessage(label)}
      >
        <MenuItem value={AdoptionType.ACTUAL_USE_TRAINING_CONTENT}>{getMessage(`label_${AdoptionType.ACTUAL_USE_TRAINING_CONTENT.toLowerCase()}`)}</MenuItem>
        <MenuItem value={AdoptionType.TRANSFER_DIGITAL_SKILLS}>{getMessage(`label_${AdoptionType.TRANSFER_DIGITAL_SKILLS.toLowerCase()}`)}</MenuItem>
      </Select>
      {meta.touched && meta.error ? (
        <div style={{ color: 'red', fontSize: '12px' }}>{meta.error}</div>
      ) : null}
    </FormControl>
  );
};

export default AdoptionTypeSelector;