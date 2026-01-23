import React, { useState } from 'react';
import { Box, Chip, Snackbar, Alert } from "@mui/material";
import VideogameAssetIcon from '@mui/icons-material/VideogameAsset';
import { useMessageService } from '../../services/MessageService';


const Footer = () => {
    const [openSnackbar, setOpenSnackbar] = useState(false);
    const token = localStorage.getItem("token");
    const { getMessage } = useMessageService();
    let isSandboxMode = false;

    if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        isSandboxMode = payload.sandbox;
    }

    const handleReportBugClick = () => {
        navigator.clipboard.writeText("contact@digitaltrainingcompanion.ch")
            .then(() => {
                setOpenSnackbar(true);
            })
            .catch(err => {
                console.error('Could not copy email to clipboard: ', err);
            });
    };

    const handleCloseSnackbar = () => {
        setOpenSnackbar(false);
    };

    return (
        <Box display="flex" justifyContent="center" alignItems="center" mb="10px">
            <Box display="flex" alignItems="center">
                <Chip
                    label="2.0.1"
                    variant="outlined"
                    color="primary"
                    sx={{ marginRight: 2 }}
                />

                {isSandboxMode && (
                    <Chip
                        icon={<VideogameAssetIcon style={{ color: 'black' }} />}
                        label={getMessage('label_sandbox_mode')}
                        variant="outlined"
                        sx={{ p: '5px', marginRight: 2, color: 'black', bgcolor: 'rgb(195,114,45)', border: 'none' }}
                    />
                )}

                <Chip 
                    label={getMessage('label_report_bug')}
                    variant="outlined"
                    onClick={handleReportBugClick}
                    sx={{ cursor: 'pointer' }}
                />
            </Box>

            <Snackbar open={openSnackbar} autoHideDuration={3000} onClose={handleCloseSnackbar}>
                <Alert onClose={handleCloseSnackbar} severity="success" sx={{ width: '100%' }}>
                    {getMessage('label_email_address_copied')}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default Footer;
