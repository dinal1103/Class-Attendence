const mongoose = require('mongoose');

const enrollmentConfigSchema = new mongoose.Schema({
    method: {
        type: String,
        enum: ['regex', 'positional', 'delimiter'],
        default: 'regex'
    },
    // For regex extraction
    pattern: { type: String, default: '' },
    // For positional extraction
    startPos: { type: Number, default: 0 },
    endPos: { type: Number, default: 0 },
    // For delimiter-based extraction
    delimiter: { type: String, default: '' },
    fieldIndex: { type: Number, default: 0 }
}, { _id: false });

const tenantSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    code: {
        type: String,
        required: true,
        trim: true,
        unique: true,
        uppercase: true
    },
    enrollmentConfig: {
        type: enrollmentConfigSchema,
        default: () => ({})
    },
    settings: {
        highThreshold: { type: Number, default: 0.85 },
        lowThreshold: { type: Number, default: 0.75 },
        disputeWindowHours: { type: Number, default: 48 },
        minDetectionRatio: { type: Number, default: 0.25 }
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

module.exports = mongoose.model('Tenant', tenantSchema);
