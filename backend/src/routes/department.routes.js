const router = require('express').Router();
const ctrl = require('../controllers/department.controller');
const authMiddleware = require('../middlewares/auth');
const tenantScope = require('../middlewares/tenantScope');
const authorize = require('../middlewares/role');

router.use(authMiddleware, tenantScope);

router.post('/', authorize('admin'), ctrl.create);
router.get('/', ctrl.list);
router.get('/:id', ctrl.getById);
router.put('/:id', authorize('admin'), ctrl.update);

module.exports = router;
