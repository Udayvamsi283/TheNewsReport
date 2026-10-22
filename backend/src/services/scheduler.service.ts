import { Post } from '../models/post.model.js';
import { logger } from '../utils/logger.js';

let schedulerInterval: NodeJS.Timeout | null = null;

/**
 * Checks for scheduled posts whose scheduledAt has arrived,
 * and updates their status to 'published'.
 */
export const publishDueScheduledPosts = async (): Promise<number> => {
  try {
    const now = new Date();
    const result = await Post.updateMany(
      {
        status: 'scheduled',
        scheduledAt: { $lte: now }
      },
      {
        $set: {
          status: 'published',
          publishedAt: now
        }
      }
    );

    if (result.modifiedCount > 0) {
      logger.info(`Scheduler published ${result.modifiedCount} scheduled post(s) automatically.`);
    }

    return result.modifiedCount;
  } catch (error) {
    logger.error('Error running scheduled post publisher:', error);
    return 0;
  }
};

/**
 * Start the database-driven scheduled post timer.
 * Checks every 60 seconds without Redis or external queue.
 */
export const startPostScheduler = (intervalMs = 60000) => {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
  }

  // Initial check on boot
  publishDueScheduledPosts();

  schedulerInterval = setInterval(() => {
    publishDueScheduledPosts();
  }, intervalMs);

  logger.info(`Post publishing scheduler started (running every ${intervalMs / 1000}s).`);
};

export const stopPostScheduler = () => {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
    logger.info('Post publishing scheduler stopped.');
  }
};
