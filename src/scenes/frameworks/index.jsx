import React from 'react';
import { Box } from "@mui/material";
import Sidebar from "../global/Sidebar";
import Topbar from "../global/Topbar";

const Frameworks = () => {

    return (
        <Box display="flex" style={{ height: '100vh', overflow: 'auto' }}>
            <Sidebar />
            <Box display="flex" flex="1" flexDirection="column">
                <Box mt="10px" ml="10px">
                    <Topbar title="Frameworks" />
                </Box>

                </Box>
        </Box>
    );
}

export default Frameworks;
