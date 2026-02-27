/**
 * stats.controller.js — Dashboard statistics for all roles.
 */
const User = require('../models/User');
const Department = require('../models/Department');
const Class = require('../models/Class');
const AttendanceSession = require('../models/AttendanceSession');
const AttendanceRecord = require('../models/AttendanceRecord');
const Dispute = require('../models/Dispute');

/**
 * GET /api/stats/admin
 * Returns counts for admin dashboard.
 */
exports.adminStats = async (req, res, next) => {
    try {
        const tid = req.tenantId;
        const [totalUsers, departments, activeClasses, overrides] = await Promise.all([
            User.countDocuments({ tenant_id: tid, isActive: true }),
            Department.countDocuments({ tenant_id: tid }),
            Class.countDocuments({ tenant_id: tid, isActive: true }),
            AttendanceRecord.countDocuments({ tenant_id: tid, manualOverride: true })
        ]);
        res.json({ totalUsers, departments, activeClasses, overrides });
    } catch (err) {
        next(err);
    }
};

/**
 * GET /api/stats/faculty
 * Returns counts for faculty dashboard.
 */
exports.facultyStats = async (req, res, next) => {
    try {
        const tid = req.tenantId;
        const uid = req.user.user_id;

        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const [myClasses, totalStudents, sessionsToday, pendingDisputes] = await Promise.all([
            Class.countDocuments({ tenant_id: tid, faculty_id: uid, isActive: true }),
            Class.aggregate([
                { $match: { tenant_id: require('mongoose').Types.ObjectId.createFromHexString(tid), faculty_id: require('mongoose').Types.ObjectId.createFromHexString(uid), isActive: true } },
                { $project: { count: { $size: '$students' } } },
                { $group: { _id: null, total: { $sum: '$count' } } }
            ]).then(r => r[0]?.total || 0),
            AttendanceSession.countDocuments({ tenant_id: tid, faculty_id: uid, createdAt: { $gte: todayStart } }),
            Dispute.countDocuments({ tenant_id: tid, status: 'pending' })
        ]);
        res.json({ myClasses, totalStudents, sessionsToday, pendingDisputes });
    } catch (err) {
        next(err);
    }
};

/**
 * GET /api/stats/student
 * Returns attendance counts for student dashboard.
 */
exports.studentStats = async (req, res, next) => {
    try {
        const tid = req.tenantId;
        const uid = req.user.user_id;

        const [totalLectures, present, absent] = await Promise.all([
            AttendanceRecord.countDocuments({ tenant_id: tid, student_id: uid }),
            AttendanceRecord.countDocuments({ tenant_id: tid, student_id: uid, status: 'present' }),
            AttendanceRecord.countDocuments({ tenant_id: tid, student_id: uid, status: 'absent' })
        ]);
        const rate = totalLectures > 0 ? Math.round((present / totalLectures) * 100) : 0;
        res.json({ totalLectures, present, absent, rate });
    } catch (err) {
        next(err);
    }
};
