import { Router } from 'express';
import {
  getProfile,
  updateProfile,
  uploadAvatar,
  removeAvatar,
  changePassword,
  updatePreferences,
  listUsers,
  getUserById,
  updateUser,
  deleteUser
} from '../controllers/user.controller.js';
import { getUserBookmarks, getUserLikes } from '../controllers/engagement.controller.js';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';
import { avatarUpload } from '../middleware/upload.middleware.js';

const router = Router();

// Authenticated current user routes
router.get('/me', authenticate, getProfile);
router.patch('/me', authenticate, updateProfile);
router.post('/me/avatar', authenticate, avatarUpload.single('avatar'), uploadAvatar);
router.delete('/me/avatar', authenticate, removeAvatar);
router.patch('/me/preferences', authenticate, updatePreferences);
router.get('/me/bookmarks', authenticate, getUserBookmarks);
router.get('/me/likes', authenticate, getUserLikes);
router.post('/me/change-password', authenticate, changePassword);

// Admin-only user management routes
router.get('/', authenticate, requireRole('admin'), listUsers);
router.get('/:id', authenticate, requireRole('admin'), getUserById);
router.patch('/:id', authenticate, requireRole('admin'), updateUser);
router.delete('/:id', authenticate, requireRole('admin'), deleteUser);

export default router;
