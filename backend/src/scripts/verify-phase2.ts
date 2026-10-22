import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/the_news';

async function verifyPhase2() {
  console.log('====================================================');
  console.log('PHASE 2 — HOMEPAGE LOCALIZATION VERIFICATION');
  console.log('====================================================');

  await mongoose.connect(MONGODB_URI, { dbName: 'the_news' });
  console.log('Connected to MongoDB database');

  const { Post } = await import('../models/post.model.js');
  const now = new Date();

  // Check how many published posts exist with translations
  const totalPublished = await Post.countDocuments({ status: 'published', publishedAt: { $lte: now } });
  const postsWithTranslations = await Post.find({
    status: 'published',
    publishedAt: { $lte: now },
    'translations.0': { $exists: true }
  }).select('title translations.languageCode translations.title translations.slug');

  console.log(`Total published posts: ${totalPublished}`);
  console.log(`Posts with translations: ${postsWithTranslations.length}`);

  for (const p of postsWithTranslations) {
    console.log(`- Canonical title: "${p.title}"`);
    for (const t of p.translations || []) {
      console.log(`   [${t.languageCode}]: "${t.title}" (slug: ${t.slug})`);
    }
  }

  await mongoose.disconnect();
  console.log('✓ Phase 2 DB inspection complete.');
}

verifyPhase2().catch((err) => {
  console.error('Phase 2 verification error:', err);
  process.exit(1);
});
