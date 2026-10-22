import { Router } from 'express';
import {
  uploadMediaAsset,
  getMediaAssets,
  updateMediaMetadata,
  deleteMediaAsset
} from '../controllers/media.controller.js';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';
import { upload } from '../middleware/upload.middleware.js';

const router = Router();

// Media routes require admin authentication
router.use(authenticate);
router.use(requireRole('admin'));

router.post('/', upload.single('file'), uploadMediaAsset);
router.get('/', getMediaAssets);
router.patch('/:id', updateMediaMetadata);
router.delete('/:id', deleteMediaAsset);

export default router;
