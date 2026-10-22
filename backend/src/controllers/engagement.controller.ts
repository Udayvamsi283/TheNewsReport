import { Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import sanitizeHtml from 'sanitize-html';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { Post } from '../models/post.model.js';
import { Like } from '../models/like.model.js';
import { Bookmark } from '../models/bookmark.model.js';
import { Comment } from '../models/comment.model.js';
import { PollVote } from '../models/pollVote.model.js';
import { createCommentSchema, pollVoteSchema } from '../validators/engagement.validator.js';
import { logger } from '../utils/logger.js';

// ==========================================
// 1. ARTICLE LIKES (Idempotent & Race-Safe)
// ==========================================

export const likePost = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const postId = req.params.id;
    const userId = req.user!._id;

    const post = await Post.findOne({ _id: postId, status: 'published' });
    if (!post) {
      res.status(404).json({ success: false, message: 'Article not found or unpublished.' });
      return;
    }

    try {
      // 1. Attempt to create Like record (guaranteed unique by user+post index)
      await Like.create({ user: userId, post: postId });

      // 2. Increment likeCount ONLY when new Like record successfully created
      const updatedPost = await Post.findByIdAndUpdate(
        postId,
        { $inc: { likeCount: 1 } },
        { new: true }
      );

      res.status(200).json({
        success: true,
        message: 'Article liked.',
        data: { isLiked: true, likeCount: updatedPost?.likeCount ?? 1 }
      });
    } catch (err: any) {
      if (err.code === 11000) {
        // Idempotent duplicate request: already liked, return current state without double counting
        const currentPost = await Post.findById(postId);
        res.status(200).json({
          success: true,
          message: 'Article already liked.',
          data: { isLiked: true, likeCount: currentPost?.likeCount ?? 0 }
        });
        return;
      }
      throw err;
    }
  } catch (error) {
    next(error);
  }
};

export const unlikePost = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const postId = req.params.id;
    const userId = req.user!._id;

    // 1. Attempt to find and remove existing Like record
    const deletedLike = await Like.findOneAndDelete({ user: userId, post: postId });

    // 2. Decrement likeCount ONLY if like record actually existed and was removed
    if (deletedLike) {
      await Post.updateOne(
        { _id: postId, likeCount: { $gt: 0 } },
        { $inc: { likeCount: -1 } }
      );
    }

    const currentPost = await Post.findById(postId);
    res.status(200).json({
      success: true,
      message: 'Article unliked.',
      data: { isLiked: false, likeCount: currentPost?.likeCount ?? 0 }
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 2. BOOKMARKS / SAVED ARTICLES
// ==========================================

export const bookmarkPost = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const postId = req.params.id;
    const userId = req.user!._id;

    const post = await Post.findOne({ _id: postId, status: 'published' });
    if (!post) {
      res.status(404).json({ success: false, message: 'Article not found or unpublished.' });
      return;
    }

    try {
      await Bookmark.create({ user: userId, post: postId });
      res.status(200).json({
        success: true,
        message: 'Article saved to bookmarks.',
        data: { isBookmarked: true }
      });
    } catch (err: any) {
      if (err.code === 11000) {
        res.status(200).json({
          success: true,
          message: 'Article already bookmarked.',
          data: { isBookmarked: true }
        });
        return;
      }
      throw err;
    }
  } catch (error) {
    next(error);
  }
};

export const removeBookmark = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const postId = req.params.id;
    const userId = req.user!._id;

    await Bookmark.findOneAndDelete({ user: userId, post: postId });

    res.status(200).json({
      success: true,
      message: 'Article removed from bookmarks.',
      data: { isBookmarked: false }
    });
  } catch (error) {
    next(error);
  }
};

export const getUserBookmarks = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!._id;
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit as string, 10) || 12, 50);
    const skip = (page - 1) * limit;

    const [total, bookmarks] = await Promise.all([
      Bookmark.countDocuments({ user: userId }),
      Bookmark.find({ user: userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate({
          path: 'post',
          select: 'title slug summary featuredImage category language publishedAt postFormat readingTime views likeCount commentCount',
          populate: [
            { path: 'category', select: 'name slug' },
            { path: 'language', select: 'name code' }
          ]
        })
    ]);

    // Filter out posts that may have been trashed or unpublished
    const activePosts = bookmarks
      .map((b) => b.post)
      .filter((p) => Boolean(p));

    res.status(200).json({
      success: true,
      data: {
        bookmarks: activePosts,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getUserLikes = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!._id;
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit as string, 10) || 12, 50);
    const skip = (page - 1) * limit;

    const [total, likes] = await Promise.all([
      Like.countDocuments({ user: userId }),
      Like.find({ user: userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate({
          path: 'post',
          select: 'title slug summary featuredImage category language publishedAt postFormat readingTime views likeCount commentCount',
          populate: [
            { path: 'category', select: 'name slug' },
            { path: 'language', select: 'name code' }
          ]
        })
    ]);

    // Filter out posts that may have been trashed or unpublished
    const activePosts = likes
      .map((l) => l.post)
      .filter((p) => Boolean(p));

    res.status(200).json({
      success: true,
      data: {
        likes: activePosts,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 3. COMMENTS & MODERATION (Invariants preserved)
// ==========================================

export const getComments = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const postId = req.params.id;
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit as string, 10) || 20, 50);
    const skip = (page - 1) * limit;

    const [total, comments] = await Promise.all([
      Comment.countDocuments({ post: postId, status: 'visible' }),
      Comment.find({ post: postId, status: 'visible' })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('user', 'name avatar role')
    ]);

    res.status(200).json({
      success: true,
      data: {
        comments,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

export const createComment = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const postId = req.params.id;
    const userId = req.user!._id;

    const post = await Post.findOne({ _id: postId, status: 'published' });
    if (!post) {
      res.status(404).json({ success: false, message: 'Article not found or unpublished.' });
      return;
    }

    const { content } = createCommentSchema.parse(req.body);

    // Sanitize comment content: strip ALL HTML tags and dangerous scripts
    const sanitizedContent = sanitizeHtml(content, {
      allowedTags: [],
      allowedAttributes: {}
    }).trim();

    if (!sanitizedContent) {
      res.status(400).json({ success: false, message: 'Comment content cannot be empty after sanitization.' });
      return;
    }

    const comment = await Comment.create({
      post: postId,
      user: userId,
      content: sanitizedContent,
      status: 'visible'
    });

    // Atomically increment comment count on post
    const updatedPost = await Post.findByIdAndUpdate(
      postId,
      { $inc: { commentCount: 1 } },
      { new: true }
    );

    await comment.populate('user', 'name avatar role');

    res.status(201).json({
      success: true,
      message: 'Comment posted successfully.',
      data: {
        comment,
        commentCount: updatedPost?.commentCount || 1
      }
    });
  } catch (error) {
    next(error);
  }
};

export const deleteComment = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const commentId = req.params.id;
    const userId = req.user!._id;
    const isAdmin = req.user!.role === 'admin';

    // Find the comment first
    const existingComment = await Comment.findById(commentId);
    if (!existingComment) {
      res.status(404).json({ success: false, message: 'Comment not found.' });
      return;
    }

    // Authorization: only the comment owner or an administrator can delete
    if (!isAdmin && existingComment.user.toString() !== userId.toString()) {
      res.status(403).json({ success: false, message: 'Unauthorized to delete this comment.' });
      return;
    }

    // Atomic State Transition: ONLY transition from 'visible' to 'deleted'
    const transitionedComment = await Comment.findOneAndUpdate(
      { _id: commentId, status: 'visible' },
      { status: 'deleted' },
      { new: true }
    );

    // Decrement counter ONLY if transition from visible to deleted actually occurred
    if (transitionedComment) {
      await Post.updateOne(
        { _id: existingComment.post, commentCount: { $gt: 0 } },
        { $inc: { commentCount: -1 } }
      );
    }

    res.status(200).json({
      success: true,
      message: 'Comment deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/engagement/admin/comments (Admin comment list with pagination and filtering)
 */
export const getAdminComments = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.min(Math.max(1, parseInt(req.query.limit as string, 10) || 20), 50);
    const skip = (page - 1) * limit;
    const status = req.query.status as string;

    const filter: any = {};
    if (status && ['visible', 'hidden', 'deleted'].includes(status)) {
      filter.status = status;
    }

    const [total, comments] = await Promise.all([
      Comment.countDocuments(filter),
      Comment.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('user', 'name email avatar role')
        .populate('post', 'title slug')
    ]);

    res.status(200).json({
      success: true,
      data: {
        comments,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/v1/engagement/admin/comments/:id/status (Admin change comment status)
 */
export const updateCommentStatusByAdmin = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['visible', 'hidden', 'deleted'].includes(status)) {
      res.status(400).json({ success: false, message: 'Invalid comment status. Must be visible, hidden, or deleted.' });
      return;
    }

    const comment = await Comment.findById(id);
    if (!comment) {
      res.status(404).json({ success: false, message: 'Comment not found.' });
      return;
    }

    const previousStatus = comment.status;
    comment.status = status;
    await comment.save();

    // Adjust Post commentCount invariant
    if (previousStatus === 'visible' && status !== 'visible') {
      await Post.updateOne(
        { _id: comment.post, commentCount: { $gt: 0 } },
        { $inc: { commentCount: -1 } }
      );
    } else if (previousStatus !== 'visible' && status === 'visible') {
      await Post.updateOne(
        { _id: comment.post },
        { $inc: { commentCount: 1 } }
      );
    }

    res.status(200).json({
      success: true,
      message: `Comment status updated to ${status}.`,
      data: comment
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 4. POLL VOTING (Atomic MongoDB Transaction)
// ==========================================

export const votePoll = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  const session = await mongoose.startSession();
  try {
    const postId = req.params.id;
    const userId = req.user!._id;
    const { optionId } = pollVoteSchema.parse(req.body);

    const post = await Post.findOne({ _id: postId, status: 'published', postFormat: 'poll' });
    if (!post) {
      res.status(404).json({ success: false, message: 'Poll post not found.' });
      return;
    }

    // Check poll schedule window
    const now = new Date();
    if (post.pollDetails?.startTime && now < new Date(post.pollDetails.startTime)) {
      res.status(400).json({ success: false, message: 'This poll has not opened yet.' });
      return;
    }
    if (post.pollDetails?.endTime && now > new Date(post.pollDetails.endTime)) {
      res.status(400).json({ success: false, message: 'This poll has ended and is closed to voting.' });
      return;
    }

    // Verify option exists on post
    const targetOption = post.pollDetails?.options.find((opt) => opt.id === optionId);
    if (!targetOption) {
      res.status(400).json({ success: false, message: 'Specified poll option does not exist.' });
      return;
    }

    // Execute atomic transaction: PollVote creation + Option vote count increment
    session.startTransaction();

    try {
      // 1. Create PollVote (Unique compound index on pollPost+user will throw if already voted)
      await PollVote.create(
        [{ pollPost: postId, user: userId, optionId }],
        { session }
      );

      // 2. Increment vote count on the selected option atomically
      await Post.updateOne(
        { _id: postId, 'pollDetails.options.id': optionId },
        { $inc: { 'pollDetails.options.$.votes': 1 } },
        { session }
      );

      await session.commitTransaction();
    } catch (txError: any) {
      await session.abortTransaction();
      if (txError.code === 11000) {
        res.status(409).json({ success: false, message: 'You have already submitted a vote for this poll.' });
        return;
      }
      throw txError;
    }

    // Fetch updated results
    const updatedPost = await Post.findById(postId);
    const options = updatedPost?.pollDetails?.options || [];
    const totalVotes = options.reduce((sum, opt) => sum + (opt.votes || 0), 0);

    const results = options.map((opt) => ({
      id: opt.id,
      text: opt.text,
      votes: opt.votes || 0,
      percentage: totalVotes > 0 ? Math.round(((opt.votes || 0) / totalVotes) * 100) : 0
    }));

    res.status(200).json({
      success: true,
      message: 'Vote submitted successfully.',
      data: {
        totalVotes,
        results,
        userVotedOptionId: optionId
      }
    });
  } catch (error) {
    next(error);
  } finally {
    session.endSession();
  }
};

export const getPollResults = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const postId = req.params.id;
    const post = await Post.findOne({ _id: postId, status: 'published', postFormat: 'poll' });
    if (!post) {
      res.status(404).json({ success: false, message: 'Poll post not found.' });
      return;
    }

    const options = post.pollDetails?.options || [];
    const totalVotes = options.reduce((sum, opt) => sum + (opt.votes || 0), 0);

    const results = options.map((opt) => ({
      id: opt.id,
      text: opt.text,
      votes: opt.votes || 0,
      percentage: totalVotes > 0 ? Math.round(((opt.votes || 0) / totalVotes) * 100) : 0
    }));

    // If authenticated, check if user has voted
    let userVotedOptionId: string | null = null;
    if (req.user) {
      const existingVote = await PollVote.findOne({ pollPost: postId, user: req.user._id });
      if (existingVote) {
        userVotedOptionId = existingVote.optionId;
      }
    }

    res.status(200).json({
      success: true,
      data: {
        totalVotes,
        results,
        userVotedOptionId,
        isClosed: Boolean(post.pollDetails?.endTime && new Date() > new Date(post.pollDetails.endTime))
      }
    });
  } catch (error) {
    next(error);
  }
};
