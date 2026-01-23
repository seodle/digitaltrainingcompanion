import React from 'react';
import { Box, FormControl, InputLabel, MenuItem } from '@mui/material';
import Select from '@mui/material/Select';
import { useMessageService } from '../services/MessageService';
import { AssessmentTableResultTabChoice, AssessmentTableResultGraph } from './AssessmentTabResultsComponents';

const AssessmentTabResultWithFilter = ({ 
    categories, 
    gridRow, 
    data, 
    onChange, 
    groupChartData, 
    groupCommentData, 
    fullScreen = false, 
    hide_students_name = true,
    allUsers, 
    selectedUser, 
    handleChangeUser,
    aiSummaries = {},
    loadingSummaries = {}
}) => {
    const { getMessage } = useMessageService();

    return (
        <Box 
            gridColumn={`span ${fullScreen ? 12 : 6}`} 
            gridRow={gridRow} 
            sx={{ 
                boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.1)', 
                borderRadius: '15px', 
                backgroundColor: '#fff',
                position: 'relative' // Enable absolute positioning context
            }}
        >
            {/* Tabs section */}
            <AssessmentTableResultTabChoice
                categories={categories}
                onChange={onChange}
                data={data}
            />

            {/* Filter overlay */}
            <Box 
                sx={{ 
                    position: 'absolute',
                    top: '48px',
                    left: '10px',
                    zIndex: 1,
                    backgroundColor: 'rgba(255, 255, 255, 0)',
                    borderRadius: '4px'
                }}
            >
                <FormControl variant="outlined" size="small" 
                sx={{ 
                    minWidth: 150,
                     mt : 1.5,
                     backgroundColor: 'rgba(255, 255, 255, 1)'}}>
                    <InputLabel id="label_set_selected_user">{getMessage("label_choose_teacher")}</InputLabel>
                    <Select
                        value={selectedUser}
                        onChange={handleChangeUser}
                        autoWidth
                        label={getMessage("label_choose_teacher")}
                    >
                        <MenuItem value="">
                            {getMessage("label_clear_filter")}
                        </MenuItem>
                        {allUsers && allUsers.map((user) => (
                            <MenuItem key={user._id} value={user._id}>
                                {user.firstName} {user.lastName} 
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Box>

            {/* Main content */}
            <AssessmentTableResultGraph
                categories={categories}
                data={data}
                groupChartData={groupChartData}
                groupCommentData={groupCommentData}
                fullScreen={fullScreen}
                hide_students_name={hide_students_name}
                aiSummaries={aiSummaries}
                loadingSummaries={loadingSummaries}
            />
        </Box>
    );
};

export default AssessmentTabResultWithFilter;