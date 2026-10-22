import mongoose from 'mongoose';
import { connectDatabase } from '../config/database.js';
import { User } from '../models/user.model.js';
import { Category } from '../models/category.model.js';
import { Tag } from '../models/tag.model.js';
import { logger } from '../utils/logger.js';

export const cleanupTestData = async () => {
  try {
    logger.info('Connecting to MongoDB Atlas to clean test artifacts...');
    await connectDatabase();

    // 1. Delete test users
    const userResult = await User.deleteMany({
      $or: [
        { email: { $regex: /^reader_/i } },
        { email: { $regex: /^short_/i } },
        { email: { $regex: /^test_/i } },
        { name: { $regex: /test reader/i } },
        { name: { $regex: /short pass/i } },
        { name: { $regex: /duplicate reader/i } }
      ]
    });
    logger.info(`Cleaned up ${userResult.deletedCount} temporary test user account(s).`);

    // 2. Delete test categories
    const catResult = await Category.deleteMany({
      $or: [
        { slug: { $regex: /^test-desk/i } },
        { slug: { $regex: /^sub-desk/i } },
        { name: { $regex: /^Test Desk/i } },
        { name: { $regex: /^Sub Desk/i } }
      ]
    });
    logger.info(`Cleaned up ${catResult.deletedCount} temporary test category(ies).`);

    // 3. Delete test tags
    const tagResult = await Tag.deleteMany({
      $or: [
        { slug: { $regex: /^tag-/i } },
        { name: { $regex: /^Tag_/i } }
      ]
    });
    logger.info(`Cleaned up ${tagResult.deletedCount} temporary test tag(s).`);

    logger.info('Database cleanup complete. Real seeded records are intact.');
  } catch (error) {
    logger.error('Error during test data cleanup:', error);
    throw error;
  }
};

cleanupTestData()
  .then(async () => {
    await mongoose.connection.close();
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
