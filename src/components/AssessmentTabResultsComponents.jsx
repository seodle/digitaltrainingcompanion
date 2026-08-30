import React, { useState } from 'react';
import { Box, Tabs, Tab, Typography, FormControl, InputLabel, MenuItem, Select } from '@mui/material';
import CommentIcon from '@mui/icons-material/Comment';
import BarChartIcon from '@mui/icons-material/BarChart';
import BarChartReports from './BarChartReports';
import DisplayTextQuestion from './DisplayTextQuestions';
import ParticipantRankingPanel from './ParticipantRankingPanel';
import PropTypes from 'prop-types';
import { localizeAssessmentType } from '../utils/ObjectsUtils';
import { useMessageService } from '../services/MessageService';
import { AssessmentType } from '../utils/enums';

export const AssessmentTableResultTabChoice = ({ categories, onChange, data }) => {

    const { getMessage } = useMessageService();

    return (
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs
                value={data}
                onChange={onChange}
                aria-label=""
                variant="scrollable"
                scrollButtons={false}
                sx={{
                    '& .MuiTabs-flexContainer': { justifyContent: 'flex-start' },
                }}
            >
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

export const AssessmentTableResultGraph = ({ categories, data, groupChartData, groupCommentData, fullScreen, hide_students_name, aiSummaries, loadingSummaries, showPercentage }) => {
    return (
        categories.map((category, index) => (
            <React.Fragment key={category}>
                <CustomTabPanel value={data} index={index * 2}>
                    <Box 
                        sx={{ 
                            height: { xs: fullScreen ? '80vh' : 'auto', md: fullScreen ? '95vh' : '31vh' },
                            minHeight: { xs: 240, md: 0 },
                            width: '95%', 
                            overflowY: 'auto',
                            overflowX: 'auto'
                        }}
                    >
                        {Object.entries(groupChartData(category)).map(([assessmentName, workshops], assessmentIdx) => (
                            <React.Fragment key={`${assessmentName}-${assessmentIdx}`}>
                                <Typography color="rgb(102,102,102)" variant="h5" fontWeight="bold" mt='10px' ml={1} textAlign="left">
                                    {assessmentName}
                                </Typography>
                                {Object.entries(workshops).map(([workshopName, items], workshopIdx) => (
                                    <BarChartReports 
                                    data={items} 
                                    key={`${workshopName}-${workshopIdx}`}
                                    hide_students_name={hide_students_name} 
                                    workshopName={workshopName !== "default" && workshopName !== assessmentName ? workshopName : ""}
                                    showPercentage={showPercentage}
                                />
                                ))}
                            </React.Fragment>
                        ))}
                    </Box>
                </CustomTabPanel>

                <CustomTabPanel value={data} index={index * 2 + 1}>
                <Box sx={{ height: { xs: fullScreen ? '80vh' : 'auto', md: fullScreen ? '95vh' : '31vh' }, minHeight: { xs: 240, md: 0 }, width: '95%', overflowY: 'auto', overflowX: 'auto' }}>
                        {Object.entries(groupCommentData(category)).map(([assessmentName, workshops], assessmentIdx) => (
                            <React.Fragment key={`${assessmentName}-comments-${assessmentIdx}`}>
                                <Typography color="rgb(102,102,102)" variant="h5" fontWeight="bold" mt='10px' ml={1} textAlign="left">
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
                alignItems: 'stretch',
                justifyContent: 'flex-start',
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

const AssessmentResultCard = ({
    assessment,
    charts,
    comments,
    hide_students_name,
    aiSummaries,
    loadingSummaries,
    showPercentage,
    hideValueLabels,
    showChoiceLabels,
    showTeacherFilter,
    teachers,
    selectedTeacher,
    handleChangeTeacher,
    onGenerateSummary,
}) => {
    const { getMessage } = useMessageService();
    const [tab, setTab] = useState(0);

    return (
        <Box
            sx={{
                boxShadow: '0px 8px 24px rgba(0, 0, 0, 0.06)',
                borderRadius: '16px',
                backgroundColor: '#fff',
                p: { xs: 1.5, md: 2 },
                minWidth: 0,
                height: '100%',
                overflow: 'hidden',
            }}
        >
            <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1.5 }}>
                <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography variant="h5" fontWeight="bold" color="rgb(102,102,102)" sx={{ wordBreak: 'break-word' }}>
                        {assessment.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        {localizeAssessmentType(assessment.type, getMessage)}
                    </Typography>
                </Box>
                {showTeacherFilter && (
                    <FormControl variant="outlined" size="small" sx={{ minWidth: { xs: '100%', sm: 200 }, maxWidth: { xs: '100%', sm: 320 } }}>
                        <InputLabel id={`teacher-filter-${assessment._id}`}>{getMessage("label_choose_teacher")}</InputLabel>
                        <Select
                            labelId={`teacher-filter-${assessment._id}`}
                            value={selectedTeacher || ''}
                            onChange={(event) => handleChangeTeacher?.(event.target.value)}
                            label={getMessage("label_choose_teacher")}
                        >
                            <MenuItem value="">{getMessage("label_clear_filter")}</MenuItem>
                            {(teachers || []).map((teacher) => (
                                <MenuItem key={teacher.id} value={teacher.id}>
                                    {teacher.label}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                )}
            </Box>

            <Tabs
                value={tab}
                onChange={(_, value) => setTab(value)}
                sx={{ borderBottom: 1, borderColor: 'divider', mt: 1, mb: 1.5 }}
            >
                <Tab icon={<BarChartIcon />} />
                <Tab icon={<CommentIcon />} />
            </Tabs>

            {tab === 0 && charts && Object.entries(charts).map(([workshopName, items], workshopIdx) => (
                <BarChartReports
                    data={items}
                    key={`${assessment._id}-chart-${workshopIdx}`}
                    hide_students_name={hide_students_name}
                    workshopName={workshopName !== "default" && workshopName !== assessment.name ? workshopName : ""}
                    showPercentage={showPercentage}
                    hideValueLabels={hideValueLabels}
                    showChoiceLabels={showChoiceLabels}
                />
            ))}

            {tab === 1 && comments && Object.entries(comments).map(([workshopName, items], workshopIdx) => (
                <Box key={`${assessment._id}-comments-${workshopIdx}`}>
                    {workshopName !== "default" && workshopName !== assessment.name && (
                        <Typography align="center" color="rgb(102,102,102)" variant="h6" mt="5px">
                            {workshopName}
                        </Typography>
                    )}
                    {items.map((item) => (
                        <DisplayTextQuestion
                            key={item.uniqueQuestionKey}
                            title={`${item.question}`}
                            content={item.responses}
                            displayName={
                                hide_students_name
                                    ? (item.displayName || []).map(() => getMessage('label_anonymous'))
                                    : item.displayName
                            }
                            aiSummary={aiSummaries?.[item.uniqueQuestionKey]}
                            loadingSummary={loadingSummaries?.[item.uniqueQuestionKey]}
                            onGenerateSummary={
                                onGenerateSummary
                                    ? () => onGenerateSummary(
                                        item.responses || [],
                                        item.question,
                                        item.uniqueQuestionKey
                                    )
                                    : undefined
                            }
                        />
                    ))}
                </Box>
            ))}
        </Box>
    );
};

export const AssessmentResultStack = ({
    assessments,
    rankingAssessments,
    groupChartData,
    groupCommentData,
    hide_students_name,
    aiSummaries,
    loadingSummaries,
    showPercentage,
    hideValueLabels,
    showChoiceLabels,
    showTeacherFilter,
    teachers,
    selectedTeacher,
    handleChangeTeacher,
    highlightedParticipant,
    anonymizeRanking,
    onGenerateSummary,
}) => {
    const ordered = [...(assessments || [])].sort(
        (a, b) => (a.position ?? Number.MAX_SAFE_INTEGER) - (b.position ?? Number.MAX_SAFE_INTEGER)
    );

    return (
        <Box display="flex" flexDirection="column" gap={2} sx={{ width: '100%' }}>
            {ordered.map((assessment) => {
                const charts = groupChartData(assessment.type)?.[assessment.name];
                const comments = groupCommentData(assessment.type)?.[assessment.name];
                if (!charts && !comments) {
                    return null;
                }

                const rankingAssessment = (rankingAssessments || []).find(
                    (item) => item._id === assessment._id
                ) || assessment;

                return (
                    <Box
                        key={assessment._id}
                        sx={{
                            display: 'flex',
                            flexDirection: { xs: 'column', lg: 'row' },
                            alignItems: 'stretch',
                            gap: 2,
                        }}
                    >
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                            <AssessmentResultCard
                                assessment={assessment}
                                charts={charts}
                                comments={comments}
                                hide_students_name={
                                    anonymizeRanking ||
                                    (hide_students_name &&
                                    [
                                        AssessmentType.STUDENT_CHARACTERISTICS,
                                        AssessmentType.STUDENT_LEARNING_OUTCOMES,
                                    ].includes(assessment.type))
                                }
                                showTeacherFilter={
                                    showTeacherFilter &&
                                    [
                                        AssessmentType.STUDENT_CHARACTERISTICS,
                                        AssessmentType.STUDENT_LEARNING_OUTCOMES,
                                    ].includes(assessment.type)
                                }
                                teachers={teachers}
                                selectedTeacher={selectedTeacher}
                                handleChangeTeacher={handleChangeTeacher}
                                aiSummaries={aiSummaries}
                                loadingSummaries={loadingSummaries}
                                showPercentage={showPercentage}
                                hideValueLabels={hideValueLabels}
                                showChoiceLabels={showChoiceLabels}
                                onGenerateSummary={onGenerateSummary}
                            />
                        </Box>
                        <Box
                            sx={{
                                width: { xs: '100%', lg: 360 },
                                flexShrink: 0,
                                display: 'flex',
                                minHeight: { xs: 320, lg: 'auto' },
                            }}
                        >
                            <ParticipantRankingPanel
                                assessments={[rankingAssessment]}
                                highlightedParticipant={highlightedParticipant}
                                anonymize={anonymizeRanking}
                            />
                        </Box>
                    </Box>
                );
            })}
        </Box>
    );
};