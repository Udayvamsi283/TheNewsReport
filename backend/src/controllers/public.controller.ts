import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { Post, IPost } from '../models/post.model.js';
import { Category } from '../models/category.model.js';
import { Language } from '../models/language.model.js';
import { Like } from '../models/like.model.js';
import { Bookmark } from '../models/bookmark.model.js';
import { PollVote } from '../models/pollVote.model.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

// In-memory sliding-window view throttling: Map<token, timestamp>
// In-memory view deduplication is intentionally best-effort for the MVP and is not globally consistent across multiple backend instances.
const viewThrottler = new Map<string, number>();
const VIEW_THROTTLE_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const ROTATING_SALT = crypto.randomBytes(16).toString('hex');

// Periodic purge of expired tokens every 5 minutes
setInterval(() => {
  const cutoff = Date.now() - VIEW_THROTTLE_WINDOW_MS;
  for (const [key, timestamp] of viewThrottler.entries()) {
    if (timestamp < cutoff) {
      viewThrottler.delete(key);
    }
  }
}, 5 * 60 * 1000);

// ==========================================
// 1. HOMEPAGE AGGREGATION
// ==========================================

export const localizePost = (post: any, targetLang?: string): any => {
  if (!post) return post;
  const pObj = typeof post.toObject === 'function' ? post.toObject() : { ...post };
  if (!targetLang || targetLang === 'en' || !Array.isArray(pObj.translations)) {
    return pObj;
  }
  const match = pObj.translations.find(
    (t: any) => t.languageCode?.toLowerCase() === targetLang.toLowerCase()
  );
  if (match) {
    if (match.title) pObj.title = match.title;
    if (match.summary) pObj.summary = match.summary;
    if (match.slug) pObj.slug = match.slug;
  }
  return pObj;
};

export const getHomepageData = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const now = new Date();
    const publishedQuery = { status: 'published', publishedAt: { $lte: now } };
    const targetLang = ((req.query.lang as string) || '').toLowerCase().trim();

    // 1. Fetch hero story (explicitly featured first, else latest published)
    let heroStory: any = await Post.findOne({
      ...publishedQuery,
      isFeatured: true
    })
      .sort({ publishedAt: -1 })
      .populate('category', 'name slug')
      .populate('language', 'name code')
      .populate('author', 'name avatar')
      .select('title slug summary featuredImage category language author publishedAt postFormat readingTime views likeCount commentCount isFullWidth isFeatured translations');

    if (!heroStory) {
      heroStory = await Post.findOne(publishedQuery)
        .sort({ publishedAt: -1 })
        .populate('category', 'name slug')
        .populate('language', 'name code')
        .populate('author', 'name avatar')
        .select('title slug summary featuredImage category language author publishedAt postFormat readingTime views likeCount commentCount isFullWidth isFeatured translations');
    }

    const heroId = heroStory?._id;

    // Fetch secondary featured stories (excluding hero)
    const secondaryFeaturedRaw = await Post.find({
      ...publishedQuery,
      ...(heroId ? { _id: { $ne: heroId } } : {})
    })
      .sort({ isFeatured: -1, publishedAt: -1 })
      .limit(2)
      .populate('category', 'name slug')
      .populate('language', 'name code')
      .populate('author', 'name avatar')
      .select('title slug summary featuredImage category language author publishedAt postFormat readingTime views likeCount commentCount isFullWidth isFeatured translations');

    const excludedIds = [heroId, ...secondaryFeaturedRaw.map((p) => p._id)].filter(Boolean);

    // 2. Latest news stories (excluding hero and secondary featured)
    const latestPostsRaw = await Post.find({
      ...publishedQuery,
      ...(excludedIds.length > 0 ? { _id: { $nin: excludedIds } } : {})
    })
      .sort({ publishedAt: -1 })
      .limit(8)
      .populate('category', 'name slug')
      .populate('language', 'name code')
      .select('title slug summary featuredImage category language publishedAt postFormat views likeCount commentCount translations');

    // 3. 7-Day Trending Window
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    let trendingPostsRaw: any[] = await Post.find({
      ...publishedQuery,
      publishedAt: { $gte: sevenDaysAgo, $lte: now }
    })
      .sort({ views: -1, likeCount: -1, publishedAt: -1 })
      .limit(5)
      .populate('category', 'name slug')
      .select('title slug summary featuredImage category publishedAt views likeCount commentCount postFormat translations');

    // Fallback if sparse
    if (trendingPostsRaw.length < 3) {
      trendingPostsRaw = await Post.find(publishedQuery)
        .sort({ views: -1, publishedAt: -1 })
        .limit(5)
        .populate('category', 'name slug')
        .select('title slug summary featuredImage category publishedAt views likeCount commentCount postFormat translations');
    }

    // 4. Video Showcase
    const featuredVideo = await Post.findOne({
      ...publishedQuery,
      postFormat: 'video'
    })
      .sort({ publishedAt: -1 })
      .populate('category', 'name slug')
      .select('title slug summary featuredImage videoDetails category publishedAt postFormat translations');

    // 5. Category Showcases (Top active categories with up to 4 articles each)
    const activeCategories = await Category.find({ parent: null }).limit(4);
    const categorySections = await Promise.all(
      activeCategories.map(async (cat) => {
        const posts = await Post.find({
          ...publishedQuery,
          category: cat._id
        })
          .sort({ publishedAt: -1 })
          .limit(4)
          .select('title slug summary featuredImage publishedAt postFormat readingTime views likeCount translations');
        return {
          category: { _id: cat._id, name: cat.name, slug: cat.slug },
          posts: posts.map((p) => localizePost(p, targetLang))
        };
      })
    );

    // Filter out categories with 0 posts
    const nonEmptySections = categorySections.filter((sec) => sec.posts.length > 0);

    // 6. Breaking News (published posts explicitly marked as breaking news)
    const breakingPost = await Post.findOne({
      ...publishedQuery,
      isBreaking: true
    })
      .sort({ publishedAt: -1 })
      .select('title slug category publishedAt translations');

    const localizedHero = localizePost(heroStory, targetLang);
    const localizedSecondary = secondaryFeaturedRaw.map((p) => localizePost(p, targetLang));
    const localizedLatest = latestPostsRaw.map((p) => localizePost(p, targetLang));
    const localizedTrending = trendingPostsRaw.map((p) => localizePost(p, targetLang));
    const localizedBreaking = breakingPost ? localizePost(breakingPost, targetLang) : null;
    const localizedVideo = featuredVideo ? localizePost(featuredVideo, targetLang) : null;

    res.status(200).json({
      success: true,
      data: {
        breaking: localizedBreaking ? { title: localizedBreaking.title, slug: localizedBreaking.slug } : null,
        heroStory: localizedHero,
        secondaryFeatured: localizedSecondary,
        latestPosts: localizedLatest,
        trendingPosts: localizedTrending,
        featuredVideo: localizedVideo,
        categorySections: nonEmptySections
      }
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 2. READER FEED & PERSONALIZATION
// ==========================================

export const getFeed = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit as string, 10) || 12, 50);
    const skip = (page - 1) * limit;
    const user = req.user;
    const now = new Date();
    const publishedQuery = { status: 'published', publishedAt: { $lte: now } };

    const targetLang = ((req.query.language || req.query.lang || user?.preferredLanguage || '') as string).toLowerCase().trim();

    // Guest Readers: Purely chronological latest published dispatches
    if (!user) {
      const [total, posts] = await Promise.all([
        Post.countDocuments(publishedQuery),
        Post.find(publishedQuery)
          .sort({ publishedAt: -1 })
          .skip(skip)
          .limit(limit)
          .populate('category', 'name slug')
          .populate('language', 'name code')
          .populate('author', 'name avatar')
          .select('title slug summary featuredImage category language author publishedAt postFormat readingTime views likeCount commentCount translations')
      ]);

      const localizedPosts = posts.map((p) => localizePost(p, targetLang));

      res.status(200).json({
        success: true,
        data: {
          feedType: 'chronological',
          isPersonalized: false,
          posts: localizedPosts,
          pagination: { page, limit, total, pages: Math.ceil(total / limit) }
        }
      });
      return;
    }

    // Authenticated Readers: Deterministic Category + Language + Recency scoring
    const userInterests = (user.interests || []).map((id) => id.toString());
    const userPrefLang = (user.preferredLanguage || 'en').toLowerCase().trim();

    // Query candidate pool from last 14 days
    const poolWindow = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    let candidatePool: any[] = await Post.find({
      ...publishedQuery,
      publishedAt: { $gte: poolWindow, $lte: now }
    })
      .populate('category', 'name slug')
      .populate('language', 'name code')
      .populate('author', 'name avatar')
      .select('title slug summary featuredImage category language author publishedAt postFormat readingTime views likeCount commentCount translations');

    // Fallback if pool is sparse
    if (candidatePool.length < 15) {
      candidatePool = await Post.find(publishedQuery)
        .sort({ publishedAt: -1 })
        .limit(100)
        .populate('category', 'name slug')
        .populate('language', 'name code')
        .populate('author', 'name avatar')
        .select('title slug summary featuredImage category language author publishedAt postFormat readingTime views likeCount commentCount translations');
    }

    // Score candidates deterministically
    const scoredPosts = candidatePool.map((post) => {
      let score = 0;

      // 1. Category Interest Match (+50 points)
      const postCatId = (post.category as any)?._id?.toString() || post.category?.toString();
      if (postCatId && userInterests.includes(postCatId)) {
        score += 50;
      }

      // 2. Language Match (+30 points for primary or translated version)
      const effectiveLang = targetLang || userPrefLang;
      const postLangCode = (post.language as any)?.code?.toLowerCase();
      const hasTranslation = (post.translations || []).some(
        (t: any) => t.languageCode?.toLowerCase() === effectiveLang
      );

      if (postLangCode === effectiveLang || hasTranslation) {
        score += 30;
      } else if (postLangCode === 'en') {
        score += 10; // Platform default fallback
      }

      // 3. Recency Decay (+20 <= 24h, +10 <= 3d, +5 <= 7d)
      if (post.publishedAt) {
        const ageHours = (now.getTime() - new Date(post.publishedAt).getTime()) / (1000 * 60 * 60);
        if (ageHours <= 24) score += 20;
        else if (ageHours <= 72) score += 10;
        else if (ageHours <= 168) score += 5;
      }

      return { post, score };
    });

    // Sort by Score DESC, then publishedAt DESC
    scoredPosts.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return new Date(b.post.publishedAt || 0).getTime() - new Date(a.post.publishedAt || 0).getTime();
    });

    const total = scoredPosts.length;
    const paginatedPosts = scoredPosts
      .slice(skip, skip + limit)
      .map((item) => localizePost(item.post, targetLang));

    res.status(200).json({
      success: true,
      data: {
        feedType: 'personalized',
        isPersonalized: true,
        posts: paginatedPosts,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) }
      }
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 3. ARTICLE DISPATCH BY SLUG (With Server-Side Gating)
// ==========================================

export const getPostBySlug = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const rawSlug = req.params.slug;
    const slug = (typeof rawSlug === 'string' ? rawSlug : '').toLowerCase().trim();
    const now = new Date();

    // 1. Locate published post by canonical slug or translation slug
    const post = await Post.findOne({
      $or: [{ slug }, { 'translations.slug': slug }],
      status: 'published',
      publishedAt: { $lte: now }
    })
      .populate('category', 'name slug description')
      .populate('tags', 'name slug')
      .populate('language', 'name code')
      .populate('author', 'name avatar');

    if (!post) {
      res.status(404).json({ success: false, message: 'Article not found or unpublished.' });
      return;
    }

    // 2. SERVER-SIDE GATED CONTENT PROTECTION
    // If registeredOnly === true and user is unauthenticated, NEVER transmit article content to client!
    const isAuthenticated = Boolean(req.user);
    if (post.registeredOnly && !isAuthenticated) {
      const gatedData = {
        _id: post._id,
        title: post.title,
        slug: post.slug,
        summary: post.summary,
        featuredImage: post.featuredImage,
        category: post.category,
        author: post.author,
        publishedAt: post.publishedAt,
        postFormat: post.postFormat,
        readingTime: (post as any).readingTime,
        registeredOnly: true,
        isGated: true
      };
      res.status(200).json({
        success: true,
        data: {
          ...gatedData,
          post: gatedData,
          isGated: true
        }
      });
      return;
    }

    // 3. Multilingual Translation Auto-Selection
    // Check if client requested a localized version or reader prefers translation
    const rawLang = req.query.lang;
    const langQueryStr = typeof rawLang === 'string' ? rawLang : '';
    const userPrefLang = (langQueryStr || req.user?.preferredLanguage || '').toLowerCase().trim();
    let displayTitle = post.title;
    let displaySummary = post.summary;
    let displayContent = post.content;
    let displaySeo = post.seo;
    let activeLanguageCode = (post.language as any)?.code || 'en';

    if (userPrefLang) {
      const matchingTranslation = post.translations?.find(
        (t) => t.languageCode.toLowerCase() === userPrefLang || t.slug === slug
      );
      if (matchingTranslation) {
        displayTitle = matchingTranslation.title;
        displaySummary = matchingTranslation.summary || displaySummary;
        displayContent = matchingTranslation.content || displayContent;
        displaySeo = matchingTranslation.seo || displaySeo;
        activeLanguageCode = matchingTranslation.languageCode;
      }
    }

    // 4. Reader Engagement States (if authenticated)
    let isLikedByUser = false;
    let isBookmarkedByUser = false;
    let userVotedOptionId: string | null = null;

    if (isAuthenticated) {
      const [likeDoc, bookmarkDoc, voteDoc] = await Promise.all([
        Like.findOne({ user: req.user!._id, post: post._id }),
        Bookmark.findOne({ user: req.user!._id, post: post._id }),
        post.postFormat === 'poll'
          ? PollVote.findOne({ pollPost: post._id, user: req.user!._id })
          : Promise.resolve(null)
      ]);

      isLikedByUser = Boolean(likeDoc);
      isBookmarkedByUser = Boolean(bookmarkDoc);
      if (voteDoc) userVotedOptionId = voteDoc.optionId;
    }

    // 5. Related Articles with Priority:
    // Selection priority:
    // 1. Same category and overlapping tags
    // 2. Same category
    // 3. Other relevant recent published stories
    const currentTagIds = (post.tags || []).map((t: any) =>
      (typeof t === 'object' && t._id ? t._id.toString() : t.toString())
    );
    const categoryId = (post.category as any)?._id?.toString() || post.category?.toString();

    const candidateRelated = await Post.find({
      status: 'published',
      publishedAt: { $lte: now },
      _id: { $ne: post._id }
    })
      .populate('category', 'name slug')
      .populate('tags', 'name slug')
      .populate('language', 'name code')
      .populate('author', 'name avatar')
      .select('title slug summary featuredImage category tags language author publishedAt postFormat readingTime translations')
      .limit(30);

    const scoredRelated = candidateRelated.map((p) => {
      const pCatId = (p.category as any)?._id?.toString() || p.category?.toString();
      const isSameCategory = Boolean(categoryId && pCatId === categoryId);
      const pTagIds = (p.tags || []).map((t: any) =>
        (typeof t === 'object' && t._id ? t._id.toString() : t.toString())
      );
      const overlappingTagCount = pTagIds.filter((id) => currentTagIds.includes(id)).length;

      let score = 0;
      if (isSameCategory && overlappingTagCount > 0) {
        score = 100 + overlappingTagCount * 10;
      } else if (isSameCategory) {
        score = 50;
      } else if (overlappingTagCount > 0) {
        score = 25 + overlappingTagCount * 5;
      } else {
        score = 10;
      }
      return { post: p, score };
    });

    scoredRelated.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      const bTime = b.post.publishedAt ? new Date(b.post.publishedAt).getTime() : 0;
      const aTime = a.post.publishedAt ? new Date(a.post.publishedAt).getTime() : 0;
      return bTime - aTime;
    });

    const localizedRelated = scoredRelated
      .slice(0, 4)
      .map(({ post: p }) => localizePost(p, userPrefLang));

    // 6. Chronological Previous / Next Article Navigation (ordered by publishedAt)
    const [prevPostDoc, nextPostDoc] = await Promise.all([
      Post.findOne({
        status: 'published',
        publishedAt: { $lt: post.publishedAt }
      })
        .sort({ publishedAt: -1 })
        .populate('category', 'name slug')
        .populate('language', 'name code')
        .select('title slug summary featuredImage category language publishedAt translations postFormat readingTime'),
      Post.findOne({
        status: 'published',
        publishedAt: { $gt: post.publishedAt, $lte: now }
      })
        .sort({ publishedAt: 1 })
        .populate('category', 'name slug')
        .populate('language', 'name code')
        .select('title slug summary featuredImage category language publishedAt translations postFormat readingTime')
    ]);

    const prevPost = prevPostDoc ? localizePost(prevPostDoc, userPrefLang) : null;
    const nextPost = nextPostDoc ? localizePost(nextPostDoc, userPrefLang) : null;

    // 7. Available Translations Manifest
    const availableTranslations = (post.translations || []).map((t) => ({
      languageCode: t.languageCode,
      title: t.title,
      slug: t.slug
    }));

    const postData = {
      _id: post._id,
      title: displayTitle,
      slug: post.slug,
      summary: displaySummary,
      content: displayContent,
      author: post.author,
      category: post.category,
      tags: post.tags,
      language: post.language,
      activeLanguageCode,
      availableTranslations,
      translations: post.translations || [],
      postFormat: post.postFormat,
      featuredImage: post.featuredImage,
      images: post.images,
      publishedAt: post.publishedAt,
      isFullWidth: post.isFullWidth,
      registeredOnly: post.registeredOnly,
      isGated: false,
      externalUrl: post.externalUrl,
      seo: displaySeo,
      faq: post.faq,
      galleryItems: post.galleryItems,
      sortedListItems: post.sortedListItems,
      videoDetails: post.videoDetails,
      audioDetails: post.audioDetails,
      pollDetails: post.pollDetails,
      eventDetails: post.eventDetails,
      views: post.views || 0,
      likeCount: post.likeCount || 0,
      commentCount: post.commentCount || 0,
      isLiked: isLikedByUser,
      isSaved: isBookmarkedByUser,
      isBookmarked: isBookmarkedByUser,
      isLikedByUser,
      isBookmarkedByUser,
      userVotedOptionId
    };

    res.status(200).json({
      success: true,
      data: {
        ...postData,
        post: postData,
        isGated: false,
        isLiked: isLikedByUser,
        isSaved: isBookmarkedByUser,
        isBookmarked: isBookmarkedByUser,
        relatedPosts: localizedRelated,
        prevPost,
        nextPost
      }
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 4. VIEW COUNTING (Throttled & Non-PII)
// ==========================================

export const recordView = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const postId = req.params.id;

    // Create an anonymous hashed token without storing raw IP address
    const clientSignature = `${req.headers['user-agent'] || ''}:${req.headers['accept-language'] || ''}:${postId}:${ROTATING_SALT}`;
    const token = crypto.createHash('sha256').update(clientSignature).digest('hex');

    const lastSeen = viewThrottler.get(token);
    const now = Date.now();

    // Throttled: limit 1 increment per 10 minutes per client token
    if (lastSeen && now - lastSeen < VIEW_THROTTLE_WINDOW_MS) {
      res.status(200).json({ success: true, message: 'View throttled.', counted: false });
      return;
    }

    viewThrottler.set(token, now);

    // Atomically increment view count on published post
    const updatedPost = await Post.findOneAndUpdate(
      { _id: postId, status: 'published' },
      { $inc: { views: 1 } },
      { new: true, select: 'views' }
    );

    res.status(200).json({
      success: true,
      message: 'View counted.',
      counted: true,
      views: updatedPost?.views ?? 1
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 5. 7-DAY TRENDING DISPATCHES
// ==========================================

export const getTrendingPosts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string, 10) || 10, 30);
    const now = new Date();
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const publishedQuery = {
      status: 'published',
      publishedAt: { $gte: sevenDaysAgo, $lte: now }
    };

    const targetLang = ((req.query.lang as string) || '').toLowerCase().trim();

    // Retrieve pool of posts from last 7 days
    let pool: any[] = await Post.find(publishedQuery)
      .populate('category', 'name slug')
      .populate('language', 'name code')
      .select('title slug summary featuredImage category language publishedAt postFormat views likeCount commentCount translations');

    // Fallback to recent published posts if fewer than 5 exist in the 7-day window
    if (pool.length < 5) {
      pool = await Post.find({ status: 'published', publishedAt: { $lte: now } })
        .sort({ publishedAt: -1 })
        .limit(20)
        .populate('category', 'name slug')
        .populate('language', 'name code')
        .select('title slug summary featuredImage category language publishedAt postFormat views likeCount commentCount translations');
    }

    // Rank via formula: (views * 1.0) + (likeCount * 3.0) + (commentCount * 5.0) + recencyBoost
    const scoredTrending = pool.map((post) => {
      const views = post.views || 0;
      const likes = post.likeCount || 0;
      const comments = post.commentCount || 0;

      let recencyBoost = 0;
      if (post.publishedAt) {
        const ageHours = (now.getTime() - new Date(post.publishedAt).getTime()) / (1000 * 60 * 60);
        if (ageHours <= 24) recencyBoost = 40;
        else if (ageHours <= 48) recencyBoost = 20;
        else if (ageHours <= 168) recencyBoost = 5;
      }

      const score = views * 1.0 + likes * 3.0 + comments * 5.0 + recencyBoost;
      return { post, score };
    });

    scoredTrending.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return new Date(b.post.publishedAt || 0).getTime() - new Date(a.post.publishedAt || 0).getTime();
    });

    const posts = scoredTrending.slice(0, limit).map((item) => {
      const p = item.post;
      const pObj = typeof p.toObject === 'function' ? p.toObject() : { ...p };
      if (targetLang && targetLang !== 'en' && Array.isArray(pObj.translations)) {
        const match = pObj.translations.find((t: any) => t.languageCode?.toLowerCase() === targetLang);
        if (match) {
          if (match.title) pObj.title = match.title;
          if (match.summary) pObj.summary = match.summary;
          if (match.slug) pObj.slug = match.slug;
        }
      }
      return pObj;
    });

    res.status(200).json({
      success: true,
      data: {
        window: '7-days',
        posts
      }
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 6. CATEGORY ARCHIVES (Supports nested)
// ==========================================

export const getCategoryPosts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const rawSlug = req.params.slug;
    const slug = (typeof rawSlug === 'string' ? rawSlug : '').toLowerCase().trim();
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit as string, 10) || 12, 50);
    const skip = (page - 1) * limit;

    const category = await Category.findOne({ slug });
    if (!category) {
      res.status(404).json({ success: false, message: 'Category not found.' });
      return;
    }

    // Find any children (e.g. subcategories under Regional)
    const childCategories = await Category.find({ parent: category._id });
    const categoryIds = [category._id, ...childCategories.map((c) => c._id)];

    const now = new Date();
    const query = {
      status: 'published',
      publishedAt: { $lte: now },
      category: { $in: categoryIds }
    };

    const targetLang = ((req.query.lang as string) || '').toLowerCase().trim();

    const [total, posts] = await Promise.all([
      Post.countDocuments(query),
      Post.find(query)
        .sort({ publishedAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('category', 'name slug')
        .populate('language', 'name code')
        .populate('author', 'name avatar')
        .select('title slug summary featuredImage category language author publishedAt postFormat readingTime views likeCount commentCount translations')
    ]);

    const localizedPosts = posts.map((p) => localizePost(p, targetLang));

    res.status(200).json({
      success: true,
      data: {
        category: {
          _id: category._id,
          name: category.name,
          slug: category.slug,
          description: category.description
        },
        posts: localizedPosts,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) }
      }
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 7. LATEST CHRONOLOGICAL WIRE
// ==========================================

export const getLatestPosts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit as string, 10) || 12, 50);
    const skip = (page - 1) * limit;
    const { category, language } = req.query;
    const targetLang = ((req.query.lang as string) || (typeof language === 'string' ? language : '')).toLowerCase().trim();

    const now = new Date();
    const query: any = { status: 'published', publishedAt: { $lte: now } };

    if (category && typeof category === 'string') {
      const cat = await Category.findOne({ slug: category.toLowerCase() });
      if (cat) query.category = cat._id;
    }

    if (language && typeof language === 'string') {
      const lang = await Language.findOne({ code: language.toLowerCase() });
      if (lang) query.language = lang._id;
    }

    const [total, posts] = await Promise.all([
      Post.countDocuments(query),
      Post.find(query)
        .sort({ publishedAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('category', 'name slug')
        .populate('language', 'name code')
        .populate('author', 'name avatar')
        .select('title slug summary featuredImage category language author publishedAt postFormat readingTime views likeCount commentCount translations')
    ]);

    const localizedPosts = posts.map((p) => localizePost(p, targetLang));

    res.status(200).json({
      success: true,
      data: {
        posts: localizedPosts,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) }
      }
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 8. VIDEO REPORTS
// ==========================================

export const getVideoPosts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit as string, 10) || 12, 30);
    const skip = (page - 1) * limit;

    const now = new Date();
    const query = {
      status: 'published',
      publishedAt: { $lte: now },
      postFormat: 'video'
    };

    const [total, posts] = await Promise.all([
      Post.countDocuments(query),
      Post.find(query)
        .sort({ publishedAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('category', 'name slug')
        .select('title slug summary featuredImage videoDetails category publishedAt postFormat views likeCount')
    ]);

    res.status(200).json({
      success: true,
      data: {
        posts,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) }
      }
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 9. PUBLIC SEARCH (Text-Indexed & Query-Bounded)
// ==========================================

export const searchPosts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const rawQuery = (req.query.q as string || '').trim();
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit as string, 10) || 12, 50);
    const skip = (page - 1) * limit;

    // Bound query to prevent expensive regex/DoS
    const searchQuery = rawQuery.substring(0, 100);

    if (!searchQuery) {
      res.status(200).json({
        success: true,
        data: {
          posts: [],
          query: '',
          pagination: { page, limit, total: 0, pages: 0 }
        }
      });
      return;
    }

    const now = new Date();
    const baseQuery: any = {
      status: 'published',
      publishedAt: { $lte: now },
      $text: { $search: searchQuery }
    };

    if (req.query.category) {
      const cat = await Category.findOne({ slug: (req.query.category as string).toLowerCase() });
      if (cat) baseQuery.category = cat._id;
    }

    const [total, posts] = await Promise.all([
      Post.countDocuments(baseQuery),
      Post.find(baseQuery, { score: { $meta: 'textScore' } })
        .sort({ score: { $meta: 'textScore' }, publishedAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('category', 'name slug')
        .populate('language', 'name code')
        .populate('author', 'name avatar')
        .select('title slug summary featuredImage category language author publishedAt postFormat readingTime views likeCount commentCount')
    ]);

    res.status(200).json({
      success: true,
      data: {
        posts,
        query: searchQuery,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) }
      }
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 11. DYNAMIC XML SITEMAP GENERATOR
// ==========================================

export const getSitemap = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const clientBaseUrl = (env.CLIENT_URL.split(',')[0] || 'http://localhost:5173').trim().replace(/\/$/, '');
    const now = new Date();

    const [posts, categories] = await Promise.all([
      Post.find({
        status: 'published',
        registeredOnly: false,
        publishedAt: { $lte: now }
      })
        .select('slug updatedAt publishedAt')
        .sort({ publishedAt: -1 })
        .limit(1000)
        .lean(),
      Category.find({ isActive: true })
        .select('slug updatedAt')
        .limit(100)
        .lean()
    ]);

    const staticRoutes = [
      { path: '', changefreq: 'hourly', priority: '1.0' },
      { path: '/latest', changefreq: 'always', priority: '0.9' },
      { path: '/trending', changefreq: 'hourly', priority: '0.8' },
      { path: '/videos', changefreq: 'daily', priority: '0.7' }
    ];

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    // Static pages
    for (const route of staticRoutes) {
      xml += '  <url>\n';
      xml += `    <loc>${clientBaseUrl}${route.path}</loc>\n`;
      xml += `    <lastmod>${now.toISOString().split('T')[0]}</lastmod>\n`;
      xml += `    <changefreq>${route.changefreq}</changefreq>\n`;
      xml += `    <priority>${route.priority}</priority>\n`;
      xml += '  </url>\n';
    }

    // Categories
    for (const cat of categories) {
      const lastmod = (cat.updatedAt ? new Date(cat.updatedAt) : now).toISOString().split('T')[0];
      xml += '  <url>\n';
      xml += `    <loc>${clientBaseUrl}/category/${cat.slug}</loc>\n`;
      xml += `    <lastmod>${lastmod}</lastmod>\n`;
      xml += '    <changefreq>daily</changefreq>\n';
      xml += '    <priority>0.8</priority>\n';
      xml += '  </url>\n';
    }

    // Published public posts (no drafts, no registered-only)
    for (const post of posts) {
      const lastmod = (post.updatedAt ? new Date(post.updatedAt) : (post.publishedAt ? new Date(post.publishedAt) : now)).toISOString().split('T')[0];
      xml += '  <url>\n';
      xml += `    <loc>${clientBaseUrl}/article/${post.slug}</loc>\n`;
      xml += `    <lastmod>${lastmod}</lastmod>\n`;
      xml += '    <changefreq>weekly</changefreq>\n';
      xml += '    <priority>0.7</priority>\n';
      xml += '  </url>\n';
    }

    xml += '</urlset>';

    res.header('Content-Type', 'application/xml');
    res.status(200).send(xml);
  } catch (error) {
    next(error);
  }
};

