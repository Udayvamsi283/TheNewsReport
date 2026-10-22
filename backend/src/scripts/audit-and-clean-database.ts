import mongoose from 'mongoose';
import { connectDatabase } from '../config/database.js';
import { env } from '../config/env.js';
import { User } from '../models/user.model.js';
import { Post } from '../models/post.model.js';
import { Comment } from '../models/comment.model.js';
import { Like } from '../models/like.model.js';
import { Bookmark } from '../models/bookmark.model.js';
import { PollVote } from '../models/pollVote.model.js';
import { Category } from '../models/category.model.js';
import { Tag } from '../models/tag.model.js';
import { Language } from '../models/language.model.js';
import { Media } from '../models/media.model.js';

interface AuditReport {
  mode: 'DRY_RUN' | 'APPLY';
  totalLegitimate: {
    admin: number;
    categories: number;
    tags: number;
    languages: number;
    editorialPosts: number;
    media: number;
  };
  targetedForRemoval: {
    testUsers: { count: number; ids: string[]; emails: string[] };
    testPosts: { count: number; ids: string[]; titles: string[] };
    testComments: { count: number; ids: string[] };
    testLikes: { count: number; ids: string[] };
    testBookmarks: { count: number; ids: string[] };
    testPollVotes: { count: number; ids: string[] };
  };
  indexes: Record<string, any[]>;
}

export async function auditAndCleanDatabase(applyChanges: boolean = false): Promise<AuditReport> {
  await connectDatabase();

  console.log(`\n======================================================`);
  console.log(`  DATABASE AUDIT & CLEANUP — ${applyChanges ? 'APPLY MODE' : 'DRY-RUN / REPORT MODE'}`);
  console.log(`======================================================\n`);

  // 1. Identify Test Users (Created by test scripts)
  // Strict matching: starts with reader_, test_, short_, or duplicate_ and NOT the admin email
  const testUsersQuery = {
    email: {
      $in: [
        /^reader_/i,
        /^test_/i,
        /^short_/i,
        /^duplicate_/i
      ],
      $ne: env.ADMIN_EMAIL.toLowerCase()
    }
  };
  const testUsers = await User.find(testUsersQuery).select('_id email role name').lean();
  const testUserIds = testUsers.map((u) => u._id);

  // 2. Identify Test Posts (Created during automated testing)
  // Strict pattern: titles ending with numeric timestamp or explicitly tagged with "Test <timestamp>"
  const testPostsQuery = {
    $or: [
      { title: { $regex: /Test \d{10,}/i } },
      { title: { $regex: /Confidential Dossier Gated \d{10,}/i } },
      { title: { $regex: /Global Economic Summit \d{10,}/i } },
      { slug: { $regex: /-test-\d{10,}/i } },
      { slug: { $regex: /-gated-\d{10,}/i } }
    ]
  };
  const testPosts = await Post.find(testPostsQuery).select('_id title slug status').lean();
  const testPostIds = testPosts.map((p) => p._id);

  // 3. Identify Engagements tied to either test users or test posts
  const testComments = await Comment.find({
    $or: [
      { user: { $in: testUserIds } },
      { post: { $in: testPostIds } }
    ]
  }).select('_id').lean();

  const testLikes = await Like.find({
    $or: [
      { user: { $in: testUserIds } },
      { post: { $in: testPostIds } }
    ]
  }).select('_id').lean();

  const testBookmarks = await Bookmark.find({
    $or: [
      { user: { $in: testUserIds } },
      { post: { $in: testPostIds } }
    ]
  }).select('_id').lean();

  const testPollVotes = await PollVote.find({
    $or: [
      { user: { $in: testUserIds } },
      { post: { $in: testPostIds } }
    ]
  }).select('_id').lean();

  // 4. Verify Legitimate Records
  const [adminCount, catCount, tagCount, langCount, legitPostCount, mediaCount] = await Promise.all([
    User.countDocuments({ role: 'admin' }),
    Category.countDocuments({}),
    Tag.countDocuments({}),
    Language.countDocuments({}),
    Post.countDocuments({ _id: { $nin: testPostIds } }),
    Media.countDocuments({})
  ]);

  // 5. Inspect Indexes across active collections
  const indexReport: Record<string, any[]> = {};
  const collections = ['users', 'posts', 'comments', 'likes', 'bookmarks', 'pollvotes', 'categories', 'tags', 'languages', 'media'];
  for (const collName of collections) {
    try {
      const coll = mongoose.connection.collection(collName);
      const indexes = await coll.indexes();
      indexReport[collName] = indexes.map((idx) => ({ name: idx.name, key: idx.key, unique: Boolean(idx.unique) }));
    } catch {
      indexReport[collName] = [];
    }
  }

  const report: AuditReport = {
    mode: applyChanges ? 'APPLY' : 'DRY_RUN',
    totalLegitimate: {
      admin: adminCount,
      categories: catCount,
      tags: tagCount,
      languages: langCount,
      editorialPosts: legitPostCount,
      media: mediaCount
    },
    targetedForRemoval: {
      testUsers: { count: testUsers.length, ids: testUserIds.map((id) => id.toString()), emails: testUsers.map((u) => u.email) },
      testPosts: { count: testPosts.length, ids: testPostIds.map((id) => id.toString()), titles: testPosts.map((p) => p.title) },
      testComments: { count: testComments.length, ids: testComments.map((c) => c._id.toString()) },
      testLikes: { count: testLikes.length, ids: testLikes.map((l) => l._id.toString()) },
      testBookmarks: { count: testBookmarks.length, ids: testBookmarks.map((b) => b._id.toString()) },
      testPollVotes: { count: testPollVotes.length, ids: testPollVotes.map((v) => v._id.toString()) }
    },
    indexes: indexReport
  };

  console.log('--- LEGITIMATE ASSETS PRESERVED ---');
  console.log(`Admin accounts: ${adminCount}`);
  console.log(`Categories: ${catCount}`);
  console.log(`Tags: ${tagCount}`);
  console.log(`Languages: ${langCount}`);
  console.log(`Legitimate Editorial Posts: ${legitPostCount}`);
  console.log(`Media Library Records: ${mediaCount}\n`);

  console.log('--- TARGETED TEST ARTIFACTS ---');
  console.log(`Test Users: ${report.targetedForRemoval.testUsers.count}`);
  console.log(`Test Posts: ${report.targetedForRemoval.testPosts.count}`);
  console.log(`Test Comments: ${report.targetedForRemoval.testComments.count}`);
  console.log(`Test Likes: ${report.targetedForRemoval.testLikes.count}`);
  console.log(`Test Bookmarks: ${report.targetedForRemoval.testBookmarks.count}`);
  console.log(`Test Poll Votes: ${report.targetedForRemoval.testPollVotes.count}\n`);

  if (applyChanges) {
    console.log('Executing deletion of identified test records...');
    if (testUsers.length > 0) await User.deleteMany({ _id: { $in: testUserIds } });
    if (testPosts.length > 0) await Post.deleteMany({ _id: { $in: testPostIds } });
    if (testComments.length > 0) await Comment.deleteMany({ _id: { $in: testComments.map((c) => c._id) } });
    if (testLikes.length > 0) await Like.deleteMany({ _id: { $in: testLikes.map((l) => l._id) } });
    if (testBookmarks.length > 0) await Bookmark.deleteMany({ _id: { $in: testBookmarks.map((b) => b._id) } });
    if (testPollVotes.length > 0) await PollVote.deleteMany({ _id: { $in: testPollVotes.map((v) => v._id) } });
    console.log('Deletion complete. Production dataset verified and cleaned.');
  } else {
    console.log('DRY RUN COMPLETE — No records were modified.');
  }

  return report;
}

// CLI Execution
const isApply = process.argv.includes('--apply');
auditAndCleanDatabase(isApply)
  .then(async () => {
    await mongoose.connection.close();
    process.exit(0);
  })
  .catch((err) => {
    console.error('Audit failed:', err);
    process.exit(1);
  });
