/**
 * class.controller.js — CRUD for Classes (tenant-scoped).
 */
const Class = require('../models/Class');
const AuditLog = require('../models/AuditLog');
const AttendanceSession = require('../models/AttendanceSession');
const AttendanceRecord = require('../models/AttendanceRecord');

/**
 * POST /api/classes
 */
exports.create = async (req, res, next) => {
    try {
        const { name, code, departmentId, facultyId, students, schedule } = req.body;

        // Auto-generate a unique 6-char alphanumeric code if none provided
        let classCode = code;
        if (!classCode) {
            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
            let attempts = 0;
            while (attempts < 10) {
                let generated = '';
                for (let i = 0; i < 6; i++) {
                    generated += chars.charAt(Math.floor(Math.random() * chars.length));
                }
                const exists = await Class.findOne({ tenant_id: req.tenantId, code: generated });
                if (!exists) {
                    classCode = generated;
                    break;
                }
                attempts++;
            }
            if (!classCode) {
                return res.status(500).json({ error: 'Could not generate a unique class code. Please try again.' });
            }
        }

        const cls = await Class.create({
            tenant_id: req.tenantId,
            department_id: departmentId,
            name,
            code: classCode,
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
        // Student sees only classes they are enrolled in
        if (req.user.role === 'student') {
            filter.students = req.user.user_id;
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
    console.log('[DEBUG] update handler hit with id:', req.params.id);
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

/**
 * POST /api/classes/join
 * Body: { code: 'CLASS_CODE' }
 * Student joins a class by its code.
 */
exports.joinByCode = async (req, res, next) => {
    try {
        const { code } = req.body;
        if (!code) return res.status(400).json({ error: 'Class code is required.' });

        const cls = await Class.findOneAndUpdate(
            { tenant_id: req.tenantId, code: code.toUpperCase(), isActive: true },
            { $addToSet: { students: req.user.user_id } },
            { new: true }
        ).populate('faculty_id', 'name email').populate('department_id', 'name code');

        if (!cls) return res.status(404).json({ error: 'Class not found with that code.' });
        res.json(cls);
    } catch (err) {
        next(err);
    }
};

/**
 * GET /api/classes/available
 * Returns all active classes in the tenant (for browsing, not filtered by enrollment).
 */
exports.listAll = async (req, res, next) => {
    try {
        const classes = await Class.find({ tenant_id: req.tenantId, isActive: true })
            .populate('faculty_id', 'name email')
            .populate('department_id', 'name code');
        res.json(classes);
    } catch (err) {
        next(err);
    }
};

/**
 * PUT /api/classes/:id/archive
 * Archives a class and generates a final attendance report for the HOD.
 */
exports.archiveClass = async (req, res, next) => {
    console.log('[DEBUG] archiveClass handler hit with id:', req.params.id);
    try {
        const cls = await Class.findOne({ _id: req.params.id, tenant_id: req.tenantId }).populate('students', '_id name');
        if (!cls) return res.status(404).json({ error: 'Class not found.' });

        // Ensure requester is faculty of this class or admin
        if (req.user.role === 'faculty' && cls.faculty_id.toString() !== req.user.user_id) {
            return res.status(403).json({ error: 'Not authorized to archive this class.' });
        }

        const fs = require('fs');

        // Generate Report
        const sessions = await AttendanceSession.find({ class_id: cls._id, status: 'completed' }).sort({ createdAt: 1 });
        const totalSessions = sessions.length;
        const sessionIds = sessions.map(s => s._id);

        let studentReport = [];
        if (totalSessions > 0) {
            const records = await AttendanceRecord.find({ session_id: { $in: sessionIds } }).populate('student_id', 'name email enrollmentId');
            
            // Map records to student status by session
            const studentStats = {};
            
            // Initialize stats for all enrolled students
            for (const student of cls.students) {
                studentStats[student._id.toString()] = {
                    name: student.name,
                    enrollmentId: student.enrollmentId || 'N/A',
                    totalPresent: 0,
                    attendanceStatuses: new Array(totalSessions).fill('absent')
                };
            }

            // Populate presence
            records.forEach(record => {
                const sid = record.student_id ? record.student_id._id.toString() : null;
                if (sid && studentStats[sid]) {
                    const sessionIndex = sessionIds.findIndex(id => id.toString() === record.session_id.toString());
                    if (sessionIndex !== -1) {
                        studentStats[sid].attendanceStatuses[sessionIndex] = record.status;
                        if (record.status === 'present' || record.status === 'flagged') {
                            studentStats[sid].totalPresent++;
                        }
                    }
                }
            });
            
            studentReport = Object.values(studentStats).map(s => ({
                name: s.name,
                enrollmentId: s.enrollmentId,
                attendancePercentage: Math.round((s.totalPresent / totalSessions) * 100),
                totalPresent: s.totalPresent,
                attendanceStatuses: s.attendanceStatuses
            }));
        }

        // Create Audit Log
        const auditLog = await AuditLog.create({
            tenant_id: req.tenantId,
            type: 'class_archived',
            class_id: cls._id,
            performedBy: req.user.user_id,
            details: {
                totalStudents: cls.students.length,
                totalSessions,
                sessionDates: sessions.map(s => s.createdAt),
                students: studentReport
            }
        });

        // --------------------------------------------------
        // THE PURGE: Delete records and session files
        // --------------------------------------------------
        await AttendanceRecord.deleteMany({ session_id: { $in: sessionIds } });
        await AttendanceSession.deleteMany({ class_id: cls._id });

        // Delete physical folders
        for (const session of sessions) {
            try {
                const sessionDir = path.join(storage.getBaseDir(), session._id.toString());
                if (fs.existsSync(sessionDir)) {
                    fs.rmSync(sessionDir, { recursive: true, force: true });
                }
            } catch (err) {
                console.error(`Failed to delete storage for session ${session._id}`, err);
            }
        }

        // Mark as inactive
        cls.isActive = false;
        await cls.save();

        res.json({ message: 'Class archived successfully, records purged.', auditLogId: auditLog._id });
    } catch (err) {
        next(err);
    }
};
