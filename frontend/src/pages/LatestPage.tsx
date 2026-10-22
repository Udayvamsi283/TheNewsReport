import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../services/apiClient';
import { RefreshCw, Radio } from 'lucide-react';
import { ArticleCard } from '../components/public/ArticleCard';

export const LatestPage: React.FC = () => {
  const [page, setPage] = useState(1);

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['public', 'latest', page],
    queryFn: () => apiClient.getLatestPosts({ page, limit: 15 }),
    refetchInterval: 30000 // Poll every 30s
  });

  const posts = data?.posts || [];
  const pagination = data?.pagination;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200 dark:border-navy-800 mb-8">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-editorial-red dark:text-editorial-red-dark mb-2">
            <Radio className="w-4 h-4 animate-pulse" />
            <span>Live Chronological News Wire</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black font-serif text-navy-900 dark:text-white">
            Latest News
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Continuous real-time reporting, investigative dispatches, and global updates.
          </p>
        </div>

        <button
          type="button"
          onClick={() => refetch()}
          disabled={isFetching}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 bg-white dark:bg-navy-850 border border-slate-200 dark:border-navy-700 hover:bg-slate-100 dark:hover:bg-navy-800 active:scale-95 transition-all self-start sm:self-auto shadow-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin text-editorial-red' : 'text-slate-500'}`} />
          <span>{isFetching ? 'Updating Wire...' : 'Refresh Wire'}</span>
        </button>
      </div>

      {/* Wire List with Images */}
      {isLoading ? (
        <div className="space-y-4 py-8">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="animate-pulse flex flex-col sm:flex-row gap-5 p-5 rounded-2xl bg-white dark:bg-navy-900 border border-slate-200/80 dark:border-navy-800">
              <div className="w-full sm:w-56 h-36 bg-slate-200 dark:bg-navy-800 rounded-xl" />
              <div className="flex-1 space-y-3">
                <div className="h-4 bg-slate-200 dark:bg-navy-800 rounded w-1/4" />
                <div className="h-6 bg-slate-200 dark:bg-navy-800 rounded w-3/4" />
                <div className="h-4 bg-slate-200 dark:bg-navy-800 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="py-20 text-center text-slate-500 dark:text-slate-400 font-medium">
          No published articles found on the news wire.
        </div>
      ) : (
        <div className="space-y-5">
          {posts.map((post) => (
            <ArticleCard key={post._id} post={post} variant="horizontal" />
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {pagination && typeof pagination.pages === 'number' && pagination.pages > 1 && (
        <div className="mt-12 pt-6 border-t border-slate-200 dark:border-navy-800 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 bg-white dark:bg-navy-850 border border-slate-200 dark:border-navy-700 hover:bg-slate-100 dark:hover:bg-navy-800 disabled:opacity-40 disabled:pointer-events-none transition-colors"
          >
            ← Previous
          </button>
          <span className="text-xs text-slate-500 font-medium">
            Page {page} of {pagination.pages}
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(pagination.pages || 1, p + 1))}
            disabled={page >= (pagination.pages || 1)}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 bg-white dark:bg-navy-850 border border-slate-200 dark:border-navy-700 hover:bg-slate-100 dark:hover:bg-navy-800 disabled:opacity-40 disabled:pointer-events-none transition-colors"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
};
