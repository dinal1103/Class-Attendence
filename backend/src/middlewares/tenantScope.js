/**
 * tenantScope.js — Middleware to enforce multi-tenant isolation.
 * Attaches tenant_id from JWT to all requests.
 */
function tenantScope(req, res, next) {
    if (!req.user || !req.user.tenant_id) {
        return res.status(403).json({ error: 'Tenant context missing.' });
    }
    // Make tenant_id easily accessible
    req.tenantId = req.user.tenant_id;
    next();
}

module.exports = tenantScope;
