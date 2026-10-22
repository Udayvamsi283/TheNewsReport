import { Router } from 'express';
import {
  likePost,
  unlikePost,
  bookmarkPost,
  removeBookmark,
  getComments,
  createComment,
  deleteComment,
  getAdminComments,
  updateCommentStatusByAdmin,
  votePoll,
  getPollResults
} from '../controllers/engagement.controller.js';
import { authenticate, optionalAuthenticate, requireRole } from '../middleware/auth.middleware.js';
import { commentRateLimiter, voteRateLimiter } from '../middleware/rateLimiter.middleware.js';

const router = Router();

// Likes
router.post('/posts/:id/like', authenticate, likePost);
router.delete('/posts/:id/like', authenticate, unlikePost);

// Bookmarks
router.post('/posts/:id/bookmark', authenticate, bookmarkPost);
router.delete('/posts/:id/bookmark', authenticate, removeBookmark);

// Comments (Public reading & authenticated posting/deletion)
router.get('/posts/:id/comments', getComments);
router.post('/posts/:id/comments', authenticate, commentRateLimiter, createComment);
router.delete('/comments/:id', authenticate, deleteComment);

// Admin Comment Moderation
router.get('/admin/comments', authenticate, requireRole('admin'), getAdminComments);
router.patch('/admin/comments/:id/status', authenticate, requireRole('admin'), updateCommentStatusByAdmin);

// Poll Voting
router.post('/posts/:id/poll/vote', authenticate, voteRateLimiter, votePoll);
router.get('/posts/:id/poll/results', optionalAuthenticate, getPollResults);

export default router;
