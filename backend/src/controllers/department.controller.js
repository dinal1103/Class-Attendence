/**
 * department.controller.js — CRUD for Departments (tenant-scoped).
 */
const Department = require('../models/Department');

/**
 * POST /api/departments
 */
exports.create = async (req, res, next) => {
    try {
        const { name, code } = req.body;
        const dept = await Department.create({
            tenant_id: req.tenantId,
            name,
            code
        });
        res.status(201).json(dept);
    } catch (err) {
        if (err.code === 11000) {
            return res.status(409).json({ error: 'Department code already exists for this tenant.' });
        }
        next(err);
    }
};

/**
 * GET /api/departments
 */
exports.list = async (req, res, next) => {
    try {
        const depts = await Department.find({ tenant_id: req.tenantId, isActive: true });
        res.json(depts);
    } catch (err) {
        next(err);
    }
};

/**
 * GET /api/departments/:id
 */
exports.getById = async (req, res, next) => {
    try {
        const dept = await Department.findOne({ _id: req.params.id, tenant_id: req.tenantId });
        if (!dept) return res.status(404).json({ error: 'Department not found.' });
        res.json(dept);
    } catch (err) {
        next(err);
    }
};

/**
 * PUT /api/departments/:id
 */
exports.update = async (req, res, next) => {
    try {
        const dept = await Department.findOneAndUpdate(
            { _id: req.params.id, tenant_id: req.tenantId },
            req.body,
            { new: true }
        );
        if (!dept) return res.status(404).json({ error: 'Department not found.' });
        res.json(dept);
    } catch (err) {
        next(err);
    }
};
