import React, { useState, useEffect } from 'react';
import Sidebar from "../global/Sidebar";
import Topbar from "../global/Topbar";
import axios from 'axios';
import { Box, Select, MenuItem, InputLabel, FormControl } from "@mui/material";
import { useSearchParams } from 'react-router-dom';
import CustomTimeline from "../../components/CustomTimeline";
import AddLog from "../../components/AddLog";
import { useMessageService } from '../../services/MessageService';
import { useAuthUser } from '../../contexts/AuthUserContext';
import { loadMonitoringAndAssessments } from "../../utils/ObjectsUtils";
import { BACKEND_URL } from "../../config";

const Logbooks = () => {

  const [logs, setLogs] = useState([]);
  const [monitorings, setMonitorings] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [currentMonitoringId, setCurrentMonitoringId] = useState('');
  const [currentMonitoring, setCurrentMonitoring] = useState(null);
  const [uniqueDays, setUniqueDays] = useState([]);
  const [searchParams] = useSearchParams();
  const queryMonitoringId = searchParams.get('monitoring');
  const queryLogId = searchParams.get('log');

  const { getMessage } = useMessageService();
  const { currentUser } = useAuthUser();

  useEffect(() => {
      const fetchMonitoringsAndAssessments = async () => {
        await loadMonitoringAndAssessments(currentUser, setMonitorings, setAssessments, setCurrentMonitoringId);
      };

      fetchMonitoringsAndAssessments();
  }, []);

  useEffect(() => {
    if (!monitorings.length) {
      return;
    }
    const preferredId = queryMonitoringId || currentMonitoringId;
    const selected = monitorings.find((monitoring) => String(monitoring._id) === String(preferredId))
      || monitorings[0];
    if (selected && selected._id !== currentMonitoring?._id) {
      setCurrentMonitoring(selected);
      setCurrentMonitoringId(selected._id);
    }
  }, [monitorings, queryMonitoringId, currentMonitoringId]);

  useEffect(() => {
    const fetchLogs = async () => {
      if (!currentMonitoring?._id) return;

      try {
          const token = localStorage.getItem("token");
          const response = await axios.get(`${BACKEND_URL}/logs/monitoring/${currentMonitoring._id}`,
            {
              headers: {
                Authorization: `Bearer ${token}`
              }
            }
          );
          setLogs(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
          console.log(error);
          setLogs([]);
      }
    };

    const selectedAssessments = assessments.filter((assessment) => assessment.monitoringId === currentMonitoring?._id);
    const daysFromAssessments = selectedAssessments.map((item) => item.day);
    setUniqueDays([...new Set(daysFromAssessments)]);

    fetchLogs();

    const pollLogs = async () => {
      if (!currentMonitoring?._id || document.hidden) {
        return;
      }
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(`${BACKEND_URL}/logs/monitoring/${currentMonitoring._id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const next = Array.isArray(response.data) ? response.data : [];
        setLogs((prev) => {
          if (prev.length !== next.length) {
            return next;
          }
          return prev.map((old) => {
            const fresh = next.find((item) => item._id === old._id);
            if (!fresh) {
              return old;
            }
            return {
              ...old,
              description: fresh.description,
              chat: fresh.chat,
              helpRequestedAt: fresh.helpRequestedAt,
              helpRequestedBy: fresh.helpRequestedBy,
              isCompleted: fresh.isCompleted,
              completionDate: fresh.completionDate,
              lastModificationDate: fresh.lastModificationDate,
            };
          });
        });
      } catch (error) {
        console.log(error);
      }
    };

    const intervalId = setInterval(pollLogs, 8000);
    return () => clearInterval(intervalId);
  }, [currentMonitoring, assessments]);

  useEffect(() => {
    if (!queryLogId) {
      return;
    }
    const timer = setTimeout(() => {
      const node = document.getElementById(`log-${queryLogId}`);
      if (node) {
        node.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [queryLogId, logs]);

  const handleChangeMonitoring = (event) => {
    const selected = monitorings.find((monitoring) => monitoring._id === event.target.value);
    setCurrentMonitoring(selected || null);
    setCurrentMonitoringId(event.target.value);
  };

  const isMonitoringOwner = Boolean(
    currentMonitoring && currentUser && String(currentMonitoring.userId) === String(currentUser._id)
  );

  return (
    <Box display="flex" sx={{ height: '100%', overflow: 'hidden', bgcolor: '#f9f9f9' }}>
      <Sidebar />

      <Box
        display="flex"
        flex="1"
        flexDirection="column"
        sx={{
          minWidth: 0,
          minHeight: 0,
          overflow: 'auto',
          '& .MuiTypography-h2': { fontSize: { xs: '1.4rem', md: '1.85rem' } },
          '& .MuiTypography-h5': { fontSize: '1.2rem' },
          '& .MuiTypography-subtitle1': { fontSize: '1.05rem' },
          '& .MuiTypography-body1': { fontSize: '0.95rem', lineHeight: 1.5 },
          '& .MuiTypography-body2': { fontSize: '0.875rem' },
          '& .MuiTypography-caption': { fontSize: '0.78rem' },
          '& .MuiInputBase-input': { fontSize: { xs: '16px', md: '0.95rem' } },
          '& .MuiInputLabel-root:not(.MuiInputLabel-shrink)': { fontSize: '0.9rem' },
          '& .MuiButton-root': { fontSize: '0.875rem' },
          '& .MuiChip-label': { fontSize: '0.78rem' },
          '& .MuiMenuItem-root': { fontSize: '0.95rem' },
        }}
      >
        <Box sx={{ mt: { xs: 1, md: '10px' }, ml: { xs: 1, md: '10px' } }}>
          <Topbar title={getMessage("label_my_logbooks")} />
        </Box>

        <Box sx={{ px: { xs: 2, md: 2.5 }, pb: 2 }}>
          <FormControl size="small" sx={{ width: { xs: '100%', sm: 220 }, maxWidth: { xs: '100%', sm: 360 } }}>
              <InputLabel id="monitoring">
                {getMessage("label_choose_monitoring")}
              </InputLabel>
              <Select
                  labelId="monitoring"
                  id="monitoring"
                  value={currentMonitoring?._id || ""}
                  label={getMessage("label_choose_monitoring")}
                  onChange={handleChangeMonitoring}
                >
                  {monitorings && monitorings.map((monitoring) => (
                      <MenuItem key={monitoring._id} value={monitoring._id}>
                          {monitoring.name} 
                      </MenuItem>
                  ))}
              </Select>
            </FormControl>
          </Box>

        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column-reverse', md: 'row' },
            width: '100%',
            flex: 1,
            minHeight: 0,
            gap: { xs: 3, md: 4 },
            px: { xs: 2, md: 2.5 },
            pb: { xs: "calc(80px + env(safe-area-inset-bottom, 0px))", md: 2.5 },
            alignItems: 'flex-start',
          }}
        >
          <Box sx={{ flex: { xs: 'none', md: 1 }, minWidth: 0, width: '100%' }}>
            {currentMonitoring && (
            <AddLog
              key={currentMonitoring._id}
              logs={logs}
              setLogs={setLogs}
              currentMonitoringId={currentMonitoring._id}
              uniqueDays={uniqueDays}
              isMonitoringOwner={isMonitoringOwner}
            />
            )}
          </Box>

          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              flex: { xs: 'none', md: 2 },
              width: '100%',
              minWidth: 0,
            }}
          >
            <CustomTimeline
              logs={logs}
              setLogs={setLogs}
              isMonitoringOwner={isMonitoringOwner}
              currentMonitoringId={currentMonitoring?._id}
              focusLogId={queryLogId}
            />
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default Logbooks;
