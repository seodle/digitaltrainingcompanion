import React, { useState, useEffect } from 'react';
import { 
    Box, 
    Button, 
    Dialog, 
    DialogActions, 
    DialogContent, 
    DialogContentText, 
    DialogTitle, 
    Typography,
    TextField,
    IconButton,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    Snackbar,
    Alert,
    CircularProgress
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import AddIcon from '@mui/icons-material/Add';
import DoneIcon from '@mui/icons-material/Done';
import Sidebar from "../global/Sidebar";
import Topbar from "../global/Topbar";
import { useMessageService } from '../../services/MessageService';
import { BACKEND_URL } from "../../config";
import { useAuthUser } from '../../contexts/AuthUserContext';
import axios from "axios";
import packageJson from '../../../package.json';
import { veryLightGray } from '../../components/styledComponents';
import { useNavigate } from "react-router-dom";

const Settings = () => {
    const { getMessage } = useMessageService();
    const { currentUser } = useAuthUser();
    const navigate = useNavigate();

    // States
    const [apiKeys, setApiKeys] = useState([]);
    const [createKeyDialog, setCreateKeyDialog] = useState(false);
    const [deleteKeyDialog, setDeleteKeyDialog] = useState(false);
    const [selectedKeyToDelete, setSelectedKeyToDelete] = useState(null);
    const [newKeyName, setNewKeyName] = useState('');
    const [dialogConfirmDeleteOpen, setDialogConfirmDeleteOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [notification, setNotification] = useState({
        open: false,
        message: '',
        severity: 'success'
    });
    const [copiedKey, setCopiedKey] = useState(null);

    // Fetch API keys when component mounts
    useEffect(() => {
        fetchApiKeys();
    }, []);

    // Reset copied key indicator after 2 seconds
    useEffect(() => {
        if (copiedKey) {
            const timer = setTimeout(() => {
                setCopiedKey(null);
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [copiedKey]);

    // Fetch API keys from backend
    const fetchApiKeys = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem("token");
            const response = await axios.get(
                `${BACKEND_URL}/api-keys`,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );
            setApiKeys(response.data);
        } catch (error) {
            showNotification(
                error.response?.data?.error || 'Error fetching API keys',
                'error'
            );
        } finally {
            setIsLoading(false);
        }
    };

    // Create new API key
    const handleCreateKey = async () => {
        if (!newKeyName.trim()) {
            showNotification('Key name is required', 'error');
            return;
        }

        // Check if user already has an API key
        if (apiKeys.length > 0) {
            showNotification('You can only have one API key at a time', 'error');
            setCreateKeyDialog(false);
            return;
        }

        setIsLoading(true);
        try {
            const token = localStorage.getItem("token");
            const response = await axios.post(
                `${BACKEND_URL}/api-keys`,
                {
                    name: newKeyName.trim(),
                },
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );
            setApiKeys([response.data]);
            setCreateKeyDialog(false);
            setNewKeyName('');
            showNotification(`${getMessage('api_key_created_successfully')}`);
        } catch (error) {
            showNotification(
                error.response?.data?.error || 'Error creating API key',
                'error'
            );
        } finally {
            setIsLoading(false);
        }
    };

    // Delete API key
    const handleDeleteKey = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem("token");
            await axios.delete(
                `${BACKEND_URL}/api-keys/${selectedKeyToDelete}`,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );
            setApiKeys(apiKeys.filter(key => key._id !== selectedKeyToDelete));
            setDeleteKeyDialog(false);
            showNotification(`${getMessage('api_key_deleted_successfully')}`);
        } catch (error) {
            showNotification(
                error.response?.data?.error || 'Error deleting API key',
                'error'
            );
        } finally {
            setIsLoading(false);
        }
    };

    // Copy API key to clipboard
    const copyToClipboard = async (key) => {
        try {
            await navigator.clipboard.writeText(key);
            setCopiedKey(key);
            showNotification('API key copied to clipboard');
        } catch (error) {
            showNotification('Failed to copy API key', 'error');
        }
    };

    // Show notification
    const showNotification = (message, severity = 'success') => {
        setNotification({
            open: true,
            message,
            severity
        });
    };

    // Handle notification close
    const handleNotificationClose = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }
        setNotification({ ...notification, open: false });
    };

    // Account deletion handlers
    const handleClickDeleteAccount = () => {
        setDialogConfirmDeleteOpen(true);
    };

    const handleCloseDeleteAccount = () => {
        setDialogConfirmDeleteOpen(false);
    };

    const handleConfirmDeleteAccount = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem("token");
            await axios.delete(`${BACKEND_URL}/users/currentUser`, {
                headers: { Authorization: `Bearer ${token}` },
                timeout: 5000
            });
            localStorage.removeItem("token");
            navigate("/", { replace: true });
        } catch (error) {
            showNotification(
                error.response?.data?.error || "Couldn't delete account",
                'error'
            );
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Box display="flex" style={{ height: '100vh', overflow: 'auto' }}>
            <Sidebar />
            <Box display="flex" flex="1" flexDirection="column">
                <Box mt="10px" ml="10px">
                    <Topbar title={getMessage("label_my_account")} />
                </Box>

                {/* User Info Section */}
                <Box mt="20px" ml="20px" mr="20px" p="20px" border="1px solid #ccc" borderRadius="8px" bgcolor={veryLightGray}>
                    <Typography variant="h6" fontWeight="bold" mb="10px">
                        {getMessage('label_user_info')}
                    </Typography>
                    <Typography variant="body1">{`${currentUser.firstName} ${currentUser.lastName}`}</Typography>
                    <Typography variant="body1">{currentUser.email}</Typography>
                    <Typography variant="body1">{`${getMessage('label_status')}: ${currentUser.userStatus}`}</Typography>
                    <Typography variant="body1">{`${getMessage('userId')}: ${currentUser._id}`}</Typography>
                    <Typography variant="body1">{`${getMessage('codes_redeemed')}: ${currentUser.sharingCodeRedeemed}`}</Typography>
                </Box>

                {/* Platform Info Section */}
                <Box mt="20px" ml="20px" mr="20px" p="20px" border="1px solid #ccc" borderRadius="8px" bgcolor={veryLightGray}>
                    <Typography variant="h6" fontWeight="bold" mb="10px">
                        {getMessage('label_platform_info')}
                    </Typography>
                    <Typography variant="body1">
                        {`${getMessage('label_name_platform')}: ${packageJson.name}`}
                    </Typography>
                    <Typography variant="body1">
                        {`${getMessage('label_version_platform')}: ${packageJson.version}`}
                    </Typography>
                </Box>

                {/* API Keys Section */}
                <Box mt="20px" ml="20px" mr="20px" p="20px" border="1px solid #ccc" borderRadius="8px" bgcolor={veryLightGray}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                        <Typography variant="h6" fontWeight="bold">
                            {`${getMessage('api_key')}`}
                        </Typography>
                        {apiKeys.length === 0 && (
                            <Button
                                startIcon={<AddIcon />}
                                onClick={() => setCreateKeyDialog(true)}
                                disabled={isLoading}
                                aria-label= {`${getMessage('no_api_key_created')}`}
                                sx={{
                                    backgroundColor: '#F7941E',
                                    color: 'white',
                                    '&:hover': { backgroundColor: '#D17A1D' }
                                }}
                            >
                                 {`${getMessage('create_api_key')}`}
                            </Button>
                        )}
                    </Box>

                    {isLoading ? (
                        <Box display="flex" justifyContent="center" p={3}>
                            <CircularProgress />
                        </Box>
                    ) : apiKeys.length === 0 ? (
                        <Typography variant="body1" color="textSecondary" textAlign="center" py={3}>
                            {`${getMessage('no_api_key_created')}`}
                        </Typography>
                    ) : (
                        <Table aria-label="API Keys table">
                            <TableHead>
                                <TableRow>
                                    <TableCell>{`${getMessage('key_name')}`}</TableCell>
                                    <TableCell>{`${getMessage('key_api')}`}</TableCell>
                                    <TableCell>{`${getMessage('created_key_api')}`}</TableCell>
                                    <TableCell>{`${getMessage('actions_key_api')}`}</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {apiKeys.map((key) => (
                                    <TableRow key={key._id}>
                                        <TableCell>{key.name}</TableCell>
                                        <TableCell>
                                            <Box display="flex" alignItems="center" gap={1}>
                                                <Typography variant="body2" component="span" sx={{ fontFamily: 'monospace' }}>
                                                    {`${key.key.substring(0, 8)}...${key.key.substring(key.key.length - 4)}`}
                                                </Typography>
                                                <IconButton 
                                                    size="small" 
                                                    onClick={() => copyToClipboard(key.key)}
                                                    aria-label={`Copy API key for ${key.name}`}
                                                    color={copiedKey === key.key ? 'success' : 'default'}
                                                >
                                                    {copiedKey === key.key ? <DoneIcon /> : <ContentCopyIcon />}
                                                </IconButton>
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            {new Date(key.createdAt).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell>
                                            <IconButton
                                                onClick={() => {
                                                    setSelectedKeyToDelete(key._id);
                                                    setDeleteKeyDialog(true);
                                                }}
                                                color="error"
                                                aria-label={`Delete API key ${key.name}`}
                                            >
                                                <DeleteIcon />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </Box>

                {/* Delete Account Section */}
                <Box mt="10px" mr="20px" p="20px">
                    <Button
                        onClick={handleClickDeleteAccount}
                        disabled={isLoading}
                        aria-label="Delete account"
                        sx={{
                            backgroundColor: 'red',
                            color: 'white',
                            '&:hover': { backgroundColor: 'darkred' }
                        }}
                    >
                        {getMessage('label_delete_account')}
                    </Button>
                </Box>

                {/* Create API Key Dialog */}
                <Dialog 
                    open={createKeyDialog} 
                    onClose={() => !isLoading && setCreateKeyDialog(false)}
                    aria-labelledby="create-key-dialog-title"
                >
                    <DialogTitle id="create-key-dialog-title">
                         {`${getMessage('create_new_api_key')}`}
                    </DialogTitle>
                    <DialogContent>
                        <TextField
                            autoFocus
                            margin="dense"
                            label={`${getMessage('key_name')}`}
                            fullWidth
                            variant="outlined"
                            value={newKeyName}
                            onChange={(e) => setNewKeyName(e.target.value)}
                            disabled={isLoading}
                            sx={{ mb: 2 }}
                            aria-label="API key name"
                        />
                    </DialogContent>
                    <DialogActions>
                        <Button 
                            onClick={() => setCreateKeyDialog(false)}
                            disabled={isLoading}
                            aria-label="Cancel creating API key"
                        >
                            {`${getMessage('cancel_key_create')}`}
                        </Button>
                        <Button 
                            onClick={handleCreateKey}
                            disabled={isLoading}
                            aria-label="Create new API key"
                            sx={{
                                backgroundColor: '#F7941E',
                                color: 'white',
                                '&:hover': { backgroundColor: '#D17A1D' }
                            }}
                        >
                            {isLoading ? <CircularProgress size={24} /> : `${getMessage('key_name_create')}`}
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* Delete API Key Dialog */}
                <Dialog 
                    open={deleteKeyDialog} 
                    onClose={() => !isLoading && setDeleteKeyDialog(false)}
                    aria-labelledby="delete-key-dialog-title"
                    aria-describedby="delete-key-dialog-description"
                >
                    <DialogTitle id="delete-key-dialog-title">
                        {`${getMessage('delete_key_api')}`}
                    </DialogTitle>
                    <DialogContent>
                        <DialogContentText id="delete-key-dialog-description">
                            {`${getMessage('delete_key_api_message')}`}
                        </DialogContentText>
                    </DialogContent>
                    <DialogActions>
                        <Button 
                            onClick={() => setDeleteKeyDialog(false)}
                            disabled={isLoading}
                            aria-label="Cancel deleting API key"
                        >
                             {`${getMessage('cancel_key_create')}`}
                        </Button>
                        <Button 
                            onClick={handleDeleteKey}
                            disabled={isLoading}
                            aria-label="Confirm delete API key"
                            sx={{
                                backgroundColor: 'red',
                                color: 'white',
                                '&:hover': { backgroundColor: 'darkred' }
                            }}
                        >
                            {isLoading ? <CircularProgress size={24} /> : `${getMessage('label_delete')}`}
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* Delete Account Dialog */}
                <Dialog 
                    open={dialogConfirmDeleteOpen} 
                    onClose={() => !isLoading && handleCloseDeleteAccount()}
                    aria-labelledby="delete-account-dialog-title"
                    aria-describedby="delete-account-dialog-description"
                >
                    <DialogTitle id="delete-account-dialog-title">
                        {getMessage('label_delete_account_question')}
                    </DialogTitle>
                    <DialogContent>
                        <DialogContentText id="delete-account-dialog-description">
                            {getMessage('label_delete_account_consequences')}
                        </DialogContentText>
                    </DialogContent>
                    <DialogActions>
                        <Button 
                            onClick={handleCloseDeleteAccount}
                            disabled={isLoading}
                            aria-label="Cancel account deletion"
                            color="primary"
                        >
                            {getMessage('label_cancel')}
                        </Button>
                        <Button 
                            onClick={handleConfirmDeleteAccount}
                            disabled={isLoading}
                            aria-label="Confirm account deletion"
                            sx={{
                                backgroundColor: 'red',
                                color: 'white',
                                '&:hover': { backgroundColor: 'darkred' }
                            }}
                        >
                            {isLoading ? (
                                <CircularProgress size={24} />
                            ) : (
                                getMessage('label_delete')
                            )}
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* Notifications */}
                <Snackbar
                    open={notification.open}
                    autoHideDuration={6000}
                    onClose={handleNotificationClose}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                >
                    <Alert
                        onClose={handleNotificationClose}
                        severity={notification.severity}
                        variant="filled"
                        sx={{ width: '100%' }}
                    >
                        {notification.message}
                    </Alert>
                </Snackbar>
            </Box>
        </Box>
    );
};

export default Settings;