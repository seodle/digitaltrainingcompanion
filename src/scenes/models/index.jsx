import React from 'react';
import { Box } from "@mui/material";
import Sidebar from "../global/Sidebar";
import Topbar from "../global/Topbar";

const Model = () => {

    return (
        <Box display="flex" sx={{ minHeight: '100vh', overflow: 'auto', maxWidth: '100vw' }}>
            <Sidebar />
            <Box display="flex" flex="1" flexDirection="column" sx={{ minWidth: 0 }}>
                <Box mt="10px" ml="10px">
                    <Topbar title="Model" />
                </Box>

                </Box>
        </Box>
    );
}

export default Model;
