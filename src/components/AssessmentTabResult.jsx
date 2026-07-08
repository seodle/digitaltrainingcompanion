import React, { useState } from 'react';
import { Box, Dialog, IconButton } from '@mui/material';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';
import { AssessmentTableResultTabChoice, AssessmentTableResultGraph } from './AssessmentTabResultsComponents';

const AssessmentTabResult = ({ 
    categories,
    gridRow,
    data,
    onChange,
    groupChartData,
    groupCommentData,
    fullScreen=false,
    aiSummaries,
    loadingSummaries,
    showPercentage,
}) => {
    const [expanded, setExpanded] = useState(false);

    const content = (isExpanded) => (
        <>
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
            <AssessmentTableResultGraph
                categories={categories}
                data={data}
                groupChartData={groupChartData}
                groupCommentData={groupCommentData}
                fullScreen={isExpanded}
                aiSummaries={aiSummaries}
                loadingSummaries={loadingSummaries}
                showPercentage={showPercentage}
            />
        </>
    );

    return (
        <>
            <Box gridColumn={`span ${fullScreen ? 12 : 6}`} gridRow={gridRow} sx={{ boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.1)', borderRadius: '15px', backgroundColor: '#fff' }}>
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

export default AssessmentTabResult;