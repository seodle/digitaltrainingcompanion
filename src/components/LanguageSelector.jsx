import React from 'react';
import { Box, Select, MenuItem } from '@mui/material';
import { useLanguage } from '../contexts/LanguageContext';

const LanguageSelector = () => {
    const { languageCode, setLanguageCode } = useLanguage();

    const changeLanguage = (newLanguage) => {
        setLanguageCode(newLanguage);
    };

    return (
        <Box display="flex" justifyContent="flex-end">
            <Select
                value={languageCode}
                onChange={(e) => changeLanguage(e.target.value)}
                size="small"
                sx={{ boxShadow: 'none', '.MuiOutlinedInput-notchedOutline': { border: 0 } }}
            >
                <MenuItem value="en"><span className="fi fi-gb"></span></MenuItem>
                <MenuItem value="fr"><span className="fi fi-fr"></span></MenuItem>
                <MenuItem value="de"><span className="fi fi-de"></span></MenuItem>
                <MenuItem value="es"><span className="fi fi-es"></span></MenuItem>
                <MenuItem value="it"><span className="fi fi-it"></span></MenuItem>

            </Select>
        </Box>
    );
};

export default LanguageSelector;