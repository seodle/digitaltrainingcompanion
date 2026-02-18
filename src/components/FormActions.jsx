import React, { useState } from 'react';
import { Box, Button, Typography, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions } from '@mui/material';
import { useMessageService } from '../services/MessageService';
import { buttonStyle } from './styledComponents';

const FormActions = ({ handleReset, handleSubmit, questionsExist }) => {

    const { getMessage } = useMessageService();
    const [openResetConfirm, setOpenResetConfirm] = useState(false);

    const handleResetClick = () => {
        setOpenResetConfirm(true);
    };

    const handleConfirmReset = () => {
        setOpenResetConfirm(false);
        handleReset();
    };

    const handleCancelReset = () => {
        setOpenResetConfirm(false);
    };

    // Return statement for JSX
    return (
        <>
            <Box mt={5} display="flex" justifyContent="space-between" m="20px">
                <Button
                    type="button"
                    variant="contained"
                    onClick={handleResetClick}
                    sx={buttonStyle}
                >
                    <Typography variant="h5">{getMessage('label_reset')}</Typography>
                </Button>
                {questionsExist && (
                    <Button
                        type="submit"
                        variant="contained"
                        onClick={handleSubmit}
                        sx={buttonStyle}
                    >
                        <Typography variant="h5">{getMessage('label_validate')}</Typography>
                    </Button>
                )}
            </Box>

            {/* Reset Confirmation Dialog */}
            <Dialog
                open={openResetConfirm}
                onClose={handleCancelReset}
            >
                <DialogTitle variant="h3">{getMessage("label_confirmation")}</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        {getMessage("label_ask_confirmation")}
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCancelReset} color="primary">
                        {getMessage("label_cancel")}
                    </Button>
                    <Button onClick={handleConfirmReset} color="primary" autoFocus>
                        {getMessage("label_continue")}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default FormActions;