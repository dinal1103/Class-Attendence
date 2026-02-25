/**
 * auth.controller.js — Login, Register, Profile
 */
const jwt = require('jsonwebtoken');
const config = require('../config');
const User = require('../models/User');
const Tenant = require('../models/Tenant');

/**
 * POST /api/auth/register
 * Body: { name, email, password, role, tenantCode, departmentId, enrollmentId? }
 */
exports.register = async (req, res, next) => {
    try {
        const { name, email, password, role, tenantCode, departmentId, enrollmentId } = req.body;

        // Find tenant by code
        const tenant = await Tenant.findOne({ code: tenantCode, isActive: true });
        if (!tenant) {
            return res.status(400).json({ error: 'Invalid tenant code.' });
        }

        // Check duplicate
        const exists = await User.findOne({ tenant_id: tenant._id, email });
        if (exists) {
            return res.status(409).json({ error: 'User already exists in this tenant.' });
        }

        const user = await User.create({
            tenant_id: tenant._id,
            department_id: departmentId,
            name,
            email,
            password,
            role: role || 'student',
            enrollmentId: enrollmentId || null
        });

        const token = _signToken(user, tenant._id);

        res.status(201).json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                tenant_id: tenant._id,
                department_id: user.department_id,
                isEnrolled: user.isEnrolled
            }
        });
    } catch (err) {
        next(err);
    }
};

/**
 * POST /api/auth/login
 * Body: { email, password, tenantCode }
 */
exports.login = async (req, res, next) => {
    try {
        const { email, password, tenantCode } = req.body;

        const tenant = await Tenant.findOne({ code: tenantCode, isActive: true });
        if (!tenant) {
            return res.status(400).json({ error: 'Invalid tenant code.' });
        }

        const user = await User.findOne({ tenant_id: tenant._id, email, isActive: true });
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials.' });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials.' });
        }

        const token = _signToken(user, tenant._id);

        res.json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                tenant_id: tenant._id,
                department_id: user.department_id,
                isEnrolled: user.isEnrolled
            }
        });
    } catch (err) {
        next(err);
    }
};

/**
 * GET /api/auth/me
 */
exports.getMe = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.user_id).select('-password -embedding');
        if (!user) return res.status(404).json({ error: 'User not found.' });
        res.json(user);
    } catch (err) {
        next(err);
    }
};

function _signToken(user, tenantId) {
    return jwt.sign(
        {
            user_id: user._id,
            role: user.role,
            tenant_id: tenantId,
            department_id: user.department_id
        },
        config.security.jwtSecret,
        { expiresIn: '7d' }
    );
}
