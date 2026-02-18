import React from 'react';
import { useFormikContext } from 'formik';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Typography,
  Box,
  Chip,
  Alert
} from '@mui/material';
import { useAuthUser } from '../contexts/AuthUserContext';

const CompetenciesSelector = ({
  getMessage,
  competenceAreas,
  getCompetencies,
  getActivities,
  automaticEncoding,
  setAutomaticEncoding,
  selectedCompetencies,
  setSelectedCompetencies,
  handleAutomaticEncodingChange,
  handleCompetencyChange,
  handleDeleteCompetency,
  helpWithAI,
  updateCompetenciesForQuestion,
  framework,
}) => {
  // Access Formik context to get form values and handlers
  const { values, touched, errors, handleChange, handleBlur } = useFormikContext();
  const { currentUser } = useAuthUser();

  return (
    <>
      {/* Automatic Encoding Switch */}
      <FormControlLabel
        control={
          <Switch
            checked={automaticEncoding}
            onChange={(event) =>
              handleAutomaticEncodingChange(
                event,
                setAutomaticEncoding,
                setSelectedCompetencies,
                values.question,
                values.shortName,
                values.framework,
                updateCompetenciesForQuestion
              )
            }
            disabled={helpWithAI || currentUser?.sandbox || !framework}
          />
        }
        label={getMessage('label_automatic_encoding_competencies')}
      />

      {currentUser?.sandbox && (
        <Alert severity="info" sx={{ mb: 2 }}>
          {getMessage("sandbox_user_ai_restriction")}
        </Alert>
      )}

      {/* Manual Competency Addition */}
      <Typography sx={{ mt: '15px', mb: '15px' }}>
        {getMessage('label_add_competencies_manually')}
      </Typography>

      {/* Competency Area Selector */}
      <FormControl fullWidth>
        <InputLabel id="selectedArea">
          {getMessage('label_choose_competency_area')}
        </InputLabel>
        <Select
          labelId="selectedArea"
          id="selectedArea"
          name="area"
          value={values.area}
          label={getMessage('label_choose_competency_area')}
          onChange={handleChange}
          onBlur={handleBlur}
          error={touched.area && Boolean(errors.area)}
          sx={{ mb: '15px' }}
        >
          {(competenceAreas[values.framework] || []).map((area, index) => (
            <MenuItem key={index} value={area}>
              {area}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Elementary Competency Selector */}
      <FormControl fullWidth>
        <InputLabel id="selectedCompetency">
          {getMessage('label_choose_elementary_competency')}
        </InputLabel>
        <Select
          labelId="selectedCompetency"
          id="selectedCompetency"
          name="competency"
          value={values.competency}
          label={getMessage('label_choose_elementary_competency')}
          onChange={handleChange}
          onBlur={handleBlur}
          error={touched.competency && Boolean(errors.competency)}
          sx={{ mb: '15px' }}
        >
          {getCompetencies(values).map((competency, index) => (
            <MenuItem key={index} value={competency}>
              {competency}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Activity Selector */}
      <FormControl fullWidth>
        <InputLabel id="selectedActivity">
          {getMessage('label_choose_activity')}
        </InputLabel>
        <Select
          labelId="selectedActivity"
          id="selectedActivity"
          name="activity"
          value={values.activity}
          label={getMessage('label_choose_activity')}
          onChange={handleCompetencyChange}
          onBlur={handleBlur}
          error={touched.activity && Boolean(errors.activity)}
          sx={{ mb: '15px' }}
        >
          {getActivities(values).map((activity, index) => (
            <MenuItem key={index} value={activity}>
              {activity}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Display Selected Competencies */}
      <Box display="flex" flexWrap="wrap" sx={{ mb: '15px' }}>
        {selectedCompetencies.map((competency, index) => (
          <Chip
            key={index}
            label={competency}
            onDelete={() => handleDeleteCompetency(competency)}
            sx={{ mr: '5px', mb: '5px' }}
          />
        ))}
      </Box>
    </>
  );
};

export default CompetenciesSelector;