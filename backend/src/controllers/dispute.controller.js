/**
 * dispute.controller.js — Raise and resolve disputes.
 */
const Dispute = require('../models/Dispute');
const AttendanceRecord = require('../models/AttendanceRecord');
const AttendanceSession = require('../models/AttendanceSession');
const Tenant = require('../models/Tenant');

/**
 * POST /api/disputes
 * Body: { sessionId, recordId, reason }
 * Only students can raise disputes within the 48h window.
 */
exports.create = async (req, res, next) => {
    try {
        const { sessionId, recordId, reason } = req.body;

        // Verify the record belongs to this student
        const record = await AttendanceRecord.findOne({
            _id: recordId,
            session_id: sessionId,
            student_id: req.user.user_id,
            tenant_id: req.tenantId
        });
        if (!record) {
            return res.status(404).json({ error: 'Attendance record not found.' });
        }

        // Check 48-hour window (configurable per tenant)
        const tenant = await Tenant.findById(req.tenantId);
        const windowHours = tenant?.settings?.disputeWindowHours || 48;
        const session = await AttendanceSession.findById(sessionId);
        const hoursElapsed = (Date.now() - new Date(session.processedAt).getTime()) / (1000 * 60 * 60);

        if (hoursElapsed > windowHours) {
            return res.status(400).json({ error: `Dispute window (${windowHours}h) has expired.` });
        }

        // Check for duplicate dispute
        const existing = await Dispute.findOne({ record_id: recordId, student_id: req.user.user_id });
        if (existing) {
            return res.status(409).json({ error: 'Dispute already raised for this record.' });
        }

        const dispute = await Dispute.create({
            tenant_id: req.tenantId,
            session_id: sessionId,
            record_id: recordId,
            student_id: req.user.user_id,
            reason,
            originalConfidence: record.confidenceScore
        });

        res.status(201).json(dispute);
    } catch (err) {
        next(err);
    }
};

/**
 * GET /api/disputes
 * Students see their own; faculty/admin see all in tenant.
 */
exports.list = async (req, res, next) => {
    try {
        const filter = { tenant_id: req.tenantId };

        if (req.user.role === 'student') {
            filter.student_id = req.user.user_id;
        } else if (req.user.role === 'faculty') {
            // Faculty only see disputes for their own sessions
            const mySessions = await AttendanceSession.find({ faculty_id: req.user.user_id }).select('_id');
            const sessionIds = mySessions.map(s => s._id);
            filter.session_id = { $in: sessionIds };
        }

        if (req.query.status) filter.status = req.query.status;

        const disputes = await Dispute.find(filter)
            .sort({ createdAt: -1 })
            .populate('student_id', 'name email enrollmentId')
            .populate({
                path: 'session_id',
                select: 'createdAt class_id',
                populate: { path: 'class_id', select: 'name code' }
            });

        res.json(disputes);
    } catch (err) {
        next(err);
    }
};

/**
 * PUT /api/disputes/:id/resolve
 * Body: { status: 'accepted'|'rejected', reviewNote }
 * Only faculty/admin can resolve.
 */
exports.resolve = async (req, res, next) => {
    try {
        const { status, reviewNote } = req.body;

        if (!['accepted', 'rejected'].includes(status)) {
            return res.status(400).json({ error: 'Status must be accepted or rejected.' });
        }

        const dispute = await Dispute.findOne({
            _id: req.params.id,
            tenant_id: req.tenantId
        });
        if (!dispute) return res.status(404).json({ error: 'Dispute not found.' });
        if (dispute.status !== 'pending') {
            return res.status(400).json({ error: 'Dispute already resolved.' });
        }

        dispute.status = status;
        dispute.reviewedBy = req.user.user_id;
        dispute.reviewNote = reviewNote || null;
        dispute.reviewedAt = new Date();
        await dispute.save();

        // If accepted, update the attendance record
        if (status === 'accepted') {
            await AttendanceRecord.findByIdAndUpdate(dispute.record_id, {
                status: 'present',
                manualOverride: true,
                overrideBy: req.user.user_id,
                overrideReason: reviewNote || 'Dispute accepted'
            });
        }

        res.json(dispute);
    } catch (err) {
        next(err);
    }
};
