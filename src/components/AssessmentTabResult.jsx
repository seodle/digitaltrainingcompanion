import React from 'react';
import { Box } from '@mui/material';

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
}) => {

    return (
        
        <Box gridColumn={`span ${fullScreen ? 12 : 6}`} gridRow={gridRow} sx={{ boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.1)', borderRadius: '15px', backgroundColor: '#fff' }}>
            <AssessmentTableResultTabChoice
                categories={categories}
                onChange={onChange}
                data={data}
            />

            <AssessmentTableResultGraph
                categories={categories}
                data={data}
                groupChartData={groupChartData}
                groupCommentData={groupCommentData}
                fullScreen={fullScreen}
                aiSummaries={aiSummaries}
                loadingSummaries={loadingSummaries}
            />
        </Box>
    );
};

export default AssessmentTabResult;