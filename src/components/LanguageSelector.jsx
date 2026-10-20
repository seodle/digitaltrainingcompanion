import React, { useState } from 'react';
import { Box, Select, MenuItem, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button } from '@mui/material';
import { useLanguage } from '../contexts/LanguageContext';
import { useMessageService } from '../services/MessageService';

const LanguageSelector = () => {
    const { languageCode, setLanguageCode, languageChangeGuardRef } = useLanguage();
    const { getMessage } = useMessageService();
    const [pendingLanguage, setPendingLanguage] = useState(null);

    const changeLanguage = (newLanguage) => {
        // Ask for confirmation when the current page would lose unsaved work
        if (newLanguage !== languageCode && languageChangeGuardRef.current?.()) {
            setPendingLanguage(newLanguage);
            return;
        }
        setLanguageCode(newLanguage);
    };

    const confirmLanguageChange = () => {
        setLanguageCode(pendingLanguage);
        setPendingLanguage(null);
    };

    const flagSx = {
        '& .fi': {
            display: 'inline-block',
            width: '1.5em',
            height: '1.125em',
        },
    };

    return (
        <Box display="flex" justifyContent="flex-end">
            <Select
                value={languageCode}
                onChange={(e) => changeLanguage(e.target.value)}
                size="small"
                MenuProps={{
                    disableScrollLock: true,
                    PaperProps: {
                        sx: {
                            zIndex: 2000,
                            mt: 0.5,
                        },
                    },
                }}
                sx={{
                    boxShadow: 'none',
                    '.MuiOutlinedInput-notchedOutline': { border: 0 },
                    ...flagSx,
                }}
            >
                <MenuItem value="en" sx={flagSx}><span className="fi fi-gb" /></MenuItem>
                <MenuItem value="fr" sx={flagSx}><span className="fi fi-fr" /></MenuItem>
                <MenuItem value="de" sx={flagSx}><span className="fi fi-de" /></MenuItem>
                <MenuItem value="es" sx={flagSx}><span className="fi fi-es" /></MenuItem>
                <MenuItem value="it" sx={flagSx}><span className="fi fi-it" /></MenuItem>
            </Select>
            <Dialog open={pendingLanguage !== null} onClose={() => setPendingLanguage(null)}>
                <DialogTitle variant="h3">{getMessage("label_confirmation")}</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        {getMessage("message_unsaved_survey_language_warning")}
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setPendingLanguage(null)} color="primary">
                        {getMessage("label_stay")}
                    </Button>
                    <Button onClick={confirmLanguageChange} color="primary" autoFocus>
                        {getMessage("label_change_language")}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default LanguageSelector;