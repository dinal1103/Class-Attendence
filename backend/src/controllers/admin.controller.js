/**
 * admin.controller.js — Administrative actions for managing staff (Faculty/HOD).
 */
const User = require('../models/User');

/**
 * POST /api/admin/users
 * Create a new user (faculty, hod, or admin) within the tenant.
 */
exports.createUser = async (req, res, next) => {
    try {
        const { name, email, password, role, department_id } = req.body;

        // Check if user already exists in this tenant
        const exists = await User.findOne({ tenant_id: req.tenantId, email });
        if (exists) {
            return res.status(409).json({ error: 'User already exists in this tenant.' });
        }

        const user = await User.create({
            tenant_id: req.tenantId,
            department_id,
            name,
            email,
            password,
            role: role || 'faculty',
            isActive: true
        });

        res.status(201).json({
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            department_id: user.department_id
        });
    } catch (err) {
        next(err);
    }
};

/**
 * GET /api/admin/users
 * List all users in the tenant, optionally filtered by role.
 */
exports.listUsers = async (req, res, next) => {
    try {
        const { role } = req.query;
        const filter = { tenant_id: req.tenantId };
        
        if (role) {
            filter.role = role;
        } else {
            // By default, list staff roles for admin management
            filter.role = { $in: ['faculty', 'hod', 'admin'] };
        }

        const users = await User.find(filter)
            .select('-password -embedding')
            .populate('department_id', 'name code');
            
        res.json(users);
    } catch (err) {
        next(err);
    }
};

/**
 * DELETE /api/admin/users/:id
 * Deactivate a user account.
 */
exports.deleteUser = async (req, res, next) => {
    try {
        const user = await User.findOneAndUpdate(
            { _id: req.params.id, tenant_id: req.tenantId },
            { isActive: false },
            { new: true }
        );
        
        if (!user) return res.status(404).json({ error: 'User not found.' });
        
        res.json({ message: 'User deactivated successfully.', user_id: user._id });
    } catch (err) {
        next(err);
    }
};
