import React, { useState, useEffect } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import { Box, Button, Checkbox, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Typography, MenuItem, InputLabel, Select, IconButton } from "@mui/material";
import ClickAwayListener from '@mui/material/ClickAwayListener';
import axios from 'axios';
import AddIcon from "@mui/icons-material/Add";
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import { useNavigate, useLocation } from 'react-router-dom';

import { BACKEND_URL } from "../../config";
import ThreeDotsMenu from '../ThreeDotsMenu';
import { buttonStyle } from '../styledComponents';

import { useMessageService } from '../../services/MessageService';
import { useAuthUser } from '../../contexts/AuthUserContext';
import { AssessmentType, OptionTypes, UserType } from '../../utils/enums';
import { localizeAssessmentType } from '../../utils/ObjectsUtils';
import { useLanguage } from '../../contexts/LanguageContext';


const AssessmentsTable = ({ assessments, setAssessments, monitorings, currentMonitoringId, currentAssessmentId, setCurrentAssessmentId,
                            setIsOpen, setOpenAssessmentsCount, selectedAssessmentIds, setSelectedAssessmentIds}) => {

    const useLanguageFromUrl = () => {
        const location = useLocation();
        const params = new URLSearchParams(location.search);
        const urlLanguageCode = params.get('lng');
        const { languageCode: contextLanguageCode, setLanguageCode } = useLanguage();

        useEffect(() => {
            if (urlLanguageCode && urlLanguageCode !== contextLanguageCode) {
                setLanguageCode(urlLanguageCode);
            }
        }, [urlLanguageCode, contextLanguageCode, setLanguageCode]);

        return { languageCode: urlLanguageCode || contextLanguageCode };
    };

    const [editingCell, setEditingCell] = useState(null);
    const [editingCellValue, setEditingCellValue] = useState(null);
    const [openDialog, setOpenDialog] = useState(false);
    const [newAssessmentDay, setNewAssessmentDay] = useState('');
    const [newAssessmentName, setNewAssessmentName] = useState('');
    const [newAssessmentType, setNewAssessmentType] = useState('');
    const [error, setError] = useState(null);
  
    const navigate = useNavigate();
    const { getMessage } = useMessageService();
    const { currentUser } = useAuthUser();
    const { languageCode } = useLanguageFromUrl();


    const statusToOptions = {
      Draft: [OptionTypes.EDIT, OptionTypes.PREVIEW, OptionTypes.OPEN, OptionTypes.COPY, OptionTypes.DELETE, OptionTypes.DELETE_ALL_ANSWERS],
      Open: [OptionTypes.CLOSE, OptionTypes.EDIT, OptionTypes.PREVIEW, OptionTypes.COPY, OptionTypes.DELETE, OptionTypes.DELETE_ALL_ANSWERS],
      Close: [OptionTypes.OPEN, OptionTypes.COPY, OptionTypes.DELETE, OptionTypes.DELETE_ALL_ANSWERS],
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
        await axios.delete(`${BACKEND_URL}/responses/assessment/${assessmentId}`, {
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
     * Handles the deletion of an assessment 
     * sending a DELETE request to the server to delete the assessment.
     * 
     * @returns {Promise<void>} A promise that resolves once the assessment is deleted from the server.
    */
    const handleDeleteAssessment = async (assessmentsId) => {

        console.log("deleting the assessement", assessmentsId);

        // DELETE the assessment on the server
        try {
            const token = localStorage.getItem("token");
            await axios.delete(`${BACKEND_URL}/assessments/${assessmentsId}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            console.log("Assessment deleted successfully");
        } catch (err) {
            console.error(err);
        }
    

        // Remove the deleted assessment from the assessments array
        const filteredAssessments = assessments.filter((assessment) => assessment._id !== assessmentsId);

        // Reassign the positions of the remaining assessments
        const sortedAssessments = filteredAssessments.slice().sort((a, b) => a.position - b.position);
        const reassignedAssessments = sortedAssessments.map((assessment, index) => {
          return {
            ...assessment,
            position: index + 1
          };
        });

        // Save the state
        setAssessments(reassignedAssessments);

        // Save the updated positions to the server
        try {
          const token = localStorage.getItem("token");
          const positionUpdatePromises = reassignedAssessments.map(assessment => {
              return axios.put(`${BACKEND_URL}/assessments/${assessment._id}`, assessment, {
                  headers: {
                      Authorization: `Bearer ${token}`
                  }
              });
          });
          await Promise.all(positionUpdatePromises);

          console.log("Positions updated on the server successfully.");
        } catch (err) {
            console.error("Error updating positions on the server:", err);
        }
    };

    /**
     * Handles the addition of a new assessment by creating a new Assessment object, adding it to the assessments state, 
     * sending a POST request to the server to save the new assessment, and updating the current assessment ID.
     * 
     * @returns {Promise<void>} A promise that resolves once the new assessment is added and saved to the server.
    */
    const handleAddAssessment = async () => {

        console.log("Add new assessment");

        let errorMessage = '';
        setError(null);
        
        // Check for empty mandatory fields
        if (!newAssessmentDay || !newAssessmentType || !newAssessmentName) {
            errorMessage = getMessage('new_assessment_error_creation');
        }
        // Check for duplicate assessment on the same day
        else if (assessments.some(assessment => Number(assessment.day) === Number(newAssessmentDay) && assessment.name === newAssessmentName)) {
            errorMessage = `${getMessage('new_assessment_error_duplicate')} ${newAssessmentDay}.`;
        }
        // If there's an error, set the error message and abort the operation
        if (errorMessage) {
            setError(errorMessage);
            return;
        }

        // Proceed if no errors
        try {
          // Retrieve token
          const token = localStorage.getItem("token");

          // Get all assessments that match the condition
          let matchingAssessments = assessments.filter(assessment => assessment.monitoringId === currentMonitoringId);

          // Get the number of matching assessments
          let nbAssessments = matchingAssessments.length;

          // The position (number of assessments + 1)
          let position = nbAssessments + 1;

          // Prepare the new assessment object
          const newAssessment = {
              monitoringId: currentMonitoringId,
              userId: currentUser._id,
              position: position,
              name: newAssessmentName,
              day: newAssessmentDay,
              type: newAssessmentType,
              status: "Draft", 
              creationDate: new Date(Date.now()), 
              lastModification: new Date(Date.now()),
              options: statusToOptions["Draft"]
          };
          
          // Attempt to save the new assessment
          const response = await axios.post(`${BACKEND_URL}/assessments`, newAssessment, {
              headers: { 
                Authorization: `Bearer ${token}` 
              }
          });

          // set current assessment server id
          const serverAssessmentId = response.data._id;
          newAssessment._id = serverAssessmentId;

          // save the current assessment ID
          setCurrentAssessmentId(serverAssessmentId);
          // Add new assessment to rows
          setAssessments(prevAssessments => [...prevAssessments, newAssessment]);

          // Reset form and close dialog
          setNewAssessmentName('');
          setNewAssessmentType('');
          handleClose();

        } catch (error) {
          console.error("Error adding assessment:", error);
          setError("Failed to add assessment. Please try again.");
        }
    };
  
    /**
     * Updates the specified assessment with a new value for the provided field and saves the changes to the server.
     * 
     * @param {string} assessmentId - The unique identifier of the assessment to be updated.
     * @param {string} field - The field of the assessment to be updated.
     * @returns {Promise<void>} A promise that resolves once the assessment is updated and saved to the server.
    */
    const handleUpdateAssessment = async (assessmentId, field) => {
  
        console.log(`Updating the field ${field} of assessment`, assessmentId);
    
        // Find the row by id
        const updatedAssessments = assessments.map((row) => {
            if (row._id === assessmentId) {
                return { ...row, [field]: editingCellValue };
            }
            return row;
        });
        
        // Update the server-side data
        try {
            const rowToUpdate = updatedAssessments.find(row => row._id === assessmentId);
            const token = localStorage.getItem("token");
            await axios.put(`${BACKEND_URL}/assessments/${assessmentId}`, rowToUpdate, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            // save the assessments state
            setAssessments(updatedAssessments);

        } catch (err) {
            console.error(err);
        }
        
        // Clear the editing state
        setEditingCell(null);
        setEditingCellValue('');
    };

    /**
     * Copy the specified assessment and save it to the server.
     * 
     * @param {string} assessmentId - The unique identifier of the assessment to be updated.
     * @returns {Promise<void>} A promise that resolves once the assessment is copied and saved to the server.
    */
    const handleCopyAssessment = async (assessmentId) => {

      // get the assessment to copy
      const assessmentToCopy = assessments.find(assessment => assessment._id === assessmentId._id);
  
      // if there is one
      if (assessmentToCopy) {

        try {
          // Retrieve token
          const token = localStorage.getItem("token");

          // Get all assessments that match the condition
          let matchingAssessments = assessments.filter(assessment => assessment.monitoringId === currentMonitoringId);

          // Get the number of matching assessments
          let nbAssessments = matchingAssessments.length;

          // The position (number of assessments + 1)
          let position = nbAssessments + 1;

          // Create a new assessment object with necessary modifications for the server
          const copiedAssessment = {
            ...assessmentToCopy,
            userId: currentUser._id,
            day: assessments.length + 1,
            position: position,
            name: `${assessmentToCopy.name} (copy)`,
            status: 'Draft',
            creationDate: new Date(Date.now()), 
            lastModificationDate: new Date(Date.now()),
            options: statusToOptions["Draft"],
          };

          // Attempt to save the new assessment (copied)
          const response = await axios.post(`${BACKEND_URL}/assessments`, copiedAssessment, {
            headers: { 
              Authorization: `Bearer ${token}` 
            }
          });

          // set current assessment server id
          const serverAssessmentId = response.data._id;
          copiedAssessment._id = serverAssessmentId;

          // save the current assessment ID
          setCurrentAssessmentId(serverAssessmentId);
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
   * Navigates to the previewSurvey page with current assessmentId
   */
  const handleAssessmentPreview = () => {
      // navigate to the previewSurvey page
      navigate(`/previewSurvey?lng=${languageCode}`, {
          state: {
              assessment: assessments.find(assessment => assessment._id === currentAssessmentId),
          },
      });
  };
  
  /**
   * Initiates editing of an assessment by setting its status to 'Draft' and navigating to the createSurvey page with relevant assessment details.
   */
  const handleEditAssessment = (assessment) => {

    // Change the status to 'Draft' using handleAssessmentStatusChange
    handleAssessmentStatusChange(assessment._id, 'Draft');

    // Redirect to createSurvey page 
    navigate('/createSurvey', {
        state: {
            assessmentType: assessment.type,
            assessmentName: assessment.name,
            asssessmentId: currentAssessmentId,
        },
    });
  };
  
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
      await axios.put(`${BACKEND_URL}/assessments/${assessmentId}`, rowToUpdate, {
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

  /**
   * Close a specific assessment for responses by setting its status to 'Close'.
   *
   * @param {Object} props - The properties of the assessment to be opened, including its unique identifier.
   */
  const handleCloseAssessment = (props) => {

    // Close the access to the questionnaire
    setIsOpen(true)
    setOpenAssessmentsCount(assessments.filter(assessment => assessment.status === 'Open').length-1)
    handleAssessmentStatusChange(props._id, 'Close');
  };

  const handleStatusChange = async (assessmentId, currentStatus) => {
        let newStatus;
        switch (currentStatus) {
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
                newStatus = currentStatus;
        }

        await handleAssessmentStatusChange(assessmentId, newStatus);

        // Update openAssessmentsCount
        const openAssessmentsCount = assessments.filter(assessment => 
            assessment.monitoringId === currentMonitoringId && assessment.status === 'Open'
        ).length;
        setOpenAssessmentsCount(openAssessmentsCount);

        // Update isOpen
        setIsOpen(newStatus === 'Open');
    };

  /**
   * Renders a cell in the DataGrid representing the status of an assessment. 
   * @param {Object} params - Parameters passed by the DataGrid, including the value of the cell which indicates the assessment's status.
   * @returns {JSX.Element} A styled Button element reflecting the assessment's status through color coding.
   */
  const renderStatusCell = (params) => {
        const status = params.value;
        let display_name = "";
        let color;

        switch (status) {
            case 'Draft':
                color = 'grey';
                display_name = getMessage('label_status_draft');
                break;
            case 'Open':
                color = 'green';
                display_name = getMessage('label_status_open');
                break;
            case 'Close':
                color = 'red';
                display_name = getMessage('label_status_close');
                break;
            default:
                break;
        }

        return (
            <Button
                variant="outlined"
                size="small"
                style={{ color, borderColor: color }}
                onClick={(event) => {
                    event.stopPropagation();
                    handleStatusChange(params.row._id, status);
                }}
            >
                {display_name}
            </Button>
        );
    };


  
  // Comment
  const handleClickOpen = () => {
      setOpenDialog(true);
  };

  // Comment
  const handleClose = () => {
      setOpenDialog(false);
  };

  // Comment
  const handleCheckboxChange = (event, assessmentId) => {
      event.stopPropagation();
      if (event.target.checked) {
          setSelectedAssessmentIds(prevIds => [...prevIds, assessmentId]);
      } else {
          setSelectedAssessmentIds(prevIds => prevIds.filter(id => id !== assessmentId));
      }
  };

  const renderNumberFieldCell = (params, field) => {
    // Check if the current user is the owner of the assessment
    const isOwner = currentUser && assessments.find(row => row._id === currentAssessmentId)?.userId === currentUser._id;

    const canEdit = currentUser && 
                    currentAssessmentId === params.row._id && 
                    isOwner &&
                    params.row.status !== 'Open';  
    return canEdit ? (
        editingCell?.id === params.id && editingCell?.field === field ? (
            <ClickAwayListener onClickAway={() => handleUpdateAssessment(params.row._id, field, editingCellValue)}>
                <TextField
                    type="number"
                    defaultValue={editingCellValue}
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
                        },
                        width: '100%',
                    }}
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
            <div 
                onClick={() => {
                    setEditingCell({ id: params.id, field });
                    setEditingCellValue(params.value);
                }}
                style={{ 
                    width: '100%', 
                    textAlign: 'center',
                    cursor: 'pointer'
                }}
            >
                {params.value}
            </div>
        )
    ) : (
        <div style={{ width: '100%', textAlign: 'center' }}>
            {params.value}
        </div>
    );
};

  const renderTextFieldCell = (params, field) => {
    
    // Check if the current user is the owner of the assessment
    const isOwner = currentUser && assessments.find(row => row._id === currentAssessmentId)?.userId === currentUser._id;
    
    // We can edit the name of the assessment and the session, only if the user own the assessment
    const canEdit = currentUser && 
                      currentAssessmentId === params.row._id && 
                      isOwner &&
                      params.row.status !== 'Open';  
    return canEdit ? (
      editingCell?.id === params.id && editingCell?.field === field ? (
        <ClickAwayListener onClickAway={() => handleUpdateAssessment(params.row._id, field, editingCellValue)}>
          <TextField
            defaultValue={editingCellValue}
            onChange={(e) => {
              // Replace newline characters with an empty string
              const cleanedValue = e.target.value.replace(/\n/g, "");
              setEditingCellValue(cleanedValue);
            }}
            autoFocus
            onKeyDown={(e) => {
              e.stopPropagation();
              if (e.key === 'Enter') {
                e.preventDefault(); // Prevent the default behavior of Enter key
                handleUpdateAssessment(params.row._id, field, editingCellValue); // Update with cleaned value
              }
            }}
          />
        </ClickAwayListener>
      ) : (
        <div onClick={() => {
          setEditingCell({ id: params.id, field });
          setEditingCellValue(params.value);
        }}>
          {params.value}
        </div>
      )
    ) : <div>{params.value}</div>;
  };

  const renderCheckboxCell = (params) => (
      <Checkbox
        checked={selectedAssessmentIds.includes(params.row._id)}
        onChange={(event) => handleCheckboxChange(event, params.row._id)}
        disabled={params.row.status === 'Draft'}
      />
  );

  const renderActionsCell = (params) => {

        // Check if there is a userId in the assessment
        const isAssessmentUserid = assessments.find(row => row._id === currentAssessmentId)?.userId !== undefined;

        // If isAssessmentUserid is false, set assessment's userId to monitoring's userId
        if (!isAssessmentUserid) {
            const assessment = assessments.find(row => row._id === currentAssessmentId);
            if (assessment) {
                assessment.userId = monitorings.find(row => row._id === currentMonitoringId)?.userId
            }
        }

        // Check if the current user is the owner of the assessment
        const isOwner = currentUser && assessments.find(row => row._id === currentAssessmentId)?.userId === currentUser._id;

        let options = isOwner ? params.row.options : ["Preview", "Copy"];
        
        // Remove EDIT option if status is Open
        if (params.row.status === 'Open') {
            options = options.filter(option => option !== OptionTypes.EDIT);
        }
        
        // Remove OPEN option if status is Close
        if (params.row.status === 'Close' || params.row.status === 'Draft') {
            options = options.filter(option => option !== OptionTypes.OPEN);
        }

        // Remove CLOSE option if status is Open
        if (params.row.status === 'Open') {
            options = options.filter(option => option !== OptionTypes.CLOSE);
        }

        return (
            <ThreeDotsMenu
                options={options}
                onDelete={() => handleDeleteAssessment(params.row._id)}
                onEdit={() => handleEditAssessment(params.row)}
                onPreview={() => handleAssessmentPreview()}
                onView={() => handleAssessmentPreview()}
                onCopy={() => handleCopyAssessment(params.row)}
                onTerminate={() => handleCloseAssessment(params.row)}
                onDeleteAllAnswers={() => handleDeleteAnswers(params.row._id)}
            />
        );
    };

    const renderTypeCell = (params) => {
        const type = params.value;
        let displayName = "";
        let backgroundColor;

        switch (type) {
            case AssessmentType.BEHAVIORAL_CHANGES:
                backgroundColor = 'rgb(44, 179, 181)';
                displayName = getMessage('label_assessment_type_behavioral_changes');
                break;
            case AssessmentType.ORGANIZATIONAL_CONDITIONS:
                backgroundColor = 'rgb(127, 190, 70)';
                displayName = getMessage('label_assessment_type_organizational_conditions');
                break;
            case AssessmentType.IMMEDIATE_REACTIONS:
                backgroundColor = 'rgb(249, 179, 50)';
                displayName = getMessage('label_assessment_type_immediate_reactions');
                break;
            case AssessmentType.LEARNING:
                backgroundColor = 'rgb(242, 141, 48)';
                displayName = getMessage('label_assessment_type_learning');
                break;
            default:
                backgroundColor = 'rgb(100, 100, 100)'; // Light grey
                displayName = localizeAssessmentType(type, getMessage);
        }

        return (
            <Button
                variant="outlined"
                size="medium"
                style={{ 
                    color: backgroundColor, 
                    borderColor: backgroundColor,
                    textTransform: 'none',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: '100%',
                    fontSize: '12px', 
                    lineHeight: '1.2', 
              
                    
                }}
                title={displayName}
            >
                {displayName}
            </Button>
        );
    };

                
    const handleMoveRow = async (assessmentId, direction) => {
    const currentAssessments = assessments.filter(assessment => assessment.monitoringId === currentMonitoringId);
    const index = currentAssessments.findIndex(assessment => assessment._id === assessmentId);
    
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === currentAssessments.length - 1)) {
        return; // Can't move further in this direction
    }

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    const updatedAssessments = [...currentAssessments];
    [updatedAssessments[index], updatedAssessments[newIndex]] = [updatedAssessments[newIndex], updatedAssessments[index]];

    // Update positions
    updatedAssessments.forEach((assessment, idx) => {
        assessment.position = idx + 1;
    });

    // Update state
    setAssessments(prevAssessments => {
        const otherAssessments = prevAssessments.filter(assessment => assessment.monitoringId !== currentMonitoringId);
        return [...otherAssessments, ...updatedAssessments];
    });

    // Update server
    try {
        const token = localStorage.getItem("token");
        const updatePromises = updatedAssessments.map(assessment => 
            axios.put(`${BACKEND_URL}/assessments/${assessment._id}`, assessment, {
                headers: { Authorization: `Bearer ${token}` }
            })
        );
        await Promise.all(updatePromises);
    } catch (err) {
        console.error("Error updating positions on server:", err);
    }
};

const renderMoveButtons = (params) => {
    const currentAssessments = assessments.filter(assessment => assessment.monitoringId === currentMonitoringId);
    const index = currentAssessments.findIndex(assessment => assessment._id === params.row._id);
    const isFirst = index === 0;
    const isLast = index === currentAssessments.length - 1;

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <IconButton 
                onClick={() => handleMoveRow(params.row._id, 'up')} 
                size="small" 
                sx={{ padding: '2px' }}
                disabled={isFirst}
            >
                <ArrowUpwardIcon fontSize="small" />
            </IconButton>
            <IconButton 
                onClick={() => handleMoveRow(params.row._id, 'down')} 
                size="small" 
                sx={{ padding: '2px' }}
                disabled={isLast}
            >
                <ArrowDownwardIcon fontSize="small" />
            </IconButton>
        </Box>
    );
};


    const columns = [
      { 
        field: 'move', 
        headerName: '', 
        width: 20, 
        sortable: false,
        renderCell: renderMoveButtons
        },
        { 
          field: 'day',
          headerName: getMessage('table_assessments_session'),
          minwidth: 100,
          type: 'number',
          align: 'center',
          sortable: false,
          headerAlign: 'center',
          renderCell: (params) => renderNumberFieldCell(params, 'day') 
        },
        { field: 'name',
          headerName: getMessage('label_name'),
          width: 250,
          sortable: false,
          headerAlign: 'center',
          renderCell: (params) => renderTextFieldCell(params, 'name') 
        },
        { field: 'type',
          headerName: getMessage('table_assessments_type'),
          minWidth: 180, 
          sortable: false,
          headerAlign: 'center',
          renderCell: (params) => renderTypeCell(params)},
        { field: 'status',
          align: 'center',
          headerName: getMessage('label_status'),
          width: 100,
          sortable: false,
          headerAlign: 'center',
          renderCell: (params) => renderStatusCell(params) },
        { field: 'creationDate', 
          headerName: getMessage('table_assessments_creation_date'),
          type: 'date',
          width: 110,
          sortable: false,
          headerAlign: 'center',
         },
        { field: 'lastModification',
          headerName: getMessage('table_assessments_last_modification'),
          type: 'date', 
          width: 110,
          sortable: false,
          headerAlign: 'center',       
        },
        { field: 'actions',
          headerName: getMessage('table_assessments_actions'), 
          sortable: false, 
          headerAlign: 'center',
          width: 60, 
          disableClickEventBubbling: true,
          renderCell: (params) => renderActionsCell(params) },
        { field: 'checkbox', 
          headerName: getMessage('table_assessments_share'), 
          sortable: false, 
          headerAlign: 'center',
          width: 15, 
          renderCell: (params) => renderCheckboxCell(params) },
      ];
    
      return (
        <Box sx={{ height: "400px", width: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <DataGrid
                GridLinesVisibility="None"
                rows={assessments
                    .filter(assessment => assessment.monitoringId === currentMonitoringId)
                    .sort((a, b) => a.position - b.position)
                }
                columns={columns}
                pageSize={5}
                sortingOrder={['asc', 'desc']}
                getRowId={(row) => row._id}
                onRowClick={(rowParams) => {
                    setCurrentAssessmentId(rowParams.row._id);
                    setIsOpen(rowParams.row.status === 'Open');
                }}
                disableColumnMenu
                getRowClassName={(params) => {
                    const isOwner = params.row.userId === currentUser._id;
                    return !isOwner ? 'italic-row' : 'owner-row';
                }}
                sx={{
                    "&.MuiDataGrid-root .MuiDataGrid-cell:focus-within": {
                        outline: "none !important",
                    },
                    "& .italic-row": {
                        fontStyle: 'italic'
                    },
                    "& .owner-row": {
                        backgroundColor: 'rgba(0, 0, 0, 0.04)'
                    }
                }}
                style={{ height: '90%' }}
            />
            
            {currentUser && 
             currentMonitoringId && 
             monitorings.some(row => row._id === currentMonitoringId) && (
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', padding: '10px', borderTop: '1px solid rgba(224, 224, 224, 1)' }}>
                  <Button
                      onClick={handleClickOpen}
                      variant="contained"
                      color="primary"
                      startIcon={<AddIcon />}
                      sx={buttonStyle}
                  >
                  {getMessage('label_new_assessment')}
                  </Button>
              </Box>
            )
          }

            <Dialog
                open={openDialog}
                onClose={handleClose}
            >        
                <DialogTitle variant="h3">{getMessage('label_create_new_assessment')}</DialogTitle>
                <DialogContent>
                    <Box display="flex" alignItems="center">
                        <Typography>{getMessage('new_assessment_day')} &nbsp; </Typography>
                        <TextField 
                          id="day" 
                          type="number"
                          autoFocus
                          size="small"
                          style={{ width: "70px" }}
                          margin="dense"
                          inputProps={{ 
                              min: "1",
                              style: { textAlign: 'center' }
                          }}
                          sx={{
                              '& .MuiInputBase-input': {
                                  textAlign: 'center',
                              }
                          }}
                          value={newAssessmentDay === '' ? '' : newAssessmentDay}
                          onChange={(e) => {
                              const value = e.target.value === '' ? '' : Math.max(1, parseInt(e.target.value, 10) || 1);
                              setNewAssessmentDay(value);
                          }}
                      />
                    </Box>
              
              <Box mb="20px" mt="20px">
                <TextField
                value={newAssessmentName}
                autoFocus
                size="small"
                margin="dense"
                id="name"
                label={getMessage('label_name')}
                type="text"
                fullWidth
                onChange={(e) => setNewAssessmentName(e.target.value)}
    
              />
              </Box>
              <Box mb="5px"><InputLabel id="type-label">{getMessage('new_assessment_type_assessment')}</InputLabel></Box>
              <Select 
                value={newAssessmentType}
                margin="dense"
                size="small"
                id="type"
                labelId="type-label"
                fullWidth
                onChange={(e) => setNewAssessmentType(e.target.value)}
              >
                {currentUser.userStatus === UserType.TEACHER_TRAINER ? (
                  [
                    <MenuItem key="trainee" value={AssessmentType.TRAINEE_CHARACTERISTICS}>{getMessage('label_assessment_type_trainee_characteristics')}</MenuItem>,
                    <MenuItem key="training" value={AssessmentType.TRAINING_CHARACTERISTICS}>{getMessage('label_assessment_type_training_characteristics')}</MenuItem>,
                    <MenuItem key="immediate" value={AssessmentType.IMMEDIATE_REACTIONS}>{getMessage('label_assessment_type_immediate_reactions')}</MenuItem>,
                    <MenuItem key="learning" value={AssessmentType.LEARNING}>{getMessage('label_assessment_type_learning')}</MenuItem>,
                    <MenuItem key="organizational" value={AssessmentType.ORGANIZATIONAL_CONDITIONS}>{getMessage('label_assessment_type_organizational_conditions')}</MenuItem>,
                    <MenuItem key="behavioral" value={AssessmentType.BEHAVIORAL_CHANGES}>{getMessage('label_assessment_type_behavioral_changes')}</MenuItem>,
                    <MenuItem key="sustainability" value={AssessmentType.SUSTAINABILITY_CONDITIONS}>{getMessage('label_assessment_type_sustainability_conditions')}</MenuItem>,
                    <MenuItem key="studentCharacteristics" value={AssessmentType.STUDENT_CHARACTERISTICS}>{getMessage('label_assessment_type_student_characteristics')}</MenuItem>,
                    <MenuItem key="studentOutcomes" value={AssessmentType.STUDENT_LEARNING_OUTCOMES}>{getMessage('label_assessment_type_student_learning_outcomes')}</MenuItem>
                  ]
                ) : (
                  [
                    <MenuItem key="studentCharacteristics" value={AssessmentType.STUDENT_CHARACTERISTICS}>{getMessage('label_assessment_type_student_characteristics')}</MenuItem>,
                    <MenuItem key="studentOutcomes" value={AssessmentType.STUDENT_LEARNING_OUTCOMES}>{getMessage('label_assessment_type_student_learning_outcomes')}</MenuItem>
                  ]
                )}
              </Select>
    
              {error && 
                <Box color="red" mt="15px">
                  <Typography>{error}</Typography>
                </Box>
              }
    
            </DialogContent>

            <DialogActions>
              <Button onClick={handleClose}>{getMessage('label_cancel')}</Button>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', padding: '10px' }}>
                <Button
                    onClick={handleAddAssessment}
                    variant="contained"
                    color="primary"
                    sx={buttonStyle}
                >
                {getMessage('new_assessment_create')}
                </Button>
              </Box>
            </DialogActions>
          </Dialog>
        </Box>
      );
};


export default AssessmentsTable;

