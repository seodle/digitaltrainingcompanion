import React, { useState, useEffect } from 'react';
import {
  Card,
  Box,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  TextField,
  Tooltip,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Button,
  Snackbar, 
  Alert
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  ContentCopy as ContentCopyIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from '@mui/icons-material';
import {
  Users,
  Edit2,
  CalendarDays
} from 'lucide-react';
import ShareIcon from '@mui/icons-material/Share';
import axios from "axios";
import { BACKEND_URL } from "../../config";

//dependencies
import { useMessageService } from '../../services/MessageService';
import { useAuthUser } from '../../contexts/AuthUserContext';
import { OptionTypes, UserType } from '../../utils/enums';
import { loadMonitoringAndAssessments } from '../../utils/ObjectsUtils';

const MonitoringCard = ({ 
    monitoring,
    setCurrentMonitoringId, 
    setMonitorings,  
    setAssessments,  
    assessments,     
    monitorings,     
    expandedMonitoring, 
    setExpandedMonitoring, 
    onUpdateMonitoring = () => {}, // Default empty function
}) => {

  const { getMessage } = useMessageService();    
  const [anchorEl, setAnchorEl] = useState(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editingName, setEditingName] = useState(monitoring.name);
  const [editingDescription, setEditingDescription] = useState(monitoring.description);
  const [showSharingCode, setShowSharingCode] = useState(false); // Toggle sharing code visibility
  const [sharingCode, setSharingCode] = useState(''); // Dynamically generated sharing code
  const { currentUser } = useAuthUser(); // Get the current user from the AuthUserContext
  const [error, setError] = useState(null); // store error messages
  const [warningDialog, setWarningDialog] = useState({
  open: false,
  type: null, // 'delete', 'deleteAnswers', or 'stopSharing'
});
  const [usersWhoRedeemed, setUsersWhoRedeemed] = useState([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [ownerInfo, setOwnerInfo] = useState(null);

  const [openSnackbar, setOpenSnackbar] = useState(false);


  const isExpanded = expandedMonitoring === monitoring._id;

useEffect(() => {
  const fetchUsersWhoRedeemed = async () => {
    if (monitoring.sharingCode) {
      setIsLoadingUsers(true);
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(
          `${BACKEND_URL}/users/redeemedCode/${monitoring.sharingCode}`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
        setUsersWhoRedeemed(response.data.usersRedeemed);
        setOwnerInfo(response.data.owner);
      } catch (error) {
        console.error('Error fetching users who redeemed code:', error);
      } finally {
        setIsLoadingUsers(false);
      }
    }
  };

  fetchUsersWhoRedeemed();
}, [monitoring.sharingCode]);

const generateTooltipContent = () => {
  if (isLoadingUsers) {
    return (
      <Box sx={{ 
        p: 1.5,
        display: 'flex',
        alignItems: 'center',
        gap: 1 
      }}>
        <Typography variant="body2">{getMessage("label_loading_users")}</Typography> //Loading users...
      </Box>
    );
  }
  
  if (usersWhoRedeemed.length === 0) {
    return (
      <Box sx={{ 
        p: 1.5,
        display: 'flex',
        alignItems: 'center',
        gap: 1 
      }}>
        <Typography 
        variant="body2">{getMessage("label_no_users_imported")}  //No users have imported this monitoring yet
        </Typography> 
      </Box>
    );
  }

  return (
    <Box sx={{ 
      p: 1.5,
      minWidth: 200,
      maxWidth: 300
    }}>
      {ownerInfo && currentUser._id !== monitoring.userId && (
        <Box sx={{
          mb: 2,
          pb: 1,
          borderBottom: '1px solid',
          borderColor: 'grey.200',
        }}>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Owner:
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            {`${ownerInfo.firstName} ${ownerInfo.lastName}`}
          </Typography>
        </Box>
      )}
      <Typography 
        variant="subtitle2" 
        sx={{ 
          mb: 1,
          pb: 1,
          borderBottom: '1px solid',
          borderColor: 'grey.200',
          color: 'primary.main',
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}
      >
        <Users size={14}/>
        {getMessage("label_user_imported")}
      </Typography>
      <Box sx={{ 
        maxHeight: 200,
        overflowY: 'auto',
        '&::-webkit-scrollbar': {
          width: '4px',
        },
        '&::-webkit-scrollbar-track': {
          background: '#f1f1f1',
          borderRadius: '4px',
        },
        '&::-webkit-scrollbar-thumb': {
          background: '#888',
          borderRadius: '4px',
        },
      }}>
        {usersWhoRedeemed.map((user, index) => (
          <Box
            key={index}
            sx={{
              py: 0.5,
              display: 'flex',
              alignItems: 'center',
              '&:not(:last-child)': {
                borderBottom: '1px solid',
                borderColor: 'grey.100',
              }
            }}
          >
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              {`${user.firstName} ${user.lastName}`}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

/**
 * Handles copying a monitoring item by its ID.
 *
 * @param {string} monitoringId - The ID of the monitoring item to copy.
 * @returns {Promise<void>} - A promise that resolves when the monitoring item has been copied.
 *
 * @throws Will throw an error if the copying process fails.
 */
  const handleCopyMonitoring = async (monitoringId) => {
    if (currentUser?.sandbox) {
    setError(getMessage("sandbox_user_cannot_copy"));
    return;
  }
    try {
        // Retrieve token
        const token = localStorage.getItem("token");

        // copy the monitoring
        let matchingMonitoring = monitorings.find(monitoring => monitoring._id == monitoringId);

        // create the new monitoring object
        const copiedMonitoring = {
          orderId: monitorings.length + 1,
          userId: currentUser._id,
          name: `${matchingMonitoring.name} (copy)`,
          description: matchingMonitoring.description,
          creationDate: new Date(Date.now()), 
          options: [OptionTypes.DELETE, OptionTypes.DELETE_ALL_ANSWERS, OptionTypes.COPY],
        };

        // add the new monitoring
        const response = await axios.post(`${BACKEND_URL}/monitoring`, copiedMonitoring, {
            headers: {
              Authorization: `Bearer ${token}`
            }
        });

        const serverMonitoringId = response.data._id;
        copiedMonitoring._id = serverMonitoringId;

        // Copy the assessments
        await copyAssessments(monitoringId, serverMonitoringId, token);

        // reload all assessment and monitorings
        await loadMonitoringAndAssessments(currentUser, setMonitorings, setAssessments, setCurrentMonitoringId);
    
        // choose the last monitoringId
        setCurrentMonitoringId(serverMonitoringId);
        
        handleMenuClose();
      
    } catch (error) {
        console.error('Error copying assessment:', error);
        setError("Failed to copy assessment. Please try again.");
    }
  }

    // Copy assessments from one monitoring to another
  const copyAssessments = async (monitoringId, newMonitoringId, token) => {
    try {
      const response = await axios.post(
        `${BACKEND_URL}/assessments/${monitoringId}/copy/${newMonitoringId}`,
        {}, // Since the route doesn't expect a body, pass an empty object
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      console.log('Assessments copied successfully:', response.data);

      return response.data; // Return the copied assessments if needed
    } catch (error) {
      console.error('Error copying assessments:', error);
      throw error; // Rethrow the error for further handling if necessary
    }
  };

 /**
 * Handles the deletion of a monitoring item.
 *
 * @param {string} monitoringId - The ID of the monitoring item to be deleted.
 * @returns {Promise<void>} - A promise that resolves when the monitoring item is deleted.
 *
 * @async
 * @function handleDeleteMonitoring
 *
 * @description
 * This function deletes a monitoring item by its ID. It first logs the deletion attempt,
 * retrieves the authentication token from local storage, and sends a DELETE request to the backend.
 * If the deletion is successful, it logs a success message. If an error occurs, it logs the error.
 * After deletion, it updates the state by filtering out the deleted monitoring item and reordering
 * the remaining items. It also filters out any assessments associated with the deleted monitoring item.
 */
const handleDeleteMonitoring = async (monitoringId) => {

    handleDeleteAnswers(monitoringId);
    console.log("deleting the monitoring and all answers", monitoringId);

    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${BACKEND_URL}/monitoring/${monitoringId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      console.log("Monitoring deleted successfully");
    } catch (err) {
      console.error(err);
    }
  
    const filteredMonitorings = monitorings.filter((monitoring) => monitoring._id !== monitoringId);
    
    const newMonitorings = filteredMonitorings.map((monitoring, index) => ({
      ...monitoring,
      orderId: index + 1,
    }));
  
    setMonitorings(newMonitorings);
  
    const filteredAssessments = assessments.filter((assessment) => assessment.monitoringId !== monitoringId);
    setAssessments(filteredAssessments);
  };

  /**
   * Deletes all answers associated with a specific monitoring ID for the current user.
   *
   * @param {string} monitoringId - The ID of the monitoring from which to delete answers.
   * @returns {Promise<void>} - A promise that resolves when the deletion is complete.
   * @throws {Error} - Throws an error if the deletion fails.
   */
  const handleDeleteAnswers = async (monitoringId) => {
    console.log("delete all answers from monitoring", monitoringId);

    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${BACKEND_URL}/monitoring/${monitoringId}/answers`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      console.log("All answers from this monitoring deleted successfully");
    } catch (err) {
      console.error(err);
    }
  };

/**
 * Updates a specific field in a monitoring record and syncs the changes with the backend.
 * 
 * @param {string} field - The name of the field to update in the monitoring record
 * @param {any} value - The new value to set for the specified field
 * @returns {Promise<void>} A promise that resolves when the update is complete
 * 
 * @throws {Error} Throws an error if the update request fails
 * 
 * @description
 * This function performs the following operations:
 * 1. Creates an updated monitoring object with the new field value
 * 2. Sends a PUT request to update the record in the backend
 * 3. Updates the local state with the new monitoring data
 * 4. Calls the onUpdateMonitoring callback with the updated data
 * 
 * @requires axios
 * @requires localStorage - For retrieving the authentication token
 */
const handleUpdateMonitoring = async (field, value) => {
  console.log(`Updating ${field} for monitoring ${monitoring._id}`);

  const updatedMonitoring = {
    ...monitoring,
    [field]: value,
    lastModification: new Date()
  };

  try {
    const token = localStorage.getItem("token");
    
    await axios.put(`${BACKEND_URL}/updateEdited/monitorings/${monitoring._id}`, updatedMonitoring, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    // Update the monitorings array in the parent component
    const updatedMonitorings = monitorings.map((m) => 
      m._id === monitoring._id ? updatedMonitoring : m
    );
    setMonitorings(updatedMonitorings);

    // Call the callback if provided
    onUpdateMonitoring(monitoring._id, { [field]: value });

  } catch (err) {
    console.error('Error updating monitoring:', err);
    setError("Failed to update monitoring. Please try again.");
  }
};

const handleSaveName = async () => {
  setIsEditingName(false);
  if (editingName !== monitoring.name) {
    await handleUpdateMonitoring('name', editingName);
  }
};

const handleSaveDescription = async () => {
  setIsEditingDescription(false);
  if (editingDescription !== monitoring.description) {
    await handleUpdateMonitoring('description', editingDescription);
  }
};

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = (event) => {
    setAnchorEl(null);
  };

  const handleExpandClick = (event) => {
    setExpandedMonitoring(isExpanded ? null : monitoring.id);
  };

  const handleKeyDown = (e, saveHandler) => {
    if (e.key === 'Enter') {
      saveHandler();
    }
  };

/**
 * Handles the sharing functionality for a monitoring item.
 * Generates a unique sharing code, updates the monitoring object in the backend,
 * updates the local state, and displays the sharing code to the user.
 * 
 * @param {React.SyntheticEvent} event - The event object from the click handler
 * @returns {Promise<void>} A promise that resolves when the sharing process is complete
 * @throws {Error} When there's a failure in updating the monitoring or generating the code
 * 
 * @example
 * <button onClick={handleShareMonitoring}>Share</button>
 */
  const handleShareMonitoring = async (event) => {
    event.stopPropagation();
    const code = generateSharingCode();
    
    try {
        const token = localStorage.getItem("token");
        
        // Create updated monitoring object with the new sharing code
        const updatedMonitoring = {
        ...monitoring,
        sharingCode: code
        };

        // Update in backend
        await axios.put(`${BACKEND_URL}/updateEdited/monitorings/${monitoring._id}`, updatedMonitoring, {
        headers: {
            Authorization: `Bearer ${token}`
        }
        });

        // Update local state
        const updatedMonitorings = monitorings.map((m) => 
        m._id === monitoring._id ? updatedMonitoring : m
        );
        setMonitorings(updatedMonitorings);

        // Show the sharing code
        setSharingCode(code);
        setShowSharingCode(true);

    } catch (err) {
        console.error('Error sharing monitoring:', err);
        setError("Failed to generate sharing code. Please try again.");
    }
  };

/**
 * Removes the sharing code from the current user's redeemed codes list
 * 
 * @async
 * @param {string} monitoringId - The ID of the monitoring to unshare
 * @throws {Error} When there's a failure in removing the sharing code
 * @returns {Promise<void>}
 * 
 * The function:
 * 1. Removes the sharing code from the current user's sharingCodeRedeemed array
 * 2. Reloads the page to reflect the changes
 */
const handleRemoveSharingCode = async (monitoringId) => {
    console.log(`Removing sharing code from user for monitoring ID`, monitoringId);

    try {
      const token = localStorage.getItem("token");
      
      // Remove the sharing code from the current user's redeemed codes
      const response = await axios.put(
        `${BACKEND_URL}/users/${currentUser._id}/remove-code/${monitoring.sharingCode}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      // After removing the code, fetch the monitoring again to see if the code was removed
      const monitoringResponse = await axios.get(
        `${BACKEND_URL}/monitoring/${monitoring._id}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      
      const updatedMonitoring = monitoringResponse.data;
      
      // If the sharing code was removed (either because user was owner or last user with access)
      if (!updatedMonitoring.sharingCode) {
        // Update all monitorings in the state
        const updatedMonitorings = monitorings.map((m) => 
          m._id === monitoring._id ? { ...m, sharingCode: null } : m
        );
        setMonitorings(updatedMonitorings);
        window.location.reload();
      } else {
        // Just update the UI to indicate we've removed our access, but others still have it
        setUsersWhoRedeemed(prevUsers => 
          prevUsers.filter(user => 
            `${user.firstName} ${user.lastName}` !== `${currentUser.firstName} ${currentUser.lastName}`
          )
        );
      }

    } catch (err) {
      console.error('Error removing sharing code:', err);
      setError("Failed to remove sharing code. Please try again.");
    }
};

const handleCloseSnackbar = (event, reason) => {
  if (reason === 'clickaway') {
    return;
  }
  setOpenSnackbar(false);
};

const handleCopySharingCode = async (event) => {
  event.stopPropagation();
  try {
    await navigator.clipboard.writeText(monitoring.sharingCode);
    setOpenSnackbar(true); // Show success message
  } catch (err) {
    console.error('Failed to copy code:', err);
  }
};

  const generateSharingCode = () => {
    // Simulate generating a unique sharing code
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

const WarningDialog = () => (
  <Dialog
    open={warningDialog.open}
    onClose={() => setWarningDialog({ open: false, type: null })}
    onClick={(e) => e.stopPropagation()}
  >
    <DialogTitle>
      {warningDialog.type === 'delete' 
        ? getMessage('warning_delete_monitoring')
        : warningDialog.type === 'deleteAnswers'
        ? getMessage('warning_delete_answers')
        : getMessage('label_stop_sharing')}
    </DialogTitle>
    <DialogContent>
      <DialogContentText>
        {warningDialog.type === 'delete'
          ? getMessage('warning_delete_monitoring_message')
          : warningDialog.type === 'deleteAnswers'
          ? getMessage('warning_delete_answers_message')
          : getMessage('warning_stop_sharing_message')}
      </DialogContentText>
    </DialogContent>
    <DialogActions>
      <Button 
        onClick={() => setWarningDialog({ open: false, type: null })}
      >
        {getMessage('label_cancel')}
      </Button>
      <Button
        color="error"
        onClick={() => {
          if (warningDialog.type === 'delete') {
            handleDeleteMonitoring(monitoring._id);
          } else if (warningDialog.type === 'deleteAnswers') {
            handleDeleteAnswers(monitoring._id);
          } else if (warningDialog.type === 'stopSharing') {
            handleRemoveSharingCode(monitoring._id);
          }
          setWarningDialog({ open: false, type: null });
          handleMenuClose();
        }}
        autoFocus
      >
        {getMessage('label_delete')}
      </Button>
    </DialogActions>
  </Dialog>
);

  return (
    <Card
      sx={{
        width: 280,
        minWidth: 280,
        maxWidth: 280,
        height: 200,
        borderRadius: 2,
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
        },
        cursor: 'pointer',
        bgcolor: isExpanded ? 'action.selected' : 'background.paper',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        position: 'relative',
        overflow: 'visible',
      }}
      onClick={() => setExpandedMonitoring(isExpanded ? null : monitoring._id)}
    >
      <Box
        sx={{
          p: 2,
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: 1.5,
          overflow: 'hidden', // Ajouter cette ligne
          minHeight: 0, // Ajouter cette ligne pour permettre le shrink
        }}
      >
        {/* Header with menu */}
        <Box
        sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            width: '100%',
        }}
        >
        <Box sx={{ 
            display: 'flex', 
            alignItems: 'center',
            gap: 1
        }}>
            {isEditingName ? (
            <TextField
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                onBlur={handleSaveName}
                onKeyDown={(e) => handleKeyDown(e, handleSaveName)}
                size="small"
                fullWidth
                inputProps={{ maxLength: 35 }}
                sx={{ fontWeight: 600, fontSize: '0.9rem' }}
                autoFocus
            />
            ) : (
            <Tooltip 
                title={getMessage("label_click_to_edit_name")}
                placement="top" 
                arrow>
                <Typography
                variant="subtitle1"
                sx={{
                    fontWeight: 600,
                    maxWidth: '150px',
                    fontSize: '0.9rem',
                    lineHeight: 1.2,
                    cursor: 'pointer',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                }}
                onClick={() => setIsEditingName(true)}
                >
                {monitoring.name}
                </Typography>
            </Tooltip>
            )}
            {monitoring.sharingCode && usersWhoRedeemed.length > 0 && (
            <Tooltip 
                title={generateTooltipContent()}
                placement="top"
                arrow
                PopperProps={{
                    sx: {
                    '& .MuiTooltip-tooltip': {
                        bgcolor: 'background.paper',
                        color: 'text.primary',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                        borderRadius: 1,
                        p: 0,
                    },
                    '& .MuiTooltip-arrow': {
                        color: 'background.paper',
                    }
                    }
                }}
                enterDelay={200}
                leaveDelay={200}
                >
                  <Chip
                  label={getMessage("label_shared")}
                  size="small"
                  icon={<Users size={14}/>}
                  sx={{
                      position: 'absolute',
                      top: 0,
                      right: 55,
                      backgroundColor: '#E8F0FE',
                      borderRadius: '1px', 
                      color: '#1967D2',
                      fontWeight: 500,
                      fontSize: '0.75rem',
                      height: '24px',
                      '& .MuiChip-label': {
                          px: 1,
                      },
                      '& .MuiChip-icon': {
                          color: '#1967D2',
                      },
                  }}
                  />
            </Tooltip>
            )}
        </Box>
        <IconButton
            size="small"
            onClick={handleMenuClick}
            sx={{
            padding: 0.5,
            '&:hover': { backgroundColor: 'action.hover' },
            }}
        >
            <MoreVertIcon fontSize="small" />
        </IconButton>
        <Menu 
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            onClick={(e) => e.stopPropagation()}
            paper={{
                elevation: 3,
                sx: { minWidth: 160 },
            }}
            >
            <Tooltip 
              title={currentUser?.sandbox ? <Typography sx={{ fontSize: '0.9rem' }}>{getMessage("sandbox_user_cannot_copy")}</Typography> : ""}
              placement="left"
            >
              <div>
                <MenuItem
                  onClick={(e) => {
                    handleCopyMonitoring(monitoring._id);
                    handleMenuClose(e);
                  }}
                  disabled={currentUser?.sandbox}
                >
                  <ContentCopyIcon sx={{ mr: 1.5, fontSize: 18 }} />
                  <Typography variant="body2">
                    {getMessage("label_copy")}
                  </Typography>
                </MenuItem>
              </div>
            </Tooltip>
            {currentUser._id === monitoring.userId && (
                <MenuItem
                    onClick={() => {
                        setWarningDialog({ open: true, type: 'delete' });
                    }}
                    sx={{ color: 'error.main' }}
                >
                    <DeleteIcon sx={{ mr: 1.5, fontSize: 18 }} />
                    <Typography variant="body2">{getMessage("label_delete")}</Typography>
                </MenuItem>
            )}
            {currentUser._id === monitoring.userId && (
                <MenuItem
                    onClick={() => {
                        setWarningDialog({ open: true, type: 'deleteAnswers' });
                    }}
                    sx={{ color: 'error.main' }}
                >
                    <DeleteIcon sx={{ mr: 1.5, fontSize: 18 }} />
                    <Typography variant="body2">{getMessage("label_delete_all_answers")}</Typography>
                </MenuItem>
            )}
            </Menu>
        </Box>

        {/* Description */}
        {isEditingDescription ? (
          <TextField
            value={editingDescription}
            onChange={(e) => setEditingDescription(e.target.value)}
            onBlur={handleSaveDescription}
            onKeyDown={(e) => handleKeyDown(e, handleSaveDescription)}
            size="small"
            multiline
            rows={2}
            fullWidth
            sx={{ fontSize: '0.825rem' }}
            autoFocus
          />
        ) : (
          <Tooltip 
            title={getMessage("label_click_to_edit_description")}
            placement="top" 
            arrow> 
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                fontSize: '0.825rem',
                lineHeight: 1.4,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                cursor: 'pointer',
                minHeight: '2.8em',
              }}
              onClick={() => setIsEditingDescription(true)}
            >
              {monitoring.description}
            </Typography>
          </Tooltip>
        )}

        {/* Dates */}
        <Box
          sx={{
            display: 'flex',
            gap: 2,
            mb: 2,
            fontSize: '0.75rem',
            color: 'text.secondary',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <CalendarDays size={12} sx={{ fontSize: '0.875rem' }} />
            <Typography variant="caption">{formatDate(monitoring.creationDate)}</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Edit2 size={12} sx={{ fontSize: '0.875rem' }} />
            <Typography variant="caption">
              {formatDate(monitoring.lastModification || monitoring.creationDate)}
            </Typography>
          </Box>
        </Box>

        {/* Share Button or Sharing Code */}
        {monitoring.sharingCode ? (
        <Box
            sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            }}
        >
            {currentUser.userStatus === UserType.TEACHER_TRAINER && (
              <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    bgcolor: 'grey.50',
                    border: '1px solid',
                    borderColor: 'grey.200',
                    borderRadius: 1,
                    pl: 1.5,
                    pr: 0.5,
                    py: 0.5,
                    width: '120px',
                }}
              >
                <Typography
                    variant="body2"
                    sx={{
                    flex: 1,
                    fontSize: '0.825rem',
                    fontFamily: 'monospace',
                    }}
                >
                    {monitoring.sharingCode}
                </Typography>
                <Tooltip 
                    title={getMessage("label_copy_code")}>
                    <IconButton
                    size="small"
                    onClick={handleCopySharingCode}
                    sx={{
                        padding: 0.5,
                        '&:hover': { bgcolor: 'grey.100' },
                    }}
                    >
                    <ContentCopyIcon sx={{ fontSize: '0.875rem' }} />
                    </IconButton>
                </Tooltip>
              </Box>
            )}

            {monitoring.sharingCode && usersWhoRedeemed.length > 0 && (
            
              <Tooltip title={getMessage("label_stop_sharing")}>
              <IconButton
                  onClick={(e) => {
                  e.stopPropagation();
                  setWarningDialog({ open: true, type: 'stopSharing' });
                  }}
                  sx={{
                  padding: '4px',
                  border: '1px solid',
                  borderColor: 'error.light',
                  color: 'error.main',
                  '&:hover': {
                      bgcolor: 'error.lighter',
                      borderColor: 'error.main',
                  },
                  }}
              >
                  <Users size={14} />
              </IconButton>
              </Tooltip>
            )}
        </Box>
        ) : (
        currentUser.userStatus === UserType.TEACHER_TRAINER && (
          <IconButton
              onClick={handleShareMonitoring}
              sx={{
              border: '1px solid',
              borderColor: 'grey.400',
              borderRadius: '6px',
              p: '4px 8px',
              display: 'flex',
              gap: 1,
              height: '32px',
              width: '120px',
              '& .MuiSvgIcon-root': { fontSize: 16, color: 'grey.700' },
              '& .MuiTypography-root': { fontSize: 12, color: 'grey.700' },
              '&:hover': {
                  bgcolor: 'grey.100',
                  '& .MuiSvgIcon-root, .MuiTypography-root': { color: 'grey.900' },
              },
              }}
          >
              <ShareIcon />
              <Typography>{getMessage("label_share")}</Typography>
          </IconButton>
        )
        )}

        {/* Expand/Collapse Button */}
        <IconButton
          size="small"
          onClick={handleExpandClick}
          sx={{
            position: 'absolute',
            bottom: 4,
            right: 4,
            padding: 0.5,
            bgcolor: 'background.paper',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            '&:hover': {
              bgcolor: 'background.paper',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
            },
          }}
        >
          {isExpanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
        </IconButton>
      </Box>
      <WarningDialog />
      <Snackbar 
        open={openSnackbar}
        autoHideDuration={2000}
        onClose={handleCloseSnackbar}
        onClick={(e) => e.stopPropagation()}
        >
        <Alert 
            onClose={handleCloseSnackbar} 
            severity="success" 
            sx={{ width: '100%' }}
        >
            {getMessage("label_copied")}
        </Alert>
        </Snackbar>
    </Card>
  );
};

export default MonitoringCard;
