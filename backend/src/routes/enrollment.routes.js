const router = require('express').Router();
const ctrl = require('../controllers/enrollment.controller');
const authMiddleware = require('../middlewares/auth');
const tenantScope = require('../middlewares/tenantScope');
const authorize = require('../middlewares/role');

router.use(authMiddleware, tenantScope);

router.post(
    '/:studentId',
    authorize('admin', 'faculty'),
    ctrl.uploadMiddleware,
    ctrl.enroll
);

module.exports = router;
