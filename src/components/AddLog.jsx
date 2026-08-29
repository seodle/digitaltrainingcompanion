import React, { useState, useEffect } from "react";
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
  Autocomplete,
  Snackbar,
  Alert,
  Paper
} from "@mui/material";
import { AddLogIcon, IconWell } from "./logbookIcons";
import axios from 'axios';
import { BACKEND_URL } from "../config";
import { useMessageService } from '../services/MessageService';
import { buttonStyle } from "./styledComponents";
import { AssessmentType, LogType } from '../utils/enums';

const getAddLogSchema = (isMonitoringOwner) => Yup.object().shape({
  description: Yup.string()
    .min(5, "Description must be at least 5 characters long")
    .max(1000, "Description must be at maximum 1000 characters long")
    .required("Description is required"),
  day: isMonitoringOwner
    ? Yup.string().required("Day is required")
    : Yup.string(),
  assessment: isMonitoringOwner
    ? Yup.string().required("Assessment is required")
    : Yup.string(),
  assessmentNames: Yup.array()
    .of(
      Yup.object().shape({
        id: Yup.string().required(),
        name: Yup.string().required()
      })
    ),
  logType: Yup.string()  
    .required("Log type is required"),
  visibility: Yup.string()
    .required("Visibility is required"),
  sharedWith: Yup.array().of(Yup.string()).when("visibility", {
    is: "selected",
    then: (schema) => schema.min(1, "Select at least one teacher"),
  }),
  displayNames: Yup.array()
    .of(Yup.string())
});

const AddLog = ({logs, setLogs, currentMonitoringId, uniqueDays, isMonitoringOwner = false}) => {
  const { getMessage } = useMessageService();
  const [availableUsers, setAvailableUsers] = useState([]);
  const [availableAssessments, setAvailableAssessments] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [helpSentOpen, setHelpSentOpen] = useState(false);
  
  const initialLogValue = { 
    description: "", 
    day: "", 
    assessment: "", 
    assessmentNames: [],
    logType: "",
    visibility: "private",
    sharedWith: [],
    displayNames: []
  };

  useEffect(() => {
    const loadFollowers = async () => {
      if (!isMonitoringOwner || !currentMonitoringId) {
        setFollowers([]);
        return;
      }
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(
          `${BACKEND_URL}/logs/monitoring/${currentMonitoringId}/followers`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setFollowers(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error("Error fetching logbook followers:", error);
        setFollowers([]);
      }
    };
    loadFollowers();
  }, [currentMonitoringId, isMonitoringOwner]);

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
      day: isMonitoringOwner ? values.day : "",
      assessment: isMonitoringOwner ? values.assessment : "",
      logType: values.logType,
      visibility: values.visibility,
      sharedWith: values.visibility === "selected" ? values.sharedWith : [],
      assessmentNames: isMonitoringOwner ? values.assessmentNames.map(a => a.name) : [],
      displayNames: isMonitoringOwner ? values.displayNames : []
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
        setLogs((prev) => [...prev, response.data]);
        if (values.logType === LogType.ASK_FOR_HELP) {
          setHelpSentOpen(true);
        }
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
    <Paper
      elevation={0}
      sx={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        minHeight: 0,
        width: "100%",
        borderRadius: "16px",
        border: "1px solid",
        borderColor: "divider",
        overflow: { xs: "visible", md: "hidden" },
        mb: { xs: 2, md: 0 },
      }}
    >
      <Box sx={{ px: { xs: 2, md: 2.5 }, pt: 2.25, pb: 1.5, display: "flex", alignItems: "center", gap: 1.5 }}>
        <IconWell>
          <AddLogIcon />
        </IconWell>
        <Typography variant="h5" fontWeight={700} sx={{ lineHeight: 1.2 }}>
          {getMessage("label_add_log_entry")}
        </Typography>
      </Box>

      <Box sx={{
        px: { xs: 2, md: 2.5 },
        pb: { xs: "calc(80px + env(safe-area-inset-bottom, 0px))", md: 3 },
        overflowY: 'auto',
        flex: 1,
        minHeight: 0,
        maxHeight: { xs: 'none', md: '72vh' },
      }}>
        <Formik
          initialValues={initialLogValue}
          validationSchema={getAddLogSchema(isMonitoringOwner)}
          onSubmit={handleSubmit}
        >
          {({ values, errors, touched, handleChange, handleBlur, setFieldValue }) => (
            <Form>
              <Box sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: 2
              }}>
                <Box position="relative">
                <TextField
                  id="description"
                  name="description"
                  label={getMessage("label_enter_description")}
                  value={values.description}
                  fullWidth
                  multiline
                  minRows={3}
                  maxRows={8}
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

                {isMonitoringOwner && (
                <>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
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
                </Box>

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
                </>
                )}

                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                <FormControl fullWidth>
                  <InputLabel id="logType-label">{getMessage("label_choose_log_type")}</InputLabel>
                  <Select
                    labelId="logType-label"
                    id="logType"
                    name="logType"
                    value={values.logType}
                    label={getMessage("label_choose_log_type")}
                    onChange={(event) => {
                      handleChange(event);
                      if (event.target.value === LogType.ASK_FOR_HELP && values.visibility === "private") {
                        setFieldValue("visibility", "trainer");
                      }
                    }}
                    onBlur={handleBlur}
                    error={touched.logType && Boolean(errors.logType)}
                  >
                    {Object.entries(LogType)
                      .filter(([key]) => !isMonitoringOwner || key !== "ASK_FOR_HELP")
                      .map(([key, value]) => (
                      <MenuItem key={`log-type-${key}`} value={value}>
                        {getMessage(`label_log_type_${key.toLowerCase()}`)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl fullWidth>
                  <InputLabel id="visibility-label">{getMessage("label_log_visibility")}</InputLabel>
                  <Select
                    labelId="visibility-label"
                    id="visibility"
                    name="visibility"
                    value={values.visibility}
                    label={getMessage("label_log_visibility")}
                    onChange={(event) => {
                      handleChange(event);
                      if (event.target.value !== "selected") {
                        setFieldValue("sharedWith", []);
                      }
                    }}
                    onBlur={handleBlur}
                  >
                    {values.logType !== LogType.ASK_FOR_HELP && (
                      <MenuItem value="private">
                        {getMessage(
                          isMonitoringOwner
                            ? "label_log_visibility_private_trainer"
                            : "label_log_visibility_private"
                        )}
                      </MenuItem>
                    )}
                    {isMonitoringOwner ? (
                      <MenuItem value="selected">{getMessage("label_log_visibility_selected")}</MenuItem>
                    ) : (
                      <MenuItem value="trainer">{getMessage("label_log_visibility_trainer")}</MenuItem>
                    )}
                    <MenuItem value="followers">
                      {getMessage(
                        isMonitoringOwner
                          ? "label_log_visibility_followers"
                          : "label_log_visibility_followers_teacher"
                      )}
                    </MenuItem>
                  </Select>
                </FormControl>
                </Box>

                {isMonitoringOwner && values.visibility === "selected" && (
                  <FormControl fullWidth>
                    <Autocomplete
                      multiple
                      options={followers}
                      getOptionLabel={(option) => `${option.firstName || ""} ${option.lastName || ""}`.trim()}
                      value={followers.filter((follower) => values.sharedWith.includes(follower._id))}
                      isOptionEqualToValue={(option, value) => option._id === value._id}
                      onChange={(_, newValue) => {
                        setFieldValue("sharedWith", newValue.map((follower) => follower._id));
                      }}
                      renderTags={(value, getTagProps) =>
                        value.map((option, index) => (
                          <Chip
                            {...getTagProps({ index })}
                            key={option._id}
                            label={`${option.firstName || ""} ${option.lastName || ""}`.trim()}
                          />
                        ))
                      }
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label={getMessage("label_log_share_with_teachers")}
                          error={touched.sharedWith && Boolean(errors.sharedWith)}
                          helperText={touched.sharedWith && errors.sharedWith}
                        />
                      )}
                    />
                  </FormControl>
                )}

                 <Box sx={{ mt: 1 }}>
                    <Button 
                      type="submit" 
                      variant="contained" 
                      sx={{ ...buttonStyle, mr: 0, px: 3, width: { xs: '100%', sm: 'auto' } }}
                    >
                    {getMessage("label_submit")}
                  </Button>
                </Box>
              </Box>
            </Form>
          )}
        </Formik>
      </Box>
      <Snackbar
        open={helpSentOpen}
        autoHideDuration={4000}
        onClose={() => setHelpSentOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setHelpSentOpen(false)}
          severity="success"
          variant="filled"
          sx={{ borderRadius: "12px", bgcolor: "#F7941E", color: "#1a1a1a" }}
        >
          {getMessage("label_log_help_sent")}
        </Alert>
      </Snackbar>
    </Paper>
  );
};

export default AddLog;