const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema({
    tenant_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tenant',
        required: true,
        index: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    code: {
        type: String,
        required: true,
        trim: true,
        uppercase: true
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

departmentSchema.index({ tenant_id: 1, code: 1 }, { unique: true });

module.exports = mongoose.model('Department', departmentSchema);
