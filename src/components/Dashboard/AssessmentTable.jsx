import React, { useState, useEffect } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Checkbox,
  IconButton,
  Paper,
  Menu,
  MenuItem,
  TablePagination,
  Tooltip,
  ToggleButton,
  ToggleButtonGroup,
  Divider,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Button
} from '@mui/material';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import {
  MoreVertical,
  Copy,
  User,
  Users,
  CalendarDays,
  Edit2,
  Eye,
  GripVertical,
  X
} from 'lucide-react';
import { Delete as DeleteIcon } from '@mui/icons-material';
import ShareIcon from '@mui/icons-material/Share';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import axios from "axios";
import { BACKEND_URL } from "../../config";
import { useNavigate, useLocation } from 'react-router-dom';


//dependencies
import { useMessageService } from '../../services/MessageService';
import { useAuthUser } from '../../contexts/AuthUserContext';
import { AssessmentType, OptionTypes, UserType } from '../../utils/enums';
import { localizeAssessmentType } from '../../utils/ObjectsUtils';

const AssessmentTable = ({ 
    assessments,
    setAssessments,
    monitorings,
    currentMonitoringId,
    currentAssessmentId,
    setCurrentAssessmentId,
    setIsOpen,
    setOpenAssessmentsCount,
    selectedAssessmentsIds,
    setSelectedAssessmentsIds
}) => {
  
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(-1);
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [activeAssessment, setActiveAssessment] = useState(null);
  const [ownerFilter, setOwnerFilter] = useState('all');
  const [sortConfig, setSortConfig] = useState({ key: 'position', direction: 'asc' });
  const { currentUser } = useAuthUser();
  const { getMessage } = useMessageService();
    const [editWarningDialog, setEditWarningDialog] = useState({ 
        open: false, 
        assessment: null,
        type: null // 'delete' or 'deleteAnswers'
    });  
  const [editingCell, setEditingCell] = useState(null);
  const [editingCellValue, setEditingCellValue] = useState(null);
  const [newAssessmentName, setNewAssessmentName] = useState('');
  const [newAssessmentType, setNewAssessmentType] = useState('');
  const [assessmentOwners, setAssessmentOwners] = useState({});
  const [error, setError] = useState(null);

  const isOwner = (assessment) => {
    console.log("----------------");
    console.log("isOwner called for assessment:", assessment);
    console.log("Current state:", {
        currentUser,
        assessment,
        isAssessmentValid: !!assessment,
        doesAssessmentHaveUserId: !!assessment?.userId,
        userId: assessment?.userId,
        currentUserId: currentUser?._id
    });

    // If there's no userId in the assessment, allow editing
    if (!assessment?.userId) {
        console.log("No userId found, considering as owned by current user");
        console.log("----------------");
        return true;
    }

    // Otherwise, check if the current user owns it
    const isOwned = assessment.userId === currentUser._id;
    console.log("Ownership check result:", isOwned);
    console.log("Assessment userId:", assessment.userId);
    console.log("Current user id:", currentUser._id);
    console.log("----------------");
    return isOwned;
};

  // Whether the current user owns the current monitoring
  const isCurrentMonitoringOwner = () => {
    const monitoring = monitorings.find(m => m._id === currentMonitoringId);
    return monitoring ? monitoring.userId === currentUser._id : false;
  };

  const statusToOptions = {
        Draft: [OptionTypes.EDIT, OptionTypes.PREVIEW, OptionTypes.OPEN, OptionTypes.COPY, OptionTypes.DELETE, OptionTypes.DELETE_ALL_ANSWERS],
        Open: [OptionTypes.CLOSE, OptionTypes.EDIT, OptionTypes.PREVIEW, OptionTypes.COPY, OptionTypes.DELETE, OptionTypes.DELETE_ALL_ANSWERS],
        Close: [OptionTypes.OPEN, OptionTypes.COPY, OptionTypes.DELETE, OptionTypes.DELETE_ALL_ANSWERS],
      };

  const handleSort = (key) => {
    setSortConfig({
      key,
      direction: sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc'
    });
  };

  /**
 * Fetches owner information for each assessment from the backend API.
 * Maps through assessments array to get user details for each assessment's userId.
 * Results are stored in assessmentOwners state as a map of userId to owner info.
 * 
 * @async
 * @function fetchOwners
 * @throws {Error} Logs error to console if API request fails
 * 
 * Requirements:
 * - Valid JWT token must be present in localStorage
 * - assessments array must be defined with valid userIds
 * - Backend API endpoint must be available at ${BACKEND_URL}/users/:userId
 * 
 * Side effects:
 * - Updates assessmentOwners state via setAssessmentOwners
 * - Makes HTTP requests to backend API
 */
  useEffect(() => {
  const fetchOwners = async () => {
    try {
      const token = localStorage.getItem("token");
      const ownerPromises = assessments.map(assessment => {
        if (!assessment.userId) return null;
        return axios.get(
          `${BACKEND_URL}/users/${assessment.userId}`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        ).then(response => ({
          userId: assessment.userId,
          ownerInfo: response.data
        }));
      });

      const results = await Promise.all(ownerPromises.filter(Boolean));
      const ownersMap = {};
      results.forEach(result => {
        if (result && result.ownerInfo) {
          ownersMap[result.userId] = result.ownerInfo;
        }
      });
      setAssessmentOwners(ownersMap);
    } catch (error) {
      console.error('Error fetching assessment owners:', error);
    }
  };

  fetchOwners();
}, [assessments]);

/**
 * Toggles the selection of an assessment ID.
 * If the ID is already selected, it removes it from the selection.
 * If the ID is not selected, it adds it to the selection.
 *
 * @param {string} id - The ID of the assessment to toggle.
 */
  const handleSelect = (id) => {
  setSelectedAssessmentsIds((prev) => {
    if (prev.includes(id)) {
      // Remove the assessment if already selected (preserve order)
      return prev.filter((item) => item !== id);
    } else {
      // Append the new selection at the end (preserve click order)
      return [...prev, id];
    }
  });
};


  const handleClose = () => {
  setMenuAnchorEl(null); // Assuming it should close a menu
};


  const renderNumberFieldCell = (params, field) => {
    // Only the owner can edit and it should not be open
    const canEdit = isOwner(params.row) && params.row.status !== 'Open';  

    return canEdit ? (
        <Tooltip title="Click to modify the session number" placement="top">
            <Box sx={{ width: '100%', cursor: 'pointer' }}>
                {editingCell?.id === params.id && editingCell?.field === field ? (
                    <ClickAwayListener onClickAway={() => handleUpdateAssessment(params.row._id, field, editingCellValue)}>
                        <TextField
                            type="number"
                            value={editingCellValue}
                            onChange={(e) => {
                                const value = Math.max(1, parseInt(e.target.value, 10) || 1);
                                setEditingCellValue(value);
                            }}
                            autoFocus
                            inputProps={{ 
                                min: 1,
                                style: { textAlign: 'center' }
                            }}
                            sx={{
                                '& .MuiInputBase-input': {
                                    textAlign: 'center',
                                    padding: '4px 8px',
                                },
                                width: '100%',
                                '& .MuiOutlinedInput-root': {
                                    '& fieldset': {
                                        borderColor: 'primary.main',
                                    },
                                },
                            }}
                            onKeyDown={(e) => {
                                e.stopPropagation();
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleUpdateAssessment(params.row._id, field, editingCellValue);
                                }
                            }}
                            onClick={(e) => e.stopPropagation()}
                        />
                    </ClickAwayListener>
                ) : (
                    <Typography
                        onClick={() => {
                            setEditingCell({ id: params.id, field });
                            setEditingCellValue(params.value);
                        }}
                        sx={{ 
                            width: '100%', 
                            textAlign: 'center',
                            padding: '4px 8px',
                            borderRadius: 1,
                            '&:hover': {
                                backgroundColor: 'action.hover',
                            }
                        }}
                    >
                        {params.value}
                    </Typography>
                )}
            </Box>
        </Tooltip>
    ) : (
        <Typography sx={{ width: '100%', textAlign: 'center', padding: '4px 8px' }}>
            {params.value}
        </Typography>
    );
};
  
    const renderTextFieldCell = (params, field) => {
    
    // Only the owner can edit and it should not be open
    const canEdit = isOwner(params.row) && params.row.status !== 'Open';

    return canEdit ? (
        editingCell?.id === params.id && editingCell?.field === field ? (
        <ClickAwayListener onClickAway={() => handleUpdateAssessment(params.row._id, field, editingCellValue)}>
            <TextField
            value={editingCellValue}
            onChange={(e) => {
                const cleanedValue = e.target.value.replace(/\n/g, "");
                setEditingCellValue(cleanedValue);
            }}
            autoFocus
            fullWidth
            size="small"
            onKeyDown={(e) => {
                e.stopPropagation();
                if (e.key === 'Enter') {
                e.preventDefault();
                handleUpdateAssessment(params.row._id, field, editingCellValue);
                }
            }}
            />
        </ClickAwayListener>
        ) : (
        <Box 
            onClick={() => {
            setEditingCell({ id: params.id, field });
            setEditingCellValue(params.value);
            }}
            sx={{ 
            cursor: 'pointer',
            '&:hover': {
                backgroundColor: 'action.hover',
                borderRadius: 1,
            },
            padding: '4px'
            }}
        >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography 
                    sx={{ 
                        maxWidth: '230px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                    }}
                >
                    {params.value}
                </Typography>
            </Box>
        </Box>
        )
    ) : (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography 
                sx={{ 
                    maxWidth: '230px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                }}
            >
                {params.value}
            </Typography>
        </Box>
    );
};

    /**
     * Renders a checkbox cell for a table row.
     *
     * @param {Object} params - The parameters for the cell renderer.
     * @param {Object} params.row - The data for the current row.
     * @param {string} params.row._id - The unique identifier for the row.
     * @param {string} params.row.status - The status of the row.
     * @returns {JSX.Element} The rendered checkbox component.
     */
    const renderCheckboxCell = (params) => {
    if (!params?.row) return null; // Guard clause for header
    
    // Find the full assessment object to get all properties
    const assessment = assessments.find(a => a._id === params.row._id);
    
    // Find the monitoring that contains this assessment
    const monitoring = monitorings.find(m => m._id === assessment?.monitoringId);
    
    // Check if user is assessment owner or if assessment owner is monitoring owner
    const isAssessmentOwner = !assessment?.userId || assessment.userId === currentUser._id;
    const isAssessmentOwnedByMonitoringOwner = assessment?.userId === monitoring?.userId;
    const canShare = isAssessmentOwner || isAssessmentOwnedByMonitoringOwner;
    
    return (
        <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
            <Tooltip title={!canShare ? getMessage('error_cannot_share_unowned_assessments') : ''}>
                <span>
                    <Checkbox
                        checked={selectedAssessmentsIds.includes(params.row._id)}
                        onChange={(event) => {
                            event.stopPropagation();
                            if (canShare) {
                                handleSelect(params.row._id);
                            }
                        }}
                        disabled={
                            !assessment ||
                            assessment.status === 'Draft' || 
                            assessment.status === 'Close' ||
                            !canShare
                        }
                        size="small"
                        sx={{ padding: '4px' }}
                    />
                </span>
            </Tooltip>
        </Box>
    );
};

/**
 * Renders an assessment type badge with an icon and display name
 * @param {Object} assessment - The assessment object containing type information
 * @param {string} assessment.type - The type of assessment to render
 * @returns {JSX.Element} A Box component containing the styled assessment type display
 * 
 * @description
 * The function creates a styled badge for different assessment types with:
 * - Custom color scheme per assessment type
 * - Appropriate icon
 * - Localized display name
 * - Hover effects
 * - Consistent styling (border, padding, etc)
 * 
 * If the assessment type is not found in typeConfigs, falls back to default styling
 * Uses getMessage for localization and localizeAssessmentType as fallback
 */
const renderAssessmentType = (assessment) => {
  const type = assessment.type;
  let displayName = "";
  let config = {};

  const typeConfigs = {
  [AssessmentType.TRAINEE_CHARACTERISTICS]: {
    color: '#2196F3',  // Bright Blue
    icon: '👥',
    name: 'label_assessment_type_trainee_characteristics'
  },
  [AssessmentType.TRAINING_CHARACTERISTICS]: {
    color: '#9C27B0',  // Purple
    icon: '📚',
    name: 'label_assessment_type_training_characteristics'
  },
  [AssessmentType.IMMEDIATE_REACTIONS]: {
    color: '#FF9800',  // Orange
    icon: '⚡',
    name: 'label_assessment_type_immediate_reactions'
  },
  [AssessmentType.LEARNING]: {
    color: '#4CAF50',  // Green
    icon: '🎯',
    name: 'label_assessment_type_learning'
  },
  [AssessmentType.ORGANIZATIONAL_CONDITIONS]: {
    color: '#E91E63',  // Pink
    icon: '🏢',
    name: 'label_assessment_type_organizational_conditions'
  },
  [AssessmentType.BEHAVIORAL_CHANGES]: {
    color: '#00BCD4',  // Cyan
    icon: '🔄',
    name: 'label_assessment_type_behavioral_changes'
  },
  [AssessmentType.SUSTAINABILITY_CONDITIONS]: {
    color: '#673AB7',  // Deep Purple
    icon: '♻️',
    name: 'label_assessment_type_sustainability_conditions'
  },
  [AssessmentType.STUDENT_CHARACTERISTICS]: {
    color: '#F44336',  // Red
    icon: '👨‍🎓',
    name: 'label_assessment_type_student_characteristics'
  },
  [AssessmentType.STUDENT_LEARNING_OUTCOMES]: {
    color: '#009688',  // Teal
    icon: '📊',
    name: 'label_assessment_type_student_learning_outcomes'
  }
};

  config = typeConfigs[type] || { color: '#95A5A6', icon: '📋', name: type };
  displayName = getMessage(config.name) || localizeAssessmentType(type, getMessage);

  return (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        padding: '6px 12px',
        borderRadius: '8px',
        border: '1px solid',
        borderColor: config.color,
        backgroundColor: `${config.color}10`,
        color: config.color,
        transition: 'all 0.2s ease',
        cursor: 'default',
        '&:hover': {
          backgroundColor: `${config.color}20`,
        }
      }}
    >
      <Typography
        component="span"
        sx={{
          fontSize: '16px',
          lineHeight: 1,
        }}
      >
        {config.icon}
      </Typography>
      <Typography
        sx={{
          fontSize: '13px',
          fontWeight: 500,
          lineHeight: '1.2',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          maxWidth: '140px'
        }}
      >
        {displayName}
      </Typography>
    </Box>
  );
};

/**
 * Renders the owner cell in the assessment table based on assessment ownership.
 * 
 * @param {Object} assessment - The assessment object containing ownership information
 * @param {string} [assessment.userId] - The ID of the user who owns the assessment
 * @returns {JSX.Element} A Box component displaying owner information with an icon
 * 
 * The function handles three cases:
 * 1. No userId specified - displays current user as owner with single user icon
 * 2. Assessment owned by current user - displays current user with single user icon 
 * 3. Assessment owned by another user - displays owner name with multiple users icon
 * 
 * @requires currentUser - Global/context object containing current user details
 * @requires assessmentOwners - Object mapping user IDs to user details
 * @requires getMessage - Function to get localized messages
 */
const renderOwnerCell = (assessment) => {
  // If no userId, display information not available
  if (!assessment.userId) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
            {''}
        </Typography>
      </Box>
    );
  }

  // If it's owned by current user
  if (assessment.userId === currentUser._id) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <User size={14} />
        <Typography variant="body2">
          {`${currentUser.firstName} ${currentUser.lastName}`}
        </Typography>
      </Box>
    );
  }

  // If it's owned by someone else
  const owner = assessmentOwners[assessment.userId];
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Users size={14} />
      <Typography variant="body2">
        {owner ? `${owner.firstName} ${owner.lastName}` : ''}
      </Typography>
    </Box>
  );
};

/**
 * Handles the editing of an assessment by changing its status to 'Draft' and navigating to the creation page
 * @param {Object} assessment - The assessment object to be edited
 * @param {string} assessment._id - The unique identifier of the assessment
 * @param {string} assessment.type - The type of the assessment
 * @param {string} assessment.name - The name of the assessment
 */
const handleEditAssessment = (assessment) => {

   console.log("assessment:", assessment._id)
  // Change status to 'Draft' when editing
  handleAssessmentStatusChange(assessment._id, 'Draft');

  
  
  navigate('/createSurvey', {
       state: {
           assessmentType: assessment.type,
           assessmentName: assessment.name,
           assessmentId: assessment._id
       },
   });
};

/**
 * Navigates to the assessment preview page with the selected assessment data
 * @param {Object} assessment - The assessment object to be previewed
 * @function handleAssessmentPreview
 */
const handleAssessmentPreview = (assessment) => {
   navigate(`/previewSurvey`, {
       state: { assessment },
   });
};

  const handleMenuOpen = (event, assessment) => {
    event.stopPropagation();
    setMenuAnchorEl(event.currentTarget);
    setActiveAssessment(assessment);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setActiveAssessment(null);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return getMessage('table_assessments_today');
    }
    if (date.toDateString() === yesterday.toDateString()) {
      return getMessage('table_assessments_yesterday');
    }
    return date.toLocaleDateString('en-GB', { 
      month: 'short',
      day: 'numeric'
    });
  };

  /**
     * Updates the specified assessment with a new value for the provided field and saves the changes to the server.
     * 
     * @param {string} assessmentId - The unique identifier of the assessment to be updated.
     * @param {string} field - The field of the assessment to be updated.
     * @returns {Promise<void>} A promise that resolves once the assessment is updated and saved to the server.
    */
    const handleUpdateAssessment = async (assessmentId, field, value) => {
    try {
        // Get the value to update - either from parameter or editing state
        const valueToUpdate = value ?? editingCellValue;
        
        // Create updated assessment object
        const updatedAssessments = assessments.map((assessment) => {
            if (assessment._id === assessmentId) {
                return { 
                    ...assessment, 
                    [field]: valueToUpdate,
                    lastModificationDate: new Date()
                };
            }
            return assessment;
        });
        
        // Get the specific assessment that was updated
        const updatedAssessment = updatedAssessments.find(assessment => assessment._id === assessmentId);
        
        if (!updatedAssessment) {
            throw new Error('Assessment not found');
        }

        // Update on server
        const token = localStorage.getItem("token");
        await axios.put(
            `${BACKEND_URL}/updateEdited/assessments/${assessmentId}`, 
            updatedAssessment, 
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );

        // Update local state
        setAssessments(updatedAssessments);
        
        // Clear editing state
        setEditingCell(null);
        setEditingCellValue('');

    } catch (error) {
        console.error('Error updating assessment:', error);
    }
};

    /**
     * Copy the specified assessment and save it to the server.
     * 
     * @param {string} assessmentId - The unique identifier of the assessment to be updated.
     * @returns {Promise<void>} A promise that resolves once the assessment is copied and saved to the server.
    */
    const handleCopyAssessment = async (assessmentId) => {
      if (currentUser?.sandbox) {
        setError(getMessage("sandbox_user_cannot_copy"));
        return;
      }

      // get the assessment to copy
      const assessmentToCopy = assessments.find(assessment => assessment._id === assessmentId._id);
  
      // if there is one
      if (assessmentToCopy) {

        try {
          // Retrieve token
          const token = localStorage.getItem("token");

          // Create a new assessment object with necessary modifications for the server
          const newAssessment = {
            ...assessmentToCopy,
            userId: currentUser._id,
            day: assessmentToCopy.day,
            name: `${assessmentToCopy.name} (copy)`,
            status: 'Draft',
            creationDate: new Date(Date.now()), 
            lastModificationDate: new Date(Date.now()),
            options: statusToOptions["Draft"],
          };

          // Attempt to save the new assessment (copied)
          const response = await axios.post(`${BACKEND_URL}/assessment`, newAssessment, {
            headers: { 
              Authorization: `Bearer ${token}` 
            }
          });

          // Use server-created assessment
          const copiedAssessment = response.data;
          // save the current assessment ID
          setCurrentAssessmentId(copiedAssessment._id);
          // Add new assessment to rows
          setAssessments(prevAssessments => [...prevAssessments, copiedAssessment]);

          // Reset form and close dialog
          setNewAssessmentName('');
          setNewAssessmentType('');
          handleClose();
        } catch (error) {
          console.error('Error copying assessment:', error);
          setError("Failed to copy assessment. Please try again.");
        }
      }
    };
  
    /**
     * Deletes an assessment and its associated answers, updates the state and reassigns positions of remaining assessments.
     *
     * @param {string} assessmentsId - The ID of the assessment to be deleted.
     * @returns {void} Updates local state by recalculating positions within the current monitoring only; no server resequencing is performed here.
     */
    const handleDeleteAssessment = async (assessmentsId) => {

        handleDeleteAnswers(assessmentsId);
        console.log("deleting the assessment and all answers", assessmentsId);

        // DELETE the assessment on the server
        try {
            const token = localStorage.getItem("token");
            await axios.delete(`${BACKEND_URL}/assessment/${assessmentsId}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            console.log("Assessment deleted successfully");
        } catch (err) {
            console.error(err);
        }

        // Refetch authoritative positions from server and update local state
        try {
            const token = localStorage.getItem("token");
            const { data: currentMonitoringAssessments } = await axios.get(
                `${BACKEND_URL}/assessments/${currentMonitoringId}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            // Replace the current monitoring's assessments with the freshly fetched ones
            const otherMonitoringAssessments = assessments.filter(
                a => String(a.monitoringId) !== String(currentMonitoringId)
            );
            setAssessments([
                ...otherMonitoringAssessments,
                ...(currentMonitoringAssessments || [])
            ]);
        } catch (err) {
            console.error("Error refetching assessments after delete:", err);
        }
    };

    /**
     * Handles the deletion of the answers from an assessment 
     * sending a DELETE request to the server to delete all answers associated to a given assessment.
     * 
     * @returns {Promise<void>} A promise that resolves once the answers from as assessment are deleted from the server.
     */
    const handleDeleteAnswers = async (assessmentId) => {

      console.log("delete all answers from assessment", assessmentId);

      // DELETE all answers associated with this monitoring for the currend userId
      try {
        const token = localStorage.getItem("token");
        await axios.delete(`${BACKEND_URL}/assessment/${assessmentId}/answers/${currentUser._id}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        console.log("Every answers from this assessment deleted successfully");
      } catch (err) {
        console.error(err);
      }
    }

/**
   * Asynchronously updates the status of a specific assessment and applies corresponding options based on the new status.
   *
   * @param {string} assessmentId - The unique identifier of the assessment to be updated.
   * @param {string} newStatus - The new status to apply to the assessment (e.g., 'Draft', 'Open', 'Close').
   */
  const handleAssessmentStatusChange = async (assessmentId, newStatus) => {

    // Update assessments with new status and options
    const updatedAssessments = assessments.map(assessment => {
      if (assessment._id === assessmentId) {
        const options = statusToOptions[newStatus] || []; // Default to an empty array if status is unknown
        return { ...assessment, status: newStatus, options };
      }
      return assessment;
    });
  
    // Update the server-side data
    try {
      const rowToUpdate = updatedAssessments.find(row => row._id === assessmentId);
      const token = localStorage.getItem("token");
      await axios.put(`${BACKEND_URL}/updateEdited/assessments/${assessmentId}`, rowToUpdate, {
          headers: {
              Authorization: `Bearer ${token}`
          }
      });

      // save the assessments state
      setAssessments(updatedAssessments);

    } catch (err) {
        console.error(err);
    }
  };

  const handleStatusClick = (assessment) => {
  if (!isOwner(assessment)) {
    console.log("Status change rejected - not owner");
    return;
  }
  
  let newStatus;
  switch (assessment.status) {
    case 'Draft':
      newStatus = 'Open';
      break;
    case 'Open':
      newStatus = 'Close';
      break;
    case 'Close':
      newStatus = 'Draft';
      break;
    default:
      return;
  }

  handleAssessmentStatusChange(assessment._id, newStatus);
};

  const filteredAssessments = assessments.filter(assessment => {
  // Convert both IDs to strings for proper comparison
  const assessmentMonitoringId = String(assessment.monitoringId);
  const currentId = String(currentMonitoringId);
  
  // First filter by current monitoring
  if (assessmentMonitoringId !== currentId) return false;
  
  // Then filter by owner
  if (ownerFilter === 'mine') 
        // Include both assessments owned by current user AND assessments with no userId
        return !assessment.userId || assessment.userId === currentUser._id; 
  if (ownerFilter === 'others') 
       // Only include assessments with a userId that doesn't match current user
       return assessment.userId && assessment.userId !== currentUser._id;
  return true;
});

  const sortedAssessments = [...filteredAssessments].sort((a, b) => {
    if (sortConfig.key === 'position') {
      return sortConfig.direction === 'asc'
        ? (a.position || 0) - (b.position || 0) // Handle null/undefined positions
        : (b.position || 0) - (a.position || 0);
    }
    if (sortConfig.key === 'date') {
      return sortConfig.direction === 'asc' 
        ? new Date(a.creationDate) - new Date(b.creationDate)
        : new Date(b.creationDate) - new Date(a.creationDate);
    }
    // Fallback for other string-based sorting keys
    const valA = String(a[sortConfig.key] || ''); // Handle potential undefined properties
    const valB = String(b[sortConfig.key] || '');
    return sortConfig.direction === 'asc'
      ? valA.localeCompare(valB)
      : valB.localeCompare(valA);
  });

  // Allow drag and drop only when the view is compatible with resequencing
  const canUseDragAndDrop = () => (
    // 1) Ownership of current monitoring
    isCurrentMonitoringOwner() &&
    // 2) View constraints
    (
      sortConfig.key === 'position' &&
      sortConfig.direction === 'asc' &&
      ownerFilter === 'all' &&
      rowsPerPage === -1
    )
  );

  // Switch the view to allow drag and drop
  const enableReorderView = () => {
    setOwnerFilter('all');
    setSortConfig({ key: 'position', direction: 'asc' });
    setRowsPerPage(-1);
  };

  const handleDragEnd = async (result) => {
    if (!result.destination) return;

    // Build the new order (IDs only) for the current monitoring
    const currentMonitoringAssessments = assessments
      .filter(assessment => assessment.monitoringId === currentMonitoringId)
      .sort((a, b) => a.position - b.position);

    const [movedAssessment] = currentMonitoringAssessments.splice(result.source.index, 1);
    currentMonitoringAssessments.splice(result.destination.index, 0, movedAssessment);

    const orderedAssessmentIds = currentMonitoringAssessments.map(assessment => assessment._id);

    // Persist new order to server, then refetch authoritative data and update local state
    try {
        const token = localStorage.getItem("token");
        await axios.put(
          `${BACKEND_URL}/assessments/${currentMonitoringId}/resequence`,
          { orderedAssessmentIds },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const { data: refreshedCurrentMonitoringAssessments } = await axios.get(
          `${BACKEND_URL}/assessments/${currentMonitoringId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const otherMonitoringAssessments = assessments.filter(
          a => String(a.monitoringId) !== String(currentMonitoringId)
        );
        setAssessments([
          ...otherMonitoringAssessments,
          ...(refreshedCurrentMonitoringAssessments || [])
        ]);
    } catch (err) {
        console.error("Error updating positions on server:", err);
    }
};

  return (
    <Paper 
      elevation={0}
      sx={{ 
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        overflow: 'hidden'
      }}
    >
      <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 800, mb: 2 }}>
                {getMessage('label_table_assessment')} { monitorings.find(monitoring => monitoring._id === currentMonitoringId).name}
            </Typography>
            <ToggleButtonGroup
              size="small"
              value={ownerFilter}
              exclusive
              onChange={(e, value) => value && setOwnerFilter(value)}
              aria-label="owner filter"
            >
              <ToggleButton value="all">{getMessage('table_assessment_all')}</ToggleButton>
              <ToggleButton value="mine">{getMessage('table_assessment_mine')}</ToggleButton>
              <ToggleButton value="others">{getMessage('table_assessment_others')}</ToggleButton>
            </ToggleButtonGroup>
          </Box>
        </Box>
      </Box>

      <TableContainer 
        sx={{ 
          maxHeight: 350,
          '&::-webkit-scrollbar': {
            width: '8px',
            height: '8px',
          },
          '&::-webkit-scrollbar-track': {
            background: '#f1f1f1',
            borderRadius: '4px',
          },
          '&::-webkit-scrollbar-thumb': {
            background: '#888',
            borderRadius: '4px',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            background: '#555',
          },
        }}
      >
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="assessments">
            {(provided) => (
              <Table 
                stickyHeader 
                size="small"
                {...provided.droppableProps}
                ref={provided.innerRef}
              >
                <TableHead>
                  <TableRow>
                  <TableCell sx={{ width: 50, padding: '6px 8px' }}>
                      {isCurrentMonitoringOwner() && !canUseDragAndDrop() ? (
                        <Tooltip title={getMessage('tooltip_enable_reorder')}>
                          <span>
                            <IconButton
                              size="small"
                              onClick={enableReorderView}
                              aria-label="enable reorder mode"
                            >
                              <X size={16} />
                            </IconButton>
                          </span>
                        </Tooltip>
                      ) : null}
                    </TableCell>
                    <TableCell sx={{ width: 100, padding: '6px 8px' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, cursor: 'pointer' }}
                            onClick={() => handleSort('day')}>
                        {getMessage('table_assessments_session')}
                        <ArrowUpwardIcon sx={{ fontSize: '0.875rem' }} />
                        <ArrowDownwardIcon sx={{ fontSize: '0.875rem' }} />
                        </Box>
                    </TableCell>
                    <TableCell sx={{ width: '20%', padding: '6px 8px' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, cursor: 'pointer' }}
                            onClick={() => handleSort('name')}>
                        {getMessage('label_name')}
                        <ArrowUpwardIcon sx={{ fontSize: '0.875rem' }} />
                        <ArrowDownwardIcon sx={{ fontSize: '0.875rem' }} />
                        </Box>
                    </TableCell>
                    <TableCell sx={{ width: 180, padding: '6px 8px' }}>
                        {getMessage('table_assessments_type')}
                    </TableCell>
                    <TableCell sx={{ width: 180, padding: '6px 8px' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            {getMessage('table_assessments_owner')}
                        </Box>
                    </TableCell>  
                   <TableCell sx={{ width: 190, padding: '6px 8px' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, cursor: 'pointer' }}
                            onClick={() => handleSort('date')}>
                        {getMessage('table_assessments_dates')}
                        <ArrowUpwardIcon sx={{ fontSize: '0.875rem' }} />
                        <ArrowDownwardIcon sx={{ fontSize: '0.875rem' }} />
                        </Box>
                    </TableCell>        
                    <TableCell sx={{ width: 140, padding: '6px 8px' }}>
                        {getMessage('label_status_assessment')}
                    </TableCell>
                    <TableCell sx={{ width: 100, padding: '6px 8px' }}>
                        {getMessage('label_edit_preview')}
                    </TableCell>
                    <TableCell 
                        padding="checkbox"
                        sx={{ 
                          width: 50,
                          padding: '6px 4px'
                        }}>
                        <ShareIcon sx={{ fontSize: '1.1rem' }} />
                    </TableCell>
                    <TableCell sx={{ width: 120, textAlign: 'center', padding: '6px 8px' }}>
                        {getMessage('table_assessments_more')}
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(rowsPerPage > 0
                        ? sortedAssessments.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                        : sortedAssessments
                      ).map((assessment, index) => (
                      <Draggable 
                        key={assessment._id} 
                        draggableId={assessment._id} 
                        index={index}
                        isDragDisabled={!canUseDragAndDrop()}
                      >
                        {(provided, snapshot) => (
                          <TableRow
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              hover
                              selected={assessments.includes(assessment._id)}
                              sx={{ 
                                  '&:hover': { bgcolor: 'action.hover' },
                                  bgcolor: snapshot.isDragging ? 'action.hover' : (isOwner(assessment) ? 'rgba(25, 118, 210, 0.04)' : 'inherit'),
                                  '& .MuiTableCell-root': {
                                    padding: '4px 8px',
                                    height: '40px'
                                  }
                              }}
                          >
                          <TableCell>
                                {canUseDragAndDrop() ? (
                                  <Box 
                                      {...provided.dragHandleProps}
                                      sx={{ 
                                          display: 'flex', 
                                          justifyContent: 'center',
                                          cursor: 'grab',
                                          opacity: 1
                                      }}
                                  >
                                      <GripVertical size={16} />
                                  </Box>
                                ) : null}
                            </TableCell>    
                            <TableCell>
                              {renderNumberFieldCell({
                                  id: assessment._id,
                                  row: assessment,
                                  value: assessment.day,
                                  field: 'day'
                              }, 'day')}
                              </TableCell>
                            <TableCell sx={{ maxWidth: 250, padding: '6px 8px' }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  {renderTextFieldCell({
                                  id: assessment._id,
                                  row: assessment,
                                  value: assessment.name,
                                  field: 'name'
                                  }, 'name')}
                              </Box>
                              </TableCell>
                            <TableCell>
                              {renderAssessmentType(assessment)}
                            </TableCell>
                            <TableCell>
                              {renderOwnerCell(assessment)}
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                  <Typography
                                  variant="caption"
                                  sx={{
                                      color: 'text.secondary',
                                      fontSize: '0.75rem',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 1
                                  }}
                                  >
                                  <CalendarDays size={12} />
                                  {formatDate(assessment.creationDate)}
                                  </Typography>
                                  {assessment.lastModificationDate && (
                                  <Typography
                                      variant="caption"
                                      sx={{
                                      color: 'text.secondary',
                                      fontSize: '0.75rem',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 1
                                      }}
                                  >
                                      <Edit2 size={12} />
                                      {formatDate(assessment.lastModificationDate)}
                                  </Typography>
                                  )}
                              </Box>
                              </TableCell>
                            <TableCell>
                              <Tooltip title={
                                  isOwner(assessment)
                                      ? getMessage('table_assessment_tooltip_status1') 
                                      : getMessage('table_assessment_tooltip_status2') 
                              }>
                                  <Box
                                  onClick={() => handleStatusClick(assessment)}
                                  sx={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '8px',
                                      padding: '6px 12px',
                                      borderRadius: '8px',
                                      border: '2px solid',
                                      cursor: assessment.userId === currentUser._id ? 'pointer' : 'default',
                                      ...(() => {
                                      switch (assessment.status) {
                                          case 'Open':
                                          return {
                                              borderColor: '#4CAF50',
                                              backgroundColor: '#e8f5e9',
                                              color: '#2e7d32',
                                              '&:hover': assessment.userId === currentUser._id ? {
                                              backgroundColor: '#c8e6c9',
                                              } : {}
                                          };
                                          case 'Draft':
                                          return {
                                              borderColor: '#FF9800',
                                              backgroundColor: '#fff3e0',
                                              color: '#ed6c02',
                                              '&:hover': assessment.userId === currentUser._id ? {
                                              backgroundColor: '#ffe0b2',
                                              } : {}
                                          };
                                          case 'Close':
                                          return {
                                              borderColor: '#F44336',
                                              backgroundColor: '#ffebee',
                                              color: '#d32f2f',
                                              '&:hover': assessment.userId === currentUser._id ? {
                                              backgroundColor: '#ffcdd2',
                                              } : {}
                                          };
                                          default:
                                          return {};
                                      }
                                      })(),
                                      transition: 'all 0.2s ease',
                                  }}
                                  >
                                  <Typography
                                      sx={{
                                      fontSize: '0.8rem',
                                      fontWeight: 600,
                                      lineHeight: '1.2',
                                      letterSpacing: '0.01em'
                                      }}
                                  >
                                      {getMessage(`label_status_${assessment.status.toLowerCase()}`)}
                                  </Typography>
                                  </Box>
                              </Tooltip>
                            </TableCell>
                            <TableCell>
                                <Box sx={{ display: 'flex', gap: 0.5 }}>
                                    {isOwner(assessment) && assessment.status === 'Draft' && (
                                        <Tooltip title={getMessage('label_edit')}>
                                            <IconButton
                                                size="small"
                                                onClick={() => handleEditAssessment(assessment)}
                                                sx={{
                                                    color: 'primary.main',
                                                    padding: '4px',
                                                }}
                                            >
                                                <Edit2 size={16} />
                                            </IconButton>
                                        </Tooltip>
                                    )}
                                    <Tooltip title={getMessage('label_preview')}>
                                        <IconButton
                                            size="small"
                                            onClick={() => handleAssessmentPreview(assessment)}
                                            sx={{
                                                color: 'info.main',
                                                padding: '4px',
                                            }}
                                        >
                                            <Eye size={16} />
                                        </IconButton>
                                    </Tooltip>
                                </Box>
                            </TableCell>
                            <TableCell padding="checkbox" sx={{ padding: '0 4px' }}>
                                {renderCheckboxCell({ 
                                    row: {
                                        _id: assessment._id,
                                        status: assessment.status
                                    }
                                })}
                            </TableCell>
                            <TableCell align="center">
                                <IconButton
                                  size="small"
                                  onClick={(e) => handleMenuOpen(e, assessment)}
                                >
                                  <MoreVertical size={16} />
                                </IconButton>
                              </TableCell>
                          </TableRow>
                        )}
                      </Draggable>
                  ))}
                  {provided.placeholder}
                </TableBody>
              </Table>
            )}
          </Droppable>
        </DragDropContext>
      </TableContainer>

      <TablePagination
        component="div"
        count={filteredAssessments.length}
        page={page}
        onPageChange={(e, newPage) => setPage(newPage)}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(event) => {
          // Convert the selected value to a number
          const value = parseInt(event.target.value, 10);
          setRowsPerPage(value);
          setPage(0);
        }}
        // Define the options: 10, 25, 50, 100, and "All" (-1)
        rowsPerPageOptions={[10, 25, 50, 100, { label: 'All', value: -1 }]}
        labelRowsPerPage=""
      />


      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}>
       <Tooltip 
          title={currentUser?.sandbox ? <Typography sx={{ fontSize: '0.9rem' }}>{getMessage("sandbox_user_cannot_copy")}</Typography> : ""}
          placement="left"
        >
          <div> {/* Wrap MenuItem in a div for tooltip to work when disabled */}
            <MenuItem 
              onClick={() => {
                handleCopyAssessment(activeAssessment);
                handleMenuClose();
              }}
              disabled={currentUser?.sandbox}
            >
              <Copy size={16} style={{ marginRight: 8 }} />
              {getMessage('label_copy')}
            </MenuItem>
          </div>
        </Tooltip>
        {activeAssessment && activeAssessment.userId === currentUser._id && (
          <Box>
              <MenuItem
                  onClick={() => {
                      setEditWarningDialog({ 
                          open: true, 
                          assessment: activeAssessment,
                          type: 'delete'
                      });
                  }}
                  sx={{ color: 'error.main' }}
              >
                  <DeleteIcon sx={{ mr: 1.5, fontSize: 18 }} />
                  {getMessage('label_delete')}
              </MenuItem>
              <MenuItem
                  onClick={() => {
                      setEditWarningDialog({ 
                          open: true, 
                          assessment: activeAssessment,
                          type: 'deleteAnswers'
                      });
                  }}
                  sx={{ color: 'error.main' }}
              >
                  <DeleteIcon sx={{ mr: 1.5, fontSize: 18 }} />
                  {getMessage('label_delete_all_answers')}
              </MenuItem>
          </Box>
      )}
    </Menu>
        <Dialog
  open={editWarningDialog.open}
  onClose={() => setEditWarningDialog({ open: false, assessment: null })}
>
  <DialogTitle>
    {editWarningDialog.type === 'delete' 
      ? getMessage('warning_delete_assessment') 
      : getMessage('warning_delete_answers')}
  </DialogTitle>
  <DialogContent>
    <DialogContentText>
      {editWarningDialog.type === 'delete' 
        ? getMessage('warning_delete_assessment_message')
        : getMessage('warning_delete_answers_message')}
    </DialogContentText>
  </DialogContent>
  <DialogActions>
    <Button onClick={() => setEditWarningDialog({ open: false, assessment: null })}>
      {getMessage('label_cancel')}
    </Button>
    <Button 
      onClick={() => {
        if (editWarningDialog.type === 'delete') {
          handleDeleteAssessment(editWarningDialog.assessment._id);
        } else {
          handleDeleteAnswers(editWarningDialog.assessment._id);
        }
        setEditWarningDialog({ open: false, assessment: null });
        handleMenuClose();
      }} 
      color="error"
      autoFocus
    >
      {getMessage('label_delete')}
    </Button>
  </DialogActions>
</Dialog>
    </Paper>
  );
};

export default AssessmentTable;