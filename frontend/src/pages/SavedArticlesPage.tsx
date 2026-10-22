import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { apiClient } from '../services/apiClient';
import { Bookmark, BookOpen, Trash2 } from 'lucide-react';
import { ArticleCard } from '../components/public/ArticleCard';
import { useToast } from '../components/ui/Toast';

export const SavedArticlesPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const { showToast } = useToast();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['users', 'me', 'bookmarks', page],
    queryFn: () => apiClient.getUserBookmarks({ page, limit: 10 })
  });

  const posts = data?.bookmarks || [];
  const pagination = data?.pagination;

  const handleRemoveBookmark = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await apiClient.removeBookmark(id);
      showToast('Article removed from bookmarks', 'info');
      refetch();
    } catch {
      showToast('Failed to remove bookmark', 'error');
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="pb-6 border-b border-slate-200 dark:border-navy-800">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-editorial-red dark:text-editorial-red-dark mb-2">
          <Bookmark className="w-4 h-4 fill-editorial-red dark:fill-editorial-red-dark" />
          <span>Personal Reading List</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black font-serif text-navy-900 dark:text-white">
          Saved Dispatches
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-sans">
          Articles and field reports you have bookmarked for offline or later reading.
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
            No saved articles yet.
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-6">
            Click the bookmark icon on any article across The News Report to save it here for later.
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
            <div key={post._id} className="relative group">
              <ArticleCard post={post} variant="horizontal" />
              <button
                type="button"
                onClick={(e) => handleRemoveBookmark(post._id, e)}
                title="Remove from bookmarks"
                className="absolute top-4 right-4 p-2 rounded-lg bg-white/90 dark:bg-navy-800/90 text-slate-400 hover:text-editorial-red hover:bg-white dark:hover:bg-navy-750 transition-all opacity-0 group-hover:opacity-100 shadow-xs"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
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
