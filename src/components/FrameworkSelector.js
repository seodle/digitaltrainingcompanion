import React, { useState, useMemo } from 'react';
import { useField } from 'formik';
import {
  FormControl,
  InputLabel,
  Box,
  Tooltip,
  Typography,
  Autocomplete,
  TextField,
  CircularProgress,
  Chip,
  Collapse,
  IconButton,
  Stack,
  FormControlLabel,
  Checkbox,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  InputAdornment,
  Button
} from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import FilterListIcon from '@mui/icons-material/FilterList';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import { frameworkOrigins } from '../assets/frameworksOrigins';

const FrameworkSelector = ({ label, getMessage, competenceAreas, sx = {}, ...props }) => {
  const [field, meta, helpers] = useField(props);
  const [inputValue, setInputValue] = useState('');
  const [expandedDescriptions, setExpandedDescriptions] = useState({});

  // Create searchable options from competenceAreas
  const options = useMemo(() => {
    return Object.keys(competenceAreas).map(framework => ({
      value: framework,
      label: framework,
      flag: frameworkOrigins[framework]?.flag || '🏳️',
      fullName: frameworkOrigins[framework]?.fullName || framework,
      description: frameworkOrigins[framework]?.description || 'No description available',
      language: frameworkOrigins[framework]?.language || 'Unknown',
      scope: frameworkOrigins[framework]?.scope || 'Unknown',
      country: frameworkOrigins[framework]?.country || 'Unknown'
    }));
  }, [competenceAreas]);

  // Filter options based on search input only
  const filteredOptions = useMemo(() => {
    if (!inputValue) return options;

    const searchTerm = inputValue.toLowerCase().trim();
    return options.filter(option => {
      const searchableText = [
        option.label,
        option.fullName,
        option.description,
        option.language,
        option.scope,
        option.country
      ].join(' ').toLowerCase();

      return searchableText.includes(searchTerm);
    });
  }, [options, inputValue]);

  const handleChange = (event, newValue) => {
    helpers.setValue(newValue ? newValue.value : '');
  };

  const handleInputChange = (event, newInputValue) => {
    setInputValue(newInputValue);
  };

  const toggleDescription = (optionValue) => {
    setExpandedDescriptions(prev => ({
      ...prev,
      [optionValue]: !prev[optionValue]
    }));
  };

  const clearInput = () => {
    setInputValue('');
  };

  return (
    <Box sx={sx}>
      <FormControl fullWidth error={meta.touched && Boolean(meta.error)}>
        <Autocomplete
          id={props.name}
          options={filteredOptions}
          getOptionLabel={(option) => {
            if (typeof option === 'string') return option;
            return option.label;
          }}
          value={options.find(option => option.value === field.value) || null}
          onChange={handleChange}
          onInputChange={handleInputChange}
          inputValue={inputValue}
          renderInput={(params) => (
            <TextField
              {...params}
              label={getMessage(label)}
              error={meta.touched && Boolean(meta.error)}
              InputProps={{
                ...params.InputProps,
                endAdornment: (
                  <InputAdornment position="end">
                    {inputValue && (
                      <IconButton
                        onClick={clearInput}
                        edge="end"
                        size="small"
                        sx={{
                          mr: -1,
                          color: 'text.secondary',
                          '&:hover': {
                            color: 'text.primary'
                          }
                        }}
                      >
                        <ClearIcon sx={{ fontSize: '18px' }} />
                      </IconButton>
                    )}
                  </InputAdornment>
                )
              }}
            />
          )}
          renderOption={(props, option) => (
            <Box component="li" {...props}>
              <Box display="flex" alignItems="flex-start" gap={1} width="100%">
                <span style={{ fontSize: '1.2em', marginTop: '2px' }}>{option.flag}</span>
                <Box flex={1}>
                  <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                    <Typography variant="body1" fontWeight="medium">
                      {option.label}
                    </Typography>
                    <Chip
                      label={option.language}
                      size="small"
                      variant="outlined"
                      sx={{ fontSize: '0.7rem', height: '20px' }}
                    />
                    <Chip
                      label={option.scope}
                      size="small"
                      variant="outlined"
                      color="primary"
                      sx={{ fontSize: '0.7rem', height: '20px' }}
                    />
                  </Box>
                  <Typography variant="caption" color="text.secondary" display="block">
                    {option.fullName}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block">
                    {option.country}
                  </Typography>
                  <Box mt={0.5}>
                    <Typography variant="caption" color="text.secondary">
                      {option.description.length > 60 ? option.description.substring(0, 60) + '...' : option.description}
                    </Typography>
                    {option.description.length > 60 && (
                      <Box display="flex" alignItems="center" mt={0.5}>
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleDescription(option.value);
                          }}
                          sx={{ padding: '2px', marginRight: '4px' }}
                        >
                          {expandedDescriptions[option.value] ? (
                            <ExpandLessIcon fontSize="small" />
                          ) : (
                            <ExpandMoreIcon fontSize="small" />
                          )}
                        </IconButton>
                        <Typography variant="caption" color="primary">
                          {expandedDescriptions[option.value] ? 'Show less' : 'Show more'}
                        </Typography>
                      </Box>
                    )}
                    <Collapse in={expandedDescriptions[option.value]} timeout="auto" unmountOnExit>
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                        {option.description}
                      </Typography>
                    </Collapse>
                  </Box>
                </Box>
              </Box>
            </Box>
          )}
          isOptionEqualToValue={(option, value) => option.value === value.value}
          noOptionsText="No frameworks found matching your search"
          loading={false}
          clearOnBlur={false}
          blurOnSelect={true}
          filterOptions={(x) => x}
        />
      </FormControl>
    </Box>
  );
};

export default FrameworkSelector;