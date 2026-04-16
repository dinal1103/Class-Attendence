const mongoose = require('mongoose');

const attendanceRecordSchema = new mongoose.Schema({
    tenant_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tenant',
        required: true,
        index: true
    },
    session_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AttendanceSession',
        required: true,
        index: true
    },
    student_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['present', 'flagged', 'absent'],
        required: true
    },
    bbox: {
        type: [Number],
        default: []
    },
    confidenceScore: {
        type: Number,
        default: 0
    },
    // Was this record manually overridden via dispute?
    manualOverride: {
        type: Boolean,
        default: false
    },
    overrideBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    overrideReason: {
        type: String,
        default: null
    }
}, { timestamps: true });

attendanceRecordSchema.index({ tenant_id: 1, session_id: 1 });
attendanceRecordSchema.index({ student_id: 1 });

module.exports = mongoose.model('AttendanceRecord', attendanceRecordSchema);
