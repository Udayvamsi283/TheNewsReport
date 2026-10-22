import React from 'react';
import { Link } from 'react-router-dom';
import { Post } from '../../types';
import { Clock, Eye, Heart, MessageSquare, Lock } from 'lucide-react';
import { ArticleImagePlaceholder } from '../common/ArticleImagePlaceholder';
import { cn } from '../../lib/utils';
import { useLanguage } from '../../context/LanguageContext';

export interface CompactArticleItemProps {
  post: Post;
  rank?: number | string;
  showCategory?: boolean;
  showMeta?: boolean;
  showEngagement?: boolean;
  className?: string;
  imageSize?: 'sm' | 'md' | 'lg';
}

export const CompactArticleItem: React.FC<CompactArticleItemProps> = ({
  post,
  rank,
  showCategory = true,
  showMeta = true,
  showEngagement = false,
  className,
  imageSize = 'md'
}) => {
  const { t, getCategoryName } = useLanguage();
  const categoryName = post.category ? getCategoryName(post.category.slug, post.category.name) : '';
  const imageUrl =
    post.featuredImage?.url ||
    post.images?.[0]?.url ||
    (post.postFormat === 'gallery' && post.galleryItems?.[0]?.image) ||
    '';

  const publishedDate = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric'
      })
    : '';

  const sizeClasses = {
    sm: 'w-16 h-16 sm:w-18 sm:h-18',
    md: 'w-20 h-20 sm:w-24 sm:h-20',
    lg: 'w-24 h-24 sm:w-28 sm:h-24'
  };

  return (
    <div
      className={cn(
        'group flex items-start gap-3.5 py-3 transition-colors rounded-xl',
        className
      )}
    >
      {/* Optional Editorial Rank Number */}
      {rank !== undefined && (
        <span className="flex-shrink-0 w-6 pt-0.5 text-center font-mono font-black text-base sm:text-lg text-slate-300 dark:text-navy-700 group-hover:text-editorial-red transition-colors select-none">
          {typeof rank === 'number' && rank < 10 ? `0${rank}` : rank}
        </span>
      )}

      {/* Article Thumbnail */}
      <Link
        to={`/article/${post.slug}`}
        className={cn(
          'relative flex-shrink-0 rounded-xl overflow-hidden bg-slate-100 dark:bg-navy-800 border border-slate-200/80 dark:border-navy-700/80 shadow-xs focus:outline-none focus-visible:ring-2 focus-visible:ring-editorial-red',
          sizeClasses[imageSize]
        )}
        tabIndex={-1}
        aria-hidden="true"
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={post.featuredImage?.alt || post.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <ArticleImagePlaceholder category={categoryName || post.category?.name} className="h-full aspect-square" />
        )}

        {post.registeredOnly && (
          <div className="absolute top-1 left-1 p-0.5 rounded bg-navy-950/80 backdrop-blur text-amber-300" title={t('subscriberExclusive')}>
            <Lock className="w-2.5 h-2.5" />
          </div>
        )}
      </Link>

      {/* Content Column */}
      <div className="flex-1 min-w-0 space-y-1">
        {showCategory && post.category && (
          <div className="flex items-center gap-2">
            <Link
              to={`/category/${post.category.slug}`}
              className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-editorial-red dark:text-editorial-red-dark hover:underline truncate"
            >
              {categoryName || post.category.name}
            </Link>
          </div>
        )}

        <h4 className="text-xs sm:text-sm font-bold font-serif text-navy-900 dark:text-white group-hover:text-editorial-red dark:group-hover:text-editorial-red-dark transition-colors line-clamp-2 leading-snug">
          <Link to={`/article/${post.slug}`} className="focus:outline-none focus-visible:underline">
            {post.title}
          </Link>
        </h4>

        {showMeta && (
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-slate-500 dark:text-slate-400 pt-0.5">
            <span className="truncate max-w-[120px] font-medium text-slate-600 dark:text-slate-300">
              {post.author?.name || t('theNewsReport')}
            </span>
            {post.author?.name && publishedDate && <span>•</span>}
            {publishedDate && (
              <span className="flex items-center gap-1 font-mono">
                <Clock className="w-3 h-3 text-slate-400" />
                {publishedDate}
              </span>
            )}
          </div>
        )}

        {showEngagement && (
          <div className="flex items-center gap-3 pt-1 text-[10px] text-slate-400 dark:text-slate-500">
            {typeof post.views === 'number' && (
              <span className="flex items-center gap-0.5">
                <Eye className="w-3 h-3 text-blue-500" /> {post.views}
              </span>
            )}
            {typeof post.likeCount === 'number' && (
              <span className="flex items-center gap-0.5">
                <Heart className="w-3 h-3 text-rose-500" /> {post.likeCount}
              </span>
            )}
            {typeof post.commentCount === 'number' && (
              <span className="flex items-center gap-0.5">
                <MessageSquare className="w-3 h-3 text-purple-500" /> {post.commentCount}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
