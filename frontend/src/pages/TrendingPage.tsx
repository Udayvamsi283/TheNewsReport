import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { apiClient } from '../services/apiClient';
import { Flame, Eye, Heart, MessageSquare, Clock, Lock } from 'lucide-react';
import { ArticleImagePlaceholder } from '../components/common/ArticleImagePlaceholder';
import { Post } from '../types';
import { useLanguage } from '../context/LanguageContext';

export const TrendingPage: React.FC = () => {
  const { currentLanguage, t } = useLanguage();
  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['public', 'trending', currentLanguage],
    queryFn: () => apiClient.getTrendingPosts({ limit: 12, lang: currentLanguage }),
    staleTime: 60000
  });

  const postList: Post[] = Array.isArray(posts) ? posts : (posts as any)?.posts || [];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="pb-6 border-b border-slate-200 dark:border-navy-800 mb-8">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400 mb-2">
          <Flame className="w-4 h-4 fill-amber-500/20 text-amber-500" />
          <span>Past 7 Days Highlights</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black font-serif text-navy-900 dark:text-white">
          {t('trending')} Stories
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          The most engaged and widely discussed journalism published over the last week.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse h-36 bg-slate-100 dark:bg-navy-900 rounded-2xl border border-slate-200 dark:border-navy-800" />
          ))}
        </div>
      ) : postList.length === 0 ? (
        <div className="py-20 text-center text-slate-500 dark:text-slate-400 font-medium">
          Trending stories will appear here once articles receive readership.
        </div>
      ) : (
        <div className="space-y-5">
          {postList.map((post: Post, index: number) => {
            const rank = index + 1;
            const imageUrl = post.featuredImage?.url || post.images?.[0]?.url || '';

            const publishedDate = post.publishedAt
              ? new Date(post.publishedAt).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric'
                })
              : '';

            return (
              <article
                key={post._id}
                className="group flex flex-col sm:flex-row items-start sm:items-center gap-5 p-5 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200/90 dark:border-navy-700/80 hover:border-slate-300 dark:hover:border-navy-600 hover:shadow-md transition-all"
              >
                {/* Large Rank Number */}
                <div className="flex-shrink-0 text-3xl sm:text-4xl font-black font-mono text-slate-300 dark:text-navy-700 group-hover:text-amber-500 transition-colors w-12 text-center select-none">
                  {rank < 10 ? `0${rank}` : rank}
                </div>

                {/* Thumbnail */}
                <div className="w-full sm:w-52 h-40 sm:h-32 flex-shrink-0 rounded-xl overflow-hidden bg-slate-100 dark:bg-navy-800 relative border border-slate-200/60 dark:border-navy-750">
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                  ) : (
                    <ArticleImagePlaceholder category={post.category?.name} className="h-full aspect-[4/3]" />
                  )}
                  {post.registeredOnly && (
                    <div className="absolute top-2 left-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-navy-950/85 backdrop-blur text-amber-300">
                      <Lock className="w-2.5 h-2.5" /> Exclusive
                    </div>
                  )}
                  {post.category && (
                    <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-navy-950/80 backdrop-blur text-white">
                      {post.category.name}
                    </span>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 w-full space-y-2 min-w-0">
                  <div className="flex items-center gap-2">
                    {post.category && (
                      <Link
                        to={`/category/${post.category.slug}`}
                        className="text-[11px] font-extrabold uppercase tracking-wider text-editorial-red dark:text-editorial-red-dark hover:underline"
                      >
                        {post.category.name}
                      </Link>
                    )}
                  </div>

                  <h2 className="text-lg sm:text-xl font-bold font-serif text-navy-900 dark:text-white group-hover:text-editorial-red dark:group-hover:text-editorial-red-dark transition-colors leading-snug">
                    <Link to={`/article/${post.slug}`}>{post.title}</Link>
                  </h2>

                  {post.summary && (
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                      {post.summary}
                    </p>
                  )}

                  <div className="pt-2 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-navy-800/60 pt-2">
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-slate-700 dark:text-slate-300">
                        {post.author?.name || 'The News Report'}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1 font-mono text-[11px]">
                        <Clock className="w-3 h-3 text-slate-400" /> {publishedDate}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-[11px]">
                      {typeof post.views === 'number' && (
                        <span className="flex items-center gap-1 font-medium">
                          <Eye className="w-3.5 h-3.5 text-blue-500" /> {post.views.toLocaleString()}
                        </span>
                      )}
                      {typeof post.likeCount === 'number' && (
                        <span className="flex items-center gap-1 font-medium">
                          <Heart className="w-3.5 h-3.5 text-rose-500" /> {post.likeCount}
                        </span>
                      )}
                      {typeof post.commentCount === 'number' && (
                        <span className="flex items-center gap-1 font-medium">
                          <MessageSquare className="w-3.5 h-3.5 text-purple-500" /> {post.commentCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};
