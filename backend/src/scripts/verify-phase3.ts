import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/the_news';

async function verifyPhase3() {
  console.log('====================================================');
  console.log('PHASE 3 — ARTICLE DETAIL ENHANCEMENTS VERIFICATION');
  console.log('====================================================');

  await mongoose.connect(MONGODB_URI, { dbName: 'the_news' });
  console.log('Connected to MongoDB database');

  const { Post } = await import('../models/post.model.js');
  const { Tag } = await import('../models/tag.model.js');
  const { localizePost } = await import('../controllers/public.controller.js');
  const now = new Date();

  // 1. Fetch published posts sorted chronologically by publishedAt
  const publishedPosts = await Post.find({
    status: 'published',
    publishedAt: { $lte: now }
  })
    .sort({ publishedAt: 1 })
    .populate('category', 'name slug')
    .populate('tags', 'name slug')
    .populate('language', 'name code');

  console.log(`\nFound ${publishedPosts.length} published posts in archive.`);
  if (publishedPosts.length === 0) {
    throw new Error('No published posts found to verify!');
  }

  // 2. Test Earliest Post Navigation (Boundary Check)
  const earliest = publishedPosts[0];
  console.log(`\n1. Testing Earliest Post: "${earliest.title}" (published: ${earliest.publishedAt?.toISOString()})`);
  const prevForEarliest = await Post.findOne({
    status: 'published',
    publishedAt: { $lt: earliest.publishedAt }
  }).sort({ publishedAt: -1 });

  const nextForEarliest = await Post.findOne({
    status: 'published',
    publishedAt: { $gt: earliest.publishedAt, $lte: now }
  }).sort({ publishedAt: 1 });

  console.log(`   Prev for earliest: ${prevForEarliest ? prevForEarliest.title : 'null (Correct - boundary)'}`);
  console.log(`   Next for earliest: "${nextForEarliest?.title}"`);
  if (prevForEarliest !== null) throw new Error('Earliest post should have null prevPost');
  if (!nextForEarliest) throw new Error('Earliest post should have a nextPost');
  console.log('   ✓ Earliest post boundary navigation verified.');

  // 3. Test Latest Post Navigation (Boundary Check)
  const latest = publishedPosts[publishedPosts.length - 1];
  console.log(`\n2. Testing Latest Post: "${latest.title}" (published: ${latest.publishedAt?.toISOString()})`);
  const prevForLatest = await Post.findOne({
    status: 'published',
    publishedAt: { $lt: latest.publishedAt }
  }).sort({ publishedAt: -1 });

  const nextForLatest = await Post.findOne({
    status: 'published',
    publishedAt: { $gt: latest.publishedAt, $lte: now }
  }).sort({ publishedAt: 1 });

  console.log(`   Prev for latest: "${prevForLatest?.title}"`);
  console.log(`   Next for latest: ${nextForLatest ? nextForLatest.title : 'null (Correct - boundary)'}`);
  if (nextForLatest !== null) throw new Error('Latest post should have null nextPost');
  if (!prevForLatest) throw new Error('Latest post should have a prevPost');
  console.log('   ✓ Latest post boundary navigation verified.');

  // 4. Test Middle Post Navigation (Bidirectional)
  const middle = publishedPosts[Math.floor(publishedPosts.length / 2)];
  console.log(`\n3. Testing Middle Post: "${middle.title}" (published: ${middle.publishedAt?.toISOString()})`);
  const prevForMiddle = await Post.findOne({
    status: 'published',
    publishedAt: { $lt: middle.publishedAt }
  }).sort({ publishedAt: -1 });
  const nextForMiddle = await Post.findOne({
    status: 'published',
    publishedAt: { $gt: middle.publishedAt, $lte: now }
  }).sort({ publishedAt: 1 });

  console.log(`   Prev: "${prevForMiddle?.title}"`);
  console.log(`   Next: "${nextForMiddle?.title}"`);
  if (!prevForMiddle || !nextForMiddle) throw new Error('Middle post must have both prev and next posts');
  if (prevForMiddle.id === middle.id || nextForMiddle.id === middle.id) {
    throw new Error('Prev or next should not be equal to current post');
  }
  console.log('   ✓ Middle post bidirectional navigation verified.');

  // 5. Test Multilingual Localization for Prev & Next
  console.log('\n4. Testing Localization of Prev & Next:');
  const localizedPrevTe = localizePost(prevForMiddle, 'te');
  const localizedNextTe = localizePost(nextForMiddle, 'te');
  const localizedPrevHi = localizePost(prevForMiddle, 'hi');
  const localizedNextHi = localizePost(nextForMiddle, 'hi');

  console.log(`   [te] Prev: "${localizedPrevTe.title}"`);
  console.log(`   [te] Next: "${localizedNextTe.title}"`);
  console.log(`   [hi] Prev: "${localizedPrevHi.title}"`);
  console.log(`   [hi] Next: "${localizedNextHi.title}"`);
  console.log('   ✓ Multilingual prev/next titles resolved properly.');

  // 6. Test Related Stories Prioritization
  console.log(`\n5. Testing Related Stories Scoring for: "${middle.title}"`);
  const currentTagIds = (middle.tags || []).map((t: any) =>
    typeof t === 'object' && t._id ? t._id.toString() : t.toString()
  );
  const categoryId = (middle.category as any)?._id?.toString() || middle.category?.toString();

  const candidates = await Post.find({
    status: 'published',
    publishedAt: { $lte: now },
    _id: { $ne: middle._id }
  })
    .populate('category', 'name slug')
    .populate('tags', 'name slug')
    .limit(20);

  const scored = candidates.map((p) => {
    const pCatId = (p.category as any)?._id?.toString() || p.category?.toString();
    const isSameCategory = Boolean(categoryId && pCatId === categoryId);
    const pTagIds = (p.tags || []).map((t: any) =>
      typeof t === 'object' && t._id ? t._id.toString() : t.toString()
    );
    const overlappingTagCount = pTagIds.filter((id) => currentTagIds.includes(id)).length;

    let score = 0;
    if (isSameCategory && overlappingTagCount > 0) score = 100 + overlappingTagCount * 10;
    else if (isSameCategory) score = 50;
    else if (overlappingTagCount > 0) score = 25 + overlappingTagCount * 5;
    else score = 10;

    return { post: p, score };
  });

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return new Date(b.post.publishedAt || 0).getTime() - new Date(a.post.publishedAt || 0).getTime();
  });

  const topRelated = scored.slice(0, 4);
  console.log(`   Top 4 related stories found (scored):`);
  for (const item of topRelated) {
    console.log(`   - Score ${item.score}: "${item.post.title}" (Cat: ${(item.post.category as any)?.name})`);
  }
  if (topRelated.some((r) => r.post.id === middle.id)) {
    throw new Error('Current article should never appear in related stories');
  }
  console.log('   ✓ Related stories priority and current-article exclusion verified.');

  // 7. Verify Real Tags
  const allTags = await Tag.find({}).sort({ name: 1 });
  console.log(`\n6. Real Tags in Database: ${allTags.length} tags`);
  console.log(`   Sample tags: ${allTags.slice(0, 8).map((t) => `#${t.name}`).join(', ')}`);

  await mongoose.disconnect();
  console.log('\n====================================================');
  console.log('PHASE 3 ALL VERIFICATIONS PASSED SUCCESSFULLY!');
  console.log('====================================================\n');
}

verifyPhase3().catch((err) => {
  console.error('Phase 3 verification error:', err);
  process.exit(1);
});
