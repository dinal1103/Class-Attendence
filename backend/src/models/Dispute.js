const mongoose = require('mongoose');

const disputeSchema = new mongoose.Schema({
    tenant_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tenant',
        required: true,
        index: true
    },
    session_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AttendanceSession',
        required: true
    },
    record_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AttendanceRecord',
        required: true
    },
    student_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    reason: {
        type: String,
        required: true,
        trim: true
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected'],
        default: 'pending'
    },
    reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    reviewNote: {
        type: String,
        default: null
    },
    reviewedAt: {
        type: Date,
        default: null
    },
    // Snapshot of the original confidence score for audit
    originalConfidence: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

disputeSchema.index({ tenant_id: 1, student_id: 1 });
disputeSchema.index({ session_id: 1 });

module.exports = mongoose.model('Dispute', disputeSchema);
