import React from 'react';
import { Link } from 'react-router-dom';
import { Post } from '../../types';
import { Clock, Lock, ArrowRight } from 'lucide-react';
import { ArticleImagePlaceholder } from '../common/ArticleImagePlaceholder';
import { cn } from '../../lib/utils';
import { useLanguage } from '../../context/LanguageContext';

export interface ArticleCardProps {
  post: Post;
  variant?: 'grid' | 'featured' | 'horizontal';
  className?: string;
  showExcerpt?: boolean;
  showMeta?: boolean;
}

export const ArticleCard: React.FC<ArticleCardProps> = ({
  post,
  variant = 'grid',
  className,
  showExcerpt = true,
  showMeta = true
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
        day: 'numeric',
        year: 'numeric'
      })
    : '';

  const wordCount = post.content
    ? post.content.split(/\s+/).length
    : post.summary
    ? post.summary.split(/\s+/).length * 4
    : 180;
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

  // Variant: HORIZONTAL (Left image, right content)
  if (variant === 'horizontal') {
    return (
      <article
        className={cn(
          'group flex flex-col sm:flex-row gap-5 p-4 sm:p-5 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200/90 dark:border-navy-700/80 shadow-xs hover:border-slate-300 dark:hover:border-navy-600 hover:shadow-md transition-all duration-200',
          className
        )}
      >
        <Link
          to={`/article/${post.slug}`}
          className="relative w-full sm:w-52 md:w-60 h-44 sm:h-auto sm:aspect-[4/3] flex-shrink-0 rounded-xl overflow-hidden bg-slate-100 dark:bg-navy-800 border border-slate-200/60 dark:border-navy-750 focus:outline-none focus-visible:ring-2 focus-visible:ring-editorial-red"
          tabIndex={-1}
          aria-hidden="true"
        >
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={post.featuredImage?.alt || post.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
              loading="lazy"
            />
          ) : (
            <ArticleImagePlaceholder category={categoryName || post.category?.name} className="h-full aspect-[4/3]" />
          )}

          {post.registeredOnly && (
            <span className="absolute top-2.5 left-2.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-navy-950/85 backdrop-blur text-amber-300 border border-amber-400/20">
              <Lock className="w-2.5 h-2.5" /> {t('exclusive')}
            </span>
          )}

          {post.postFormat && post.postFormat !== 'article' && (
            <span className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-black/75 backdrop-blur text-white">
              {post.postFormat.replace('_', ' ')}
            </span>
          )}
        </Link>

        <div className="flex-1 flex flex-col justify-between min-w-0">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              {post.category && (
                <Link
                  to={`/category/${post.category.slug}`}
                  className="text-xs font-extrabold uppercase tracking-wider text-editorial-red dark:text-editorial-red-dark hover:underline"
                >
                  {categoryName || post.category.name}
                </Link>
              )}
              {publishedDate && (
                <>
                  <span className="text-slate-300 dark:text-navy-700">•</span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                    {publishedDate}
                  </span>
                </>
              )}
            </div>

            <h3 className="text-base sm:text-lg font-bold font-serif text-navy-900 dark:text-white group-hover:text-editorial-red dark:group-hover:text-editorial-red-dark transition-colors line-clamp-2 leading-snug">
              <Link to={`/article/${post.slug}`}>{post.title}</Link>
            </h3>

            {showExcerpt && post.summary && (
              <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed font-sans">
                {post.summary}
              </p>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-navy-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-medium text-slate-700 dark:text-slate-300">
              {t('by')} {post.author?.name || t('theNewsReport')}
            </span>
            <Link
              to={`/article/${post.slug}`}
              className="inline-flex items-center gap-1 font-semibold text-editorial-red dark:text-editorial-red-dark hover:underline text-xs"
            >
              <span>{t('readStory')}</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </article>
    );
  }

  // Variant: FEATURED (Large prominent story card)
  if (variant === 'featured') {
    return (
      <article
        className={cn(
          'group flex flex-col justify-between rounded-2xl bg-white dark:bg-navy-900 border border-slate-200/90 dark:border-navy-700/80 overflow-hidden shadow-sm hover:border-slate-300 dark:hover:border-navy-600 hover:shadow-lg transition-all duration-300',
          className
        )}
      >
        <div>
          <Link
            to={`/article/${post.slug}`}
            className="block relative aspect-[16/10] overflow-hidden bg-slate-100 dark:bg-navy-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-editorial-red"
            tabIndex={-1}
            aria-hidden="true"
          >
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={post.featuredImage?.alt || post.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-600 ease-out"
                loading="lazy"
              />
            ) : (
              <ArticleImagePlaceholder category={categoryName || post.category?.name} className="h-full aspect-[16/10]" />
            )}

            {post.registeredOnly && (
              <div className="absolute top-3 left-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-navy-950/85 backdrop-blur text-amber-300 border border-amber-400/20">
                <Lock className="w-3 h-3" /> {t('exclusive')}
              </div>
            )}

            {post.category && (
              <span className="absolute bottom-3 right-3 px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wider bg-navy-950/85 backdrop-blur text-white">
                {categoryName || post.category.name}
              </span>
            )}
          </Link>

          <div className="p-5 sm:p-6 space-y-2.5">
            <h3 className="text-xl sm:text-2xl font-bold font-serif text-navy-900 dark:text-white leading-snug group-hover:text-editorial-red dark:group-hover:text-editorial-red-dark transition-colors line-clamp-2">
              <Link to={`/article/${post.slug}`}>{post.title}</Link>
            </h3>

            {showExcerpt && post.summary && (
              <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                {post.summary}
              </p>
            )}
          </div>
        </div>

        {showMeta && (
          <div className="px-5 sm:px-6 pb-5 pt-0 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between border-t border-slate-100 dark:border-navy-800/60 pt-3">
            <span className="font-medium text-slate-700 dark:text-slate-300">
              {t('by')} {post.author?.name || t('theNewsReport')}
            </span>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 font-mono">
                <Clock className="w-3 h-3" /> {readingTime}{t('mRead')}
              </span>
              {publishedDate && <span>• {publishedDate}</span>}
            </div>
          </div>
        )}
      </article>
    );
  }

  // Default Variant: GRID (Standard editorial card)
  return (
    <article
      className={cn(
        'group flex flex-col justify-between rounded-2xl bg-white dark:bg-navy-900 border border-slate-200/90 dark:border-navy-700/80 overflow-hidden shadow-xs hover:border-slate-300 dark:hover:border-navy-600 hover:shadow-md transition-all duration-200',
        className
      )}
    >
      <div>
        <Link
          to={`/article/${post.slug}`}
          className="block relative aspect-[16/10] overflow-hidden bg-slate-100 dark:bg-navy-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-editorial-red"
          tabIndex={-1}
          aria-hidden="true"
        >
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={post.featuredImage?.alt || post.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
              loading="lazy"
            />
          ) : (
            <ArticleImagePlaceholder category={categoryName || post.category?.name} className="h-full aspect-[16/10]" />
          )}

          {post.registeredOnly && (
            <div className="absolute top-2.5 left-2.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-navy-950/85 backdrop-blur text-amber-300 border border-amber-400/20">
              <Lock className="w-3 h-3" /> {t('exclusive')}
            </div>
          )}

          {post.category && (
            <span className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-navy-950/80 backdrop-blur text-white">
              {categoryName || post.category.name}
            </span>
          )}
        </Link>

        <div className="p-4 sm:p-5">
          <h3 className="text-base sm:text-lg font-bold font-serif text-navy-900 dark:text-white leading-snug group-hover:text-editorial-red dark:group-hover:text-editorial-red-dark transition-colors line-clamp-2 mb-2">
            <Link to={`/article/${post.slug}`}>{post.title}</Link>
          </h3>

          {showExcerpt && post.summary && (
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
              {post.summary}
            </p>
          )}
        </div>
      </div>

      {showMeta && (
        <div className="px-4 sm:px-5 pb-4 pt-0 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between border-t border-slate-100 dark:border-navy-800/50 pt-2.5">
          <span className="font-medium text-slate-700 dark:text-slate-300 truncate max-w-[130px]">
            {t('by')} {post.author?.name || t('theNewsReport')}
          </span>
          {publishedDate && (
            <span className="flex items-center gap-1 font-mono text-[11px]">
              <Clock className="w-3 h-3" />
              {publishedDate}
            </span>
          )}
        </div>
      )}
    </article>
  );
};
