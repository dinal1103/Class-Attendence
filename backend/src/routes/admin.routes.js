/**
 * admin.routes.js — Staff management routes.
 */
const router = require('express').Router();
const ctrl = require('../controllers/admin.controller');
const authMiddleware = require('../middlewares/auth');
const tenantScope = require('../middlewares/tenantScope');
const authorize = require('../middlewares/role');

// All admin routes require authentication, tenant context, and admin role
router.use(authMiddleware, tenantScope, authorize('admin'));

router.post('/users', ctrl.createUser);
router.get('/users', ctrl.listUsers);
router.delete('/users/:id', ctrl.deleteUser);
router.post('/users/bulk', ctrl.bulkUploadMiddleware, ctrl.bulkCreateUsers);

module.exports = router;
