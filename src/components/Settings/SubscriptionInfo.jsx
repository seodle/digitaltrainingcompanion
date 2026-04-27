import React, { useEffect, useState } from 'react';
import {
    Box,
    Typography,
    LinearProgress,
    Chip,
    CircularProgress,
    Button,
    Alert,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    IconButton,
    Tooltip,
} from '@mui/material';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import PersonRemoveIcon from '@mui/icons-material/PersonRemove';
import { useAuthUser } from '../../contexts/AuthUserContext';
import { useMessageService } from '../../services/MessageService';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { BACKEND_URL } from '../../config';

const PLAN_META = {
    FREE_TRAINER:     { color: '#8AC055', labelKey: 'plan_free_trainer' },
    PRO_TRAINER:      { color: '#57C1CA', labelKey: 'plan_pro_trainer' },
    PRO_PLUS_TRAINER: { color: '#7B5EA7', labelKey: 'plan_pro_plus_trainer' },
    ULTRA_TRAINER:    { color: '#0F2537', labelKey: 'plan_ultra_trainer' },
    FREE_TEACHER:     { color: '#8AC055', labelKey: 'plan_free_teacher' },
    PRO_TEACHER:      { color: '#57C1CA', labelKey: 'plan_pro_teacher' },
    INSTITUTION_XS:   { color: '#57C1CA', labelKey: 'plan_institution_xs' },
    INSTITUTION_S:    { color: '#E3913C', labelKey: 'plan_institution_s' },
    INSTITUTION_M:    { color: '#0F2537', labelKey: 'plan_institution_m' },
    RESEARCH:         { color: '#0F2537', labelKey: 'plan_research' },
};

const TRIAL_DURATION_DAYS = 14;

const SubscriptionInfo = () => {
    const { currentUser } = useAuthUser();
    const { getMessage } = useMessageService();
    const [usage, setUsage] = useState(null);
    const [loadingUsage, setLoadingUsage] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const pricingTab = currentUser?.userStatus === 'Teacher' ? 1 : 0;
    const [members, setMembers] = useState([]);
    const [loadingMembers, setLoadingMembers] = useState(false);


    useEffect(() => {
        const fetchUsage = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await axios.get(`${BACKEND_URL}/users/currentUser/ai-usage`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setUsage(res.data);
            } catch (err) {
                setError(getMessage('settings_usage_fetch_error'));
            } finally {
                setLoadingUsage(false);
            }
        };
        fetchUsage();
    }, []);

    useEffect(() => {
        if (!usage?.isInstitutionAdmin || !usage?.institutionId) return;
        const fetchMembers = async () => {
            setLoadingMembers(true);
            try {
                const token = localStorage.getItem('token');
                const res = await axios.get(
                    `${BACKEND_URL}/institutions/${usage.institutionId}/members`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                setMembers(res.data.members || []);
            } catch (err) {
                console.error('Error fetching members:', err);
            } finally {
                setLoadingMembers(false);
            }
        };
        fetchMembers();
    }, [usage]);

    const handleRemoveMember = async (userId) => {
        try {
            const token = localStorage.getItem('token');
            await axios.delete(
                `${BACKEND_URL}/institutions/${usage.institutionId}/members/${userId}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setMembers(prev => prev.filter(m => String(m._id) !== String(userId)));
        } catch (err) {
            console.error('Error removing member:', err);
        }
    };

    if (!currentUser) return null;

    const plan = currentUser.subscriptionPlan || 'FREE_TRAINER';
    const meta = PLAN_META[plan] || PLAN_META.FREE_TRAINER;
    const isFree = plan === 'FREE_TRAINER' || plan === 'FREE_TEACHER';

    // Trial countdown
    const trialActive = currentUser.trialActive;
    let trialDaysRemaining = 0;
    if (trialActive && currentUser.trialStartDate) {
        const start = new Date(currentUser.trialStartDate);
        const elapsed = Math.floor((Date.now() - start.getTime()) / (1000 * 60 * 60 * 24));
        trialDaysRemaining = Math.max(0, TRIAL_DURATION_DAYS - elapsed);
    }

    // Progress bar percentage
    const usedPct = usage && usage.quota > 0
        ? Math.min(100, Math.round((usage.used / usage.quota) * 100))
        : 0;

    const progressColor = usedPct >= 90 ? 'error' : usedPct >= 70 ? 'warning' : 'primary';

    return (
        <Box>
            {/* Plan badge */}
            <Box display="flex" alignItems="center" gap={2} mb={3}>
                <WorkspacePremiumIcon sx={{ color: meta.color, fontSize: 32 }} />
                <Box>
                    <Chip
                        label={getMessage(meta.labelKey)}
                        sx={{
                            bgcolor: meta.color,
                            color: '#fff',
                            fontWeight: 700,
                            fontSize: '0.9rem',
                            px: 1,
                        }}
                    />
                </Box>
            </Box>

            {/* Trial banner */}
            {trialActive && (
                <Alert
                    severity={trialDaysRemaining <= 3 ? 'warning' : 'info'}
                    sx={{ mb: 3 }}
                >
                    {trialDaysRemaining > 0
                        ? `${getMessage('settings_trial_active')} ${trialDaysRemaining} ${getMessage('settings_trial_days_remaining')}`
                        : getMessage('settings_trial_expired')}
                </Alert>
            )}

            {/* AI call usage */}
            {loadingUsage ? (
                <Box display="flex" justifyContent="center" py={2}>
                    <CircularProgress size={24} />
                </Box>
            ) : error ? (
                <Alert severity="error">{error}</Alert>
            ) : usage && usage.quota > 0 ? (
                <Box mb={3}>
                    <Box display="flex" justifyContent="space-between" mb={0.5}>
                        <Typography variant="body2" fontWeight={600}>
                            {getMessage('settings_ai_calls_this_month')}:
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {usage.used} / {usage.quota}
                        </Typography>
                    </Box>
                    <LinearProgress
                        variant="determinate"
                        value={usedPct}
                        color={progressColor}
                        sx={{ height: 8, borderRadius: 4 }}
                    />
                    <Typography variant="caption" color="text.secondary" mt={0.5} display="block">
                        {usage.remaining} {getMessage('settings_ai_calls_remaining')}
                    </Typography>
                </Box>
            ) : (
                <Box mb={3}>
                    <Alert severity="info">
                        {isFree ? getMessage('settings_ai_not_included') : getMessage('settings_ai_no_calls_this_month')}
                    </Alert>
                </Box>
            )}

            {/* Plan CTA — always visible */}
            <Button
                variant={isFree ? 'contained' : 'outlined'}
                onClick={() => {
                    navigate(`/?pricingTab=${pricingTab}`);
                    setTimeout(() => {
                        document.getElementById('pricing-section')?.scrollIntoView({ behavior: 'smooth' });
                    }, 150);
                }}
                sx={{
                    bgcolor: isFree ? meta.color : undefined,
                    color: isFree ? '#fff' : meta.color,
                    borderColor: meta.color,
                    fontWeight: 700,
                    textTransform: 'none',
                    borderRadius: 2,
                    '&:hover': { opacity: 0.88, bgcolor: isFree ? meta.color : undefined },
                }}
            >
                {isFree ? getMessage('settings_see_plans') : getMessage('settings_manage_plan')}
            </Button>
            {/* Institution admin dashboard */}
            {usage?.isInstitutionAdmin && usage?.institutionPool && (
                <Box mt={4}>
                    <Typography variant="subtitle1" fontWeight={700} mb={1}>
                        {getMessage('institution_pool_usage')}
                    </Typography>
                    <Box display="flex" justifyContent="space-between" mb={0.5}>
                        <Typography variant="body2">{usage.institutionPool.name}</Typography>
                        <Typography variant="body2" color="text.secondary">
                            {usage.institutionPool.used} / {usage.institutionPool.quota}
                        </Typography>
                    </Box>
                    <LinearProgress
                        variant="determinate"
                        value={usage.institutionPool.quota > 0
                            ? Math.min(100, Math.round((usage.institutionPool.used / usage.institutionPool.quota) * 100))
                            : 0}
                        sx={{ height: 8, borderRadius: 4, mb: 3 }}
                    />
                    <Typography variant="subtitle1" fontWeight={700} mb={1}>
                        {getMessage('institution_members_title')}
                    </Typography>
                    {loadingMembers ? <CircularProgress size={24} /> : (
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>{getMessage('institution_member_name')}</TableCell>
                                    <TableCell>{getMessage('institution_member_email')}</TableCell>
                                    <TableCell align="right">{getMessage('institution_member_calls')}</TableCell>
                                    <TableCell />
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {members.map(m => (
                                    <TableRow key={m._id}>
                                        <TableCell>{m.firstName} {m.lastName}</TableCell>
                                        <TableCell>{m.email}</TableCell>
                                        <TableCell align="right">{m.aiCallsUsedThisMonth ?? 0}</TableCell>
                                        <TableCell align="right">
                                            <Tooltip title={getMessage('institution_member_remove')}>
                                                <IconButton size="small" onClick={() => handleRemoveMember(m._id)}>
                                                    <PersonRemoveIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </Box>
            )}
        </Box>
    );
};

export default SubscriptionInfo;