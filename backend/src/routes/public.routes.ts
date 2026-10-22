import { Router } from 'express';
import {
  getHomepageData,
  getFeed,
  getPostBySlug,
  recordView,
  getCategoryPosts,
  getLatestPosts,
  getTrendingPosts,
  getVideoPosts,
  searchPosts,
  getSitemap
} from '../controllers/public.controller.js';
import { optionalAuthenticate } from '../middleware/auth.middleware.js';

const router = Router();

// Public Content Discovery
router.get('/sitemap.xml', getSitemap);
router.get('/home', getHomepageData);
router.get('/feed', optionalAuthenticate, getFeed);
router.get('/posts', optionalAuthenticate, getLatestPosts);
router.get('/posts/:slug', optionalAuthenticate, getPostBySlug);
router.post('/posts/:id/view', recordView);
router.get('/categories/:slug/posts', getCategoryPosts);
router.get('/latest', getLatestPosts);
router.get('/trending', getTrendingPosts);
router.get('/videos', getVideoPosts);
router.get('/search', searchPosts);

export default router;
