import React from 'react';
import { useField } from 'formik';
import { TextField, Box, Typography } from '@mui/material';

const TextFieldWrapper = ({ label, getMessage, onErrorChange, hideCharCount = false, ...props }) => {
  const [field, meta] = useField(props);
  const [charCount, setCharCount] = React.useState(10000);

  const handleChange = (e) => {
    const text = e.target.value;
    const newCharCount = 10000 - text.length;
    setCharCount(newCharCount);
    if (onErrorChange) {
      onErrorChange(newCharCount < 0);
    }
    field.onChange(e);
  };

  return (
    <Box sx={{ position: 'relative', width: '100%' }}>
      <TextField
        {...field}
        {...props}
        label={getMessage(label)}
        error={meta.touched && (Boolean(meta.error) || (!hideCharCount && charCount < 0))}
        onChange={handleChange}
        helperText={meta.touched && meta.error ? meta.error : ' '}
        InputProps={{
          endAdornment: !hideCharCount && (
            <Typography
              variant="caption"
              sx={{
                color: charCount < 0 ? 'error.main' : 'text.secondary',
                position: 'absolute',
                right: 8,
                bottom: 8,
                backgroundColor: 'white',
                px: 0.5,
              }}
            >
              {charCount}
            </Typography>
          ),
        }}
        sx={{
          ...props.sx,
          '& .MuiInputBase-root': {
            paddingBottom: hideCharCount ? '0px' : '32px',
          },
          '& .MuiFormHelperText-root': {
            marginTop: 0,
            marginBottom: 0,
          }
        }}
      />
    </Box>
  );
};

export default TextFieldWrapper;