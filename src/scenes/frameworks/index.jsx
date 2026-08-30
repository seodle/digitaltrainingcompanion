import React from 'react';
import { Box } from "@mui/material";
import Sidebar from "../global/Sidebar";
import Topbar from "../global/Topbar";

const Frameworks = () => {

    return (
        <Box display="flex" sx={{ height: '100%', overflow: 'hidden', maxWidth: '100vw', bgcolor: '#f9f9f9' }}>
            <Sidebar />
            <Box display="flex" flex="1" flexDirection="column" sx={{ minWidth: 0, minHeight: 0, overflow: 'auto' }}>
                <Box mt="10px" ml="10px">
                    <Topbar title="Frameworks" />
                </Box>

                </Box>
        </Box>
    );
}

export default Frameworks;
