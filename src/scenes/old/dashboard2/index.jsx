import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Typography, IconButton, Tooltip, useTheme } from "@mui/material";
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import SwipeRightAltIcon from '@mui/icons-material/SwipeRightAlt';
import InsertLinkIcon from '@mui/icons-material/InsertLink';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import jwt_decode from "jwt-decode";
import { QRCodeCanvas } from 'qrcode.react';
import axios from "axios";
import { saveAs } from 'file-saver';

// dependencies
import { loadMonitoringAndAssessments } from "../../../utils/ObjectsUtils";
import MonitoringsTable from '../../../components/MonitoringTable';
import AssessmentsTable from '../../../components/old/AssessmentsTable';
import Sidebar from "../../global/Sidebar";
import Topbar from "../../global/Topbar";
import Footer from "../../global/Footer";
import { FRONTEND_URL } from "../../../config";
import { BACKEND_URL } from "../../../config";
import { useMessageService } from '../../../services/MessageService';
import { useLanguage } from '../../../contexts/LanguageContext';
import { useAuthUser } from '../../../contexts/AuthUserContext';


const Dashboard = () => {


  // monitoring states
  const [currentMonitoringId, setCurrentMonitoringId] = useState(null) // the currecntly selected monitoring Id
  const [monitorings, setMonitorings] = useState([]); // every monitorings 
  // assessments states
  const [currentAssessmentId, setCurrentAssessmentId] = useState(null) // the currecntly selected assessment Id
  const [assessments, setAssessments] = useState([]); // dict with all assessments
  const [selectedAssessmentIds, setSelectedAssessmentIds] = useState([]); // assessments selected to "share" -> will be included in the QR code
  const [isOpen, setIsOpen] = useState(false); // isOpen true is used to open an assessment -> get the QR code
  const qrCodeRef = useRef(null); // the qrCodeReference
  const largeQRCodeRef = useRef(null); // the largeQrCodeReference

  const [ openAssesmentCount, setOpenAssessmentsCount] = useState(0);
  const { getMessage } = useMessageService();
  const { languageCode } = useLanguage();
  const { currentUser } = useAuthUser();
  const [isLoading, setIsLoading] = useState(true); // loading state when loading monitorings and assessments
  const [isLinked, setIsLinked] = useState(false); // when true, several assessments filled together will be linked by an id (make possible to correlate surveys)
  const [isCodeVisible, setIsCodeVisible] = useState(false); // When true, the code to report data with the paper and pencil functionality is visible
  const [generatedCode, setGeneratedCode] = useState(''); // Store the generated code for the paper and pencil functionality
  const theme = useTheme()
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

    //console.log("---------- DATA UPDATED ----------");

    //console.log("currentMonitoringId", currentMonitoringId);
    //console.log("assessments", assessments);
    //console.log("currentAssessmentId", currentAssessmentId);
    //console.log("monitorings", monitorings);
    //console.log("isOpen", isOpen);
    //console.log("selectedAssessmentIds", selectedAssessmentIds);
    //console.log("currentUser", currentUser);
    
  }, [currentMonitoringId, assessments, currentAssessmentId, monitorings, isOpen, selectedAssessmentIds]);

  useEffect(() => {
    const fetchMonitoringsAndAssessments = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem("token");
        if (isTokenExpired(token)) {
          console.log("🚫 Impossible de charger les données - Token expiré");
          navigate("/signin");
          return;
        }
        await loadMonitoringAndAssessments(currentUser, setMonitorings, setAssessments, setCurrentMonitoringId);
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

  /**
  * Generate a QR code for the current monitoringID containing every assessment
  */
  const generateQRCodeValue = () => {
    // Filter selectedAssessmentIds to include only those assessments
    // that have the correct monitoringId
    const filteredAssessmentIds = selectedAssessmentIds.filter(id => {
      return assessments.some(
        assessment =>
          assessment._id === id && assessment.monitoringId === currentMonitoringId
      );
    });
  
    // Build the assessmentsQuery string in the desired order
    const assessmentsQuery = filteredAssessmentIds
      .map(id => `assessment[]=${id}`)
      .join('&');
  
    const token = localStorage.getItem('token');
    const decodedToken = jwt_decode(token);
    const sandbox = decodedToken.sandbox;
  
    return `${FRONTEND_URL}/completeSurvey?userId=${currentUser._id}&monitoring=${currentMonitoringId}&${assessmentsQuery}&link=${isLinked}&lng=${languageCode}&sandbox=${sandbox}`;
  };

  /**
   * Initiates the download of a QR code as a PNG image. It first checks if the QR code reference (`qrCodeRef`) is present and 
   * contains a canvas element. If found, it converts the canvas to a PNG data URL, creates an anchor (`<a>`) element with the 
   * 'download' attribute to trigger the download, and simulates a click on this anchor. After the download, the anchor element 
   * is removed from the document body to clean up.
   */
  const handleDownloadQR = () => {
    if (qrCodeRef.current) {
      const canvas = qrCodeRef.current.querySelector('canvas');

      if (canvas) {
        const image = canvas.toDataURL("image/png");
        const link = document.createElement('a');
        link.download = "QRCode.png";
        link.href = image;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    }
  };

  /**
  * Copy the QR code to the clipboard
  */
  const handleCopyToClipboard = () => {
    const qrValue = generateQRCodeValue();
    navigator.clipboard.writeText(qrValue);
  };

  /**
  * Copy the code to the clipboard
  */
  const handleCopyCode = () => {
    navigator.clipboard.writeText(generatedCode).then(() => {
      // You might want to add some visual feedback here, like a temporary tooltip
      console.log('Code copied to clipboard');
    }, (err) => {
      console.error('Could not copy text: ', err);
    });
  };

  /**
  * Copy the QR code to the clipboard
  */
  const handleIconClick = () => {
  setIsLinked(!isLinked);
};

/**
  * Allow to download a paper-pencil version with the assessments selected
  */
const handleDownloadPaperVersion = async () => {
  try {
    const filteredAssessmentIds = assessments
      .filter(assessment => assessment.monitoringId === currentMonitoringId && selectedAssessmentIds.includes(assessment._id))
      .map(filteredAssessment => filteredAssessment._id);

    const token = localStorage.getItem("token");
    const decodedToken = jwt_decode(token);
    const sandbox = decodedToken.sandbox;

    const response = await axios.post(
      `${BACKEND_URL}/export/pdfPaperVersion`, 
      {
        currentUserId: currentUser._id,
        monitoringId: currentMonitoringId,
        assessmentIds: filteredAssessmentIds,
        lng: languageCode,
        isLinked: isLinked,
        sandbox: sandbox
      }, 
      {
        responseType: 'blob',
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    const file = new Blob([response.data], { type: 'application/pdf' });

    saveAs(file, 'report.pdf');
  } catch (error) {
    console.error('Error exporting PDF:', error);
  }
};


// Generate a consistent 6-character alphanumeric code based on the assessment IDs
const generateUniqueAlphanumericCode = () => {
  // Early return if no monitoring ID is selected
  if (!currentMonitoringId) {
    return '------';
  }

  // Get filtered assessment IDs with null checks
  const filteredAssessmentIds = assessments
    ?.filter(assessment => 
      assessment?.monitoringId === currentMonitoringId && 
      selectedAssessmentIds?.includes(assessment._id)
    )
    ?.map(assessment => assessment._id) || [];

  // Return placeholder if no assessments are selected
  if (filteredAssessmentIds.length === 0) {
    return '------';
  }

  try {
    // Sort and join assessment IDs into one string
    const concatenatedIds = filteredAssessmentIds.sort().join('');

    // Calculate checksum
    let checksum = 0;
    for (let i = 0; i < concatenatedIds.length; i++) {
      checksum = (checksum * 31 + concatenatedIds.charCodeAt(i)) & 0xFFFFFFFF;
    }

    // Convert to base-36 and ensure 6 characters
    const base36String = (checksum >>> 0).toString(36).toUpperCase();
    return base36String.length < 6 
      ? base36String.padEnd(6, base36String) 
      : base36String.slice(0, 6);
      
  } catch (error) {
    console.error('Error generating code:', error);
    return '------';
  }
};

// Toggle visibility of the code and generate a new one if it is not visible
useEffect(() => {
  setGeneratedCode(generateUniqueAlphanumericCode());
  setIsCodeVisible(false);

}, [selectedAssessmentIds]);

// Button click handler to toggle visibility
const handleToggleCodeVisibility = () => {
  setIsCodeVisible(!isCodeVisible);
};

   return (
    <Box display="flex" backgroundColor="white" style={{ height: '100vh' }}>
      <Sidebar />
      <Box display="flex" flex={1} flexDirection="column" justifyContent="space-between">
        <Box ml="10px">
          <Topbar title={getMessage('label_monitoring_title')} />
        </Box>
  
        <Box display="grid" gridTemplateColumns="repeat(12, 1fr)" gap="20px" ml="20px" mr="20px">
          { monitorings.find(monitoring => monitoring._id === currentMonitoringId) && (
            <Box gridColumn="span 9" sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <Typography 
                variant="h3" 
                fontWeight="bold" 
                noWrap
                sx={{
                  m: "10px",
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  width: '100%',
                  [theme.breakpoints.down('md')]: {
                    fontSize: '1.5rem',
                  },
                  [theme.breakpoints.down('sm')]: {
                    fontSize: '1.2rem',
                  },
                }}
              >
                {getMessage('label_table_assessment')} { monitorings.find(monitoring => monitoring._id === currentMonitoringId).name}
              </Typography>
              <Box flex={1} display="flex">
                <AssessmentsTable
                  assessments={assessments}
                  setAssessments={setAssessments}
                  monitorings={monitorings}
                  currentMonitoringId={currentMonitoringId}
                  currentAssessmentId={currentAssessmentId}
                  setCurrentAssessmentId={setCurrentAssessmentId}
                  setIsOpen={setIsOpen}
                  setOpenAssessmentsCount={setOpenAssessmentsCount}
                  selectedAssessmentIds={selectedAssessmentIds}
                  setSelectedAssessmentIds={setSelectedAssessmentIds}
                />
              </Box>
            </Box>
          )}
          
        {assessments.filter(assessment => assessment.monitoringId === currentMonitoringId).length > 0 && (
          <Box gridColumn="span 3" sx={{ display: 'flex', flexDirection: 'column' }}>
          <Typography 
            variant="h3" 
            fontWeight="bold" 
            noWrap
            sx={{
              m: "10px",
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              width: '100%',
              [theme.breakpoints.down('md')]: {
                fontSize: '1.5rem',
              },
              [theme.breakpoints.down('sm')]: {
                fontSize: '1.2rem',
              },
            }}
          >
            {getMessage('label_qr_code_section')}
          </Typography>
          <Box
              sx={{
                backgroundColor: 'white',
                height: '345px',
                border: '1px solid rgb(224,224,224)',
                borderRadius: '4px',
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                overflowY: 'auto',
              }}
            >
              {assessments.filter(assessment => assessment.monitoringId === currentMonitoringId && selectedAssessmentIds.includes(assessment._id)).length > 0 && (
                <Box sx={{ textAlign: 'center', p: '5px', width: '100%', height: '100%' }}>
                  <Typography variant="h5">
                    {getMessage('dashboard_share_open_assessments_together')}
                  </Typography>
                  <div style={{ marginTop: '10px', marginBottom: '15px' }}>
                    {selectedAssessmentIds.map((id, index) => {
                      // Find the assessment with the matching ID and monitoringId
                      const assessment = assessments.find(
                        (assessment) =>
                          assessment._id === id && assessment.monitoringId === currentMonitoringId
                      );
                      
                      // If the assessment is found, render it
                      if (assessment) {
                        const assessmentName = assessment.name || 'Unknown Assessment';
                        return (
                          <Typography variant="h5" key={assessment._id}>
                            {`${getMessage('label_page_qr_code')} ${index + 1}: ${assessmentName}`}
                          </Typography>
                        );
                      } else {
                        // Optionally handle the case where the assessment is not found
                        return null; // or render a placeholder or error message
                      }
                    })}
                  </div>
                  <Box mt={1} sx={{ alignItems: 'center' }}>
                    <div ref={largeQRCodeRef} style={{ display: 'flex', justifyContent: 'center' }}>
                      <QRCodeCanvas value={generateQRCodeValue()} size={160} />
                    </div>
                    <div ref={qrCodeRef} style={{ display: 'none' }}>
                      <QRCodeCanvas value={generateQRCodeValue()} size={1024} includeMargin />
                    </div>
                    <Box mt={1} sx={{ display: 'flex', justifyContent: 'center' }}>
                        <Tooltip title={getMessage('label_tooltip_download_pdf')}>
                          <IconButton color="inherit" onClick={handleDownloadPaperVersion}>
                            <PictureAsPdfIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={getMessage('label_tooltip_download_qr')}>
                          <IconButton color="inherit" onClick={handleDownloadQR}>
                            <QrCodeScannerIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={getMessage('label_tooltip_copy_link')}>
                          <IconButton color="inherit" onClick={handleCopyToClipboard}>
                            <InsertLinkIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={isLinked ? getMessage('label_tooltip_linked_on') : getMessage('label_tooltip_linked_off')}>
                          <IconButton color="inherit" onClick={handleIconClick}>
                            {isLinked ? (
                              <SwipeRightAltIcon sx={{ color: 'green' }} />
                            ) : (
                              <SwipeRightAltIcon sx={{ color: 'red' }} />
                            )}
                          </IconButton>
                        </Tooltip>
                      </Box>

                     <Box 
                      display="flex" 
                      alignItems="center" 
                      justifyContent="center"
                      mt="10px"
                      onClick={handleToggleCodeVisibility}
                      sx={{ 
                        cursor: 'pointer',
                      }}
                    >
                      <Typography variant="h5" sx={{ mr: isCodeVisible ? 2 : 0 }}>
                        {isCodeVisible ? generatedCode : getMessage('dashboard_share_code_reporting_grades')}
                      </Typography>
                      {isCodeVisible && (
                        <IconButton 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopyCode();
                          }} 
                          size="small"
                        >
                          <ContentCopyIcon fontSize="small" />
                        </IconButton>
                      )}
                    </Box>
                  </Box>
                </Box>
              )}
            </Box>
          </Box>)}
  
          <Box gridColumn="span 12">
            <Typography variant="h3" fontWeight="bold" m="10px">
              {getMessage('label_monitoring_title')}
            </Typography>
            <MonitoringsTable
              monitorings={monitorings}
              setMonitorings={setMonitorings}
              setCurrentMonitoringId={setCurrentMonitoringId}
              assessments={assessments}
              setAssessments={setAssessments}
            />
        </Box>
      </Box>
      <Footer />
    </Box>
  </Box>
);

};

export default Dashboard;