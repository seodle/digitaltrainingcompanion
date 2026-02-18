import React, { useState, useEffect } from 'react';
import Sidebar from "../global/Sidebar";
import Topbar from "../global/Topbar";
import axios from 'axios';
import { Box, Select, MenuItem, InputLabel, FormControl } from "@mui/material";
import CustomTimeline from "../../components/CustomTimeline";
import AddLog from "../../components/AddLog";
import { useMessageService } from '../../services/MessageService';
import { useAuthUser } from '../../contexts/AuthUserContext';
import { loadMonitoringAndAssessments } from "../../utils/ObjectsUtils";
import { BACKEND_URL } from "../../config";

const Logbooks = () => {

  const [logs, setLogs] = useState([]);
  const [monitorings, setMonitorings] = useState([]); // dict with all monitorings
  const [assessments, setAssessments] = useState([]); // dict with all assessments
  const [currentMonitoringId, setCurrentMonitoringId] = useState('');
  const [currentMonitoring, setCurrentMonitoring] = useState('');
  const [currentMonitoringName, setCurrentMonitoringName] = useState('');
  const [uniqueDays, setUniqueDays] = useState([]);

  const { getMessage } = useMessageService();
  const { currentUser } = useAuthUser();


  // Load all monitorings and assessments
  useEffect(() => {

      /**
       * Fetch all monitorings and assessments from the server and update the states accordingly
       * @returns {Promise<void>} A promise that resolves once the data are fetched.
       */
      const fetchMonitoringsAndAssessments = async () => {

        await loadMonitoringAndAssessments(currentUser, setMonitorings, setAssessments, setCurrentMonitoringId);
      };

      fetchMonitoringsAndAssessments();
  }, []);


  // Load all logs for the current monitoring
  useEffect(() => {

    // TODO add this in object utils
    const fetchLogs = async () => {

      if(!currentMonitoring) return;

      try {
          const token = localStorage.getItem("token");
          const response = await axios.get(`${BACKEND_URL}/logs/monitoring/${currentMonitoring._id}`,
            {
              headers: {
                Authorization: `Bearer ${token}`
              }
            }
          );
          if(response.data === "No logs found for this monitoring") { 
              setLogs([]); 
          } else {
            setLogs(response.data);
          }
      } catch (error) {
          console.log(error);
          setLogs([]);  // In case of an error, you can choose to set logs to an empty array
      }
    };

    

    // get the days from the assessment
    const selectedAssessments = assessments.filter(assessemnt => assessemnt.monitoringId === currentMonitoring._id);
    const daysFromAssessments = selectedAssessments.map(item => item.day);
    const uniqueDaysFromAssessments = [...new Set(daysFromAssessments)];
    setUniqueDays(uniqueDaysFromAssessments);

    fetchLogs();

    console.log(logs);
  }, [currentMonitoring]);


  /**
  * Handle the selection change of a monitoring
  */
  const handleChangeMonitoring = (event) => {

    // set the selected monitoring
    setCurrentMonitoring(monitorings.find(monitoring => monitoring._id === event.target.value));
    setCurrentMonitoringName(event.target.value);
  };

  return (
    <Box display="flex" style={{ height: '100vh', overflow: 'auto' }}>
      <Sidebar />

      <Box display="flex" flex="1" flexDirection="column">
        <Box mt="10px" ml="10px">
          <Topbar title={getMessage("label_my_logbooks")} />
        </Box>

        <Box>
          <FormControl  size="small" sx={{ minWidth: 220, marginLeft: '20px'}} >
              <InputLabel id="monitoring">
                {getMessage("label_choose_monitoring")}
              </InputLabel>
              <Select
                  labelId="monitoring"
                  id="monitoring"
                  value={currentMonitoringName}
                  label={getMessage("label_choose_monitoring")}
                  onChange={handleChangeMonitoring}
                  autoWidth
                >
                  {monitorings && monitorings.map((monitoring) => (
                      <MenuItem key={monitoring._id} value={monitoring._id}>
                          {monitoring.name} 
                      </MenuItem>
                  ))}
              </Select>
            </FormControl>
          </Box>

        <Box display="flex" width="100%" flex="1">
          <Box flex="1" justifyContent="center" alignItems="center" sx={{ borderRadius: '16px' }}>
            <AddLog
              logs={logs}
              setLogs={setLogs}
              currentMonitoringId={currentMonitoring._id}
              uniqueDays={uniqueDays}
            />
          </Box>

          <Box display="flex" flexDirection="column" flex="2" width="100%" m="20px" style={{ overflowY: 'auto'}}>            
            <CustomTimeline
              logs={logs}
              setLogs={setLogs}
              currentMonitoringId={currentMonitoring._id}
            />
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default Logbooks;
