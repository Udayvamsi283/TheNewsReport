import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { apiClient } from '../services/apiClient';
import { Heart, BookOpen } from 'lucide-react';
import { ArticleCard } from '../components/public/ArticleCard';

export const LikedArticlesPage: React.FC = () => {
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['users', 'me', 'likes', page],
    queryFn: () => apiClient.getUserLikes({ page, limit: 10 })
  });

  const posts = data?.likes || [];
  const pagination = data?.pagination;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="pb-6 border-b border-slate-200 dark:border-navy-800">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-rose-600 dark:text-rose-400 mb-2">
          <Heart className="w-4 h-4 fill-rose-600 dark:fill-rose-400" />
          <span>Supported Journalism</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black font-serif text-navy-900 dark:text-white">
          Liked Dispatches
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-sans">
          Stories, investigations, and field dispatches you have endorsed.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse h-28 bg-white dark:bg-navy-900 rounded-2xl border border-slate-200 dark:border-navy-800" />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="py-20 text-center">
          <BookOpen className="w-12 h-12 text-slate-300 dark:text-navy-700 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-1">
            No liked articles yet.
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-6">
            Click the heart icon on any article across The News Report to show your support and save it here.
          </p>
          <Link
            to="/"
            className="inline-flex items-center px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-navy-900 hover:bg-navy-800 dark:bg-white dark:text-navy-950 shadow-xs transition-all"
          >
            Explore Front Page
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <ArticleCard key={post._id} post={post} variant="horizontal" />
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
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 bg-white dark:bg-navy-850 border border-slate-200 dark:border-navy-700 hover:bg-slate-100 dark:hover:bg-navy-800 disabled:opacity-40 transition-colors"
          >
            Previous
          </button>
          <span className="text-xs text-slate-500 font-medium">
            Page {page} of {pagination.pages}
          </span>
          <button
            type="button"
            disabled={page >= (pagination.pages || 1)}
            onClick={() => setPage((p) => Math.min(pagination.pages || 1, p + 1))}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 bg-white dark:bg-navy-850 border border-slate-200 dark:border-navy-700 hover:bg-slate-100 dark:hover:bg-navy-800 disabled:opacity-40 transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};
