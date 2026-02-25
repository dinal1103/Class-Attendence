/**
 * tenant.controller.js — CRUD for Tenants (super-admin level).
 */
const Tenant = require('../models/Tenant');

/**
 * POST /api/tenants
 */
exports.create = async (req, res, next) => {
    try {
        const { name, code, enrollmentConfig, settings } = req.body;
        const tenant = await Tenant.create({ name, code, enrollmentConfig, settings });
        res.status(201).json(tenant);
    } catch (err) {
        if (err.code === 11000) {
            return res.status(409).json({ error: 'Tenant name or code already exists.' });
        }
        next(err);
    }
};

/**
 * GET /api/tenants
 */
exports.list = async (req, res, next) => {
    try {
        const tenants = await Tenant.find({ isActive: true });
        res.json(tenants);
    } catch (err) {
        next(err);
    }
};

/**
 * GET /api/tenants/:id
 */
exports.getById = async (req, res, next) => {
    try {
        const tenant = await Tenant.findById(req.params.id);
        if (!tenant) return res.status(404).json({ error: 'Tenant not found.' });
        res.json(tenant);
    } catch (err) {
        next(err);
    }
};

/**
 * PUT /api/tenants/:id
 */
exports.update = async (req, res, next) => {
    try {
        const tenant = await Tenant.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!tenant) return res.status(404).json({ error: 'Tenant not found.' });
        res.json(tenant);
    } catch (err) {
        next(err);
    }
};
