const router = require('express').Router();
const ctrl = require('../controllers/stats.controller');
const authMiddleware = require('../middlewares/auth');
const tenantScope = require('../middlewares/tenantScope');
const authorize = require('../middlewares/role');

router.use(authMiddleware, tenantScope);

router.get('/admin', authorize('admin'), ctrl.adminStats);
router.get('/faculty', authorize('faculty'), ctrl.facultyStats);
router.get('/student', authorize('student'), ctrl.studentStats);
router.get('/class-attendance', ctrl.classAttendance);
router.get('/hod/weekly', authorize('hod'), ctrl.hodWeekly);

module.exports = router;
