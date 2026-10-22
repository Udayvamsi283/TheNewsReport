import { Router } from 'express';
import {
  getPosts,
  getPostById,
  getPostPreview,
  getAdminDashboardStats,
  createPost,
  updatePost,
  deletePost,
  publishPost,
  unpublishPost,
  restorePost,
  duplicatePost,
  bulkUploadPosts
} from '../controllers/post.controller.js';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';
import { upload } from '../middleware/upload.middleware.js';

const router = Router();

// All editorial post management and preview endpoints require admin authentication
router.use(authenticate);
router.use(requireRole('admin'));

// Real admin dashboard stats
router.get('/admin/stats', getAdminDashboardStats);

// Preview endpoints strictly protected by admin role
router.get('/preview/:tokenOrId', getPostPreview);

// Standard post management
router.get('/', getPosts);
router.get('/:id', getPostById);

router.post('/', createPost);
router.patch('/:id', updatePost);
router.delete('/:id', deletePost);

router.post('/:id/publish', publishPost);
router.post('/:id/unpublish', unpublishPost);
router.post('/:id/restore', restorePost);
router.post('/:id/duplicate', duplicatePost);

router.post('/bulk-upload', upload.single('file'), bulkUploadPosts);

export default router;
