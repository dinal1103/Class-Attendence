/**
 * admin.controller.js — Administrative actions for managing staff (Faculty/HOD).
 */
const User = require('../models/User');
const Department = require('../models/Department');
const multer = require('multer');
const xlsx = require('xlsx');
const path = require('path');
const storage = require('../services/storage');
const fs = require('fs');

// Multer for Excel Uploads
const upload = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, storage.getBaseDir());
        },
        filename: (req, file, cb) => {
            cb(null, `bulk-${Date.now()}-${file.originalname}`);
        }
    }),
    fileFilter: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        if (['.xlsx', '.xls'].includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error('Only Excel files (.xlsx, .xls) are allowed.'), false);
        }
    }
}).single('file');

exports.bulkUploadMiddleware = upload;

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

/**
 * POST /api/admin/users/bulk
 * Upload Excel and create users.
 */
exports.bulkCreateUsers = async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No Excel file uploaded.' });
        }

        const workbook = xlsx.readFile(req.file.path);
        const sheetName = workbook.SheetNames[0];
        const rows = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

        const results = {
            success: 0,
            failed: 0,
            errors: []
        };

        const departments = await Department.find({ tenant_id: req.tenantId });
        const deptMap = new Map(departments.map(d => [d.code.toUpperCase(), d._id]));

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const { Name, Email, Password, Role, DepartmentCode } = row;

            try {
                if (!Name || !Email || !Password || !Role || !DepartmentCode) {
                    throw new Error('Missing required fields');
                }

                const deptId = deptMap.get(DepartmentCode.toString().toUpperCase());
                if (!deptId) {
                    throw new Error(`Department code ${DepartmentCode} not found`);
                }

                // Check if user already exists
                const exists = await User.findOne({ tenant_id: req.tenantId, email: Email });
                if (exists) {
                    throw new Error(`User with email ${Email} already exists`);
                }

                await User.create({
                    tenant_id: req.tenantId,
                    department_id: deptId,
                    name: Name,
                    email: Email,
                    password: Password,
                    role: Role.toLowerCase(),
                    isActive: true
                });

                results.success++;
            } catch (err) {
                results.failed++;
                results.errors.push({ row: i + 2, error: err.message });
            }
        }

        // Clean up temp file
        fs.unlinkSync(req.file.path);

        res.json({
            message: `Bulk processing complete. ${results.success} success, ${results.failed} failed.`,
            ...results
        });
    } catch (err) {
        next(err);
    }
};
