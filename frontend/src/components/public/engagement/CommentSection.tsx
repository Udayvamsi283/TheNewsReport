import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { apiClient } from '../../../services/apiClient';
import { Comment, Pagination } from '../../../types';
import { CommentItem } from './CommentItem';
import { MessageSquare, Send, AlertCircle, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

interface CommentSectionProps {
  postId: string;
  initialCommentCount?: number;
}

export const CommentSection: React.FC<CommentSectionProps> = ({
  postId,
  initialCommentCount = 0
}) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentCount, setCommentCount] = useState<number>(initialCommentCount);
  const [page, setPage] = useState<number>(1);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [newComment, setNewComment] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const fetchComments = useCallback(async (pageNum: number) => {
    try {
      setLoading(true);
      const res = await apiClient.getComments(postId, { page: pageNum, limit: 15 });
      if (pageNum === 1) {
        setComments(res.comments);
      } else {
        setComments((prev) => [...prev, ...res.comments]);
      }
      setPagination(res.pagination);
      setCommentCount(res.pagination.total);
    } catch {
      setError('Failed to load discussion comments.');
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    fetchComments(1);
  }, [fetchComments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || submitting) return;

    if (!user) {
      setError('You must be signed in to post a comment.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await apiClient.createComment(postId, newComment.trim());
      setComments((prev) => [res.comment, ...prev]);
      setCommentCount(res.commentCount);
      setNewComment('');
    } catch (err: any) {
      setError(err?.message || 'Failed to submit comment. Please check rate limits.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await apiClient.deleteComment(commentId);
      setComments((prev) => prev.filter((c) => c._id !== commentId));
      setCommentCount((prev) => Math.max(0, prev - 1));
    } catch (err: any) {
      setError(err?.message || 'Failed to delete comment.');
    }
  };

  const handleLoadMore = () => {
    if (pagination && typeof pagination.pages === 'number' && page < pagination.pages) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchComments(nextPage);
    }
  };

  return (
    <section className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-800">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2 font-serif">
          <MessageSquare className="w-5 h-5 text-primary-600 dark:text-primary-400" />
          <span>Reader Discussion ({commentCount})</span>
        </h3>
      </div>

      {error && (
        <div className="mb-4 p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 flex items-start gap-3 text-sm text-red-700 dark:text-red-300">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Submission Form */}
      {user ? (
        <form onSubmit={handleSubmit} className="mb-8">
          <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-3 shadow-sm focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-transparent transition-all">
            <textarea
              rows={3}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Join the discussion. Civil, constructive discourse is required..."
              maxLength={1000}
              disabled={submitting}
              className="w-full bg-transparent border-0 resize-none text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-0"
            />
            <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-800 text-xs text-gray-400">
              <span>{1000 - newComment.length} characters remaining</span>
              <button
                type="submit"
                disabled={!newComment.trim() || submitting}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg font-medium text-xs text-white bg-primary-600 hover:bg-primary-700 active:scale-95 disabled:opacity-40 disabled:pointer-events-none transition-all shadow-sm"
              >
                {submitting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                <span>Post Comment</span>
              </button>
            </div>
          </div>
        </form>
      ) : (
        <div className="mb-8 p-6 rounded-2xl bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            Sign in to share your perspective and join the discussion.
          </p>
          <Link
            to="/login"
            className="inline-flex items-center justify-center px-5 py-2 rounded-xl text-xs font-semibold text-white bg-primary-600 hover:bg-primary-700 shadow-sm transition-all"
          >
            Sign In to Comment
          </Link>
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-1">
        {loading && page === 1 ? (
          <div className="py-8 text-center text-gray-400 flex items-center justify-center gap-2 text-sm">
            <Loader2 className="w-4 h-4 animate-spin text-primary-600" />
            <span>Loading discussion...</span>
          </div>
        ) : comments.length > 0 ? (
          comments.map((comment) => (
            <CommentItem
              key={comment._id}
              comment={comment}
              currentUserId={user?.id || (user as any)?._id}
              currentUserRole={user?.role}
              onDelete={handleDeleteComment}
            />
          ))
        ) : (
          <div className="py-8 text-center text-gray-400 text-sm italic">
            No comments yet. Be the first to share your thoughts!
          </div>
        )}
      </div>

      {/* Pagination Load More */}
      {pagination && typeof pagination.pages === 'number' && page < pagination.pages && (
        <div className="text-center pt-6">
          <button
            type="button"
            onClick={handleLoadMore}
            disabled={loading}
            className="px-5 py-2 rounded-xl border border-gray-200 dark:border-gray-800 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors shadow-sm"
          >
            {loading ? 'Loading...' : `Load More Comments (${pagination.total - comments.length} left)`}
          </button>
        </div>
      )}
    </section>
  );
};
