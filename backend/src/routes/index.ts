import { Router } from 'express';
import healthRoutes from './health.routes.js';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import categoryRoutes from './category.routes.js';
import tagRoutes from './tag.routes.js';
import languageRoutes from './language.routes.js';
import postRoutes from './post.routes.js';
import mediaRoutes from './media.routes.js';
import publicRoutes from './public.routes.js';
import engagementRoutes from './engagement.routes.js';

const apiRouter = Router();

// Base & Health
apiRouter.use('/', healthRoutes);

// Core Modules
apiRouter.use('/auth', authRoutes);
apiRouter.use('/users', userRoutes);
apiRouter.use('/categories', categoryRoutes);
apiRouter.use('/tags', tagRoutes);
apiRouter.use('/languages', languageRoutes);

// Phase 3 Modules: Posts & Media
apiRouter.use('/posts', postRoutes);
apiRouter.use('/media', mediaRoutes);

// Phase 4 Modules: Public Portal & Reader Engagement
apiRouter.use('/public', publicRoutes);
apiRouter.use('/engagement', engagementRoutes);
apiRouter.use('/', engagementRoutes);

export default apiRouter;
