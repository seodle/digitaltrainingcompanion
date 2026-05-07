import { useState, useEffect } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useMessageService } from '../services/MessageService';
import { useAuthUser } from '../contexts/AuthUserContext';

const AiQuotaDialog = () => {
  const [open, setOpen] = useState(false);
  const [errorType, setErrorType] = useState(null);
  const navigate = useNavigate();
  const { getMessage } = useMessageService();
  const { currentUser } = useAuthUser();

  useEffect(() => {
    const handler = (e) => {
      setErrorType(e.detail?.errorType || 'quota_exceeded');
      setOpen(true);
    };
    window.addEventListener('ai-quota-exceeded', handler);
    return () => window.removeEventListener('ai-quota-exceeded', handler);
  }, []);

  const handlePrimary = () => {
    setOpen(false);
    const plan = currentUser?.subscriptionPlan || '';
    if (plan.includes('INSTITUTION')) {
      navigate('/settings?tab=1');
      return;
    }
    // Numeric tabs match PricingSection (AUDIENCES order: trainer, teacher, institution, research)
    const pricingTab = plan.includes('RESEARCH')
      ? 3
      : plan.includes('TEACHER')
        ? 1
        : 0;
    navigate(`/?pricingTab=${pricingTab}`);
  };

  const titleKey = errorType === 'trial_expired'
    ? 'quota_dialog_trial_title'
    : 'quota_dialog_quota_title';
  const bodyKey = errorType === 'trial_expired'
    ? 'quota_dialog_trial_body'
    : 'quota_dialog_quota_body';

  return (
    <Dialog open={open} onClose={() => setOpen(false)}>
      <DialogTitle>{getMessage(titleKey)}</DialogTitle>
      <DialogContent>
        <DialogContentText>{getMessage(bodyKey)}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setOpen(false)}>{getMessage('quota_dialog_dismiss')}</Button>
        <Button onClick={handlePrimary} variant="contained">{getMessage('quota_dialog_upgrade')}</Button>
      </DialogActions>
    </Dialog>
  );
};

export default AiQuotaDialog;