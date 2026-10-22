import { Router } from 'express';
import {
  listTags,
  createTag,
  updateTag,
  deleteTag
} from '../controllers/tag.controller.js';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';

const router = Router();

// Public reads
router.get('/', listTags);

// Admin-only writes
router.post('/', authenticate, requireRole('admin'), createTag);
router.patch('/:id', authenticate, requireRole('admin'), updateTag);
router.delete('/:id', authenticate, requireRole('admin'), deleteTag);

export default router;
