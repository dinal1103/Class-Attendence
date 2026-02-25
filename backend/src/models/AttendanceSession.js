const mongoose = require('mongoose');

const attendanceSessionSchema = new mongoose.Schema({
    tenant_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tenant',
        required: true,
        index: true
    },
    class_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Class',
        required: true
    },
    faculty_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'processing', 'completed', 'failed', 'rejected'],
        default: 'pending'
    },
    // Path to temporary image(s) for this session
    imagePaths: [{
        type: String
    }],
    totalDetections: {
        type: Number,
        default: 0
    },
    totalStudents: {
        type: Number,
        default: 0
    },
    detectionRatio: {
        type: Number,
        default: 0
    },
    rejectionReason: {
        type: String,
        default: null
    },
    processedAt: {
        type: Date,
        default: null
    }
}, { timestamps: true });

attendanceSessionSchema.index({ tenant_id: 1, class_id: 1 });
attendanceSessionSchema.index({ status: 1 });

module.exports = mongoose.model('AttendanceSession', attendanceSessionSchema);
