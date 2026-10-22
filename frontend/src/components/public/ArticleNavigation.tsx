import React from 'react';
import { Link } from 'react-router-dom';
import { Post } from '../../types';
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { ArticleImagePlaceholder } from '../common/ArticleImagePlaceholder';
import { useLanguage } from '../../context/LanguageContext';
import { cn } from '../../lib/utils';

interface ArticleNavigationProps {
  prevPost?: Post | null;
  nextPost?: Post | null;
  className?: string;
}

export const ArticleNavigation: React.FC<ArticleNavigationProps> = ({
  prevPost,
  nextPost,
  className
}) => {
  const { t, getCategoryName } = useLanguage();

  if (!prevPost && !nextPost) {
    return null;
  }

  const renderNavCard = (post: Post | null | undefined, direction: 'prev' | 'next') => {
    const isPrev = direction === 'prev';
    const label = isPrev ? t('previousArticle') : t('nextArticle');

    if (!post) {
      return (
        <div
          className={cn(
            'flex flex-col justify-between p-4 rounded-2xl border border-dashed border-slate-200 dark:border-navy-800 bg-slate-50/50 dark:bg-navy-950/40 opacity-70 text-xs text-slate-400 dark:text-slate-500',
            isPrev ? 'text-left' : 'text-right'
          )}
        >
          <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[11px] mb-2 justify-start">
            {isPrev ? (
              <>
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>{label}</span>
              </>
            ) : (
              <div className="w-full flex items-center justify-end gap-1.5">
                <span>{label}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            )}
          </div>
          <p className="italic text-[11px]">
            {isPrev ? 'Earliest story in archive' : 'Latest story in news wire'}
          </p>
        </div>
      );
    }

    const imageUrl =
      post.featuredImage?.url ||
      post.images?.[0]?.url ||
      '';
    const categoryName = post.category
      ? getCategoryName(post.category.slug, post.category.name)
      : '';
    const publishedDate = post.publishedAt
      ? new Date(post.publishedAt).toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric'
        })
      : '';

    return (
      <Link
        to={`/article/${post.slug}`}
        className={cn(
          'group flex flex-col justify-between p-4 rounded-2xl border border-slate-200/90 dark:border-navy-700/80 bg-white dark:bg-navy-900 hover:border-slate-300 dark:hover:border-navy-600 shadow-2xs hover:shadow-md transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-editorial-red',
          isPrev ? 'items-start' : 'items-end'
        )}
      >
        <div className="w-full flex items-center gap-1.5 font-extrabold uppercase tracking-wider text-[11px] text-editorial-red dark:text-editorial-red-dark mb-2.5">
          {isPrev ? (
            <>
              <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span>{label}</span>
            </>
          ) : (
            <div className="w-full flex items-center justify-end gap-1.5">
              <span>{label}</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          )}
        </div>

        <div className={cn('w-full flex gap-3', isPrev ? 'flex-row' : 'flex-row-reverse')}>
          {/* Thumbnail */}
          <div className="relative w-16 h-16 sm:w-18 sm:h-18 flex-shrink-0 rounded-xl overflow-hidden bg-slate-100 dark:bg-navy-800 border border-slate-200/60 dark:border-navy-750">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={post.featuredImage?.alt || post.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                loading="lazy"
              />
            ) : (
              <ArticleImagePlaceholder category={categoryName || post.category?.name} className="h-full aspect-square" />
            )}
          </div>

          {/* Details */}
          <div className={cn('flex-1 min-w-0 flex flex-col justify-center', isPrev ? 'text-left' : 'text-right')}>
            {categoryName && (
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                {categoryName}
              </span>
            )}
            <h4 className="text-xs sm:text-sm font-bold font-serif text-navy-900 dark:text-white group-hover:text-editorial-red dark:group-hover:text-editorial-red-dark line-clamp-2 leading-snug transition-colors">
              {post.title}
            </h4>
            {publishedDate && (
              <span className={cn('text-[10px] text-slate-400 dark:text-slate-500 font-mono mt-1 flex items-center gap-1', !isPrev && 'justify-end')}>
                <Clock className="w-3 h-3" />
                {publishedDate}
              </span>
            )}
          </div>
        </div>
      </Link>
    );
  };

  return (
    <nav
      aria-label="Article navigation"
      className={cn('grid grid-cols-1 md:grid-cols-2 gap-4 my-8', className)}
    >
      {renderNavCard(prevPost, 'prev')}
      {renderNavCard(nextPost, 'next')}
    </nav>
  );
};
