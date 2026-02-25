const router = require('express').Router();
const ctrl = require('../controllers/dispute.controller');
const authMiddleware = require('../middlewares/auth');
const tenantScope = require('../middlewares/tenantScope');
const authorize = require('../middlewares/role');

router.use(authMiddleware, tenantScope);

router.post('/', authorize('student'), ctrl.create);
router.get('/', ctrl.list);
router.put('/:id/resolve', authorize('admin', 'faculty'), ctrl.resolve);

module.exports = router;
