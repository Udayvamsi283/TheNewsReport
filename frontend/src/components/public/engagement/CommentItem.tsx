import React, { useState } from 'react';
import { Comment } from '../../../types';
import { Trash2, ShieldCheck } from 'lucide-react';
import { Avatar } from '../../ui/Avatar';

interface CommentItemProps {
  comment: Comment;
  currentUserId?: string;
  currentUserRole?: string;
  onDelete: (commentId: string) => Promise<void>;
}

export const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  currentUserId,
  currentUserRole,
  onDelete
}) => {
  const [deleting, setDeleting] = useState(false);

  const canDelete =
    currentUserId &&
    (currentUserId === comment.user?._id ||
      currentUserRole === 'admin' ||
      currentUserRole === 'editor');

  const handleDelete = async () => {
    if (deleting) return;
    if (window.confirm('Are you sure you want to delete this comment?')) {
      setDeleting(true);
      try {
        await onDelete(comment._id);
      } finally {
        setDeleting(false);
      }
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  if (comment.status === 'deleted') {
    return (
      <div className="py-3 px-4 rounded-xl bg-gray-50 dark:bg-gray-900/50 text-xs italic text-gray-400 border border-dashed border-gray-200 dark:border-gray-800">
        [This comment has been removed by the author or moderator]
      </div>
    );
  }

  const isStaff = comment.user?.role === 'admin' || comment.user?.role === 'editor';

  return (
    <div className="py-4 border-b border-gray-100 dark:border-gray-800/80 last:border-b-0 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar name={comment.user?.name} src={comment.user?.avatar} size="sm" />

          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {comment.user?.name || 'Anonymous Reader'}
              </span>
              {isStaff && (
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-primary-100 text-primary-800 dark:bg-primary-950 dark:text-primary-300">
                  <ShieldCheck className="w-2.5 h-2.5" /> Staff
                </span>
              )}
            </div>
            <time className="text-xs text-gray-400 dark:text-gray-500">
              {formatDate(comment.createdAt)}
            </time>
          </div>
        </div>

        {canDelete && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            title="Delete comment"
            className="text-gray-400 hover:text-red-600 dark:hover:text-red-400 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap pl-11">
        {comment.content}
      </div>
    </div>
  );
};
