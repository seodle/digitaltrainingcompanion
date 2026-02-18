const jwt = require('jsonwebtoken');
const Monitoring = require('../models/monitoringModel');
const User = require('../models/userModel');
const Assessment = require('../models/assessmentModel');
const Log = require('../models/logModel');
const ApiKey = require('../models/apiKeysModel');
const Response = require('../models/responseModel');

// Get user token
const getUser = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).send('Access denied. No token provided.');
    }

    try {
        const decoded = jwt.verify(token, process.env.JWTPRIVATEKEY);
        req.user = decoded; // Set the entire decoded token as req.user
        next();
    } catch (ex) {
        res.status(400).send('Invalid token.');
    }
};

// Admin gate (replace with roles/env later)
const requireAdmin = (req, res, next) => {
    const adminEmails = (process.env.ADMIN_EMAILS || '')
        .split(',')
        .map(e => e.trim())
        .filter(Boolean);
    const userEmail = (req.user && req.user.email) ? req.user.email.toLowerCase() : null;
    const allowed = userEmail && adminEmails.map(e => e.toLowerCase()).includes(userEmail);
    if (!allowed) {
        return res.status(403).json({ error: "Forbidden" });
    }
    next();
};

// Restrict access to Teacher-trainers only
const requireTeacherTrainer = (req, res, next) => {
    try {
        const requester = req.user || {};
        if (!requester || !requester._id) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        if (String(requester.userStatus) !== 'Teacher-trainer') {
            return res.status(403).json({ error: 'Forbidden' });
        }
        return next();
    } catch (err) {
        console.error('Teacher-trainer check failed:', err);
        return res.status(500).json({ error: 'Server error' });
    }
};

// Ensure the authenticated user owns the monitoring (factory; default param 'monitoringId')
// Infers whether the param references an assessment or a monitoring by paramName
const requireMonitoringOwner = (paramName = 'monitoringId') => {
    return async (req, res, next) => {
        try {
            const requesterId = req.user && req.user._id;
            if (!requesterId) {
                return res.status(401).json({ error: 'Authentication required' });
            }
            const rawId = String(req.params?.[paramName] || '').trim();
            if (!rawId) {
                return res.status(400).json({ error: `Missing ${paramName}` });
            }
            let monitoringId;
            const monitoringParam = String(paramName).toLowerCase().includes('monitoring');
            const assessmentParam = String(paramName).toLowerCase().includes('assessment');
            if (monitoringParam) {
                monitoringId = rawId;
            } else if (assessmentParam) {
                const assessment = await Assessment.findById(rawId).select('monitoringId');
                if (!assessment) {
                    return res.status(404).json({ error: 'Assessment not found' });
                }
                monitoringId = String(assessment.monitoringId || '').trim();
                if (!monitoringId) {
                    return res.status(403).json({ error: 'Forbidden' });
                }
            } else {
                return res.status(400).json({ error: `Unsupported param name '${paramName}' for guard` });
            }
            const monitoring = await Monitoring.findById(monitoringId).select('userId');
            if (!monitoring) {
                return res.status(404).json({ error: 'Monitoring not found' });
            }
            if (String(monitoring.userId) !== String(requesterId)) {
                return res.status(403).json({ error: 'Forbidden' });
            }
            return next();
        } catch (err) {
            console.error('Ownership check failed:', err);
            return res.status(500).json({ error: 'Server error' });
        }
    };
};

// Owner-or-redeemer guard for monitoring-scoped routes (factory; default param 'monitoringId')
// Infers whether the param references an assessment or a monitoring by paramName
const requireMonitoringOwnerOrRedeemer = (paramName = 'monitoringId') => {
    return async (req, res, next) => {
        try {
            const requesterId = req.user && req.user._id;
            if (!requesterId) {
                return res.status(401).json({ error: 'Authentication required' });
            }
            const rawId = String(req.params?.[paramName] || '').trim();
            if (!rawId) {
                return res.status(400).json({ error: `Missing ${paramName}` });
            }
            let monitoringId;
            const monitoringParam = String(paramName).toLowerCase().includes('monitoring');
            const assessmentParam = String(paramName).toLowerCase().includes('assessment');
            if (monitoringParam) {
                monitoringId = rawId;
            } else if (assessmentParam) {
                const assessment = await Assessment.findById(rawId).select('monitoringId');
                if (!assessment) {
                    return res.status(404).json({ error: 'Assessment not found' });
                }
                monitoringId = String(assessment.monitoringId || '').trim();
                if (!monitoringId) {
                    return res.status(403).json({ error: 'Forbidden' });
                }
            } else {
                return res.status(400).json({ error: `Unsupported param name '${paramName}' for guard` });
            }
            const monitoring = await Monitoring.findById(monitoringId).select('userId sharingCode');
            if (!monitoring) {
                return res.status(404).json({ error: 'Monitoring not found' });
            }
            if (String(monitoring.userId) === String(requesterId)) {
                return next();
            }
            const code = monitoring.sharingCode || null;
            if (!code) {
                return res.status(403).json({ error: 'Forbidden' });
            }
            const requester = await User.findById(requesterId).select('sharingCodeRedeemed');
            const isRedeemer = Array.isArray(requester?.sharingCodeRedeemed) &&
                               requester.sharingCodeRedeemed.includes(code);
            if (!isRedeemer) {
                return res.status(403).json({ error: 'Forbidden' });
            }
            return next();
        } catch (err) {
            console.error('Owner-or-redeemer check failed:', err);
            return res.status(500).json({ error: 'Server error' });
        }
    };
};

// Ensure the authenticated user owns the assessment (factory; supports 'assessmentId' or 'responseId')
const requireAssessmentOwner = (paramName = 'assessmentId') => {
    return async (req, res, next) => {
        try {
            const requesterId = req.user && req.user._id;
            if (!requesterId) {
                return res.status(401).json({ error: 'Authentication required' });
            }
            const rawId = String(req.params?.[paramName] || '').trim();
            if (!rawId) {
                return res.status(400).json({ error: `Missing ${paramName}` });
            }

            let assessmentId;
            const assessmentParam = String(paramName).toLowerCase().includes('assessment');
            const responseParam = String(paramName).toLowerCase().includes('response');
            if (assessmentParam) {
                assessmentId = rawId;
            } else if (responseParam) {
                const response = await Response.findById(rawId).select('assessmentId');
                if (!response) {
                    return res.status(404).json({ error: 'Response not found' });
                }
                assessmentId = String(response.assessmentId || '').trim();
                if (!assessmentId) {
                    return res.status(404).json({ error: 'Forbidden' });
                }
            } else {
                return res.status(400).json({ error: `Unsupported param name '${paramName}' for guard` });
            }

            const assessment = await Assessment.findById(assessmentId).select('userId');
            if (!assessment) {
                return res.status(404).json({ error: 'Assessment not found' });
            }
            if (String(assessment.userId) !== String(requesterId)) {
                return res.status(403).json({ error: 'Forbidden' });
            }
            return next();
        } catch (err) {
            console.error('Assessment ownership check failed:', err);
            return res.status(500).json({ error: 'Server error' });
        }
    };
};

// Ensure authenticated user owns the log (param 'logId')
const requireLogOwner = async (req, res, next) => {
    try {
        const requesterId = req.user && req.user._id;
        if (!requesterId) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        const logId = String(req.params?.logId || '').trim();
        if (!logId) {
            return res.status(400).json({ error: 'Missing logId' });
        }
        const log = await Log.findById(logId).select('userId');
        if (!log) {
            return res.status(404).json({ error: 'Log not found' });
        }
        if (String(log.userId) !== String(requesterId)) {
            return res.status(403).json({ error: 'Forbidden' });
        }
        return next();
    } catch (err) {
        console.error('Log ownership check failed:', err);
        return res.status(500).json({ error: 'Server error' });
    }
};

// Ensure authenticated user owns the API key (param 'apiKeyId' by default)
const requireApiKeyOwner = (paramName = 'apiKeyId') => {
    return async (req, res, next) => {
        try {
            const requesterId = req.user && req.user._id;
            if (!requesterId) {
                return res.status(401).json({ error: 'Authentication required' });
            }
            const apiKeyId = String(req.params?.[paramName] || '').trim();
            if (!apiKeyId) {
                return res.status(400).json({ error: `Missing ${paramName}` });
            }
            const apiKey = await ApiKey.findById(apiKeyId).select('userId');
            if (!apiKey) {
                return res.status(404).json({ error: 'API key not found' });
            }
            if (String(apiKey.userId) !== String(requesterId)) {
                return res.status(403).json({ error: 'Forbidden' });
            }
            return next();
        } catch (err) {
            console.error('API key ownership check failed:', err);
            return res.status(500).json({ error: 'Server error' });
        }
    };
};

module.exports = {
    getUser,
    requireAdmin,
    requireTeacherTrainer,
    requireMonitoringOwner,
    requireMonitoringOwnerOrRedeemer,
    requireAssessmentOwner,
    requireLogOwner,
    requireApiKeyOwner
};


