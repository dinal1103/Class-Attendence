const router = require('express').Router();
const ctrl = require('../controllers/audit.controller');
const authMiddleware = require('../middlewares/auth');
const tenantScope = require('../middlewares/tenantScope');
const authorize = require('../middlewares/role');

router.use(authMiddleware, tenantScope);

// Only admin and HOD can view audit logs
router.get('/', authorize('admin', 'hod'), ctrl.listLogs);
router.get('/:id', authorize('admin', 'hod'), ctrl.getLog);

module.exports = router;
