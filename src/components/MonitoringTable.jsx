import React, { useState, useEffect } from 'react';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Typography, Tooltip, IconButton } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import AddIcon from "@mui/icons-material/Add";
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import axios from "axios";
import { BACKEND_URL } from "../config";
import ClickAwayListener from '@mui/material/ClickAwayListener';
import ThreeDotsMenu from './ThreeDotsMenu';

import { useMessageService } from '../services/MessageService';
import { useAuthUser } from '../contexts/AuthUserContext';
import { generateSharingCode, loadMonitoringAndAssessments } from '../utils/ObjectsUtils';
import { buttonStyle } from './styledComponents';
import { OptionTypes, UserType } from '../utils/enums';

const MonitoringsTable = ({ assessments, setAssessments, setCurrentMonitoringId, monitorings, setMonitorings }) => {
    const [editingCell, setEditingCell] = useState(null);
    const [editingCellValue, setEditingCellValue] = useState('');
    const [openDialog, setOpenDialog] = useState(false);
    const [newMonitoringName, setNewMonitoringName] = useState('');
    const [newMonitoringDescription, setNewMonitoringDescription] = useState('');
    const [error, setError] = useState(null);
    const [openLoadCodeDialog, setOpenLoadCodeDialog] = useState(false);
    const [loadCode, setLoadCode] = useState('');
    const [sortModel, setSortModel] = useState([{field: 'id', sort: 'desc',},]);
    const [copiedCode, setCopiedCode] = useState(null);

    const { getMessage } = useMessageService();
    const { currentUser } = useAuthUser();
    const [loadCodeError, setLoadCodeError] = useState('');

    useEffect(() => {
      //console.log('Monitorings in table updated:', monitorings);
    }, [monitorings]);
    
    const handleClickAddNewMonitoring = () => {
        setOpenDialog(true);
    };

    const handleClose = () => {
        setOpenDialog(false);
    };
  
    const handleAddMonitoring = async () => {
      let errorMessage = '';
      setError(null);

      if (!newMonitoringName || !newMonitoringDescription) {
          errorMessage = getMessage('new_monitoring_error_creation');
      }
      else if (monitorings.some(monitoring => monitoring.name === newMonitoringName)) {
          errorMessage = `${getMessage('new_monitoring_error_duplicate')}.`;
      }
      if (errorMessage) {
          setError(errorMessage);
          return;
      }

      console.log("Add new monitoring");

      try {
        const token = localStorage.getItem("token");
    
        const newMonitoring = {
            orderId: monitorings.length + 1,
            userId: currentUser._id,
            name: newMonitoringName,
            description: newMonitoringDescription,
            creationDate: new Date(),
            lastModification: new Date(),
            options: [OptionTypes.DELETE, OptionTypes.DELETE_ALL_ANSWERS, OptionTypes.COPY]
        };

        const response = await axios.post(`${BACKEND_URL}/monitorings`, newMonitoring, {
            headers: {
              Authorization: `Bearer ${token}`
            }
        });

        const serverMonitoringId = response.data._id;
        newMonitoring._id = serverMonitoringId;
    
        setCurrentMonitoringId(serverMonitoringId);
        setMonitorings(prevMonitorings => [...prevMonitorings, newMonitoring]);
    
        setNewMonitoringName('');
        setNewMonitoringDescription('');
        handleClose();
      } catch (error) {
        console.error("Error adding monitoring:", error);
      }
    };
  
    const handleUpdateMonitoring = async (monitoringId, field) => {

      console.log(`Updating the field ${field} of monitoring`, monitoringId);
    
      const updatedMonitorings = monitorings.map((row) => {
        if (row._id === monitoringId) {
          return { 
            ...row,
            [field]: editingCellValue,
            lastModificationDate: new Date() };
        }
        return row;
      });

      console.log("updatedMonitorings",updatedMonitorings)

    
      try {
        const rowToUpdate = updatedMonitorings.find(row => row._id === monitoringId);

        console.log("updatedMonitoringData",rowToUpdate)

        const token = localStorage.getItem("token");
        await axios.put(`${BACKEND_URL}/monitorings/${monitoringId}`, rowToUpdate, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        setMonitorings(updatedMonitorings);

      } catch (err) {
        console.error(err);
      }
    
      setEditingCell(null);
      setEditingCellValue('');
    };
  
    const handleDeleteMonitoring = async (monitoringId) => {
      console.log("deleting the monitoring", monitoringId);

      try {
        const token = localStorage.getItem("token");
        await axios.delete(`${BACKEND_URL}/monitorings/${monitoringId}`, {
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

    const handleDeleteAnswers = async (monitoringId) => {
      console.log("delete all answers from monitoring", monitoringId);

      try {
        const token = localStorage.getItem("token");
        await axios.delete(`${BACKEND_URL}/responses/monitoring/${monitoringId}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        console.log("Every answers from this monitoring deleted successfully");
      } catch (err) {
        console.error(err);
      }
    }

    const handleRemoveSharingCode = async (monitoringId) => {

      console.log(`Removing sharing code from the monitoring Id`, monitoringId);

      try {
        const token = localStorage.getItem("token");

        await axios.put(`${BACKEND_URL}/monitorings/${monitoringId}/stopSharing`, {}, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        await loadMonitoringAndAssessments(currentUser, setMonitorings, setAssessments, setCurrentMonitoringId);

      } catch (err) {
        console.error(err);
      }
    };

    const handleCopyMonitoring = async (monitoringId) => {

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
        const response = await axios.post(`${BACKEND_URL}/monitorings`, copiedMonitoring, {
            headers: {
              Authorization: `Bearer ${token}`
            }
        });

        const serverMonitoringId = response.data._id;
        copiedMonitoring._id = serverMonitoringId;

        // copy the corresponding assessments
        copyAssessments(monitoringId, serverMonitoringId, token);

        // reload all assessment and monitorings
        await loadMonitoringAndAssessments(currentUser, setMonitorings, setAssessments, setCurrentMonitoringId);
    
        // choose the last monitoringId
        setCurrentMonitoringId(serverMonitoringId);
        
        handleClose();
      
      } catch (error) {
        console.error('Error copying assessment:', error);
        setError("Failed to copy assessment. Please try again.");
      }

      
    }

    // Copy assessments from one monitoring to another
  const copyAssessments = async (monitoringId, newMonitoringId, token) => {
    try {
        const response = await axios.post(
        `${BACKEND_URL}/assessments/monitoring/${monitoringId}/copy`,
        { newMonitoringId },
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
  
    const handleShareMonitoring = async (monitoringId) => {
      console.log(`Add a sharing code to the monitoring Id`, monitoringId);

      let sharingCode = generateSharingCode();

      const updatedMonitorings = monitorings.map((row) => {
        if (row._id === monitoringId) {
          return { ...row, ["sharingCode"]: sharingCode };
        }
        return row;
      });

      try {
        const token = localStorage.getItem("token");
        await axios.put(`${BACKEND_URL}/monitorings/${monitoringId}/startSharing`, { sharingCode }, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        setMonitorings(updatedMonitorings);

      } catch (err) {
        console.error(err);
      }
    }

    const handleLoadCode = async () => {
      const token = localStorage.getItem("token");
  
      if (!token) {
        alert("No authentication token available.");
        return;
      }
  
      try {
        const response = await axios.put(`${BACKEND_URL}/users/monitorings/code/${loadCode}/startFollowing`, {}, {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (response.status === 200) {
            console.log("Code loaded successfully, and monitorings/assessments updated");
            setLoadCodeError('');
            handleCloseLoadCodeDialog();

            await loadMonitoringAndAssessments(currentUser, setMonitorings, setAssessments, setCurrentMonitoringId);
        }
      } catch (err) {
        console.error("Error while appending code:", err);
        if (err.response && err.response.status === 409) {
          setLoadCodeError("label_code_already_redeemed");
        } 
        else if (err.response && err.response.status === 404){
          setLoadCodeError("label_code_does_not_exist");
        }
        else {
          alert("An error occurred while loading the code.");
        }
      }
    };

    const handleCopyCode = (code) => {
      navigator.clipboard.writeText(code).then(() => {
        setCopiedCode(code);
        setTimeout(() => setCopiedCode(null), 2000);
      });
    };

    const renderNameCell = (params) => (
      currentUser && monitorings.some(row => row._id === params.row._id && row.userId === currentUser._id) && editingCell?.id === params.id && editingCell?.field === 'name' ? (
        <ClickAwayListener onClickAway={() => handleUpdate('name', params)}>
          <TextField 
            defaultValue={params.value} 
            onChange={(e) => {
              const cleanedValue = e.target.value.replace(/\n/g, "");
              setEditingCellValue(cleanedValue);
            }}
            autoFocus
            onKeyDown={(e) => {
              e.stopPropagation()
              if (e.key === 'Enter'){
                e.preventDefault();
                handleUpdate('name', params)}
              }
            }
          />
        </ClickAwayListener>
      ) : (
        <div onClick={() => startEditing('name', params)}>{params.value}</div>
      )
    );

    const renderDescriptionCell = (params) => (
      currentUser && monitorings.some(row => row._id === params.row._id && row.userId === currentUser._id) && editingCell?.id === params.id && editingCell?.field === 'description' ? (
        <ClickAwayListener onClickAway={() => handleUpdate('description', params)}>
          <TextField 
            defaultValue={params.value}
            onChange={(e) => {
              const cleanedValue = e.target.value.replace(/\n/g, "");
              setEditingCellValue(cleanedValue);
            }}
            autoFocus
            fullWidth
            onKeyDown={(e) => {
              e.stopPropagation()
              if (e.key === 'Enter'){
                e.preventDefault();
                handleUpdate('description', params)}
              }
            }
          />
        </ClickAwayListener>
      ) : (
        <div onClick={() => startEditing('description', params)}>{params.value}</div>
      )
    );

    const columns = [
      { field: 'name', headerName: getMessage('label_name'), width: 300, renderCell: renderNameCell },
      { field: 'description', headerName: getMessage('table_monitorings_description'), flex: 1, renderCell: renderDescriptionCell },
      ...(currentUser.userStatus === UserType.TEACHER_TRAINER ? [{
        field: 'sharingCode',
        headerName: getMessage('label_sharing_status'),
        flex: 1,
        renderCell: (params) => (
          params.row.sharingCode
            ? (
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span>{params.row.sharingCode}</span>
                <Tooltip title={copiedCode === params.row.sharingCode ? getMessage('label_copied') : getMessage('label_copy_code')}>
                  <IconButton onClick={() => handleCopyCode(params.row.sharingCode)}>
                    <ContentCopyIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </div>
            )
            : <Button
                variant="contained"
                color="primary"
                onClick={() => handleShareMonitoring(params.row._id)}
                sx={{ color: "black", backgroundColor: "#F7941E", borderRadius: "50px", "&:hover": { backgroundColor: "#D17A1D" }}}
              >
                {getMessage('label_button_share_monitoring')}
              </Button>
        )
      }] : []),
      ...(currentUser.userStatus === UserType.TEACHER ? [{
        field: 'status',
        headerName: getMessage('label_source'),
        flex: 1,
        renderHeader: () => (
          <Tooltip title={getMessage('label_tooltip_source')}>
            <span>{getMessage('label_source')}</span>
          </Tooltip>
        ),
        renderCell: (params) => (
          monitorings.some(row => row._id === params.row._id && row.userId === currentUser._id)
            ? getMessage('label_source_owned')
            : getMessage('label_source_imported')
        )
      }] : []),
      { field: 'creationDate', headerName: getMessage('table_monitorings_creation_date'), type: 'date', width: 130},
      { field: 'lastModification', headerName: getMessage('table_monitorings_last_modification'), type: 'date', width: 130 },
      { field: 'actions', 
        headerName: getMessage('table_monitorings_actions'), 
        sortable: false,
        width: 80, 
        renderCell: (params) => (
          <ThreeDotsMenu 
            options={params.row.options} 
            onDeleteAllAnswers={() => handleDeleteAnswers(params.row._id)}
            onDelete={() => handleDeleteMonitoring(params.row._id)}
            onCopy={() => handleCopyMonitoring(params.row._id)}
            onUnshare={() => handleRemoveSharingCode(params.row._id)}
          />
        )
      },
    ];

    const startEditing = (field, params) => {
      setEditingCell({ id: params.id, field });
      setEditingCellValue(params.value);
    };

    const handleUpdate = (field, params) => {
      handleUpdateMonitoring(params.row._id, field);
      setEditingCellValue('');
    };

    const handleOpenLoadCodeDialog = () => {
        setOpenLoadCodeDialog(true);
    };

    const handleCloseLoadCodeDialog = () => {
        setOpenLoadCodeDialog(false);
    };

    return (
      <Box sx={{ height: 300, width: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <DataGrid
          rows={monitorings}
          columns={columns}
          pageSize={3}
          sortModel={sortModel}
          onSortModelChange={setSortModel}
          getRowId={(row) => row._id}
          onRowClick={(params) => setCurrentMonitoringId(params.row._id)}
          sx={{ height: '90%', "& .MuiDataGrid-cell:focus-within": { outline: "none" } }}
        />
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', padding: '10px', borderTop: '1px solid rgba(224, 224, 224, 1)' }}>
            
          <Button onClick={handleOpenLoadCodeDialog} variant="contained" startIcon={<AddIcon />} sx={buttonStyle}>
              {getMessage('label_button_import_monitoring')}
          </Button>
            
          <Button onClick={handleClickAddNewMonitoring} variant="contained" startIcon={<AddIcon />} sx={buttonStyle}>
            {getMessage('table_monitoring_button_new_monitoring')}
          </Button>
        </Box>

        <Dialog open={openDialog} onClose={handleClose}>
          <DialogTitle variant="h3">{getMessage('new_monitoring_create_new_monitoring')}</DialogTitle>
          <DialogContent>
            <TextField 
              autoFocus 
              size="small" 
              margin="dense" 
              id="name" 
              label={getMessage('label_name')} 
              type="text" 
              fullWidth 
              value={newMonitoringName} 
              onChange={(e) => setNewMonitoringName(e.target.value)} 
            />
            <TextField 
              margin="dense" 
              id="description" 
              label={getMessage('new_monitoring_description')} 
              type="text" 
              fullWidth 
              value={newMonitoringDescription} 
              onChange={(e) => setNewMonitoringDescription(e.target.value)} 
            />
          
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
                onClick={handleAddMonitoring}
                variant="contained"
                color="primary"
                sx={buttonStyle}
              >
                {getMessage('new_monitoring_create')}
              </Button>
            </Box>
          </DialogActions>
        </Dialog>

        <Dialog open={openLoadCodeDialog} onClose={handleCloseLoadCodeDialog}>
          <DialogTitle>{getMessage('load_code_dialog_title')}</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              id="loadCode"
              label={getMessage('label_code_dialog_enter')}
              type="text"
              fullWidth
              value={loadCode}
              onChange={(e) => setLoadCode(e.target.value)}
            />
            {loadCodeError && <Typography color="error" style={{ marginTop: 8 }}>{getMessage(loadCodeError)}</Typography>}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseLoadCodeDialog}>{getMessage('label_cancel')}</Button>
            <Button onClick={handleLoadCode}>{getMessage('label_import')}</Button>
          </DialogActions>
        </Dialog>
      </Box>
    );
};

export default MonitoringsTable;