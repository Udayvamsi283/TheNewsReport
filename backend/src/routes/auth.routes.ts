import { Router } from 'express';
import { register, login, logout, getMe, getCsrfToken } from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/csrf-token', getCsrfToken);
router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.get('/me', authenticate, getMe);

export default router;
