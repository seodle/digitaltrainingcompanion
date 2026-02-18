import React, { useState } from "react";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import { 
  Box, 
  TextField, 
  Button, 
  Select, 
  MenuItem, 
  InputLabel, 
  Typography, 
  FormControl,
  Chip,
  Autocomplete
} from "@mui/material";
import axios from 'axios';
import { BACKEND_URL } from "../config";
import { useAuthUser } from '../contexts/AuthUserContext';
import { useMessageService } from '../services/MessageService';
import { buttonStyle } from "./styledComponents";
import { AssessmentType, LogType } from '../utils/enums';

const AddLogSchema = Yup.object().shape({
  description: Yup.string()
    .min(5, "Description must be at least 5 characters long")
    .max(1000, "Description must be at maximum 1000 characters long")
    .required("Description is required"),
  day: Yup.string()
    .required("Day is required"),
  assessment: Yup.string()
    .required("Assessment is required"),
  assessmentNames: Yup.array()
    .of(
      Yup.object().shape({
        id: Yup.string().required(),
        name: Yup.string().required()
      })
    ),
  logType: Yup.string()  
    .required("Log type is required"),
  displayNames: Yup.array()
    .of(Yup.string())
});

const AddLog = ({logs, setLogs, currentMonitoringId, uniqueDays}) => {
  const { currentUser } = useAuthUser();
  const { getMessage } = useMessageService();
  const [availableUsers, setAvailableUsers] = useState([]);
  const [availableAssessments, setAvailableAssessments] = useState([]);
  
  const initialLogValue = { 
    description: "", 
    day: "", 
    assessment: "", 
    assessmentNames: [],
    logType: "",
    displayNames: []
  };

  const fetchAssessments = async (assessmentType) => {
    if (!assessmentType) return;

    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${BACKEND_URL}/assessments/monitoring/${currentMonitoringId}`,
        {
          params: { assessmentType },
          headers: { Authorization: `Bearer ${token}` },
          validateStatus: (status) => (status >= 200 && status < 300) || status === 204,
        }
      );

      if (response.status === 204 || !response.data) {
        setAvailableAssessments([]);
        return;
      }

      const uniqueAssessments = Array.isArray(response.data)
        ? response.data.map((assessment) => ({
            id: assessment._id,
            name: assessment.name
          }))
        : [];

      setAvailableAssessments(uniqueAssessments);
    } catch (error) {
      console.error("Error fetching assessments:", error);
      setAvailableAssessments([]);
    }
  };

  const fetchUsers = async (assessments) => {
    if (!assessments?.length) {
      setAvailableUsers([]);
      return;
    }

    try {
      const assessmentIds = assessments.map(assessment => assessment.id);
      
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${BACKEND_URL}/responses/monitoring/${currentMonitoringId}/displayNames`,
        {
          params: { assessmentIds: assessmentIds.join(",") },
          headers: { Authorization: `Bearer ${token}` },
          validateStatus: (status) => (status >= 200 && status < 300) || status === 204,
        }
      );

      if (response.status === 204 || !response.data) {
        setAvailableUsers([]);
        return;
      }

      const displayNames = Array.isArray(response.data) ? response.data : [];
      setAvailableUsers(displayNames.filter(name => name && typeof name === "string"));
    } catch (error) {
      console.error("Error fetching users:", error);
      setAvailableUsers([]);
    }
  };

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    const newLog = {
      description: values.description,
      day: values.day,
      assessment: values.assessment,
      logType: values.logType,
      assessmentNames: values.assessmentNames.map(a => a.name),
      displayNames: values.displayNames
    };

    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${BACKEND_URL}/logs`,
        { ...newLog, monitoringId: currentMonitoringId },
        { 
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if(response.status === 200) {
        setLogs([...logs, response.data]);
        resetForm({
          values: {
            ...initialLogValue,
            assessment: values.assessment
          }
        });
      }
    } catch (error) {
      console.error('An error occurred while creating the log:', error);
      console.error('Error details:', error.response?.data);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box sx={{
      display: "flex",
      flexDirection: "column",
      flex: 1,
      p: 2,
      m: 2,
      height: "80vh"
    }}>
      <Typography variant="h3" fontWeight="bold" sx={{ mb: 4 }}>
        {getMessage("label_add_log_entry")}
      </Typography>

      <Box sx={{
        backgroundColor: 'background.paper',
        borderRadius: 2,
        p: 3,
        boxShadow: 1,
        overflowY: 'auto',
        flex: 1,
        minHeight: 0
      }}>
        <Formik
          initialValues={initialLogValue}
          validationSchema={AddLogSchema}
          onSubmit={handleSubmit}
        >
          {({ values, errors, touched, handleChange, handleBlur, setFieldValue }) => (
            <Form>
              <Box sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: 3
              }}>
                <Box position="relative">
                <TextField
                  id="description"
                  name="description"
                  label={getMessage("label_enter_description")}
                  value={values.description}
                  fullWidth
                  multiline
                  rows={6}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  error={touched.description && Boolean(errors.description)}
                />
                <Typography
                  variant="caption" 
                  sx={{ 
                    position: 'absolute', 
                    bottom: 10,  
                    right: 14,                             
                    color: values.description?.length >= 1000 ? 'error.main' : 'text.secondary',
                    backgroundColor: 'white',              
                    px: 0.5,                              
                    zIndex: 1                             
                  }}
                >
                  {values.description?.length || 0}/1000
                </Typography>
              </Box>

                <FormControl fullWidth>
                  <InputLabel id="day-label">{getMessage("label_choose_session")}</InputLabel>
                  <Select
                    labelId="day-label"
                    id="day"
                    name="day"
                    value={values.day}
                    label={getMessage("label_choose_session")}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.day && Boolean(errors.day)}
                  >
                    {uniqueDays.map((day, index) => (
                      <MenuItem key={`day-${index}-${day}`} value={day}>
                        {day}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl fullWidth>
                  <InputLabel id="assessment-label">{getMessage("label_concerns")}</InputLabel>
                  <Select
                    labelId="assessment-label"
                    id="assessment"
                    name="assessment"
                    value={values.assessment}
                    label={getMessage("label_concerns")}
                    onChange={(e) => {
                      handleChange(e);
                      fetchAssessments(e.target.value);
                      setFieldValue('assessmentNames', []);
                      setFieldValue('displayNames', []);
                    }}
                    onBlur={handleBlur}
                    error={touched.assessment && Boolean(errors.assessment)}
                  >
                    {Object.entries(AssessmentType).map(([key, value]) => (
                      <MenuItem key={`assessment-type-${key}`} value={value}>
                        {getMessage(`label_assessment_type_${key.toLowerCase()}`)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl fullWidth>
                  <Autocomplete
                    multiple
                    id="assessmentNames"
                    options={availableAssessments}
                    getOptionLabel={(option) => option.name}
                    value={values.assessmentNames}
                    isOptionEqualToValue={(option, value) => option.id === value.id}
                    onChange={(_, newValue) => {
                      setFieldValue("assessmentNames", newValue);
                      fetchUsers(newValue);
                      setFieldValue("displayNames", []);
                    }}
                    renderTags={(value, getTagProps) =>
                      value.map((option, index) => (
                        <Chip
                          {...getTagProps({ index })}
                          key={option.id}
                          label={option.name}
                        />
                      ))
                    }
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label={getMessage("label_select_assessment")}
                        error={touched.assessmentNames && Boolean(errors.assessmentNames)}
                        helperText={touched.assessmentNames && errors.assessmentNames}
                      />
                    )}
                  />
                </FormControl>

                <FormControl fullWidth>
                  <Autocomplete
                    multiple
                    id="displayNames"
                    options={availableUsers}
                    value={values.displayNames}
                    onChange={(_, newValue) => {
                      setFieldValue("displayNames", newValue);
                    }}
                    renderTags={(value, getTagProps) =>
                      value.map((option, index) => (
                        <Chip
                          {...getTagProps({ index })}
                          key={index}
                          label={option}
                        />
                      ))
                    }
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label={getMessage("label_display_names")}
                        error={touched.displayNames && Boolean(errors.displayNames)}
                        helperText={touched.displayNames && errors.displayNames}
                      />
                    )}
                  />
                </FormControl>

                <FormControl fullWidth>
                  <InputLabel id="logType-label">{getMessage("label_choose_log_type")}</InputLabel>
                  <Select
                    labelId="logType-label"
                    id="logType"
                    name="logType"
                    value={values.logType}
                    label={getMessage("label_choose_log_type")}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={touched.logType && Boolean(errors.logType)}
                  >
                    {Object.entries(LogType).map(([key, value]) => (
                      <MenuItem key={`log-type-${key}`} value={value}>
                        {getMessage(`label_log_type_${key.toLowerCase()}`)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                 <Box sx={{ mt: 1 }}>
                    <Button 
                      type="submit" 
                      variant="contained" 
                      sx={buttonStyle}
                    >
                    <Typography variant="h4">{getMessage("label_submit")}</Typography>
                  </Button>
                </Box>
              </Box>
            </Form>
          )}
        </Formik>
      </Box>
    </Box>
  );
};

export default AddLog;