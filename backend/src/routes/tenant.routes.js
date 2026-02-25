const router = require('express').Router();
const ctrl = require('../controllers/tenant.controller');
const authMiddleware = require('../middlewares/auth');
const authorize = require('../middlewares/role');

// All tenant routes require admin auth
router.use(authMiddleware, authorize('admin'));

router.post('/', ctrl.create);
router.get('/', ctrl.list);
router.get('/:id', ctrl.getById);
router.put('/:id', ctrl.update);

module.exports = router;
