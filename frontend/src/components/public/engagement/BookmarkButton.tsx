import React, { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../../hooks/useAuth';
import { apiClient } from '../../../services/apiClient';
import { Bookmark } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface BookmarkButtonProps {
  postId: string;
  initialIsBookmarked?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const BookmarkButton: React.FC<BookmarkButtonProps> = ({
  postId,
  initialIsBookmarked = false,
  size = 'md'
}) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [isBookmarked, setIsBookmarked] = useState<boolean>(initialIsBookmarked);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    setIsBookmarked(Boolean(initialIsBookmarked));
  }, [initialIsBookmarked]);

  const handleToggleBookmark = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      navigate('/login');
      return;
    }

    if (loading) return;

    const prevBookmarked = isBookmarked;
    const nextBookmarked = !prevBookmarked;
    setIsBookmarked(nextBookmarked);
    setLoading(true);

    try {
      if (nextBookmarked) {
        await apiClient.bookmarkPost(postId);
      } else {
        await apiClient.removeBookmark(postId);
      }
      queryClient.invalidateQueries({ queryKey: ['public', 'post'] });
      queryClient.invalidateQueries({ queryKey: ['user', 'bookmarks'] });
    } catch {
      setIsBookmarked(prevBookmarked);
    } finally {
      setLoading(false);
    }
  };

  const sizeClasses = {
    sm: 'p-1.5 text-xs',
    md: 'p-2 text-sm',
    lg: 'p-2.5 text-base'
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  return (
    <button
      type="button"
      onClick={handleToggleBookmark}
      disabled={loading}
      aria-label={isBookmarked ? 'Remove from saved' : 'Save article'}
      title={isBookmarked ? 'Saved to bookmarks' : 'Save for later'}
      className={`rounded-full transition-all duration-200 border flex items-center justify-center ${sizeClasses[size]} ${
        isBookmarked
          ? 'bg-primary-50 text-primary-600 border-primary-200 dark:bg-primary-950/40 dark:text-primary-400 dark:border-primary-900/60 shadow-sm'
          : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:text-gray-900 dark:bg-gray-900 dark:text-gray-400 dark:border-gray-800 dark:hover:bg-gray-800 dark:hover:text-white'
      }`}
    >
      <Bookmark
        className={`${iconSizes[size]} transition-transform active:scale-125 ${
          isBookmarked ? 'fill-primary-600 dark:fill-primary-400 stroke-primary-600 dark:stroke-primary-400' : 'stroke-current'
        }`}
      />
    </button>
  );
};
