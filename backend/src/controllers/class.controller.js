/**
 * class.controller.js — CRUD for Classes (tenant-scoped).
 */
const Class = require('../models/Class');

/**
 * POST /api/classes
 */
exports.create = async (req, res, next) => {
    try {
        const { name, code, departmentId, facultyId, students, schedule } = req.body;
        const cls = await Class.create({
            tenant_id: req.tenantId,
            department_id: departmentId,
            name,
            code,
            faculty_id: facultyId,
            students: students || [],
            schedule: schedule || ''
        });
        res.status(201).json(cls);
    } catch (err) {
        if (err.code === 11000) {
            return res.status(409).json({ error: 'Class code already exists for this tenant.' });
        }
        next(err);
    }
};

/**
 * GET /api/classes
 */
exports.list = async (req, res, next) => {
    try {
        const filter = { tenant_id: req.tenantId, isActive: true };
        // Faculty sees only their own classes
        if (req.user.role === 'faculty') {
            filter.faculty_id = req.user.user_id;
        }
        const classes = await Class.find(filter)
            .populate('faculty_id', 'name email')
            .populate('department_id', 'name code');
        res.json(classes);
    } catch (err) {
        next(err);
    }
};

/**
 * GET /api/classes/:id
 */
exports.getById = async (req, res, next) => {
    try {
        const cls = await Class.findOne({ _id: req.params.id, tenant_id: req.tenantId })
            .populate('faculty_id', 'name email')
            .populate('students', 'name email enrollmentId');
        if (!cls) return res.status(404).json({ error: 'Class not found.' });
        res.json(cls);
    } catch (err) {
        next(err);
    }
};

/**
 * PUT /api/classes/:id
 */
exports.update = async (req, res, next) => {
    try {
        const cls = await Class.findOneAndUpdate(
            { _id: req.params.id, tenant_id: req.tenantId },
            req.body,
            { new: true }
        );
        if (!cls) return res.status(404).json({ error: 'Class not found.' });
        res.json(cls);
    } catch (err) {
        next(err);
    }
};

/**
 * POST /api/classes/:id/students
 * Body: { studentIds: [ObjectId] }
 */
exports.addStudents = async (req, res, next) => {
    try {
        const { studentIds } = req.body;
        const cls = await Class.findOneAndUpdate(
            { _id: req.params.id, tenant_id: req.tenantId },
            { $addToSet: { students: { $each: studentIds } } },
            { new: true }
        );
        if (!cls) return res.status(404).json({ error: 'Class not found.' });
        res.json(cls);
    } catch (err) {
        next(err);
    }
};
