import React, { useState } from 'react';
import Timeline from '@mui/lab/Timeline';
import TimelineItem from '@mui/lab/TimelineItem';
import TimelineSeparator from '@mui/lab/TimelineSeparator';
import TimelineConnector from '@mui/lab/TimelineConnector';
import TimelineContent from '@mui/lab/TimelineContent';
import TimelineDot from '@mui/lab/TimelineDot';
import TimelineOppositeContent from '@mui/lab/TimelineOppositeContent';
import { Box, Typography, IconButton, TextField, Chip } from "@mui/material";
import Delete from "@mui/icons-material/Delete";
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import RepeatIcon from '@mui/icons-material/Repeat';
import VisibilityIcon from '@mui/icons-material/Visibility';
import axios from 'axios';
import { BACKEND_URL } from "../config";
import { useAuthUser } from '../contexts/AuthUserContext';
import { AssessmentType, LogType } from '../utils/enums';
import { useMessageService } from '../services/MessageService';
import { localizeAssessmentType } from '../utils/ObjectsUtils';

const CustomTimeline = ({ logs, setLogs, currentMonitoringId }) => {
  const { currentUser } = useAuthUser();
  const { getMessage } = useMessageService();
  const [editingIndex, setEditingIndex] = useState(null);
  const [tempDescription, setTempDescription] = useState("");

  const displayLogs = [...logs].reverse();

  const handleDelete = async (displayIndex) => {
    const actualIndex = logs.length - 1 - displayIndex;
    const newLogs = [...logs];
    newLogs.splice(actualIndex, 1);
    setLogs(newLogs);

    const serverLogs = {
      userId: currentUser._id, 
      monitoringId: currentMonitoringId,
      logs: newLogs,
    };

    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${BACKEND_URL}/logs/${currentMonitoringId}`,
        serverLogs,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if(response.status === 200) {
        console.log('Log deleted successfully');
      } else {
        console.log('An error occurred while deleting the log:', response);
      }
    } catch (error) {
      console.log('An error occurred while deleting the log:', error);
    }
  };

    const handleStartEdit = (index, description) => {
      setEditingIndex(index);
      setTempDescription(description);
    };

    const handleSave = async (displayIndex) => {
      const actualIndex = logs.length - 1 - displayIndex;
      const newLogs = [...logs];
      const currentLog = newLogs[actualIndex];
      
      // Only update lastModificationDate if the description has changed
      const hasDescriptionChanged = currentLog.description !== tempDescription;
            
      newLogs[actualIndex] = {
        ...currentLog,
        description: tempDescription,
        ...(hasDescriptionChanged && { lastModificationDate: new Date().toISOString() })
      };

      setLogs(newLogs);
      setEditingIndex(null);

    const serverLogs = {
      userId: currentUser._id,
      monitoringId: currentMonitoringId,
      logs: newLogs,
    };

    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `${BACKEND_URL}/logs/${currentMonitoringId}`,
        serverLogs,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      console.log('Log updated successfully');
    } catch (error) {
      console.error('Error updating log:', error);
    }
  };

  if (logs.length === 0) {
    return <Typography mt="50px" variant="h6">{getMessage("label_no_entries")}</Typography>;
  }

const handleChangeCompletion = async (displayIndex) => {
    const actualIndex = logs.length - 1 - displayIndex;
    const newLogs = [...logs];
    const isNowCompleted = !newLogs[actualIndex].isCompleted;
    
    newLogs[actualIndex] = {
      ...newLogs[actualIndex],
      isCompleted: isNowCompleted,
      completionDate: isNowCompleted ? new Date().toISOString() : null
    };

    setLogs(newLogs);

    const serverLogs = {
      userId: currentUser._id,
      monitoringId: currentMonitoringId,
      logs: newLogs,
    };

    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `${BACKEND_URL}/logs/${currentMonitoringId}`,
        serverLogs,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      console.log('Change completion status updated successfully');
    } catch (error) {
      console.error('Error updating change completion status:', error);
    }
};

return (
    <Box mt="12px">
      <Typography variant="h3" fontWeight="bold">
        {getMessage("label_my_training_activity")}
      </Typography>

      <Box mt="30px" sx={{overflowY: 'auto', height: "70vh", minWidth: "40vw"}}>
        <Timeline sx={{ 
          flexDirection: 'column', 
          '& .MuiTimelineItem-root': { 
            minHeight: 'auto',
            '&:before': {
              flex: 0.2
            }
          }
        }}>
          {displayLogs.map((log, displayIndex) => {
            const isEditing = editingIndex === displayIndex;

            return (
              <TimelineItem 
                key={displayIndex}
                sx={{
                  '&::before': {
                    display: 'none'
                  }
                }}
              >
              <TimelineOppositeContent 
                  sx={{ 
                    flex: '0.2 !important',
                    display: 'flex', 
                    alignItems: 'center',
                    py: 1,
                    pr: 1
                  }} 
                  variant="body2" 
                  color="text.secondary"
                >
                  <Box 
                    display="flex" 
                    flexDirection="column"
                    flexGrow={1} 
                    sx={{ 
                      bgcolor: '#fff',
                      borderRadius: 2,
                      p: 1,
                      border: '1px solid rgba(0, 0, 0, 0.12)',
                      boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
                      '&:hover': {
                        boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.12)'
                      },
                      transition: 'box-shadow 0.2s ease-in-out'
                    }}
                  >
                    <Box 
                      display="flex" 
                      alignItems="center"
                    >
                      <IconButton 
                        onClick={() => handleDelete(displayIndex)}
                        sx={{ padding: 0.5 }}
                      >
                        <Delete sx={{ 
                          color: 'rgba(211, 47, 47, 0.8)', 
                          fontSize: '1.2rem' 
                        }} />     
                      </IconButton>

                      <Typography 
                        variant="h4" 
                        fontWeight="bold" 
                        sx={{ 
                          ml: 1, 
                          mr: 1,
                          whiteSpace: 'nowrap',
                          fontSize: '1.2rem',
                          color: 'text.primary'
                        }}
                      >
                        Session {log.day}
                      </Typography>
                    </Box>

                    {log.creationDate && (
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          ml: 4,
                          color: 'text.secondary',
                          fontSize: '0.75rem'
                        }}
                      >
                        {new Date(log.creationDate).toLocaleDateString()}
                      </Typography>
                    )}
                  </Box>
                </TimelineOppositeContent>
                <TimelineSeparator>
                  <TimelineConnector sx={{ bgcolor: 'primary.main' }} />
                  <TimelineDot style={{ backgroundColor: 'rgb(236, 141, 53)' }}>
                    {log.logType === LogType.OBSERVATION ? <VisibilityIcon /> : <RepeatIcon />}
                  </TimelineDot>
                  <TimelineConnector sx={{ bgcolor: 'primary.main' }} />
                </TimelineSeparator>
                <TimelineContent 
                  sx={{
                    py: '2%', 
                    border: '1px solid rgba(0, 0, 0, 0.12)', 
                    borderRadius: 2,
                    margin: '10px',
                    position: 'relative',
                    flex: '0.8 !important',
                    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)', 
                    backgroundColor: '#fff', 
                    '& .edit-button': {
                      opacity: 0,
                      transition: 'opacity 0.2s'
                    },
                    '&:hover .edit-button': {
                      opacity: 1
                    }
                  }}
                >
                  <IconButton 
                    onClick={() => isEditing ? handleSave(displayIndex) : handleStartEdit(displayIndex, log.description)}
                    aria-label={isEditing ? `Save log ${log.day}` : `Edit log ${log.day}`}
                    sx={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      bgcolor: 'white',
                      boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
                      '&:hover': {
                        bgcolor: 'rgba(255, 255, 255, 0.9)',
                        boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.12)'
                      }
                    }}
                  >
                    {isEditing ? <SaveIcon color="primary" /> : <EditIcon />}
                  </IconButton>

                  {/* Main Assessment Label */}
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Typography 
                      variant="h4" 
                      fontWeight="bold" 
                      sx={{ 
                        color: 'text.primary',
                      }}
                    >
                      {localizeAssessmentType(log.assessment, getMessage)}
                    </Typography>
                  </Box>

                  {/* Assessment Names */}
                  {Array.isArray(log.assessmentNames) && log.assessmentNames.length > 0 && (
                    <Box sx={{ mb: 1 }}>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {log.assessmentNames.map((assessmentName, index) => (
                          <Chip
                            key={`assessment-name-${index}`}
                            label={assessmentName}
                            size="small"
                            sx={{
                              bgcolor: `rgb(236, 141, 53)`,
                              color: 'white',
                              '& .MuiChip-label': {
                                fontWeight: 500
                              }
                            }}
                          />
                        ))}
                      </Box>
                    </Box>
                  )}

                  {/* Display Names */}
                  {Array.isArray(log.displayNames) && log.displayNames.length > 0 && (
                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {log.displayNames.map((displayName, index) => (
                          <Chip
                            key={`display-name-${index}`}
                            label={displayName}
                            size="small"
                            sx={{
                              bgcolor: 'rgba(0, 0, 0, 0.3)',
                              color: 'white',
                              '& .MuiChip-label': {
                                fontWeight: 500
                              }
                            }}
                          />
                        ))}
                      </Box>
                    </Box>
                  )}

                  {/* Description Section */}
                  {isEditing ? (
                    <Box sx={{ position: 'relative', mt: 2 }}>
                      <TextField
                        fullWidth
                        multiline
                        rows={10}
                        value={tempDescription}
                        onChange={(e) => {
                          if (e.target.value.length <= 1000) {
                            setTempDescription(e.target.value);
                          }
                        }}
                        autoFocus
                        variant="outlined"
                        inputProps={{ maxLength: 1000 }}
                        sx={{
                          '& .MuiInputBase-root': {
                            width: '100%',
                            bgcolor: 'white',
                            '& textarea': {
                              width: '100%',
                              whiteSpace: 'pre-wrap',
                              lineHeight: '1.5',
                              fontSize: '16px',
                              wordBreak: 'break-word',
                              padding: '10px',
                              columnWidth: '100ch',
                              maxWidth: '100%'
                            }
                          }
                        }}
                      />
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          position: 'absolute', 
                          bottom: -20, 
                          right: 0 
                        }}
                      >
                        {tempDescription.length}/1000
                      </Typography>
                    </Box>
                  ) : (
                    <Typography 
                      variant="h5" 
                      onClick={() => handleStartEdit(displayIndex, log.description)}
                      sx={{ 
                        cursor: 'pointer',
                        whiteSpace: 'pre-wrap',
                        lineHeight: '1.5',
                        fontSize: '16px',
                        wordBreak: 'break-word',
                        padding: '10px',
                        columnWidth: '100ch',
                        maxWidth: '100%',
                        mt: 2
                      }}
                    >
                      {log.description}
                    </Typography>
                  )}

                    {/* Last Modified Info */}
                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: log.logType === LogType.OBSERVATION ? 'flex-end' : 'space-between',
                      alignItems: 'flex-end',
                      mt: 1 
                    }}>
                                            
                      {log.logType !== LogType.OBSERVATION && (
                        <Box sx={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: 1,
                          bgcolor: log.isCompleted ? 'success.light' : 'grey.100',
                          color: log.isCompleted ? 'white' : 'text.secondary',
                          borderRadius: 2,
                          px: 2,
                          py: 0.5,
                          cursor: 'pointer',
                          transition: 'all 0.2s ease-in-out',
                          '&:hover': {
                            bgcolor: log.isCompleted ? 'success.main' : 'grey.200'
                          }
                        }}
                        onClick={() => handleChangeCompletion(displayIndex)}
                        >

                          <Typography variant="caption">
                            {log.isCompleted 
                              ? `${getMessage("label_log_completed")} ${new Date(log.completionDate).toLocaleString()}` 
                              : getMessage("label_log_isCompleted")
                            }
                          </Typography>                         
                        </Box>
                      )}

                      {log.lastModificationDate && (
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            color: 'text.secondary',
                            fontStyle: 'italic',
                          }}
                        >
                          {getMessage("label_last_modified")}: {new Date(log.lastModificationDate).toLocaleString()}
                        </Typography>
                      )}
                    </Box>
                  </TimelineContent>
              </TimelineItem>
            );
          })}
        </Timeline>
      </Box>
    </Box>
  );
};

export default CustomTimeline;