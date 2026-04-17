import React, { useState } from 'react';
import { Box, Dialog, FormControl, IconButton, InputLabel, MenuItem } from '@mui/material';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';
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
    loadingSummaries = {},
    showPercentage,
}) => {
    const { getMessage } = useMessageService();
    const [expanded, setExpanded] = useState(false);

    const content = (isExpanded) => (
        <Box sx={{ position: 'relative', height: '100%', backgroundColor: '#fff' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ flex: 1 }}>
                    <AssessmentTableResultTabChoice
                        categories={categories}
                        onChange={onChange}
                        data={data}
                    />
                </Box>
                <IconButton onClick={() => setExpanded(v => !v)} size="small" sx={{ mr: 1 }}>
                    {isExpanded ? <FullscreenExitIcon /> : <FullscreenIcon />}
                </IconButton>
            </Box>

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
                    mt: 1.5,
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

            <AssessmentTableResultGraph
                categories={categories}
                data={data}
                groupChartData={groupChartData}
                groupCommentData={groupCommentData}
                fullScreen={isExpanded}
                hide_students_name={hide_students_name}
                aiSummaries={aiSummaries}
                loadingSummaries={loadingSummaries}
                showPercentage={showPercentage}
            />
        </Box>
    );

    return (
        <>
            <Box 
                gridColumn={`span ${fullScreen ? 12 : 6}`} 
                gridRow={gridRow} 
                sx={{ 
                    boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.1)', 
                    borderRadius: '15px', 
                    backgroundColor: '#fff',
                    position: 'relative'
                }}
            >
                {content(false)}
            </Box>
            <Dialog fullScreen open={expanded} onClose={() => setExpanded(false)}
                sx={{ '& .MuiDialog-paper': { backgroundColor: '#fff' } }}
            >
                {content(true)}
            </Dialog>
        </>
    );
};

export default AssessmentTabResultWithFilter;