const router = require('express').Router();
const ctrl = require('../controllers/attendance.controller');
const authMiddleware = require('../middlewares/auth');
const tenantScope = require('../middlewares/tenantScope');
const authorize = require('../middlewares/role');

router.use(authMiddleware, tenantScope);

router.post(
    '/sessions',
    authorize('faculty'),
    ctrl.uploadMiddleware,
    ctrl.createSession
);
router.get('/sessions', ctrl.listSessions);
router.get('/sessions/:id', ctrl.getSession);
router.get('/sessions/:id/records', ctrl.getSessionRecords);
router.get('/sessions/:id/image/:index', ctrl.getSessionImage);

module.exports = router;
