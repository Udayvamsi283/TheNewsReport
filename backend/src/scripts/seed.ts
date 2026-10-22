import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import { connectDatabase } from '../config/database.js';
import { User } from '../models/user.model.js';
import { Category } from '../models/category.model.js';
import { Tag } from '../models/tag.model.js';
import { Language } from '../models/language.model.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

export const seedDatabase = async () => {
  try {
    logger.info('Starting Phase 2 database seed on MongoDB Atlas...');
    await connectDatabase();

    // 1. Languages
    const existingLanguages = await Language.countDocuments();
    if (existingLanguages === 0) {
      logger.info('Seeding initial platform languages...');
      await Language.create([
        { name: 'English', code: 'en', isDefault: true, status: 'active' },
        { name: 'Telugu', code: 'te', isDefault: false, status: 'active' },
        { name: 'Hindi', code: 'hi', isDefault: false, status: 'active' }
      ]);
      logger.info('Languages seeded successfully.');
    }

    // 2. Categories & Nested Categories
    const existingCategories = await Category.countDocuments();
    if (existingCategories === 0) {
      logger.info('Seeding foundational news categories...');
      const topCategories = await Category.create([
        { name: 'National', slug: 'national', description: 'Domestic governance and public policy reporting.' },
        { name: 'International', slug: 'international', description: 'Geopolitics, multilateral diplomacy, and world affairs.' },
        { name: 'Politics', slug: 'politics', description: 'Parliamentary affairs, electoral analysis, and constitutional reform.' },
        { name: 'Business', slug: 'business', description: 'Macroeconomics, markets, monetary policy, and corporate governance.' },
        { name: 'Technology', slug: 'technology', description: 'Silicon architecture, cyber doctrine, and digital innovation.' },
        { name: 'Sports', slug: 'sports', description: 'Championship athletics, performance science, and federation governance.' },
        { name: 'Entertainment', slug: 'entertainment', description: 'Arts, cultural heritage, and cinematic archives.' },
        { name: 'Regional', slug: 'regional', description: 'State and provincial investigative dispatches.' }
      ]);

      const regionalCategory = topCategories.find((c) => c.slug === 'regional');
      if (regionalCategory) {
        await Category.create([
          {
            name: 'Andhra Pradesh',
            slug: 'andhra-pradesh',
            description: 'State governance and public policy dispatches from Andhra Pradesh.',
            parent: regionalCategory._id
          },
          {
            name: 'Telangana',
            slug: 'telangana',
            description: 'State governance and economic reporting from Telangana.',
            parent: regionalCategory._id
          }
        ]);
      }
      logger.info('Categories seeded successfully.');
    }

    // 3. Tags
    const existingTags = await Tag.countDocuments();
    if (existingTags === 0) {
      logger.info('Seeding foundational tags...');
      await Tag.create([
        { name: 'Diplomacy', slug: 'diplomacy' },
        { name: 'Markets', slug: 'markets' },
        { name: 'Semiconductors', slug: 'semiconductors' },
        { name: 'Governance', slug: 'governance' },
        { name: 'Climate Finance', slug: 'climate-finance' }
      ]);
      logger.info('Tags seeded successfully.');
    }

    // 4. Administrator User from Environment
    const adminEmail = env.ADMIN_EMAIL.toLowerCase().trim();
    const existingAdmin = await User.findOne({ email: adminEmail });
    const passwordHash = await bcrypt.hash(env.ADMIN_PASSWORD, 10);

    if (!existingAdmin) {
      logger.info(`Seeding initial administrator user (${adminEmail})...`);
      await User.create({
        name: 'Editorial Administrator',
        email: adminEmail,
        passwordHash,
        role: 'admin',
        preferredLanguage: 'en',
        status: 'active'
      });
      logger.info('Admin user created successfully from environment variables.');
    } else {
      // Rotate password and ensure admin role
      existingAdmin.passwordHash = passwordHash;
      existingAdmin.role = 'admin';
      existingAdmin.status = 'active';
      await existingAdmin.save();
      logger.info(`Admin user (${adminEmail}) credentials synchronized with environment.`);
    }

    logger.info('Database seeding completed successfully.');
  } catch (error) {
    logger.error('Error during database seed:', error);
    throw error;
  }
};

// Execute if run directly from CLI
if (process.argv[1]?.includes('seed.ts') || process.argv[1]?.includes('seed.js')) {
  seedDatabase()
    .then(async () => {
      await mongoose.connection.close();
      process.exit(0);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
