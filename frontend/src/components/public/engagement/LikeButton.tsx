import React, { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../../hooks/useAuth';
import { apiClient } from '../../../services/apiClient';
import { Heart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface LikeButtonProps {
  postId: string;
  initialLikeCount?: number;
  initialIsLiked?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const LikeButton: React.FC<LikeButtonProps> = ({
  postId,
  initialLikeCount = 0,
  initialIsLiked = false,
  size = 'md'
}) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [isLiked, setIsLiked] = useState<boolean>(initialIsLiked);
  const [likeCount, setLikeCount] = useState<number>(initialLikeCount);
  const [loading, setLoading] = useState<boolean>(false);

  // Synchronize state when props change (e.g. on auth change, navigation, or data fetch)
  useEffect(() => {
    setIsLiked(Boolean(initialIsLiked));
  }, [initialIsLiked]);

  useEffect(() => {
    setLikeCount(initialLikeCount || 0);
  }, [initialLikeCount]);

  const handleToggleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      navigate('/login');
      return;
    }

    if (loading) return;

    // Optimistic state update
    const prevLiked = isLiked;
    const prevCount = likeCount;

    const nextLiked = !prevLiked;
    const nextCount = nextLiked ? prevCount + 1 : Math.max(0, prevCount - 1);

    setIsLiked(nextLiked);
    setLikeCount(nextCount);
    setLoading(true);

    try {
      if (nextLiked) {
        const res = await apiClient.likePost(postId);
        setLikeCount(res.likeCount);
      } else {
        const res = await apiClient.unlikePost(postId);
        setLikeCount(res.likeCount);
      }
      queryClient.invalidateQueries({ queryKey: ['public', 'post'] });
      queryClient.invalidateQueries({ queryKey: ['user', 'likes'] });
    } catch (err) {
      // Revert optimistic update on failure
      setIsLiked(prevLiked);
      setLikeCount(prevCount);
    } finally {
      setLoading(false);
    }
  };

  const sizeClasses = {
    sm: 'px-2.5 py-1 text-xs gap-1.5',
    md: 'px-3.5 py-2 text-sm gap-2',
    lg: 'px-4 py-2.5 text-base gap-2.5'
  };

  const iconSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  return (
    <button
      type="button"
      onClick={handleToggleLike}
      disabled={loading}
      aria-label={isLiked ? 'Unlike article' : 'Like article'}
      className={`inline-flex items-center rounded-full font-medium transition-all duration-200 border ${sizeClasses[size]} ${
        isLiked
          ? 'bg-red-50 text-red-600 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900/60 shadow-sm'
          : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50 hover:text-gray-900 dark:bg-gray-900 dark:text-gray-300 dark:border-gray-800 dark:hover:bg-gray-800 dark:hover:text-white'
      }`}
    >
      <Heart
        className={`${iconSizes[size]} transition-transform active:scale-125 ${
          isLiked ? 'fill-red-600 dark:fill-red-400 stroke-red-600 dark:stroke-red-400' : 'stroke-current'
        }`}
      />
      <span className="tabular-nums font-semibold">{likeCount.toLocaleString()}</span>
    </button>
  );
};
