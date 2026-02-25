const router = require('express').Router();
const ctrl = require('../controllers/class.controller');
const authMiddleware = require('../middlewares/auth');
const tenantScope = require('../middlewares/tenantScope');
const authorize = require('../middlewares/role');

router.use(authMiddleware, tenantScope);

router.post('/', authorize('admin', 'faculty'), ctrl.create);
router.get('/', ctrl.list);
router.get('/:id', ctrl.getById);
router.put('/:id', authorize('admin', 'faculty'), ctrl.update);
router.post('/:id/students', authorize('admin', 'faculty'), ctrl.addStudents);

module.exports = router;
