import React from 'react';
import { Link } from 'react-router-dom';
import { Post } from '../../types';
import { Clock, Eye, Heart, MessageSquare, Lock } from 'lucide-react';
import { ArticleImagePlaceholder } from '../common/ArticleImagePlaceholder';
import { Avatar } from '../ui/Avatar';
import { useLanguage } from '../../context/LanguageContext';

interface HeroStoryProps {
  post: Post;
}

export const HeroStory: React.FC<HeroStoryProps> = ({ post }) => {
  const { t, getCategoryName } = useLanguage();
  const publishedDate = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
    : '';

  const wordCount = post.content ? post.content.split(/\s+/).length : (post.summary ? post.summary.split(/\s+/).length * 4 : 200);
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

  const imageUrl = post.featuredImage?.url || post.images?.[0]?.url || '';

  return (
    <article className="group relative rounded-3xl overflow-hidden bg-white dark:bg-navy-900 border border-slate-200/90 dark:border-navy-700/80 shadow-md hover:shadow-xl transition-all duration-300">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
        {/* Image Section */}
        <div className="lg:col-span-7 relative min-h-[300px] lg:min-h-[460px] overflow-hidden bg-slate-100 dark:bg-navy-800">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={post.featuredImage?.alt || post.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
            />
          ) : (
            <ArticleImagePlaceholder category={post.category?.name} className="h-full min-h-[300px] lg:min-h-[460px]" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent lg:hidden" />

          {post.registeredOnly && (
            <div className="absolute top-4 left-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-navy-950/85 backdrop-blur text-amber-300 border border-amber-400/30">
              <Lock className="w-3.5 h-3.5" /> {t('subscriberExclusive')}
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="lg:col-span-5 p-6 sm:p-8 lg:p-10 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              {post.category && (
                <Link
                  to={`/category/${post.category.slug}`}
                  className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-editorial-red/10 text-editorial-red hover:bg-editorial-red/20 dark:bg-editorial-red/20 dark:text-editorial-red-dark transition-colors"
                >
                  {getCategoryName(post.category.slug, post.category.name)}
                </Link>
              )}
              <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 font-mono">
                <Clock className="w-3.5 h-3.5" />
                {readingTime} {t('minRead')}
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-navy-900 dark:text-white font-serif leading-tight group-hover:text-editorial-red dark:group-hover:text-editorial-red-dark transition-colors">
              <Link to={`/article/${post.slug}`} className="focus:outline-none">
                {post.title}
              </Link>
            </h2>

            {post.summary && (
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 line-clamp-3 leading-relaxed font-sans">
                {post.summary}
              </p>
            )}
          </div>

          <div className="pt-6 border-t border-slate-100 dark:border-navy-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar src={post.author?.avatar} name={post.author?.name} size="md" />
              <div>
                <p className="text-sm font-bold text-navy-900 dark:text-white leading-tight">
                  {post.author?.name || t('theNewsReport')}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">{publishedDate}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs text-slate-400 dark:text-slate-500">
              {typeof post.views === 'number' && (
                <span className="flex items-center gap-1" title={`${post.views} views`}>
                  <Eye className="w-3.5 h-3.5" /> {post.views}
                </span>
              )}
              {typeof post.likeCount === 'number' && (
                <span className="flex items-center gap-1" title={`${post.likeCount} likes`}>
                  <Heart className="w-3.5 h-3.5" /> {post.likeCount}
                </span>
              )}
              {typeof post.commentCount === 'number' && (
                <span className="flex items-center gap-1" title={`${post.commentCount} comments`}>
                  <MessageSquare className="w-3.5 h-3.5" /> {post.commentCount}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
};
