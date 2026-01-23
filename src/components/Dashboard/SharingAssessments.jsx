import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Paper,
  IconButton,
  Tooltip,
} from '@mui/material';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import SwipeRightAltIcon from '@mui/icons-material/SwipeRightAlt';
import InsertLinkIcon from '@mui/icons-material/InsertLink';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import EditIcon from '@mui/icons-material/Edit';
import { QRCodeCanvas } from 'qrcode.react';
import jwt_decode from "jwt-decode";
import axios from "axios";
import { saveAs } from 'file-saver';

//dependencies
import { useMessageService } from '../../services/MessageService';
import { useLanguage } from '../../contexts/LanguageContext';
import { FRONTEND_URL } from "../../config";
import { BACKEND_URL } from "../../config";
import { useAuthUser } from '../../contexts/AuthUserContext';




const SharingAssessments = ({ selectedAssessmentsIds, assessments, currentMonitoringId }) => {
  const [showPaperCode, setShowPaperCode] = useState(false);
  const [generatedCode, setGeneratedCode] = useState('');
  const [isCodeVisible, setIsCodeVisible] = useState(false);
  const [isLinked, setIsLinked] = useState(false);
  const { getMessage } = useMessageService();
  const sharingCode = "123456";
  const { languageCode } = useLanguage();
  const { currentUser } = useAuthUser(); 


  // assessments states 
  const [selectedAssessmentIds, setSelectedAssessmentIds] = useState([]); // assessments selected to "share" -> will be included in the QR code
  const qrCodeRef = useRef(null); // the qrCodeReference

  useEffect(() => {
  setSelectedAssessmentIds(selectedAssessmentsIds);
}, [selectedAssessmentsIds]);
  
  const selectedAssessmentDetails = selectedAssessmentsIds.map((id, index) => {
    const assessment = assessments.find(a => a._id === id);
    return {
      ...assessment,
      pageNumber: index + 1, // Keep user-selected order
    };
  });



/**
  * Generate a QR code for the current monitoringID containing every assessment
  */
  const generateQRCodeValue = () => {
  const assessmentsQuery = selectedAssessmentsIds
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
    const token = localStorage.getItem("token");
    const decodedToken = jwt_decode(token);
    const sandbox = decodedToken.sandbox;

    const response = await axios.post(
      `${BACKEND_URL}/export/pdfPaperVersion`, 
      {
        currentUserId: currentUser._id,
        monitoringId: currentMonitoringId,
        assessmentIds: selectedAssessmentsIds,
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


  const generateUniqueAlphanumericCode = () => {
    if (!currentMonitoringId) {
      return '------';
    }
  
    const filteredAssessmentIds = assessments
      ?.filter(assessment => 
        assessment?.monitoringId === currentMonitoringId && 
        selectedAssessmentsIds?.includes(assessment._id)
      )
      ?.map(assessment => assessment._id) || [];
  
    if (filteredAssessmentIds.length === 0) {
      return '------';
    }
  
    try {
      const concatenatedIds = filteredAssessmentIds.sort().join('');
  
      let checksum = 0;
      for (let i = 0; i < concatenatedIds.length; i++) {
        checksum = (checksum * 31 + concatenatedIds.charCodeAt(i)) & 0xFFFFFFFF;
      }
  
      const base36String = (checksum >>> 0).toString(36).toUpperCase();
      return base36String.length < 6 
        ? base36String.padEnd(6, base36String) 
        : base36String.slice(0, 6);
        
    } catch (error) {
      console.error('Error generating code:', error);
      return '------';
    }
  };
  
  useEffect(() => {
    setGeneratedCode(generateUniqueAlphanumericCode());
    setIsCodeVisible(false);
  }, [selectedAssessmentsIds, currentMonitoringId, assessments]);
  
  const handleToggleCodeVisibility = () => {
    setIsCodeVisible(!isCodeVisible);
  };

  return (
    <Paper
      elevation={0}
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        overflow: 'hidden',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header Section */}
      <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Typography variant="h4" fontWeight={800} gutterBottom>
          {getMessage("label_qr_code_section")}
        </Typography>
      </Box>

      {/* Assessment Order Section */}
      <Box sx={{ textAlign: 'center', mt : 2, bgcolor: 'background.default' }}>
        <Typography variant="h5" gutterBottom>
          {getMessage("dashboard_share_open_assessments_together")}
        </Typography>
        <div style={{ marginTop: '10px', marginBottom: '15px' }}>
          {selectedAssessmentDetails.map((assessment, index) => (
            <Typography
              key={assessment._id}
              variant="body1"
              sx={{
                fontSize: '1rem',
                marginBottom: '5px',
                lineHeight: 1.4,
              }}
            >
              {`${getMessage("label_page_qr_code")} ${assessment.pageNumber}: ${assessment.name}`}
            </Typography>
          ))}
        </div>
      </Box>

      {/* QR Code Section */}
      <Box
        ref={qrCodeRef}
        sx={{
            p: 2,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            flex: 1,
        }}
        >
        <Box
            sx={{
            width: 300,
            height: 300,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: '16px',
            mb: 3,
            }}
        >
            {selectedAssessmentIds.length > 0 ? (
            <QRCodeCanvas
                value={generateQRCodeValue()}
                size={280}
                level="H"
                includeMargin={true}
            />
            ) : (
            <QrCodeScannerIcon sx={{ fontSize: 160, color: 'text.secondary' }} />
            )}
        </Box>

        <Box
            sx={{
            display: 'flex',
            gap: 1,
            justifyContent: 'center',
            width: '100%',
            }}
        >
            <Tooltip title={getMessage('label_tooltip_download_pdf')}>
                <span>
                    <IconButton
                        onClick={handleDownloadPaperVersion}
                        sx={{ border: '1px solid', borderColor: 'divider' }}
                        disabled={selectedAssessmentIds.length === 0}
                    >
                        <PictureAsPdfIcon />
                    </IconButton>
                </span>
            </Tooltip>
            <Tooltip title={getMessage('label_tooltip_download_qr')}>
                <span>
                    <IconButton
                        onClick={handleDownloadQR}
                        sx={{ border: '1px solid', borderColor: 'divider' }}
                        disabled={selectedAssessmentIds.length === 0}
                    >
                        <QrCodeScannerIcon />
                    </IconButton>
                </span>
            </Tooltip>
            <Tooltip title={getMessage('label_tooltip_copy_link')}>
                <span>
                    <IconButton
                        onClick={handleCopyToClipboard}
                        sx={{ border: '1px solid', borderColor: 'divider' }}
                        disabled={selectedAssessmentIds.length === 0}
                    >
                        <InsertLinkIcon />
                    </IconButton>
                </span>
            </Tooltip>
            <Tooltip title={isLinked ? getMessage('tooltip_unlink_answers') : getMessage('tooltip_link_answers')}>
                <span>
                    <IconButton
                        onClick={handleIconClick}
                        sx={{ 
                        border: '1px solid', 
                        borderColor: 'divider',
                        bgcolor: isLinked ? 'common.white' : 'transparent',
                        color: isLinked ? '#4CAF50' : 'inherit',
                        '&:hover': {
                            bgcolor: isLinked ? 'common.white' : 'action.hover'
                        }
                        }}
                        disabled={selectedAssessmentIds.length === 0}
                    >
                        <SwipeRightAltIcon />
                    </IconButton>
                </span>
            </Tooltip>
        </Box>
        </Box>

      {/* Paper Code Section */}
      <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider', textAlign: 'center' }}>
  <Box
    sx={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 1,
    }}
  >
      <IconButton
        onClick={handleToggleCodeVisibility}
        sx={{
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        <EditIcon />
      </IconButton>
    <Typography
      variant="body2"
      sx={{
        fontWeight: 500,
        fontSize: '0.85rem',
        fontFamily: isCodeVisible ? 'monospace' : 'inherit',
      }}
    >
      {isCodeVisible ? generatedCode : getMessage('dashboard_share_code_reporting_grades')}
    </Typography>
    {isCodeVisible && (
      <Tooltip>
        <IconButton 
          onClick={(e) => {
            e.stopPropagation();
            handleCopyCode();
          }} 
          size="small"
        >
          <ContentCopyIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    )}
  </Box>
</Box>
    </Paper>
  );
};

export default SharingAssessments;
