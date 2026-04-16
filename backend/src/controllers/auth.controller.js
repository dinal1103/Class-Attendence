/**
 * auth.controller.js — Login, Register, Profile
 */
const jwt = require('jsonwebtoken');
const config = require('../config');
const User = require('../models/User');
const Tenant = require('../models/Tenant');
const Department = require('../models/Department');

/**
 * POST /api/auth/register
 * Body: { name, email, password, role, tenantCode, departmentId, enrollmentId? }
 */
exports.register = async (req, res, next) => {
    try {
        const { name, email, password, role, tenantCode, departmentId, enrollmentId } = req.body;

        // Only students are allowed to register publicly
        const requestedRole = role || 'student';
        if (requestedRole !== 'student') {
            return res.status(403).json({ error: 'Public registration is only allowed for student accounts. Staff accounts must be created by an Admin.' });
        }

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

        // Resolve Department ID from Code (e.g., 'CE' -> ObjectId)
        // If departmentId is already a valid ObjectId, this will still work
        let finalDepartmentId = departmentId;
        if (departmentId && !departmentId.match(/^[0-9a-fA-F]{24}$/)) {
            const dept = await Department.findOne({ tenant_id: tenant._id, code: departmentId.toUpperCase() });
            if (!dept) {
                return res.status(400).json({ error: 'Invalid department code.' });
            }
            finalDepartmentId = dept._id;
        }

        const user = await User.create({
            tenant_id: tenant._id,
            department_id: finalDepartmentId,
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

/**
 * POST /api/auth/change-password
 * Body: { currentPassword, newPassword }
 */
exports.changePassword = async (req, res, next) => {
    try {
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: 'Current and new passwords are required.' });
        }

        const user = await User.findById(req.user.user_id);
        if (!user) return res.status(404).json({ error: 'User not found.' });

        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
            return res.status(401).json({ error: 'Incorrect current password.' });
        }

        user.password = newPassword;
        await user.save(); // Triggers pre-save hashing

        res.json({ message: 'Password updated successfully.' });
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
