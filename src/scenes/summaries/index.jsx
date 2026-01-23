

import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import Sidebar from "../../scenes/global/Sidebar";
import Topbar from "../../scenes/global/Topbar";
import BarChartSummaries from '../../components/BarChartSummaries';
import { InputLabel, Box, Tabs, Tab, MenuItem, FormControl, Button } from "@mui/material";
import Select from '@mui/material/Select';
import jwt_decode from "jwt-decode";
import axios from 'axios';
import { BACKEND_URL } from "../../config";
import { AssessmentType, QuestionType, LearningType } from '../../utils/enums';
import { getWorkshopDetailsById } from '../../utils/SurveyUtils';

const Summaries = () => {

  const [monitorings, setMonitorings] = useState([]);
  const [selectedMonitoring, setSelectedMonitoring] = useState('');
  const [currentUserId, setCurrentUserId] = useState('');
  const [valuePanelOne, setValuePanelOne] = useState(0);
  const [valuePanelTwo, setValuePanelTwo] = useState(0);
  const [valuePanelThree, setValuePanelThree] = useState(0);
  const [valuePanelFour, setValuePanelFour] = useState(0);
  const [teacherKnowledgeData, setTeacherKnowledgeData] = useState([]);
  const [teacherCompetenciesData, setTeacherCompetenciesData] = useState([]);
  const [studentCompetenciesData, setStudentCompetenciesData] = useState([]);
  const [teacherImplementationData, setTeacherImplementationData] = useState([]);
  const [teacherOrganizationalNeedsData, setTeacherOrganizationalNeedsData] = useState([]);

  // Get all the monitorings of the current user when page loads
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      console.log('No token found');
      return;
    }
    const decodedToken = jwt_decode(token);
    setCurrentUserId(decodedToken._id)

    const fetchMonitorings = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(`${BACKEND_URL}/monitorings/${decodedToken._id}`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        setMonitorings(response.data.monitorings);

      } catch (error) {
        console.log(error);
      }
    };

    fetchMonitorings(); 
  }, [currentUserId]); 


  useEffect(() => {
      const token = localStorage.getItem("token");
      const fetchMonitorings = async () => {
        if (selectedMonitoring) {
          try {
            const response = await axios.get(`${BACKEND_URL}/responses/monitoring/${selectedMonitoring}`, {
              headers: { Authorization: `Bearer ${token}` }
            });

            // Fetch assessments for this monitoring to obtain workshops used for label resolution
            const assessmentsResponse = await axios.get(`${BACKEND_URL}/assessments/${selectedMonitoring}`, {
              headers: { Authorization: `Bearer ${token}` }
            }).catch(() => ({ data: [] }));

            const monitoringWorkshops = [];
            const foundWorkshopIds = new Set();
            (assessmentsResponse.data || []).forEach(assessment => {
              (assessment?.workshops || []).forEach(workshop => {
                const id = workshop && workshop._id ? String(workshop._id) : null;
                if (id && !foundWorkshopIds.has(id)) {
                  foundWorkshopIds.add(id);
                  monitoringWorkshops.push(workshop);
                }
              });
            });
            
            const teacherKnowledgeProcessedData = processTeacherKnowledgeData(response.data, monitoringWorkshops);
            setTeacherKnowledgeData(teacherKnowledgeProcessedData);

            const teacherImplementationProcessedData = processTeacherImplementationData(response.data, monitoringWorkshops);
            setTeacherImplementationData(teacherImplementationProcessedData);

            const teacherOrganizationalNeedsProcessedData = processTeacherOrganizationalNeedsData(response.data);
            setTeacherOrganizationalNeedsData(teacherOrganizationalNeedsProcessedData);

            const teacherCompetenciesProcessedData = processTeacherCompetenciesData(response.data);
            setTeacherCompetenciesData(teacherCompetenciesProcessedData);

            const studentCompetenciesProcessedData = processStudentCompetenciesData(response.data);
            setStudentCompetenciesData(studentCompetenciesProcessedData);

          } catch (error) {
            console.error('Error fetching data:', error);
          }
        }
      };

      fetchMonitorings();
    }, [selectedMonitoring]);

const processTeacherKnowledgeData = (responseData, monitoringWorkshops = []) => {
    const workshopScores = {};

    // Iterate over each response
    responseData.forEach(response => {
      if (response.assessmentType === AssessmentType.LEARNING) {
        const questions = response.survey.filter(q => q.learningType === LearningType.KNOWLEDGE);

        questions.forEach(question => {
          const workshopKey = question.workshopId ? String(question.workshopId) : "General"; // Use "General" if no specific workshop id is given

          // Initialize workshop score tracking
          if (!workshopScores[workshopKey]) {
            workshopScores[workshopKey] = { total: 0, correct: 0 };
          }

          const userAnswer = question.response[0];
          const correctAnswer = question.correctAnswer;

          workshopScores[workshopKey].total += 1;
          if (userAnswer === correctAnswer) {
            workshopScores[workshopKey].correct += 1;
          }
        });
      }
    });

    const formattedData = Object.keys(workshopScores).map(workshopKey => {
    const { total, correct } = workshopScores[workshopKey];
    const score = total > 0 ? ((correct / total) * 100) : 0;
    return { 
      Name: workshopKey === "General" ? "General" : ((getWorkshopDetailsById(monitoringWorkshops, workshopKey)?.label) || workshopKey), 
      Score: score > 0 ? score.toFixed() : 0.1,
      "Score Count": total,
 };
 
  });

  return formattedData;
};

const processTeacherImplementationData = (responseData, monitoringWorkshops = []) => {
  const frequencyScores = {};
  let questionChoices = [];

  responseData.forEach(response => {
    if (response.assessmentType === AssessmentType.BEHAVIORAL_CHANGES) {
      response.survey.forEach(question => {
      if (question.adoptionType === "Actual use of training content" && question.questionType === QuestionType.RADIO_ORDERED) {
        const workshopKey = question.workshopId ? String(question.workshopId) : "General";
        if (!frequencyScores[workshopKey]) {
          frequencyScores[workshopKey] = { totalFrequency: 0, responses: 0 };
        }

        if (questionChoices.length === 0 && question.choices) {
          questionChoices = question.choices; 
        }

        // Convert question response to a numerical value
        const responseValue = question.choices.indexOf(question.response[0]);
        if (responseValue >= 0) {
          frequencyScores[workshopKey].totalFrequency += responseValue;
          frequencyScores[workshopKey].responses += 1;
        }
        }
      });
    }
  });

  const formattedData = Object.keys(frequencyScores).map(workshopKey => {
    const { totalFrequency, responses } = frequencyScores[workshopKey];
    const meanFrequency = responses > 0 ? (totalFrequency / responses) : 0;
    return {
      Name: workshopKey === "General" ? "General" : ((getWorkshopDetailsById(monitoringWorkshops, workshopKey)?.label) || workshopKey),
      Score: meanFrequency > 0 ? meanFrequency.toFixed(2) : 0.1,
      "Score Count": responses,
      yAxisLabels: questionChoices
    };
  });

  return formattedData;
};

const processTeacherOrganizationalNeedsData = (responseData) => {
  let organizationalScores = {};
  let questionChoices = [];

  responseData.forEach(response => {
    if (response.assessmentType === AssessmentType.ORGANIZATIONAL_CONDITIONS) {
      response.survey.forEach(question => {
        if (question.questionType === QuestionType.RADIO_ORDERED) {
          const organizationalType = question.organizationalType;
         
          if (questionChoices.length === 0 && question.choices) {
            questionChoices = question.choices; 
          }

          const responseIndex = question.choices.indexOf(question.response[0]);

          if (!organizationalScores[organizationalType]) {
            organizationalScores[organizationalType] = { totalFrequency: 0, responses: 0 };
          }

          if (responseIndex !== -1) {
            organizationalScores[organizationalType].totalFrequency += (responseIndex + 1); // Assuming choice indexing starts at 0, so add 1 for a 1-based score
            organizationalScores[organizationalType].responses += 1;
          }
        }
      });
    }
  });


  // Convert the accumulated scores into a formatted array of mean values
  const formattedData = Object.entries(organizationalScores).map(([type, data]) => {
    const meanScore = data.responses > 0 ? data.totalFrequency / data.responses : 0;

    return {
      Name: type,
      Score: meanScore > 0 ? meanScore.toFixed(2) : 0.1,
      "Score Count": data.responses,
      yAxisLabels: questionChoices

    };
  });

  return formattedData;
};

const processTeacherCompetenciesData = (responseData) => {
  const competencyScores = {};
  const competencySelfEfficacyScores = {};

  // Processing for "Learning" assessment type
  responseData.forEach(response => {
    if (response.assessmentType === AssessmentType.LEARNING) {
      response.survey.forEach(question => {
        if (question.learningType === LearningType.SKILL && question.competencies) {
          question.competencies.forEach(competency => {
            if (!competencyScores[competency]) {
              competencyScores[competency] = { total: 0, correct: 0 };
            }

            const userAnswer = question.response[0];
            const correctAnswer = question.correctAnswer;

            competencyScores[competency].total += 1;
            if (userAnswer === correctAnswer) {
              competencyScores[competency].correct += 1;
            }
          });
        }
      });
    }
  });

  // Processing for "Behavioral changes" assessment type
  responseData.forEach(response => {
    if (response.assessmentType === AssessmentType.BEHAVIORAL_CHANGES) {
      response.survey.forEach(question => {
        if (question.adoptionType === "Transfer of digital skills" && question.questionType === QuestionType.RADIO_ORDERED && question.competencies) {
          question.competencies.forEach(competency => {
            if (!competencySelfEfficacyScores[competency]) {
              competencySelfEfficacyScores[competency] = { total: 0, count: 0 };
            }

            const choicesLength = question.choices.length;
            const responseIndex = question.choices.indexOf(question.response[0]);
            const responseValue = (responseIndex / (choicesLength - 1)) * 100;

            competencySelfEfficacyScores[competency].total += responseValue;
            competencySelfEfficacyScores[competency].count += 1;
          });
        }
      });
    }
  });

  // Combine keys from both competencyScores and competencySelfEfficacyScores
  const allCompetencies = new Set([...Object.keys(competencyScores), ...Object.keys(competencySelfEfficacyScores)]);

  // Generate formatted data for all competencies, applying minimal value for zero values
  const formattedData = Array.from(allCompetencies).map(competency => {
    const masteryCount = competencyScores[competency]?.total || 0;
    const masteryScore = masteryCount > 0 ? parseFloat(((competencyScores[competency].correct / masteryCount) * 100).toFixed(0)) : 0;
    // Apply minimal value for visual representation if there were attempts but no correct answers
    return {
      "Competency": competency.split(':')[0],
      "Full Competency": competency.split(':')[1],
      "In-Training Mastery": masteryScore > 0 ? masteryScore : (masteryCount > 0 ? 0.1 : 0),
      "In-Field Self-efficacy": competencySelfEfficacyScores[competency] && competencySelfEfficacyScores[competency].count > 0 ? parseFloat((competencySelfEfficacyScores[competency].total / competencySelfEfficacyScores[competency].count).toFixed()) : (competencySelfEfficacyScores[competency] && competencySelfEfficacyScores[competency].count > 0 ? 0.1 : 0),
      "In-Training Mastery Count": masteryCount,
      "In-Field Self-efficacy Count": competencySelfEfficacyScores[competency]?.count || 0,
    };
  });

  return formattedData;
};

const processStudentCompetenciesData = (responseData) => {
    const competencyScores = {};

    // Iterate over each response
    responseData.forEach(response => {
        if (response.assessmentType === AssessmentType.STUDENT_LEARNING_OUTCOMES) {
            response.survey.forEach(question => {
                // Ensure competencies are defined for the question
                if (question.competencies) {
                    question.competencies.forEach(competency => {
                        // Initialize competency if not already present
                        if (!competencyScores[competency]) {
                            competencyScores[competency] = {
                                Knowledge: 0, Skill: 0, Attitude: 0,
                                KnowledgeCount: 0, SkillCount: 0, AttitudeCount: 0
                            };
                        }

                        // Check the learning type and increment the count and score accordingly
                        const learningType = question.learningType;
                        const userAnswer = question.response[0];
                        const correctAnswer = question.correctAnswer;

                        if (learningType === LearningType.KNOWLEDGE || learningType === LearningType.SKILL || learningType === LearningType.ATTITUDE) {
                            competencyScores[competency][`${learningType}Count`] += 1; // Increment count for the learning type

                            if (userAnswer === correctAnswer) {
                                competencyScores[competency][learningType] += 1; // Increment score if the answer is correct
                            }
                        }
                    });
                }
            });
        }
    });

    // Calculate percentage scores for each learning type in each competency and include counts
    let formattedData = Object.keys(competencyScores).map(competency => {
        const scores = competencyScores[competency];
        return {
            Competency: competency.split(':')[0], 
            "Full Competency": competency.split(':')[1],
            "Knowledge": scores.KnowledgeCount > 0 ? Math.round((scores.Knowledge / scores.KnowledgeCount) * 100) : 0,
            "Skill": scores.SkillCount > 0 ? Math.round((scores.Skill / scores.SkillCount) * 100) : 0,
            "Attitude": scores.AttitudeCount > 0 ? Math.round((scores.Attitude / scores.AttitudeCount) * 100) : 0,
            "Knowledge Count": scores.KnowledgeCount,
            "Skill Count": scores.SkillCount,
            "Attitude Count": scores.AttitudeCount,
        };
    });

    // Adjusting data for minimal visual representation of zero values
    formattedData = formattedData.map(item => ({
      ...item,
      Knowledge: item["Knowledge Count"] > 0 && item.Knowledge === 0 ? 0.1 : item.Knowledge,
      Skill: item["Skill Count"] > 0 && item.Skill === 0 ? 1 : item.Skill,
      Attitude: item["Attitude Count"] > 0 && item.Attitude === 0 ? 0.1 : item.Attitude,
    }));

    return formattedData;
};

const handleChangeTabsOne = (newValue) => {
    setValuePanelOne(newValue);
};

    const handleChangeTabsTwo = (newValue) => {
    setValuePanelTwo(newValue);
  };

     const handleChangeTabsThree = (newValue) => {
    setValuePanelThree(newValue);
  };

   const handleChangeTabsFour = (event, newValue) => {
    setValuePanelFour(newValue);
  };

const handleChangeMonitoring = (event) => {
    setSelectedMonitoring(event.target.value);
};

return (
    <Box display="flex" backgroundColor="white" style={{ height: '100vh', overflow: 'auto' }}>
      <Sidebar />
      <Box flex={1}>
        <Box mt="10px" ml="10px">
          <Topbar title="My Summaries" />
        </Box>

          {/* Row 1 */}

        <Box 
        display="grid" 
        gridTemplateColumns="repeat(12, 1fr)" 
        gridTemplateRows="4vh 39vh 39vh"
        gap="20px" 
        ml="20px" 
        mr="20px"
        >
            
        <Box gridColumn="span 12" gridRow="1" display="flex" justifyContent="space-between" alignItems="center">
        <Box>
          <FormControl variant="outlined" size="small"  sx={{ minWidth: 170, marginRight: '20px'}}>
            <InputLabel id="monitoring">Choose a monitoring</InputLabel>
            <Select
              labelId="monitoring"
              id="monitoring"
              value={selectedMonitoring}
              onChange={handleChangeMonitoring}
              autoWidth
              label="Choose a monitoring"
          >
              {monitorings.map((monitoring) => (
                  <MenuItem key={monitoring._id} value={monitoring._id}>
                      {monitoring.name} 
                  </MenuItem>
              ))}
          </Select>
        </FormControl>
          </Box>
          <Box>
            <FormControl variant="outlined" size="small" 
            sx={{ minWidth: 140, marginRight: '20px'}}>
              <Button 
                //onClick={handleExportReport}
                variant="contained"
                color="primary"
                sx={{ 
                  color: "black",
                  backgroundColor: "#F7941E",
                  borderRadius: "50px",
                  "&:hover": {
                    backgroundColor: "#D17A1D"
                  }
                }}
                //disabled={!selectedDayAssessments || selectedDayAssessments.length === 0}
                disabled={true}
              >
                Export a Report in PDF
              </Button>
            </FormControl>

            <FormControl variant="outlined" size="small" 
            sx={{ minWidth: 140, marginRight: '20px'}}>
              <Button 
                //onClick={handleExportData}
                variant="contained"
                color="primary"
                sx={{ 
                  color: "black",
                  backgroundColor: "#F7941E",
                  borderRadius: "50px",
                  "&:hover": {
                    backgroundColor: "#D17A1D"
                  }
                }}
                //disabled={!selectedMonitoring || selectedMonitoring.length === 0}
                disabled={true}
              >
                Export data in CSV
              </Button>
            </FormControl>
        </Box>
        </Box>

        {/* Row 2 */}

            <Box
                gridColumn="span 4" gridRow="2"
                sx={{
                boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.1)',
                borderRadius: '15px',
                backgroundColor: '#fff',
                mt: '15px',
                }}
            >
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={valuePanelOne} onChange={handleChangeTabsOne} aria-label="">
                    <Tab label="Knowledge acquisition"/>
                </Tabs>
                </Box>
                 <CustomTabPanel value={valuePanelOne} index={0}>
                <Box style={{ height: '36vh', width: '100%', overflowY: 'auto' }}>
                    <React.Fragment>
                         <div style={{ height: '35vh', width: '100%' }}>
                        <BarChartSummaries 
                            data={teacherKnowledgeData} 
                            keys={['Score']}
                            indexBy="Name"
                            legends={false}
                            axisLeftLabel={"Mastery (%)"} />
                        </div>
                    </React.Fragment>
                </Box>
                </CustomTabPanel>
          </Box>
          
          <Box
            gridColumn="span 4" gridRow="2"
            sx={{
              boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.1)',
              borderRadius: '15px',
              backgroundColor: '#fff',
              mt: '15px'
            }}
          >
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={valuePanelTwo} onChange={handleChangeTabsTwo} aria-label="">
                    <Tab label="Implementation"  />
                </Tabs>
                </Box>
                <CustomTabPanel value={valuePanelTwo} index={0}>
                <Box style={{ height: '36vh', width: '100%', overflowY: 'auto' }}>
                    <React.Fragment>
                         <div style={{ height: '35vh', width: '100%' }}>
                        <BarChartSummaries 
                            data={teacherImplementationData} 
                            keys={['Score']}
                            indexBy="Name"
                            legends={false}
                            yAxisLabels={teacherImplementationData[0]?.yAxisLabels} />
                        </div>
                    </React.Fragment>
                </Box>
                </CustomTabPanel>
            </Box>
            <Box
            gridColumn="span 4" gridRow="2"
            sx={{
              boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.1)',
              borderRadius: '15px',
              backgroundColor: '#fff',
              mt: '15px'
            }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={valuePanelThree} onChange={handleChangeTabsThree} aria-label="">
                    <Tab label="Organizational needs"  />
                </Tabs>
                </Box>
                <CustomTabPanel value={valuePanelThree} index={0}>
               <Box style={{ height: '36vh', width: '100%', overflowY: 'auto' }}>
                    <React.Fragment>
                         <div style={{ height: '35vh', width: '100%' }}>
                        <BarChartSummaries 
                            data={teacherOrganizationalNeedsData} 
                            keys={['Score']}
                            indexBy="Name"
                            legends={false}
                            yAxisLabels={teacherOrganizationalNeedsData[0]?.yAxisLabels} />
                        </div>
                    </React.Fragment>
                </Box>
                </CustomTabPanel>
            </Box>
           
          {/* Row 3 */}

          <Box gridColumn="span 12" gridRow="3"
          sx={{
              boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.1)',
              borderRadius: '15px',
              backgroundColor: '#fff',
            }}>
           
           <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={valuePanelFour} onChange={handleChangeTabsFour} aria-label="">
                    <Tab label="Teachers competencies"  />
                    <Tab label="Students competencies"  />
                </Tabs>
                </Box>
                 <CustomTabPanel value={valuePanelFour} index={0}>
                <Box style={{ height: '36vh', width: '100%', overflowY: 'auto' }}>
                    <React.Fragment>
                        <div style={{ height: '35vh', width: '100%' }}>
                        <BarChartSummaries 
                            data={teacherCompetenciesData} 
                            keys={["In-Training Mastery", "In-Field Self-efficacy"]}
                            indexBy="Competency"
                            legends={true}
                            axisLeftLabel={"Mastery (%)"}
                            axisRightLabel={"Self-Efficacy (%)"} />
                        </div>
                    </React.Fragment>
                </Box>
                </CustomTabPanel>
                <CustomTabPanel value={valuePanelFour} index={1}>
                <Box style={{ height: '36vh', width: '100%', overflowY: 'auto' }}>
                    <React.Fragment>
                        <div style={{ height: '35vh', width: '100%' }}>
                        <BarChartSummaries 
                            data={studentCompetenciesData} 
                            keys={['Knowledge', 'Skill', 'Attitude']}
                            indexBy="Competency"
                            legends={true}
                            axisLeftLabel={"Mastery (%)"}
                        />
                        </div>
                    </React.Fragment>
                </Box>
                </CustomTabPanel>
          </Box>
        </Box>
      </Box>
  </Box>
  );
};

export default Summaries;

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
        width: '100%'        
        
      }}
      {...other}
    >
      {value === index && (
        <div style={{ width: '100%', overflowX: 'auto' }}> 
          {children}
        </div>
      )}
    </Box>
  );
}

CustomTabPanel.propTypes = {
  children: PropTypes.node,
  index: PropTypes.number.isRequired,
  value: PropTypes.number.isRequired,
};
