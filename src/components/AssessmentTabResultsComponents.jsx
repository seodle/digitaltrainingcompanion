import React from 'react';
import { Box, Tabs, Tab, Typography } from '@mui/material';
import CommentIcon from '@mui/icons-material/Comment';
import BarChartReports from './BarChartReports';
import DisplayTextQuestion from './DisplayTextQuestions';
import PropTypes from 'prop-types';
import { localizeAssessmentType } from '../utils/ObjectsUtils';
import { useMessageService } from '../services/MessageService';

export const AssessmentTableResultTabChoice = ({ categories, onChange, data }) => {

    const { getMessage } = useMessageService();

    return (
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={data} onChange={onChange} aria-label="">
                {categories.flatMap((category, index) => {
                    const localizedLabel = localizeAssessmentType(category, getMessage);
                    return [
                        <Tab label={localizedLabel} key={`tab-${index * 2}`} />,
                        <Tab icon={<CommentIcon />} key={`comment-${index * 2 + 1}`} />
                    ];
                })}
            </Tabs>
        </Box>
    );
};

export const AssessmentTableResultGraph = ({ categories, data, groupChartData, groupCommentData, fullScreen, hide_students_name, aiSummaries, loadingSummaries }) => {

    return (
        categories.map((category, index) => (
            <React.Fragment key={category}>
                <CustomTabPanel value={data} index={index * 2}>
                    <Box 
                        sx={{ 
                            height: fullScreen ? '95vh' : '31vh', 
                            width: '95%', 
                            overflowY: 'auto',
                            overflowX: 'hidden'
                        }}
                    >
                        {Object.entries(groupChartData(category)).map(([assessmentName, workshops], assessmentIdx) => (
                            <React.Fragment key={`${assessmentName}-${assessmentIdx}`}>
                                <Typography align="center" color="rgb(102,102,102)" variant="h5" fontWeight="bold" mt='10px'>
                                    {assessmentName}
                                </Typography>
                                {Object.entries(workshops).map(([workshopName, items], workshopIdx) => (
                                    <BarChartReports 
                                        data={items} 
                                        key={`${workshopName}-${workshopIdx}`}
                                        hide_students_name={hide_students_name} 
                                        workshopName={workshopName !== "default" && workshopName !== assessmentName ? workshopName : ""}
                                    />
                                ))}
                            </React.Fragment>
                        ))}
                    </Box>
                </CustomTabPanel>

                <CustomTabPanel value={data} index={index * 2 + 1}>
                    <Box style={{ height: `${fullScreen ? '55vh' : '31vh'}`, width: '95%', overflowY: 'auto', overflowX: 'auto' }}>
                        {Object.entries(groupCommentData(category)).map(([assessmentName, workshops], assessmentIdx) => (
                            <React.Fragment key={`${assessmentName}-comments-${assessmentIdx}`}>
                                <Typography align="center" color="rgb(102,102,102)" variant="h5" fontWeight="bold" mt='10px'>
                                    {assessmentName}
                                </Typography>
                                {Object.entries(workshops).map(([workshopName, items], workshopIdx) => (
                                    <React.Fragment key={`${workshopName}-comments-${workshopIdx}`}>
                                        {workshopName !== "default" && workshopName !== assessmentName && (
                                            <Typography align="center" color="rgb(102,102,102)" variant="h6" mt='5px'>
                                                {workshopName}
                                            </Typography>
                                        )}
                                        {items.map((item) => {
                                            const summaryKey = item.uniqueQuestionKey;
                                            return (
                                                <DisplayTextQuestion
                                                    key={item.uniqueQuestionKey}
                                                    title={`${item.question}`}
                                                    content={item.responses}
                                                    displayName={item.displayName}
                                                    aiSummary={aiSummaries[summaryKey]}
                                                    loadingSummary={loadingSummaries[item.uniqueQuestionKey]}
                                                />
                                            );
                                        })}
                                    </React.Fragment>
                                ))}
                            </React.Fragment>
                        ))}
                    </Box>
                </CustomTabPanel>
            </React.Fragment>
        ))
    );
};

function CustomTabPanel(props) {
    const { children, value, index, ...other } = props;

    return (
        <Box
            role="tabpanel"
            hidden={value !== index}
            id={`simple-tabpanel-${index}`}
            aria-labelledby={`simple-tab-${index}`}
            sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'auto',
            }}
            {...other}
        >
            {value === index && (
                <>{children}</>
            )}
        </Box>
    );
}

CustomTabPanel.propTypes = {
    children: PropTypes.node,
    index: PropTypes.number.isRequired,
    value: PropTypes.number.isRequired,
};