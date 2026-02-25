/**
 * role.js — Role-based access control middleware.
 * Usage: authorize('admin', 'faculty')
 */
function authorize(...allowedRoles) {
    return (req, res, next) => {
        if (!req.user || !allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Insufficient permissions.' });
        }
        next();
    };
}

module.exports = authorize;
