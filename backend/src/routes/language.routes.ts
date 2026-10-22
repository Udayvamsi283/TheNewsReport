import { Router } from 'express';
import {
  listLanguages,
  createLanguage,
  updateLanguage,
  deleteLanguage
} from '../controllers/language.controller.js';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';

const router = Router();

// Public reads
router.get('/', listLanguages);

// Admin-only writes
router.post('/', authenticate, requireRole('admin'), createLanguage);
router.patch('/:id', authenticate, requireRole('admin'), updateLanguage);
router.delete('/:id', authenticate, requireRole('admin'), deleteLanguage);

export default router;
