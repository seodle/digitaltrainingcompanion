import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Checkbox,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  IconButton,
  InputAdornment,
  Alert
} from "@mui/material";
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import * as Yup from "yup";
import { BACKEND_URL } from "../../config";

// components
import DTCLogo from '../../components/DTCLogo';
import { useMessageService } from '../../services/MessageService';
import { useLanguage } from '../../contexts/LanguageContext';
import LanguageSelector from '../../components/LanguageSelector';
import { buttonStyle, authentificationFormStyle } from '../../components/styledComponents';
import { UserType } from '../../utils/enums';

//Terms of Use
import { termsOfUse } from '../../assets/termsOfUse';

const LegalTermsContent = React.memo(function LegalTermsContent({ onScrollToBottom }) {
  // Local state only, so we avoid re-mounting if the parent re-renders
  const [hasScrolledToEnd, setHasScrolledToEnd] = useState(false);
  const { languageCode } = useLanguage();

  const handleScroll = (event) => {
    const { scrollTop, scrollHeight, clientHeight } = event.currentTarget;
    const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10; // small buffer
    if (isAtBottom && !hasScrolledToEnd) {
      setHasScrolledToEnd(true);
      onScrollToBottom(); // Tell the parent to enable the "Accept" button
    }
  };

    return (
    <DialogContent
      dividers
      sx={{
        maxHeight: '60vh',
        overflowY: 'auto',
        '& .MuiTypography-paragraph': { lineHeight: 1.6, mb: 2 },
        '& .MuiTypography-h5': { mt: 3, mb: 2, fontWeight: 600 },
        '& .MuiTypography-h6': { mt: 2, mb: 1, fontWeight: 500 },
      }}
      onScroll={handleScroll}
    >
      <DialogContentText component="div">
        {/* -- HEADINGS / PARAGRAPHS FROM termsOfUse[language] -- */}

        <Typography variant="h5" gutterBottom>
          {termsOfUse[languageCode].mentionLegalTitle}
        </Typography>

        <Typography variant="h6" gutterBottom>
          {termsOfUse[languageCode].mentionLegalEditorTitle}
        </Typography>
        <Typography paragraph sx={{ whiteSpace: 'pre-line' }}>
          {termsOfUse[languageCode].mentionLegalEditorText}
        </Typography>

        <Typography variant="h6" gutterBottom>
          {termsOfUse[languageCode].mentionLegalHostingTitle}
        </Typography>
        <Typography paragraph sx={{ whiteSpace: 'pre-line' }}>
          {termsOfUse[languageCode].mentionLegalHostingText}
        </Typography>

        <Typography variant="h6" gutterBottom>
          {termsOfUse[languageCode].mentionLegalDirectorTitle}
        </Typography>
        <Typography paragraph sx={{ whiteSpace: 'pre-line' }}>
          {termsOfUse[languageCode].mentionLegalDirectorText}
        </Typography>

        <Typography variant="h5" gutterBottom>
          {termsOfUse[languageCode].cguTitle}
        </Typography>

        {/* Article 1 */}
        <Typography variant="h6" gutterBottom>
          {termsOfUse[languageCode].article1Title}
        </Typography>
        <Typography paragraph sx={{ whiteSpace: 'pre-line' }}>
          {termsOfUse[languageCode].article1Text}
        </Typography>

        {/* Article 2 */}
        <Typography variant="h6" gutterBottom>
          {termsOfUse[languageCode].article2Title}
        </Typography>
        <Typography paragraph sx={{ whiteSpace: 'pre-line' }}>
          {termsOfUse[languageCode].article2Text}
        </Typography>

        {/* Article 3 */}
        <Typography variant="h6" gutterBottom>
          {termsOfUse[languageCode].article3Title}
        </Typography>
        <Typography paragraph sx={{ whiteSpace: 'pre-line' }}>
          {termsOfUse[languageCode].article3Text}
        </Typography>

        {/* Article 4 */}
        <Typography variant="h6" gutterBottom>
          {termsOfUse[languageCode].article4Title}
        </Typography>
        <Typography paragraph sx={{ whiteSpace: 'pre-line' }}>
          {termsOfUse[languageCode].article4Text}
        </Typography>

        {/* Article 5 */}
        <Typography variant="h6" gutterBottom>
          {termsOfUse[languageCode].article5Title}
        </Typography>
        <Typography paragraph sx={{ whiteSpace: 'pre-line' }}>
          {termsOfUse[languageCode].article5Text}
        </Typography>

        {/* Article 6 */}
        <Typography variant="h6" gutterBottom>
          {termsOfUse[languageCode].article6Title}
        </Typography>
        <Typography paragraph sx={{ whiteSpace: 'pre-line' }}>
          {termsOfUse[languageCode].article6Text}
        </Typography>

        {/* Article 7 */}
        <Typography variant="h6" gutterBottom>
          {termsOfUse[languageCode].article7Title}
        </Typography>
        <Typography paragraph sx={{ whiteSpace: 'pre-line' }}>
          {termsOfUse[languageCode].article7Text}
        </Typography>

        {/* Article 8 */}
        <Typography variant="h6" gutterBottom>
          {termsOfUse[languageCode].article8Title}
        </Typography>
        <Typography paragraph sx={{ whiteSpace: 'pre-line' }}>
          {termsOfUse[languageCode].article8Text}
        </Typography>

        {/* Article 9 */}
        <Typography variant="h6" gutterBottom>
          {termsOfUse[languageCode].article9Title}
        </Typography>
        <Typography paragraph sx={{ whiteSpace: 'pre-line' }}>
          {termsOfUse[languageCode].article9Text}
        </Typography>

        {/* Article 10 */}
        <Typography variant="h6" gutterBottom>
          {termsOfUse[languageCode].article10Title}
        </Typography>
        <Typography paragraph sx={{ whiteSpace: 'pre-line' }}>
          {termsOfUse[languageCode].article10Text}
        </Typography>

        {/* Last update */}
        <Typography paragraph sx={{ whiteSpace: 'pre-line' }}>
          {termsOfUse[languageCode].lastUpdate}
        </Typography>

      </DialogContentText>
    </DialogContent>
  );
});

const Signup = () => {
  const [message, setMessage] = useState(null);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [openTermsDialog, setOpenTermsDialog] = useState(false);

  // Whether the 'Accept' button is enabled (becomes true after user scrolls to bottom)
  const [acceptEnabled, setAcceptEnabled] = useState(false);

  const isSandboxMode = location.state?.isSandboxMode || false;
  const { getMessage } = useMessageService();

  const [data, setData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    sandbox: isSandboxMode,
    userStatus: "",
    termsAccepted: false
  });

  // Build the Yup validation schema
  const createSignupSchema = () => {
    const schema = {
      firstName: Yup.string().required(getMessage('label_firstname_required')),
      lastName: Yup.string().required(getMessage('label_lastname_required')),
      email: Yup.string().email(getMessage('label_invalid_email')).required(getMessage('label_email_required')),
      password: Yup.string()
        .min(8, getMessage('label_minimum_password_characters_required'))
        .max(255, getMessage('label_maximum_password_characters_exceeded'))
        .matches(/[a-z]/, getMessage('label_password_lowercase_required'))
        .matches(/[A-Z]/, getMessage('label_password_uppercase_required'))
        .matches(/[0-9]/, getMessage('label_password_number_required'))
        .matches(/[^A-Za-z0-9]/, getMessage('label_password_symbol_required'))
        .required(getMessage('label_password_required')),
      userStatus: Yup.string().required(getMessage('label_status_required')),
      termsAccepted: Yup.boolean().oneOf([true], getMessage('label_terms_required'))
    };
    return Yup.object().shape(schema);
  };

  // Recreate schema when language changes
  const signupSchema = React.useMemo(() => createSignupSchema(), [getMessage]);

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };
  const handleMouseDownPassword = (event) => {
    event.preventDefault();
  };

  const handleChange = (event) => {
    const { name, value, checked } = event.target;
    
    if (name === "termsAccepted") {
      setTermsAccepted(checked);
      setData(prevData => ({
        ...prevData,
        [name]: checked
      }));
      return;
    }
    
    setData(prevData => {
        return {
          ...prevData,
          [name]: value
        };
      })
  };

  const handleOpenTermsDialog = () => {
    setOpenTermsDialog(true);
    setAcceptEnabled(false); // reset button if user re-opens
  };

  const handleCloseTermsDialog = () => {
    setOpenTermsDialog(false);
  };

  const handleAcceptTerms = () => {
    setTermsAccepted(true);
    setData(prevData => ({
      ...prevData,
      termsAccepted: true
    }));
    console.log(`Terms accepted by user at ${new Date().toISOString()}`);
    handleCloseTermsDialog();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      // Validate form data using memoized schema
      await signupSchema.validate(data, { abortEarly: false });

      // API call
      const res = await axios.post(`${BACKEND_URL}/register`, data);
      
      // Show success
      setError("");
      setMessage({
        type: "success",
        text: getMessage("signup_success")
      });
    } catch (err) {
      if (err instanceof Yup.ValidationError) {
        setError(err.errors.join(", "));
      } else if (err.response && err.response.status === 409) {
        // Handle email already exists error
        setError(getMessage("signup_email_already_exists"));
      } else {
        setError(getMessage("signup_error"));
      }
    }
  };

  return (
    <>
      {/* This semi-transparent black overlay is optional UI styling */}
      <Box
        position="fixed"
        top={0}
        left={0}
        height="100vh"
        bgcolor="rgba(0,0,0,0.5)"
      />

      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        minHeight="100vh"
      >
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          minHeight="90vh"
        >
          <Box
            display="flex"
            flexDirection="row"
            alignItems="stretch"
            justifyContent="center"
            sx={authentificationFormStyle}
            component="form"
            onSubmit={handleSubmit}
          >
            <Box flexGrow={2} flexBasis={0} padding="60px">
              <LanguageSelector/>
              <DTCLogo/>
              
              <Typography variant="h2" mb={2}>
                {getMessage('signup_create_account')}
              </Typography>

              <TextField
                variant="outlined"
                margin="normal"
                fullWidth
                id="firstName"
                label={getMessage('label_first_name')}
                name="firstName"
                autoComplete="firstName"
                autoFocus
                value={data.firstName}
                onChange={handleChange}
              />

              <TextField
                variant="outlined"
                margin="normal"
                fullWidth
                id="lastName"
                label={getMessage('label_last_name')}
                name="lastName"
                autoComplete="lastName"
                autoFocus
                value={data.lastName}
                onChange={handleChange}
              />

              <TextField
                variant="outlined"
                margin="normal"
                fullWidth
                id="email"
                label={getMessage('label_email')}
                name="email"
                autoComplete="email"
                autoFocus
                value={data.email}
                onChange={handleChange}
              />

              <TextField
                variant="outlined"
                margin="normal"
                fullWidth
                name="password"
                label={getMessage('label_password')}
                type={showPassword ? 'text' : 'password'}
                id="password"
                autoComplete="current-password"
                value={data.password}
                onChange={handleChange}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={handleClickShowPassword}
                        onMouseDown={handleMouseDownPassword}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <FormControl component="fieldset" margin="normal" sx={{ display: 'flex', alignItems: 'center' }}>
                <FormLabel component="legend" sx={{ mr: 1 }}>
                  {getMessage('label_status')}
                </FormLabel>
                <RadioGroup
                  row
                  name="userStatus"
                  value={data.userStatus}
                  onChange={handleChange}
                >
                  <FormControlLabel
                    value={UserType.TEACHER_TRAINER}
                    control={<Radio />}
                    label={getMessage('signup_teacher_trainer')}
                  />
                  <FormControlLabel
                    value={UserType.TEACHER}
                    control={<Radio />}
                    label={getMessage('signup_teacher')}
                  />
                </RadioGroup>
              </FormControl>

              {/* Legal Terms Acceptance */}
              <Box mt={2}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={termsAccepted}
                      onChange={handleChange}
                      name="termsAccepted"
                      color="primary"
                      disabled={!termsAccepted} 
                    />
                  }
                  label={
                    <Box
                      component="span"
                      sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}
                    >
                      <Typography component="span">
                        {getMessage('label_i_accept_the')}
                      </Typography>
                      <Typography
                        component="span"
                        onClick={handleOpenTermsDialog}
                        sx={{ 
                          ml: 0.5,
                          color: 'primary.main',
                          textDecoration: 'underline',
                          cursor: 'pointer',
                          fontWeight: 'bold'
                        }}
                      >
                        {getMessage('label_legal_terms')}
                      </Typography>
                      <Typography component="span">
                        &nbsp;{getMessage('label_i_accept_the2')}
                      </Typography>
                    </Box>
                  }
                />
              </Box>

              {/* Terms Dialog */}
              <Dialog
                open={openTermsDialog}
                onClose={handleCloseTermsDialog}
                scroll="paper"
                aria-labelledby="terms-dialog-title"
                maxWidth="md"
                fullWidth
              >
                <DialogTitle id="terms-dialog-title" variant="h3">
                  {getMessage('label_legal_terms')}
                </DialogTitle>
                
                {/* The memoized component: local scroll state, triggers parent callback */}
                <LegalTermsContent onScrollToBottom={() => setAcceptEnabled(true)} />

                <DialogActions>
                  <Button onClick={handleCloseTermsDialog}>
                    {getMessage('label_cancel')}
                  </Button>
                   <Button 
                    onClick={handleAcceptTerms}
                    disabled={!acceptEnabled}
                    variant="contained" 
                    sx={{ ...buttonStyle, width: '20%' }}>
                    <Typography variant="h5">{getMessage('label_accept')}</Typography>
                </Button>

                </DialogActions>
              </Dialog>

              <Box mt="10px" mb="10px">
                {error ? (
                  <Alert severity="error">{error}</Alert>
                ) : (
                  message && <Alert severity="success">{message ? message.text : ""}</Alert>
                )}
              </Box>

              <Box mt={5} display="flex" justifyContent="center">
                <Button type="submit" variant="contained" sx={{ ...buttonStyle, width: '20%' }}>
                  <Typography variant="h5">{getMessage('label_next')}</Typography>
                </Button>
              </Box>

              <Box mt={5} display="inline-flex" alignItems="center">
                <Typography>
                  {getMessage('label_has_account_already')}
                </Typography>
                <Typography
                  style={{ textDecoration: "underline", cursor: "pointer", marginLeft: '5px' }}
                  onClick={() => navigate("/signin")}
                  color="primary"
                >
                  {getMessage('label_signin')}
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>
    </>
  );
};

export default Signup;
