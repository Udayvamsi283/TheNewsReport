import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../services/apiClient';
import { Layers, Clock, Lock, ChevronLeft, ChevronRight } from 'lucide-react';
import { ArticleImagePlaceholder } from '../components/common/ArticleImagePlaceholder';
import { ArticleCard } from '../components/public/ArticleCard';
import { NotFoundPage } from './NotFoundPage';
import { useLanguage } from '../context/LanguageContext';

export const CategoryPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [page, setPage] = useState(1);
  const { currentLanguage, getCategoryName } = useLanguage();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['public', 'category', slug, page, currentLanguage],
    queryFn: () => apiClient.getCategoryPosts(slug!, { page, limit: 12, lang: currentLanguage }),
    enabled: !!slug
  });

  if (isError) {
    return <NotFoundPage />;
  }

  const category = data?.category;
  const posts = data?.posts || [];
  const pagination = data?.pagination;

  const leadStory = posts[0];
  const gridStories = posts.slice(1);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Category Header */}
      <div className="border-b-4 border-editorial-red pb-6">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-editorial-red dark:text-editorial-red-dark mb-2">
          <Layers className="w-4 h-4" />
          <span>Journalistic Beat</span>
        </div>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-5xl font-black font-serif text-navy-900 dark:text-white capitalize">
              {getCategoryName(slug || '', category?.name || slug || '')}
            </h1>
            {category?.description && (
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
                {category.description}
              </p>
            )}
          </div>
          {pagination && (
            <div className="text-xs font-mono text-slate-500 dark:text-slate-400">
              {pagination.total} Total Published Dispatches
            </div>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-6 animate-pulse">
          <div className="h-80 bg-slate-200 dark:bg-navy-900 rounded-3xl" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 bg-slate-200 dark:bg-navy-900 rounded-2xl" />
            ))}
          </div>
        </div>
      ) : posts.length === 0 ? (
        <div className="py-20 text-center text-slate-500 dark:text-slate-400 font-medium">
          No articles in this beat yet.
        </div>
      ) : (
        <>
          {/* Lead Story for this Beat */}
          {leadStory && (
            <article className="group rounded-3xl overflow-hidden bg-white dark:bg-navy-900 border border-slate-200/90 dark:border-navy-700/80 shadow-sm hover:shadow-md transition-all">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
                <div className="lg:col-span-7 aspect-[16/10] overflow-hidden bg-slate-100 dark:bg-navy-800 relative">
                  {(leadStory.featuredImage?.url || leadStory.images?.[0]?.url) ? (
                    <img
                      src={leadStory.featuredImage?.url || leadStory.images?.[0]?.url}
                      alt={leadStory.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                    />
                  ) : (
                    <ArticleImagePlaceholder category={category?.name} className="h-full aspect-[16/10]" />
                  )}
                  {leadStory.registeredOnly && (
                    <div className="absolute top-3 left-3 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-navy-950/85 backdrop-blur text-amber-300">
                      <Lock className="w-3 h-3 inline mr-1" /> Exclusive
                    </div>
                  )}
                </div>

                <div className="lg:col-span-5 p-6 sm:p-8 flex flex-col justify-between">
                  <div className="space-y-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-editorial-red dark:text-editorial-red-dark">
                      Top Beat Story
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-bold font-serif text-navy-900 dark:text-white group-hover:text-editorial-red dark:group-hover:text-editorial-red-dark transition-colors leading-tight">
                      <Link to={`/article/${leadStory.slug}`}>{leadStory.title}</Link>
                    </h2>
                    {leadStory.summary && (
                      <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-3 leading-relaxed">
                        {leadStory.summary}
                      </p>
                    )}
                  </div>

                  <div className="pt-4 border-t border-slate-100 dark:border-navy-800 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      {leadStory.author?.name || 'The News Report'}
                    </span>
                    {leadStory.publishedAt && (
                      <span className="flex items-center gap-1 font-mono text-[11px]">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {new Date(leadStory.publishedAt).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </article>
          )}

          {/* Additional Beat Stories */}
          {gridStories.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {gridStories.map((post) => (
                <ArticleCard key={post._id} post={post} variant="grid" />
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination && typeof pagination.pages === 'number' && pagination.pages > 1 && (
            <div className="pt-8 border-t border-slate-200 dark:border-navy-800 flex items-center justify-between">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="inline-flex items-center gap-1 px-4 py-2 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 bg-white dark:bg-navy-850 border border-slate-200 dark:border-navy-700 hover:bg-slate-100 dark:hover:bg-navy-800 disabled:opacity-40 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" /> Previous
              </button>
              <span className="text-xs text-slate-500 font-medium">
                Page {page} of {pagination.pages}
              </span>
              <button
                type="button"
                disabled={page >= (pagination.pages || 1)}
                onClick={() => setPage((p) => Math.min(pagination.pages || 1, p + 1))}
                className="inline-flex items-center gap-1 px-4 py-2 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 bg-white dark:bg-navy-850 border border-slate-200 dark:border-navy-700 hover:bg-slate-100 dark:hover:bg-navy-800 disabled:opacity-40 transition-colors"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};
