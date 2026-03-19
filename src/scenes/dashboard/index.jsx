import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  TextField,
  IconButton,
  Typography,
  Button,
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  TableContainer,
  Paper,
  Table,
  TableBody,
  TableRow,
  TableCell,
  Checkbox
} from "@mui/material";
import { Search, ChevronLeft, ChevronRight, Globe2 } from "lucide-react";

// dependencies
import { loadMonitoringAndAssessments } from "../../utils/ObjectsUtils";
import Sidebar from "../../scenes/global/Sidebar";
import Topbar from "../../scenes/global/Topbar";
import Footer from "../../scenes/global/Footer";
import MonitoringCard from "../../components/Dashboard/MonitoringCard";
import AssessmentsTable from "../../components/Dashboard/AssessmentTable";
import SharingAssessments from "../../components/Dashboard/SharingAssessments";
import AddIcon from "@mui/icons-material/Add";
import { buttonStyle } from "../../components/styledComponents";
import jwt_decode from "jwt-decode";
import axios from "axios";
import { FRONTEND_URL, BACKEND_URL } from "../../config";
import { useMessageService } from '../../services/MessageService';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuthUser } from '../../contexts/AuthUserContext';
import { hasAiBeaconAndMoodleApiKeys } from '../../utils/aibeacon';
import { AssessmentType, OptionTypes, UserType } from '../../utils/enums';

const Dashboard = () => {

  const [expandedMonitoring, setExpandedMonitoring] = useState(null);
  const [selectedAssessments, setSelectedAssessments] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const scrollContainerRef = useRef(null);
  const [error, setError] = useState(null);

  // monitoring states
  const [currentMonitoringId, setCurrentMonitoringId] = useState(null);
  const [monitorings, setMonitorings] = useState([]);
  const [newMonitoringName, setNewMonitoringName] = useState('');
  const [newMonitoringDescription, setNewMonitoringDescription] = useState('');
  const [newMonitoringCourseId, setNewMonitoringCourseId] = useState('');
  const [courseOptions, setCourseOptions] = useState([]);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [coursesError, setCoursesError] = useState('');
  const [openMonitoringDialog, setOpenMonitoringDialog] = useState(false);
  const [openLoadCodeDialog, setOpenLoadCodeDialog] = useState(false);
  const [loadCode, setLoadCode] = useState('');
  const [loadCodeError, setLoadCodeError] = useState('');
  const [showSandboxLimitAlert, setShowSandboxLimitAlert] = useState(false);

  // assessments states
  const [currentAssessmentId, setCurrentAssessmentId] = useState(null);
  const [assessments, setAssessments] = useState([]);
  const [selectedAssessmentsIds, setSelectedAssessmentsIds] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const qrCodeRef = useRef(null);
  const largeQRCodeRef = useRef(null);
  const [editingCell, setEditingCell] = useState(null);
  const [editingCellValue, setEditingCellValue] = useState(null);
  const [newAssessmentDay, setNewAssessmentDay] = useState('');
  const [newAssessmentName, setNewAssessmentName] = useState('');
  const [newAssessmentType, setNewAssessmentType] = useState('');
  const [openAssessmentDialog, setOpenAssessmentDialog] = useState(false);
  const [moodleCourseContents, setMoodleCourseContents] = useState([]);
  const [isLoadingMoodleCourseContents, setIsLoadingMoodleCourseContents] = useState(false);
  const [moodleCourseContentsError, setMoodleCourseContentsError] = useState('');
  const [selectedMoodleContentIds, setSelectedMoodleContentIds] = useState([]);
  const [aiBeaconOutputLanguage, setAiBeaconOutputLanguage] = useState('auto');
  const [aiBeaconLanguageError, setAiBeaconLanguageError] = useState('');
  const [aiBeaconLanguageSaving, setAiBeaconLanguageSaving] = useState(false);
  const [isCreatingAssessment, setIsCreatingAssessment] = useState(false);
  const [isSyncingCourse, setIsSyncingCourse] = useState(false);

  const [openAssesmentCount, setOpenAssessmentsCount] = useState(0);

  const statusToOptions = {
    Draft: [OptionTypes.EDIT, OptionTypes.PREVIEW, OptionTypes.OPEN, OptionTypes.COPY, OptionTypes.DELETE, OptionTypes.DELETE_ALL_ANSWERS],
    Open: [OptionTypes.CLOSE, OptionTypes.EDIT, OptionTypes.PREVIEW, OptionTypes.COPY, OptionTypes.DELETE, OptionTypes.DELETE_ALL_ANSWERS],
    Close: [OptionTypes.OPEN, OptionTypes.COPY, OptionTypes.DELETE, OptionTypes.DELETE_ALL_ANSWERS],
  };

  // sharing states
  const { getMessage } = useMessageService();
  const { languageCode } = useLanguage();
  const { currentUser } = useAuthUser();
  const [isLoading, setIsLoading] = useState(true);
  const showCourseField = hasAiBeaconAndMoodleApiKeys(currentUser);
  const [isLinked, setIsLinked] = useState(false);
  const [isCodeVisible, setIsCodeVisible] = useState(false);
  const [generatedCode, setGeneratedCode] = useState('');
  const theme = useTheme();
  const navigate = useNavigate();

  // Function to check if the token is expired
  const isTokenExpired = (token) => {
    if (!token) {
      console.log("🔐 Token non trouvé dans le localStorage");
      return true;
    }
    try {
      const decoded = jwt_decode(token);
      const currentTime = Date.now() / 1000;
      const isExpired = decoded.exp < currentTime;

      if (isExpired) {
        console.log("🚫 Token expiré!", {
          expirationTime: new Date(decoded.exp * 1000).toLocaleString(),
          currentTime: new Date().toLocaleString()
        });
      } else {
        console.log("✅ Token valide jusqu'à:", new Date(decoded.exp * 1000).toLocaleString());
      }

      return isExpired;
    } catch (error) {
      console.log("❌ Erreur lors du décodage du token:", error.message);
      return true;
    }
  };

  useEffect(() => {
    /**
     * Fetches and initializes monitoring and assessment data for the dashboard.
     */
    const fetchMonitoringsAndAssessments = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem("token");
        if (isTokenExpired(token)) {
          console.log("🚫 Impossible de charger les données - Token expiré");
          navigate("/signin");
          return;
        }

        // Fetch monitorings and assessments
        await loadMonitoringAndAssessments(
          currentUser,
          setMonitorings,
          setAssessments,
          setCurrentMonitoringId
        );

        // Determine which monitoring to open
        let monitoringToOpen = localStorage.getItem("lastMonitoringId");
        if (!monitoringToOpen && assessments.length > 0) {
          // Find the monitoring with the most recent lastModified assessment
          const mostRecentAssessment = assessments.reduce(
            (latest, current) =>
              new Date(current.lastModification) > new Date(latest.lastModification)
                ? current
                : latest,
            assessments[0]
          );
          monitoringToOpen = mostRecentAssessment?.monitoringId || null;
        }

        setExpandedMonitoring(monitoringToOpen);
        setCurrentMonitoringId(monitoringToOpen);
      } catch (error) {
        console.error('❌ Erreur lors du chargement des données:', error);
        if (error.response?.status === 401) {
          console.log("🔐 Erreur 401 - Session expirée");
          navigate("/signin");
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchMonitoringsAndAssessments();
  }, [currentUser, navigate]);

  // Load courses for the "New monitoring" modal (only when external keys exist).
  useEffect(() => {
    if (!openMonitoringDialog) return;
    if (!showCourseField) return;

    // If we already loaded courses for this modal session, reuse them.
    if (courseOptions.length > 0) return;

    const token = localStorage.getItem("token");
    if (!token) {
      setCoursesError("No authentication token available.");
      return;
    }

    let cancelled = false;
    const loadCourses = async () => {
      setCoursesLoading(true);
      setCoursesError("");
      try {
        const coursesRes = await axios.get(
          `${BACKEND_URL}/aiBeacon/courses`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const coursesRaw = coursesRes.data?.courses;
        if (!Array.isArray(coursesRaw)) {
          throw new Error("Unexpected response format while loading courses.");
        }

        if (!cancelled) {
          setCourseOptions(coursesRaw);
        }
      } catch (e) {
        console.error("Failed to load courses for New monitoring:", e);
        if (!cancelled) {
          setCoursesError("Failed to load courses. Please try again.");
          setCourseOptions([]);
        }
      } finally {
        if (!cancelled) setCoursesLoading(false);
      }
    };

    loadCourses();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openMonitoringDialog, showCourseField]);

  // Save the current monitoring ID in localStorage whenever it changes
  useEffect(() => {
    if (currentMonitoringId) {
      localStorage.setItem("lastMonitoringId", currentMonitoringId);
    }
  }, [currentMonitoringId]);

  useEffect(() => {
    // Debugging logs
    // console.log("currentMonitoringId", currentMonitoringId);
    // console.log("assessments", assessments);
    // console.log("monitorings", monitorings);
  }, [
    currentMonitoringId,
    assessments,
    currentAssessmentId,
    monitorings,
    isOpen,
    selectedAssessmentsIds
  ]);

  const handleImportMonitoring = () => {
    setOpenLoadCodeDialog(true);
  };

  const handleCloseLoadCodeDialog = () => {
    setOpenLoadCodeDialog(false);
    setLoadCode('');
    setLoadCodeError('');
  };

  const handleLoadCode = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      alert("No authentication token available.");
      return;
    }

    try {
      const response = await axios.put(
        `${BACKEND_URL}/users/monitorings/code/${loadCode}/startFollowing`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.status === 200) {
        console.log("Code loaded successfully, and monitorings/assessments updated");
        setLoadCodeError('');
        handleCloseLoadCodeDialog();

        await loadMonitoringAndAssessments(
          currentUser,
          setMonitorings,
          setAssessments,
          setCurrentMonitoringId
        );
      }
    } catch (err) {
      console.error("Error while appending code:", err);
      if (err.response?.status === 409) {
        setLoadCodeError(getMessage("label_code_already_redeemed"));
      } else if (err.response?.status === 404) {
        setLoadCodeError(getMessage("label_code_does_not_exist"));
      } else {
        setLoadCodeError(getMessage("label_error_loading_code"));
      }
    }
  };

  /**
   * Handle creation of a new monitoring
   */
  const handleCreateMonitoring = async () => {
  let errorMessage = '';
  setError(null);

  if (!newMonitoringName || !newMonitoringDescription) {
    errorMessage = getMessage('new_monitoring_error_creation');
  } else if (
    monitorings.some(monitoring => monitoring.name === newMonitoringName)
  ) {
    errorMessage = `${getMessage('new_monitoring_error_duplicate')}.`;
  }
  if (errorMessage) {
    setError(errorMessage);
    return;
  }

  // Rest of the function remains the same...
  console.log("Add new monitoring");

  try {
    const token = localStorage.getItem("token");

    const newMonitoring = {
      orderId: monitorings.length + 1,
      userId: currentUser._id,
      name: newMonitoringName,
      description: newMonitoringDescription,
      courseMoodleId: showCourseField && newMonitoringCourseId ? newMonitoringCourseId : null,
      courseName:
        showCourseField && newMonitoringCourseId
          ? courseOptions.find(c => c.id === newMonitoringCourseId)?.name || null
          : null,
      courseAiBeaconId: null,
      courseSyncedAt: null,
      creationDate: new Date(),
      lastModification: new Date(),
      options: [
        OptionTypes.DELETE,
        OptionTypes.DELETE_ALL_ANSWERS,
        OptionTypes.COPY
      ]
    };

    const response = await axios.post(
      `${BACKEND_URL}/monitorings`,
      newMonitoring,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    const serverMonitoringId = response.data._id;
    newMonitoring._id = serverMonitoringId;

    setCurrentMonitoringId(serverMonitoringId);
    setMonitorings(prev => [...prev, newMonitoring]);

    if (newMonitoring.courseMoodleId) {
      await handleSyncCourseFromMoodle({
        monitoringId: serverMonitoringId,
        moodleCourseId: newMonitoring.courseMoodleId,
        currentCourseAiBeaconId: newMonitoring.courseAiBeaconId,
      });
    }

    setNewMonitoringName('');
    setNewMonitoringDescription('');
    handleCloseMonitoringDialog();
  } catch (error) {
    console.error("Error adding monitoring:", error);
  }
};

  const handleSyncCourseFromMoodle = async ({
    monitoringId = currentMonitoringId,
    moodleCourseId: explicitMoodleCourseId,
    currentCourseAiBeaconId: explicitCourseAiBeaconId,
  } = {}) => {
    const monitoring = monitorings.find(
      (entry) => entry._id === monitoringId
    );
    const moodleCourseId = explicitMoodleCourseId ?? monitoring?.courseMoodleId;
    if (!moodleCourseId) return;

    const token = localStorage.getItem("token");
    if (!token) return;

    setIsSyncingCourse(true);
    try {
      const response = await axios.post(
        `${BACKEND_URL}/aiBeacon/courses/${encodeURIComponent(moodleCourseId)}/sync`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response?.status < 300 && response?.data?.success === true) {
        const syncedCourses = Array.isArray(response?.data?.syncedCourses)
          ? response.data.syncedCourses
          : [];
        const syncedCourse = syncedCourses.find(
          (course) => String(course?.courseMoodleId) === String(moodleCourseId)
        );
        const resolvedAiBeaconId =
          syncedCourse?.courseAiBeaconId ??
          explicitCourseAiBeaconId ??
          monitoring?.courseAiBeaconId;

        setMonitorings((prev) =>
          prev.map((entry) =>
            entry._id === monitoringId
              ? {
                  ...entry,
                  courseSyncedAt: new Date().toISOString(),
                  ...(resolvedAiBeaconId
                    ? { courseAiBeaconId: String(resolvedAiBeaconId) }
                    : {}),
                }
              : entry
          )
        );
      }
    } catch (syncError) {
      console.error("Failed to sync course from Moodle:", syncError);
    } finally {
      setIsSyncingCourse(false);
    }
  };

  /**
   * Handle creation of a new assessment
   */
  const handleCreateAssessment = async () => {
    let errorMessage = '';
    setError(null);

    // Check for sandbox user restrictions
    if (currentUser?.sandbox) {
      const existingAssessmentsOfType = assessments.filter(
        assessment => assessment.monitoringId === currentMonitoringId && 
                     assessment.type === newAssessmentType
      );
      
      if (existingAssessmentsOfType.length >= 1) {
        setError(getMessage('sandbox_user_assessment_type_limit'));
        return;
      }
    }

    if (!newAssessmentName || !newAssessmentType || !newAssessmentDay) {
      errorMessage = getMessage('new_assessment_error_creation');
    } else if (
      assessments.some(assessment => 
        assessment.monitoringId === currentMonitoringId && 
        assessment.name === newAssessmentName
      )
    ) {
      errorMessage = `${getMessage('new_assessment_error_duplicate')}.`;
    }
    if (errorMessage) {
      setError(errorMessage);
      return;
    }

    try {
      setIsCreatingAssessment(true);
      const token = localStorage.getItem("token");
      const shouldCreateWithAiBeacon =
        hasAiBeaconAndMoodleApiKeys(currentUser) &&
        newAssessmentType === AssessmentType.LEARNING &&
        selectedMoodleContentIds.length > 0 &&
        !!selectedMonitoring?.courseAiBeaconId;

      const newAssessment = {
        monitoringId: currentMonitoringId,
        userId: currentUser._id,
        name: newAssessmentName,
        day: newAssessmentDay,
        type: newAssessmentType,
        status: "Draft",
        creationDate: new Date(),
        lastModification: new Date(),
        options: statusToOptions["Draft"],
        ...(selectedMoodleContentIds.length > 0 ? { content_ids: selectedMoodleContentIds } : {}),
        ...(selectedMonitoring?.courseAiBeaconId ? { courseId: selectedMonitoring.courseAiBeaconId } : {})
      };

      const response = await axios.post(
        shouldCreateWithAiBeacon
          ? `${BACKEND_URL}/aiBeacon/assessments`
          : `${BACKEND_URL}/assessments`,
        newAssessment,
        { headers: { Authorization: `Bearer ${token}` } }
      );

    const createdAssessment = response.data;
    setCurrentAssessmentId(createdAssessment._id);
    setAssessments(prev => [...prev, createdAssessment]);

      setNewAssessmentName('');
      setNewAssessmentType('');
      handleCloseAssessmentDialog();
    } catch (error) {
      console.error("Error adding assessment:", error);
      setError("Failed to add assessment. Please try again.");
    } finally {
      setIsCreatingAssessment(false);
    }
  };

  const handleCloseMonitoringDialog = () => {
    setOpenMonitoringDialog(false);
    setError(null);
    setNewMonitoringCourseId("");
    setCoursesError("");
  };

  const handleCloseAssessmentDialog = () => {
    setOpenAssessmentDialog(false);
    setError(null);
    setMoodleCourseContents([]);
    setMoodleCourseContentsError('');
    setSelectedMoodleContentIds([]);
    setAiBeaconOutputLanguage('auto');
    setAiBeaconLanguageError('');
  };

  const filteredMonitorings = monitorings
    .filter(monitoring =>
      monitoring.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      monitoring.description.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => new Date(b.creationDate) - new Date(a.creationDate));

  const selectedMonitoring = monitorings.find(
    m => m._id === expandedMonitoring
  );
  const showAiBeaconContentsInAssessmentModal =
    showCourseField &&
    openAssessmentDialog &&
    newAssessmentType === AssessmentType.LEARNING &&
    !!selectedMonitoring?.courseAiBeaconId &&
    !!selectedMonitoring?.courseSyncedAt;

  useEffect(() => {
    if (showAiBeaconContentsInAssessmentModal) {
      setSelectedMoodleContentIds([]);
      setAiBeaconOutputLanguage('auto');
      setAiBeaconLanguageError('');
    }
  }, [showAiBeaconContentsInAssessmentModal]);

  const handleAiBeaconOutputLanguageChange = async (event) => {
    const language = event.target.value;
    const courseAiBeaconId = selectedMonitoring?.courseAiBeaconId;
    const previous = aiBeaconOutputLanguage;
    if (!courseAiBeaconId || aiBeaconLanguageSaving) return;

    const token = localStorage.getItem('token');
    if (!token) {
      setAiBeaconLanguageError('Could not save language.');
      return;
    }

    setAiBeaconOutputLanguage(language);
    setAiBeaconLanguageError('');
    setAiBeaconLanguageSaving(true);
    try {
      await axios.put(
        `${BACKEND_URL}/aiBeacon/courses/${encodeURIComponent(courseAiBeaconId)}`,
        { language },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (e) {
      setAiBeaconOutputLanguage(previous);
      const msg = e?.response?.data?.error || e?.response?.data?.message;
      setAiBeaconLanguageError(typeof msg === 'string' ? msg : 'Could not save language.');
    } finally {
      setAiBeaconLanguageSaving(false);
    }
  };

  useEffect(() => {
    if (!showAiBeaconContentsInAssessmentModal) {
      setMoodleCourseContents([]);
      setMoodleCourseContentsError('');
      setSelectedMoodleContentIds([]);
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      setMoodleCourseContents([]);
      setMoodleCourseContentsError('No authentication token available.');
      return;
    }

    let cancelled = false;
    const loadCourseContents = async () => {
      setIsLoadingMoodleCourseContents(true);
      setMoodleCourseContentsError('');
      try {
        const response = await axios.get(
          `${BACKEND_URL}/aiBeacon/courses/${encodeURIComponent(selectedMonitoring.courseAiBeaconId)}/contents`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const contents = Array.isArray(response?.data?.contents)
          ? response.data.contents
          : [];
        if (!cancelled) {
          setMoodleCourseContents(contents);
        }
      } catch (e) {
        if (!cancelled) {
          setMoodleCourseContents([]);
          setMoodleCourseContentsError('Failed to load Moodle course contents.');
        }
      } finally {
        if (!cancelled) {
          setIsLoadingMoodleCourseContents(false);
        }
      }
    };

    loadCourseContents();
    return () => {
      cancelled = true;
    };
  }, [showAiBeaconContentsInAssessmentModal, selectedMonitoring?.courseAiBeaconId]);

  const toggleMoodleContentSelected = (contentId) => {
    if (contentId == null) return;
    setSelectedMoodleContentIds((prev) =>
      prev.includes(contentId)
        ? prev.filter((id) => id !== contentId)
        : [...prev, contentId]
    );
  };

  const scroll = direction => {
    const container = scrollContainerRef.current;
    if (container) {
      const cardWidth = 300;
      const scrollAmount = direction === "left" ? -cardWidth : cardWidth;
      container.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  return (
    <Box
      display="flex"
      height="100vh"
      bgcolor="#f9f9f9"
      sx={{ maxWidth: "100vw", overflow: "hidden" }}
    >
      <Sidebar />
      <Box
        display="flex"
        flex={1}
        flexDirection="column"
        justifyContent="space-between"
        sx={{ width: 0 }}
      >
        <Topbar title={getMessage("label_dashboard_title")} />
        <Box
          p={3}
          sx={{
            flex: 1,
            width: "100%",
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: 3
          }}
        >
          {/** Only show the search bar & monitoring cards if monitorings exist **/}
          {monitorings.length > 0 ? (
            <>
              {/* Search Bar */}
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
              >
                <TextField
                  fullWidth
                  placeholder={getMessage("label_search_monitoring")}
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  InputProps={{
                    endAdornment: <Search size={20} />,
                    sx: { bgcolor: "background.paper" }
                  }}
                  sx={{ flex: 1 }}
                />
              </Box>

              {/* Monitoring Cards */}
              <Box sx={{ position: "relative", width: "100%", mb: 7 }}>
                {filteredMonitorings.length > 0 && (
                  <IconButton
                    onClick={() => scroll("left")}
                    sx={{
                      position: "absolute",
                      left: 0,
                      top: "50%",
                      transform: "translateY(-50%)",
                      zIndex: 2,
                      bgcolor: "background.paper",
                      boxShadow: 2,
                      "&:hover": { bgcolor: "background.paper" }
                    }}
                  >
                    <ChevronLeft />
                  </IconButton>
                )}

                <Box
                  ref={scrollContainerRef}
                  sx={{
                    display: "flex",
                    overflowX: "auto",
                    gap: 2,
                    pb: 2,
                    px: 6,
                    scrollBehavior: "smooth",
                    "&::-webkit-scrollbar": { display: "none" },
                    msOverflowStyle: "none",
                    scrollbarWidth: "none",
                    width: "calc(100% - 48px)",
                    margin: "0 auto",
                    position: "relative"
                  }}
                >
                  {filteredMonitorings.map(monitoring => (
                    <MonitoringCard
                      key={monitoring._id}
                      monitoring={monitoring}
                      expandedMonitoring={expandedMonitoring}
                      setExpandedMonitoring={id => {
                        setExpandedMonitoring(id);
                        setCurrentMonitoringId(id);
                        setSelectedAssessmentsIds([]);
                      }}
                      setMonitorings={setMonitorings}
                      setCurrentMonitoringId={setCurrentMonitoringId}
                      setAssessments={setAssessments}
                      assessments={assessments}
                      monitorings={monitorings}
                    />
                  ))}
                </Box>

                {filteredMonitorings.length > 0 && (
                  <IconButton
                    onClick={() => scroll("right")}
                    sx={{
                      position: "absolute",
                      right: 0,
                      top: "50%",
                      transform: "translateY(-50%)",
                      zIndex: 2,
                      bgcolor: "background.paper",
                      boxShadow: 2,
                      "&:hover": { bgcolor: "background.paper" }
                    }}
                  >
                    <ChevronRight />
                  </IconButton>
                )}
              </Box>
            </>
          ) : (
            // Fallback if no monitorings
            <Box>
              <Typography variant="h6">
                {getMessage("label_no_monitorings_found")}
              </Typography>
            </Box>
          )}

          {/* New Monitoring/Import Buttons (always visible) */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 2,
              mt: -8,
              mb: 1
            }}
          >
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              sx={buttonStyle}
              onClick={handleImportMonitoring}
            >
              {getMessage("label_button_import_monitoring")}
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              sx={buttonStyle}
              onClick={() => {
                setOpenMonitoringDialog(true);
                if (currentUser?.sandbox && monitorings.length >= 1) {
                  setShowSandboxLimitAlert(true);
                }
              }}
            >
              {getMessage("table_monitoring_button_new_monitoring")}
            </Button>
          </Box>

          {/* Create Monitoring Dialog */}
          {/* Create Monitoring Dialog */}
          <Dialog
            open={openMonitoringDialog}
            onClose={() => {
              handleCloseMonitoringDialog();
              setShowSandboxLimitAlert(false);
            }}
          >
            <DialogTitle variant="h3">
              {getMessage("new_monitoring_create_new_monitoring")}
            </DialogTitle>
            <DialogContent>
              {showSandboxLimitAlert && currentUser?.sandbox && monitorings.length >= 1 && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  {getMessage("sandbox_user_monitoring_limit")}
                </Alert>
              )}
              <TextField
                autoFocus
                size="small"
                margin="dense"
                id="name"
                label={getMessage("label_name")}
                type="text"
                fullWidth
                value={newMonitoringName}
                onChange={e => setNewMonitoringName(e.target.value)}
                disabled={showSandboxLimitAlert}
              />
              <TextField
                margin="dense"
                id="description"
                label={getMessage("new_monitoring_description")}
                type="text"
                fullWidth
                value={newMonitoringDescription}
                onChange={e => setNewMonitoringDescription(e.target.value)}
                disabled={currentUser?.sandbox && monitorings.length >= 1}
              />
              {showCourseField && (
                <Box mt="20px">
                  <Select
                    value={newMonitoringCourseId}
                    margin="dense"
                    size="small"
                    fullWidth
                    onChange={e => setNewMonitoringCourseId(e.target.value)}
                    disabled={coursesLoading}
                    displayEmpty
                  >
                    <MenuItem value="">
                      {getMessage("label_select_course")}
                    </MenuItem>
                    {courseOptions.map(course => (
                      <MenuItem key={course.id} value={course.id}>
                        {course.name}
                      </MenuItem>
                    ))}
                  </Select>

                  {coursesLoading && (
                    <Box display="flex" justifyContent="flex-start" mt={1}>
                      <CircularProgress size={20} />
                    </Box>
                  )}
                  {coursesError && (
                    <Box mt="10px">
                      <Alert severity="error">{coursesError}</Alert>
                    </Box>
                  )}
                </Box>
              )}
              {error && error !== getMessage("sandbox_user_monitoring_limit") && (
                <Box mt="15px">
                  <Alert severity="error">
                    {error}
                  </Alert>
                </Box>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseMonitoringDialog}>
                {getMessage("label_cancel")}
              </Button>
              <Button
                onClick={handleCreateMonitoring}
                variant="contained"
                color="primary"
                sx={buttonStyle}
                disabled={showSandboxLimitAlert}
              >
                {getMessage("new_monitoring_create")}
              </Button>
            </DialogActions>
          </Dialog>

          {/* Import Monitoring Dialog */}
          <Dialog open={openLoadCodeDialog} onClose={handleCloseLoadCodeDialog}>
            <DialogTitle>{getMessage("load_code_dialog_title")}</DialogTitle>
            <DialogContent>
              {currentUser?.sandbox && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  {getMessage("sandbox_user_cannot_import")}
                </Alert>
              )}
              <TextField
                autoFocus
                margin="dense"
                id="loadCode"
                label={getMessage("label_code_dialog_enter")}
                type="text"
                fullWidth
                value={loadCode}
                onChange={e => setLoadCode(e.target.value)}
                error={!!loadCodeError}
                helperText={loadCodeError}
                disabled={currentUser?.sandbox} 
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseLoadCodeDialog}>
                {getMessage("label_cancel")}
              </Button>
              <Button
                onClick={handleLoadCode}
                variant="contained"
                color="primary"
                sx={buttonStyle}
                disabled={currentUser?.sandbox} 
              >
                {getMessage("label_import")}
              </Button>
            </DialogActions>
          </Dialog>

          {/* Create Assessment Dialog */}
          <Dialog
            open={openAssessmentDialog}
            onClose={isCreatingAssessment ? undefined : handleCloseAssessmentDialog}
          >
            <DialogTitle variant="h3">
              {getMessage("label_create_new_assessment")}
            </DialogTitle>
            <DialogContent>
              <Box display="flex" alignItems="center">
                <Typography>{getMessage("new_assessment_day")} &nbsp; </Typography>
                <TextField
                  id="day"
                  type="number"
                  autoFocus
                  size="small"
                  style={{ width: "70px" }}
                  margin="dense"
                  inputProps={{
                    min: "1",
                    style: { textAlign: "center" }
                  }}
                  sx={{
                    "& .MuiInputBase-input": {
                      textAlign: "center"
                    }
                  }}
                  value={newAssessmentDay === "" ? "" : newAssessmentDay}
                  onChange={e => {
                    const value =
                      e.target.value === ""
                        ? ""
                        : Math.max(1, parseInt(e.target.value, 10) || 1);
                    setNewAssessmentDay(value);
                  }}
                  disabled={isCreatingAssessment}
                />
              </Box>

             
              <Box mt="20px" mb="5px">
                <InputLabel id="type-label">
                  {getMessage("new_assessment_type_assessment")}
                </InputLabel>
              </Box>
              <Select
                value={newAssessmentType}
                margin="dense"
                size="small"
                id="type"
                labelId="type-label"
                fullWidth
                onChange={e => setNewAssessmentType(e.target.value)}
                disabled={isCreatingAssessment}
              >
                {currentUser.userStatus === UserType.TEACHER_TRAINER
                  ? [
                      <MenuItem
                        key="trainee"
                        value={AssessmentType.TRAINEE_CHARACTERISTICS}
                      >
                        {getMessage(
                          "label_assessment_type_trainee_characteristics"
                        )}
                      </MenuItem>,
                      <MenuItem
                        key="training"
                        value={AssessmentType.TRAINING_CHARACTERISTICS}
                      >
                        {getMessage(
                          "label_assessment_type_training_characteristics"
                        )}
                      </MenuItem>,
                      <MenuItem
                        key="immediate"
                        value={AssessmentType.IMMEDIATE_REACTIONS}
                      >
                        {getMessage("label_assessment_type_immediate_reactions")}
                      </MenuItem>,
                      <MenuItem key="learning" value={AssessmentType.LEARNING}>
                        {getMessage("label_assessment_type_learning")}
                      </MenuItem>,
                      <MenuItem
                        key="organizational"
                        value={AssessmentType.ORGANIZATIONAL_CONDITIONS}
                      >
                        {getMessage(
                          "label_assessment_type_organizational_conditions"
                        )}
                      </MenuItem>,
                      <MenuItem
                        key="behavioral"
                        value={AssessmentType.BEHAVIORAL_CHANGES}
                      >
                        {getMessage("label_assessment_type_behavioral_changes")}
                      </MenuItem>,
                      <MenuItem
                        key="sustainability"
                        value={AssessmentType.SUSTAINABILITY_CONDITIONS}
                      >
                        {getMessage(
                          "label_assessment_type_sustainability_conditions"
                        )}
                      </MenuItem>,
                      <MenuItem
                        key="studentCharacteristics"
                        value={AssessmentType.STUDENT_CHARACTERISTICS}
                      >
                        {getMessage(
                          "label_assessment_type_student_characteristics"
                        )}
                      </MenuItem>,
                      <MenuItem
                        key="studentOutcomes"
                        value={AssessmentType.STUDENT_LEARNING_OUTCOMES}
                      >
                        {getMessage(
                          "label_assessment_type_student_learning_outcomes"
                        )}
                      </MenuItem>
                    ]
                  : [
                      <MenuItem
                        key="studentCharacteristics"
                        value={AssessmentType.STUDENT_CHARACTERISTICS}
                      >
                        {getMessage(
                          "label_assessment_type_student_characteristics"
                        )}
                      </MenuItem>,
                      <MenuItem
                        key="studentOutcomes"
                        value={AssessmentType.STUDENT_LEARNING_OUTCOMES}
                      >
                        {getMessage(
                          "label_assessment_type_student_learning_outcomes"
                        )}
                      </MenuItem>
                    ]}
              </Select>

               <Box mb="20px" mt="20px">
                <TextField
                  value={newAssessmentName}
                  autoFocus
                  size="small"
                  margin="dense"
                  id="name"
                  label={getMessage("label_name")}
                  type="text"
                  fullWidth
                  onChange={e => setNewAssessmentName(e.target.value)}
                  disabled={isCreatingAssessment}
                />
              </Box>

              {showAiBeaconContentsInAssessmentModal && (
                <Box mb="20px">
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 2,
                      flexWrap: 'wrap',
                      mb: 2,
                    }}
                  >
                    <Typography
                      component="span"
                      variant="body2"
                      color="text.secondary"
                      sx={{ whiteSpace: 'nowrap' }}
                    >
                      {getMessage('label_language')}
                    </Typography>
                    <Box
                      sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-end',
                        gap: 0.5,
                        minWidth: 120,
                      }}
                    >
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          flexWrap: 'wrap',
                          justifyContent: 'flex-end',
                        }}
                      >
                        <Select
                          size="small"
                          value={aiBeaconOutputLanguage}
                          onChange={handleAiBeaconOutputLanguageChange}
                          disabled={!selectedMonitoring?.courseAiBeaconId || aiBeaconLanguageSaving || isCreatingAssessment}
                          inputProps={{
                            'aria-label': getMessage('label_language'),
                          }}
                          sx={{
                            minWidth: 148,
                            boxShadow: 'none',
                            '.MuiOutlinedInput-notchedOutline': { borderColor: 'divider' },
                          }}
                          renderValue={(value) => {
                            if (value === 'auto') {
                              return (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                                  <Globe2 size={18} aria-hidden />
                                  {getMessage('label_ai_beacon_auto_detect')}
                                </Box>
                              );
                            }
                            const flagClass =
                              value === 'en'
                                ? 'fi fi-gb'
                                : value === 'de'
                                  ? 'fi fi-de'
                                  : value === 'fr'
                                    ? 'fi fi-fr'
                                    : 'fi fi-it';
                            const native =
                              value === 'en'
                                ? 'English'
                                : value === 'fr'
                                  ? 'Français'
                                  : value === 'de'
                                    ? 'Deutsch'
                                    : 'Italiano';
                            return (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <span className={flagClass} aria-hidden />
                                {native}
                              </Box>
                            );
                          }}
                        >
                          <MenuItem value="auto">
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Globe2 size={18} aria-hidden />
                              {getMessage('label_ai_beacon_auto_detect')}
                            </Box>
                          </MenuItem>
                          <MenuItem value="en">
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <span className="fi fi-gb" aria-hidden />
                              English
                            </Box>
                          </MenuItem>
                          <MenuItem value="fr">
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <span className="fi fi-fr" aria-hidden />
                              Français
                            </Box>
                          </MenuItem>
                          <MenuItem value="de">
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <span className="fi fi-de" aria-hidden />
                              Deutsch
                            </Box>
                          </MenuItem>
                          <MenuItem value="it">
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <span className="fi fi-it" aria-hidden />
                              Italiano
                            </Box>
                          </MenuItem>
                        </Select>
                      </Box>
                      {aiBeaconLanguageError ? (
                        <Typography variant="caption" color="error" sx={{ textAlign: 'right' }}>
                          {aiBeaconLanguageError}
                        </Typography>
                      ) : null}
                    </Box>
                  </Box>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    {getMessage('label_select_your_content')}
                  </Typography>
                  {isLoadingMoodleCourseContents ? (
                    <Box display="flex" justifyContent="center" py={2}>
                      <CircularProgress size={22} />
                    </Box>
                  ) : moodleCourseContentsError ? (
                    <Alert severity="error">{moodleCourseContentsError}</Alert>
                  ) : moodleCourseContents.length === 0 ? (
                    <Typography color="text.secondary">No course contents found.</Typography>
                  ) : (
                    <TableContainer component={Paper} variant="outlined" sx={{ mt: 1, maxHeight: 220 }}>
                      <Table size="small" stickyHeader>
                        <TableBody>
                          {moodleCourseContents.map((content, index) => {
                            const contentId =
                              content.id != null && content.id !== ''
                                ? Number(content.id)
                                : null;
                            return (
                              <TableRow key={String(contentId ?? index)}>
                                <TableCell padding="checkbox" sx={{ width: 48 }}>
                                  <Checkbox
                                    size="small"
                                    checked={contentId != null && selectedMoodleContentIds.includes(contentId)}
                                    disabled={!contentId || isCreatingAssessment}
                                    onChange={() => toggleMoodleContentSelected(contentId)}
                                  />
                                </TableCell>
                                <TableCell>{content.name || '-'}</TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </Box>
              )}

              {error && (
                <Box mt="15px">
                  <Alert severity={
                    error === getMessage("sandbox_user_monitoring_limit") || 
                    error === getMessage("sandbox_user_assessment_type_limit") 
                      ? "info" 
                      : "error"
                  }>
                    {error}
                  </Alert>
                </Box>
              )}
            </DialogContent>

            <DialogActions>
              <Button onClick={handleCloseAssessmentDialog} disabled={isCreatingAssessment}>
                {getMessage("label_cancel")}
              </Button>
              <Box sx={{ display: "flex", justifyContent: "flex-end", p: 1 }}>
                <Button
                  onClick={handleCreateAssessment}
                  variant="contained"
                  color="primary"
                  sx={buttonStyle}
                  disabled={isCreatingAssessment}
                  startIcon={isCreatingAssessment ? <CircularProgress size={18} color="inherit" /> : undefined}
                >
                  {isCreatingAssessment ? "Creating..." : getMessage("new_assessment_create")}
                </Button>
              </Box>
            </DialogActions>
          </Dialog>

          {/* Assessments and Sharing Section */}
          {selectedMonitoring && (
            <Box sx={{ display: "flex", gap: 2 }}>
              <Box sx={{ flex: 2 }}>
                <AssessmentsTable
                  assessments={assessments}
                  setAssessments={setAssessments}
                  setMonitorings={setMonitorings}
                  monitorings={monitorings}
                  currentMonitoringId={currentMonitoringId}
                  onSyncCourseFromMoodle={handleSyncCourseFromMoodle}
                  isSyncingCourse={isSyncingCourse}
                  showSyncCourseButton={
                    showCourseField &&
                    !!selectedMonitoring?.courseMoodleId
                  }
                  currentAssessmentId={currentAssessmentId}
                  setCurrentAssessmentId={setCurrentAssessmentId}
                  setIsOpen={setIsOpen}
                  setOpenAssessmentsCount={setOpenAssessmentsCount}
                  selectedAssessmentsIds={selectedAssessmentsIds}
                  setSelectedAssessmentsIds={setSelectedAssessmentsIds}
                />
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "flex-end",
                    mt: 2
                  }}
                >
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    sx={buttonStyle}
                    onClick={() => {
                      setError(null);
                      setOpenAssessmentDialog(true);
                    }}
                  >
                    {getMessage("label_new_assessment")}
                  </Button>
                </Box>
              </Box>

              {selectedAssessmentsIds.length > 0 && (
                <Box sx={{ flex: 1 }}>
                  <SharingAssessments
                    selectedAssessmentsIds={selectedAssessmentsIds}
                    assessments={assessments}
                    currentMonitoringId={currentMonitoringId}
                  />
                </Box>
              )}
            </Box>
          )}
        </Box>
        <Footer />
      </Box>
    </Box>
  );
};

export default Dashboard;
