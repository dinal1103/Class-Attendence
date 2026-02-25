/**
 * attendance.controller.js — Create sessions, dispatch to queue, query results.
 */
const multer = require('multer');
const path = require('path');
const { Queue } = require('bullmq');
const config = require('../config');
const AttendanceSession = require('../models/AttendanceSession');
const AttendanceRecord = require('../models/AttendanceRecord');
const storage = require('../services/storage');

// BullMQ queue
const attendanceQueue = new Queue('attendance', {
    connection: { host: config.redis.host, port: config.redis.port }
});

// Multer — in-memory buffer
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 15 * 1024 * 1024 }, // 15 MB per file
    fileFilter: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        if (['.jpg', '.jpeg', '.png'].includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error('Only .jpg, .jpeg, .png images allowed'), false);
        }
    }
}).array('images', 10);

exports.uploadMiddleware = upload;

/**
 * POST /api/attendance/sessions
 * Body (multipart): classId, images[]
 * Returns 202 immediately; processing happens in background worker.
 */
exports.createSession = async (req, res, next) => {
    try {
        const { classId } = req.body;

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: 'At least one classroom photo is required.' });
        }

        // Create attendance session record
        const session = await AttendanceSession.create({
            tenant_id: req.tenantId,
            class_id: classId,
            faculty_id: req.user.user_id,
            status: 'pending'
        });

        // Save images to temp storage
        const imagePaths = [];
        for (const file of req.files) {
            const filePath = storage.saveFile(session._id.toString(), file.originalname, file.buffer);
            imagePaths.push(filePath);
        }

        // Update session with image paths
        session.imagePaths = imagePaths;
        await session.save();

        // Dispatch to BullMQ
        await attendanceQueue.add('processAttendance', {
            sessionId: session._id.toString(),
            tenantId: req.tenantId,
            classId
        });

        res.status(202).json({
            message: 'Attendance session created. Processing in background.',
            sessionId: session._id
        });
    } catch (err) {
        next(err);
    }
};

/**
 * GET /api/attendance/sessions
 * Query: ?classId=&status=
 */
exports.listSessions = async (req, res, next) => {
    try {
        const filter = { tenant_id: req.tenantId };
        if (req.query.classId) filter.class_id = req.query.classId;
        if (req.query.status) filter.status = req.query.status;

        // Faculty sees only their own sessions
        if (req.user.role === 'faculty') {
            filter.faculty_id = req.user.user_id;
        }

        const sessions = await AttendanceSession.find(filter)
            .sort({ createdAt: -1 })
            .populate('class_id', 'name code');
        res.json(sessions);
    } catch (err) {
        next(err);
    }
};

/**
 * GET /api/attendance/sessions/:id
 */
exports.getSession = async (req, res, next) => {
    try {
        const session = await AttendanceSession.findOne({
            _id: req.params.id,
            tenant_id: req.tenantId
        }).populate('class_id', 'name code');

        if (!session) return res.status(404).json({ error: 'Session not found.' });
        res.json(session);
    } catch (err) {
        next(err);
    }
};

/**
 * GET /api/attendance/sessions/:id/records
 */
exports.getSessionRecords = async (req, res, next) => {
    try {
        const records = await AttendanceRecord.find({
            session_id: req.params.id,
            tenant_id: req.tenantId
        }).populate('student_id', 'name email enrollmentId');

        res.json(records);
    } catch (err) {
        next(err);
    }
};
