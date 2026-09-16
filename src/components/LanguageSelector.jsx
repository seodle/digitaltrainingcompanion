import React from 'react';
import { Box, Select, MenuItem } from '@mui/material';
import { useLanguage } from '../contexts/LanguageContext';

const LanguageSelector = () => {
    const { languageCode, setLanguageCode } = useLanguage();

    const changeLanguage = (newLanguage) => {
        setLanguageCode(newLanguage);
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
        </Box>
    );
};

export default LanguageSelector;