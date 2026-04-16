/**
 * audit.controller.js — Fetch audit logs for HODs
 */
const AuditLog = require('../models/AuditLog');

/**
 * GET /api/audit-logs
 * Authorized for 'hod' and 'admin'
 */
exports.listLogs = async (req, res, next) => {
    try {
        const filter = { tenant_id: req.tenantId };
        
        // Optional filters if needed
        if (req.query.type) {
            filter.type = req.query.type;
        }

        const logs = await AuditLog.find(filter)
            .sort({ createdAt: -1 })
            .populate('performedBy', 'name email role')
            .populate({
                path: 'class_id',
                select: 'name code department_id',
                populate: { path: 'department_id', select: 'name code' }
            });
            
        res.json(logs);
    } catch (err) {
        next(err);
    }
};

/**
 * GET /api/audit-logs/:id
 */
exports.getLog = async (req, res, next) => {
    try {
        const log = await AuditLog.findOne({ _id: req.params.id, tenant_id: req.tenantId })
            .populate('performedBy', 'name email role')
            .populate({
                path: 'class_id',
                select: 'name code department_id',
                populate: { path: 'department_id', select: 'name code' }
            });
            
        if (!log) return res.status(404).json({ error: 'Audit log not found.' });
        res.json(log);
    } catch (err) {
        next(err);
    }
};
