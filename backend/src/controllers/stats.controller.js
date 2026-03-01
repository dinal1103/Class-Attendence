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

/**
 * GET /api/stats/class-attendance
 * Returns per-class attendance percentages.
 * Works for student, faculty, and hod roles.
 */
exports.classAttendance = async (req, res, next) => {
    try {
        const mongoose = require('mongoose');
        const tid = req.tenantId;
        const uid = req.user.user_id;
        const role = req.user.role;

        // Find relevant classes based on role
        const classFilter = { tenant_id: tid, isActive: true };
        if (role === 'faculty') classFilter.faculty_id = uid;
        if (role === 'student') classFilter.students = uid;
        if (role === 'hod') {
            const user = await User.findById(uid).lean();
            if (user?.department_id) classFilter.department_id = user.department_id;
        }

        const classes = await Class.find(classFilter).lean();

        const results = await Promise.all(classes.map(async (cls) => {
            // Get all sessions for this class
            const sessions = await AttendanceSession.find({
                tenant_id: tid,
                class_id: cls._id,
                status: 'completed'
            }).select('_id').lean();

            const sessionIds = sessions.map(s => s._id);

            let totalRecords = 0, presentCount = 0;

            if (sessionIds.length > 0) {
                if (role === 'student') {
                    // Student: count only their own records
                    totalRecords = await AttendanceRecord.countDocuments({
                        session_id: { $in: sessionIds },
                        student_id: uid
                    });
                    presentCount = await AttendanceRecord.countDocuments({
                        session_id: { $in: sessionIds },
                        student_id: uid,
                        status: 'present'
                    });
                } else {
                    // Faculty/HOD: count all records across sessions
                    totalRecords = await AttendanceRecord.countDocuments({
                        session_id: { $in: sessionIds }
                    });
                    presentCount = await AttendanceRecord.countDocuments({
                        session_id: { $in: sessionIds },
                        status: 'present'
                    });
                }
            }

            const rate = totalRecords > 0 ? Math.round((presentCount / totalRecords) * 100) : 0;

            return {
                classId: cls._id,
                className: cls.name,
                classCode: cls.code,
                totalSessions: sessionIds.length,
                totalRecords,
                presentCount,
                rate
            };
        }));

        res.json(results);
    } catch (err) {
        next(err);
    }
};

/**
 * GET /api/stats/hod/weekly
 * Returns 7-day department attendance breakdown for HOD bar chart.
 */
exports.hodWeekly = async (req, res, next) => {
    try {
        const mongoose = require('mongoose');
        const tid = req.tenantId;
        const uid = req.user.user_id;

        const user = await User.findById(uid).lean();
        const deptId = user?.department_id;

        // Get all classes in the HOD's department
        const classIds = await Class.find({
            tenant_id: tid,
            department_id: deptId,
            isActive: true
        }).distinct('_id');

        // Build last 7 days
        const days = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setHours(0, 0, 0, 0);
            d.setDate(d.getDate() - i);
            days.push(d);
        }

        const results = await Promise.all(days.map(async (dayStart) => {
            const dayEnd = new Date(dayStart);
            dayEnd.setHours(23, 59, 59, 999);

            // Find sessions for that day in department classes
            const sessionIds = await AttendanceSession.find({
                tenant_id: tid,
                class_id: { $in: classIds },
                createdAt: { $gte: dayStart, $lte: dayEnd },
                status: 'completed'
            }).distinct('_id');

            let present = 0, absent = 0;
            if (sessionIds.length > 0) {
                present = await AttendanceRecord.countDocuments({
                    session_id: { $in: sessionIds },
                    status: 'present'
                });
                absent = await AttendanceRecord.countDocuments({
                    session_id: { $in: sessionIds },
                    status: 'absent'
                });
            }

            return {
                date: dayStart.toISOString().split('T')[0],
                day: dayStart.toLocaleDateString('en-US', { weekday: 'short' }),
                present,
                absent,
                total: present + absent
            };
        }));

        res.json(results);
    } catch (err) {
        next(err);
    }
};

/**
 * GET /api/stats/admin/report
 * Returns college-wide attendance report rows for the DataTable.
 * Each row = one completed session with aggregated present/absent counts.
 */
exports.adminReport = async (req, res, next) => {
    try {
        const tid = req.tenantId;

        // Get all completed sessions
        const sessions = await AttendanceSession.find({
            tenant_id: tid,
            status: 'completed'
        })
            .populate({
                path: 'class_id',
                select: 'name code department_id',
                populate: { path: 'department_id', select: 'name code' }
            })
            .sort({ createdAt: -1 })
            .lean();

        const results = await Promise.all(sessions.map(async (session) => {
            const present = await AttendanceRecord.countDocuments({
                session_id: session._id,
                status: 'present'
            });
            const absent = await AttendanceRecord.countDocuments({
                session_id: session._id,
                status: 'absent'
            });
            const total = present + absent;
            const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

            const d = new Date(session.sessionDate || session.createdAt);

            return {
                department: session.class_id?.department_id?.name || 'N/A',
                className: session.class_id?.name || 'Unknown',
                classCode: session.class_id?.code || '',
                date: d.toLocaleDateString(),
                time: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                rawDate: d.toISOString(),
                totalAttendance: total,
                present,
                absent,
                percentage
            };
        }));

        res.json(results);
    } catch (err) {
        next(err);
    }
};
