const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
    tenant_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tenant',
        required: true,
        index: true
    },
    type: {
        type: String,
        enum: ['class_archived'],
        required: true
    },
    class_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Class',
        required: true
    },
    performedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    details: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    }
}, { timestamps: true });

auditLogSchema.index({ tenant_id: 1, type: 1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
