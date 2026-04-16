const router = require('express').Router();
const ctrl = require('../controllers/auth.controller');
const authMiddleware = require('../middlewares/auth');

router.post('/register', ctrl.register);
router.post('/login', ctrl.login);
router.get('/me', authMiddleware, ctrl.getMe);
router.post('/change-password', authMiddleware, ctrl.changePassword);

module.exports = router;
