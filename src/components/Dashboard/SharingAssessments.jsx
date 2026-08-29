import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Paper,
  IconButton,
  Tooltip,
  Dialog,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Chip,
  Alert,
  CircularProgress,
} from '@mui/material';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import SwipeRightAltIcon from '@mui/icons-material/SwipeRightAlt';
import InsertLinkIcon from '@mui/icons-material/InsertLink';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import EditIcon from '@mui/icons-material/Edit';
import ScheduleIcon from '@mui/icons-material/Schedule';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { frFR, deDE, itIT, esES, enUS } from '@mui/x-date-pickers/locales';
import BrandedQrCode from '../BrandedQrCode';
import jwt_decode from "jwt-decode";
import axios from "axios";
import { saveAs } from 'file-saver';
import dayjs from 'dayjs';
import 'dayjs/locale/fr';
import 'dayjs/locale/de';
import 'dayjs/locale/it';
import 'dayjs/locale/es';

//dependencies
import { useMessageService } from '../../services/MessageService';
import { useLanguage } from '../../contexts/LanguageContext';
import { FRONTEND_URL } from "../../config";
import { BACKEND_URL } from "../../config";
import { useAuthUser } from '../../contexts/AuthUserContext';
import { UserType } from '../../utils/enums';
import { buttonStyle } from '../styledComponents';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const PICKER_LOCALE_TEXT = {
  en: enUS.components.MuiLocalizationProvider.defaultProps.localeText,
  fr: frFR.components.MuiLocalizationProvider.defaultProps.localeText,
  de: deDE.components.MuiLocalizationProvider.defaultProps.localeText,
  it: itIT.components.MuiLocalizationProvider.defaultProps.localeText,
  es: esES.components.MuiLocalizationProvider.defaultProps.localeText,
};

const DATE_TIME_FORMATS = {
  en: 'MMM D, YYYY HH:mm',
  fr: 'DD/MM/YYYY HH:mm',
  de: 'DD.MM.YYYY HH:mm',
  it: 'DD/MM/YYYY HH:mm',
  es: 'DD/MM/YYYY HH:mm',
};

const SharingAssessments = ({
  selectedAssessmentsIds,
  assessments,
  currentMonitoringId,
  isMonitoringOwner = false,
  onScheduleSaved,
}) => {
  const [showPaperCode, setShowPaperCode] = useState(false);
  const [generatedCode, setGeneratedCode] = useState('');
  const [isCodeVisible, setIsCodeVisible] = useState(false);
  const [isLinked, setIsLinked] = useState(false);
  const { getMessage } = useMessageService();
  const sharingCode = "123456";
  const { languageCode } = useLanguage();
  const { currentUser } = useAuthUser();
  const canSchedule = currentUser?.userStatus === UserType.TEACHER_TRAINER && isMonitoringOwner;

  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [scheduleEmails, setScheduleEmails] = useState([]);
  const [emailInput, setEmailInput] = useState('');
  const [scheduledAt, setScheduledAt] = useState(null);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [scheduleSaving, setScheduleSaving] = useState(false);
  const [scheduleError, setScheduleError] = useState(''); 


  // assessments states 
  const [selectedAssessmentIds, setSelectedAssessmentIds] = useState([]); // assessments selected to "share" -> will be included in the QR code
  const qrCodeRef = useRef(null);
  const brandedQrRef = useRef(null);

  useEffect(() => {
  setSelectedAssessmentIds(selectedAssessmentsIds);
}, [selectedAssessmentsIds]);
  
  const selectedAssessmentDetails = selectedAssessmentsIds
    .map((id, index) => {
      const assessment = (assessments || []).find(a => a._id === id);
      if (!assessment) {
        return null;
      }
      return {
        ...assessment,
        pageNumber: index + 1,
      };
    })
    .filter(Boolean);



/**
  * Generate a QR code for the current monitoringID containing every assessment
  */
  const generateQRCodeValue = () => {
  const fallback = FRONTEND_URL || 'https://evalution-asso.ch';
  try {
    const token = localStorage.getItem('token');
    if (!token || !currentUser?._id) {
      return fallback;
    }

    const decodedToken = jwt_decode(token);
    const sandbox = decodedToken.sandbox;
    const assessmentsQuery = selectedAssessmentsIds
      .map(id => `assessment[]=${id}`)
      .join('&');

    return `${FRONTEND_URL}/completeSurvey?userId=${currentUser._id}&monitoring=${currentMonitoringId}&${assessmentsQuery}&link=${isLinked}&lng=${languageCode}&sandbox=${sandbox}`;
  } catch (error) {
    console.error('Error generating QR value:', error);
    return fallback;
  }
};


  /**
   * Initiates the download of a QR code as a PNG image. It first checks if the QR code reference (`qrCodeRef`) is present and 
   * contains a canvas element. If found, it converts the canvas to a PNG data URL, creates an anchor (`<a>`) element with the 
   * 'download' attribute to trigger the download, and simulates a click on this anchor. After the download, the anchor element 
   * is removed from the document body to clean up.
   */
  const handleDownloadQR = () => {
    brandedQrRef.current?.download();
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

  const parseEmailList = (text) => {
    return [...new Set(
      String(text || "")
        .split(/[\s,;]+/)
        .map((email) => email.trim().toLowerCase())
        .filter(Boolean)
    )];
  };

  const addEmailsFromText = (text) => {
    const parsed = parseEmailList(text);
    if (parsed.length === 0) {
      setScheduleError(getMessage('label_schedule_invalid_email'));
      return;
    }

    const valid = parsed.filter((email) => EMAIL_REGEX.test(email));
    const invalid = parsed.filter((email) => !EMAIL_REGEX.test(email));

    if (valid.length > 0) {
      setScheduleEmails((prev) => {
        const next = [...prev];
        valid.forEach((email) => {
          if (!next.includes(email)) {
            next.push(email);
          }
        });
        return next;
      });
    }

    if (invalid.length > 0) {
      setEmailInput(invalid.join('\n'));
      setScheduleError(`${getMessage('label_schedule_invalid_email')}: ${invalid.join(', ')}`);
      return;
    }

    setEmailInput('');
    setScheduleError('');
  };

  const addScheduleEmail = () => {
    addEmailsFromText(emailInput);
  };

  const removeScheduleEmail = (emailToRemove) => {
    setScheduleEmails((prev) => prev.filter((email) => email !== emailToRemove));
  };

  const openScheduleDialog = async () => {
    setScheduleOpen(true);
    setScheduleError('');
    setEmailInput('');
    setScheduleLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(
        `${BACKEND_URL}/monitorings/${currentMonitoringId}/email-schedule`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setScheduleEmails(res.data.emails || []);

      const selectedSchedules = (res.data.assessments || [])
        .filter((assessment) => selectedAssessmentsIds.includes(assessment._id) && assessment.scheduledSendAt)
        .map((assessment) => new Date(assessment.scheduledSendAt).toISOString());
      const uniqueTimes = [...new Set(selectedSchedules)];
      if (uniqueTimes.length === 1) {
        setScheduledAt(dayjs(uniqueTimes[0]));
      } else {
        setScheduledAt(null);
      }
    } catch (error) {
      console.error('Error loading email schedule:', error);
      setScheduleError(getMessage('label_schedule_save_error'));
      setScheduleEmails([]);
      setScheduledAt(null);
    } finally {
      setScheduleLoading(false);
    }
  };

  const handleSaveSchedule = async () => {
    if (scheduleEmails.length === 0) {
      setScheduleError(getMessage('label_schedule_email_required'));
      return;
    }
    if (!scheduledAt || !scheduledAt.isValid() || !scheduledAt.isAfter(dayjs())) {
      setScheduleError(getMessage('label_schedule_date_required'));
      return;
    }

    setScheduleSaving(true);
    setScheduleError('');
    try {
      const token = localStorage.getItem('token');
      const res = await axios.put(
        `${BACKEND_URL}/monitorings/${currentMonitoringId}/email-schedule`,
        {
          emails: scheduleEmails,
          assessmentIds: selectedAssessmentsIds,
          scheduledSendAt: scheduledAt.toISOString(),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (typeof onScheduleSaved === 'function') {
        onScheduleSaved(res.data.assessments || []);
      }
      setScheduleOpen(false);
    } catch (error) {
      console.error('Error saving email schedule:', error);
      setScheduleError(error.response?.data?.error || getMessage('label_schedule_save_error'));
    } finally {
      setScheduleSaving(false);
    }
  };

  return (
    <>
    <Paper
      elevation={0}
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 2,
        overflow: 'hidden',
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header Section */}
      <Box sx={{ px: 2, pt: 2, pb: 1.5, boxSizing: 'border-box', borderBottom: '1px solid', borderColor: 'divider', flexShrink: 0 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, lineHeight: 1.3 }}>
          {getMessage("label_qr_code_section")}
        </Typography>
      </Box>

      <Box
        ref={qrCodeRef}
        sx={{
          flex: 1,
          minHeight: 0,
          width: '100%',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Box
          sx={{
            width: 268,
            height: 268,
            minWidth: 268,
            minHeight: 268,
            flex: '0 0 268px',
          }}
        >
          {selectedAssessmentIds.length > 0 ? (
            <BrandedQrCode
              ref={brandedQrRef}
              value={generateQRCodeValue()}
              size={268}
            />
          ) : (
            <Box sx={{ width: 268, height: 268, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <QrCodeScannerIcon sx={{ fontSize: 72, color: 'text.secondary' }} />
            </Box>
          )}
        </Box>
        {selectedAssessmentDetails.length > 0 && (
          <Tooltip
            placement="left-start"
            enterTouchDelay={0}
            slotProps={{
              tooltip: {
                sx: { fontSize: '0.95rem', maxWidth: 300, px: 1.5, py: 1 },
              },
            }}
            title={
              <Box sx={{ py: 0.25 }}>
                <Typography sx={{ display: 'block', fontWeight: 700, fontSize: '0.95rem', mb: 0.75 }}>
                  {getMessage("dashboard_share_open_assessments_together")}
                </Typography>
                {selectedAssessmentDetails.map((assessment, index) => (
                  <Typography
                    key={assessment._id}
                    sx={{ display: 'block', fontSize: '0.9rem', lineHeight: 1.55 }}
                  >
                    {assessment.pageNumber || index + 1}. {assessment.name}
                  </Typography>
                ))}
              </Box>
            }
          >
            <Box
              sx={{
                position: 'absolute',
                top: 8,
                right: 8,
                zIndex: 1,
                width: 24,
                height: 24,
                borderRadius: '50%',
                bgcolor: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'text.secondary',
                cursor: 'default',
              }}
            >
              <InfoOutlinedIcon sx={{ fontSize: 18 }} />
            </Box>
          </Tooltip>
        )}
      </Box>

        <Box
            sx={{
            display: 'flex',
            gap: 1,
            justifyContent: 'center',
            width: '100%',
            py: 1.25,
            flexShrink: 0,
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
            {canSchedule && (
            <Tooltip title={getMessage('tooltip_schedule_questionnaires')}>
                <span>
                    <IconButton
                        onClick={openScheduleDialog}
                        sx={{ border: '1px solid', borderColor: 'divider' }}
                        disabled={selectedAssessmentIds.length === 0}
                    >
                        <ScheduleIcon />
                    </IconButton>
                </span>
            </Tooltip>
            )}
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

      {/* Paper Code Section */}
      <Box sx={{ p: 1.5, borderTop: '1px solid', borderColor: 'divider', textAlign: 'center', flexShrink: 0 }}>
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
    <LocalizationProvider
      dateAdapter={AdapterDayjs}
      adapterLocale={languageCode || 'en'}
      localeText={PICKER_LOCALE_TEXT[languageCode] || PICKER_LOCALE_TEXT.en}
    >
      <Dialog
        open={scheduleOpen}
        onClose={() => !scheduleSaving && setScheduleOpen(false)}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            borderRadius: '20px',
            overflow: 'hidden',
          },
        }}
      >
        <Box
          sx={{
            px: 3,
            py: 2.5,
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            background: 'linear-gradient(180deg, #FFF6EC 0%, #FFFFFF 100%)',
            borderBottom: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: '14px',
              bgcolor: '#F7941E',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <ScheduleIcon sx={{ color: '#1a1a1a' }} />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h5" fontWeight={800} sx={{ lineHeight: 1.2 }}>
              {getMessage('dialog_schedule_title')}
            </Typography>
            <Typography variant="body2" color="text.secondary" noWrap>
              {selectedAssessmentDetails.map((assessment) => assessment.name).filter(Boolean).join(' · ')}
            </Typography>
          </Box>
        </Box>
        <DialogContent sx={{ px: 3, py: 2.5 }}>
          {scheduleError && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: '12px' }}>{scheduleError}</Alert>
          )}
          {scheduleLoading ? (
            <Box display="flex" justifyContent="center" py={6}>
              <CircularProgress size={28} />
            </Box>
          ) : (
            <>
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  mb: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: '16px',
                  bgcolor: '#fafafa',
                }}
              >
                <Box display="flex" alignItems="center" gap={1} mb={1.5}>
                  <MailOutlineIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                  <Typography variant="subtitle2" fontWeight={700}>
                    {getMessage('label_schedule_emails')}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1.5, minHeight: 36 }}>
                  {scheduleEmails.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      {getMessage('label_schedule_no_emails')}
                    </Typography>
                  ) : (
                    scheduleEmails.map((email) => (
                      <Chip
                        key={email}
                        label={email}
                        onDelete={() => removeScheduleEmail(email)}
                        disabled={scheduleSaving}
                        sx={{
                          bgcolor: 'white',
                          border: '1px solid #F7941E',
                          '& .MuiChip-deleteIcon': { color: '#D17A1D' },
                        }}
                      />
                    ))
                  )}
                </Box>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                  <TextField
                    fullWidth
                    size="small"
                    multiline
                    minRows={3}
                    placeholder={getMessage('label_schedule_email_placeholder')}
                    value={emailInput}
                    onChange={(event) => setEmailInput(event.target.value)}
                    onPaste={(event) => {
                      const pasted = event.clipboardData.getData('text');
                      if (/[\n\r,;]/.test(pasted) || parseEmailList(pasted).length > 1) {
                        event.preventDefault();
                        addEmailsFromText(`${emailInput}\n${pasted}`);
                      }
                    }}
                    disabled={scheduleSaving}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        bgcolor: 'white',
                        borderRadius: '12px',
                      },
                    }}
                  />
                  <Button
                    variant="contained"
                    onClick={addScheduleEmail}
                    disabled={scheduleSaving}
                    sx={{ ...buttonStyle, mr: 0, minWidth: 88, height: 40 }}
                  >
                    {getMessage('label_schedule_add_email')}
                  </Button>
                </Box>
              </Paper>
              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: '16px',
                  bgcolor: '#fafafa',
                }}
              >
                <Box display="flex" alignItems="center" gap={1} mb={1.5}>
                  <ScheduleIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                  <Typography variant="subtitle2" fontWeight={700}>
                    {getMessage('label_schedule_datetime')}
                  </Typography>
                </Box>
                <DateTimePicker
                  value={scheduledAt}
                  onChange={(value) => {
                    if (!value || !value.isValid()) {
                      setScheduledAt(value);
                      return;
                    }
                    const now = dayjs();
                    setScheduledAt(value.isBefore(now) ? now.add(1, 'minute').startOf('minute') : value);
                  }}
                  minDateTime={dayjs()}
                  disablePast
                  disableIgnoringDatePartForTimeValidation
                  shouldDisableTime={(value, view) => {
                    if (!value || !value.isValid()) {
                      return false;
                    }
                    const now = dayjs();
                    if (!value.isSame(now, 'day')) {
                      return false;
                    }
                    if (view === 'hours') {
                      return value.hour() < now.hour();
                    }
                    if (view === 'minutes') {
                      return value.hour() === now.hour() && value.minute() <= now.minute();
                    }
                    return false;
                  }}
                  ampm={false}
                  format={DATE_TIME_FORMATS[languageCode] || DATE_TIME_FORMATS.en}
                  disabled={scheduleSaving}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      sx: {
                        '& .MuiOutlinedInput-root': {
                          bgcolor: 'white',
                          borderRadius: '12px',
                        },
                      },
                    },
                  }}
                />
              </Paper>
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
          <Button
            onClick={() => setScheduleOpen(false)}
            disabled={scheduleSaving}
            sx={{ borderRadius: '50px', px: 2.5 }}
          >
            {getMessage('label_cancel')}
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveSchedule}
            disabled={scheduleLoading || scheduleSaving}
            sx={{ ...buttonStyle, mr: 0, px: 3 }}
          >
            {getMessage('label_schedule_save')}
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  </>
  );
};

export default SharingAssessments;
