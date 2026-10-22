import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../services/apiClient';
import { Search as SearchIcon, X } from 'lucide-react';
import { ArticleCard } from '../components/public/ArticleCard';

export const SearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryParam = searchParams.get('q') || '';
  const [query, setQuery] = useState(queryParam);
  const [page, setPage] = useState(1);

  // Sync state if URL query param changes
  useEffect(() => {
    setQuery(queryParam);
    setPage(1);
  }, [queryParam]);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['public', 'search', queryParam, page],
    queryFn: () => apiClient.searchPosts(queryParam, { page, limit: 12 }),
    enabled: queryParam.trim().length > 0
  });

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setSearchParams({ q: query.trim() });
    } else {
      setSearchParams({});
    }
  };

  const handleClear = () => {
    setQuery('');
    setSearchParams({});
  };

  const posts = data?.posts || [];
  const pagination = data?.pagination;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header and Search Box */}
      <div className="bg-white dark:bg-navy-900 p-6 sm:p-8 rounded-3xl border border-slate-200/90 dark:border-navy-700/80 shadow-xs space-y-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black font-serif text-navy-900 dark:text-white">
            Editorial Archive Search
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 font-sans">
            Search our global journalism, breaking dispatches, investigations, and multimedia archive.
          </p>
        </div>

        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by keywords, headlines, topics, or names..."
              className="w-full pl-11 pr-10 py-3 rounded-2xl border border-slate-300 dark:border-navy-700 bg-slate-50 dark:bg-navy-850 text-sm font-medium text-navy-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-editorial-red"
            />
            {query && (
              <button
                type="button"
                onClick={handleClear}
                aria-label="Clear search query"
                className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <button
            type="submit"
            className="px-6 py-3 rounded-2xl font-bold text-sm text-white bg-navy-900 hover:bg-navy-800 dark:bg-white dark:text-navy-950 dark:hover:bg-slate-100 shadow-xs transition-all"
          >
            Search
          </button>
        </form>
      </div>

      {/* Results Section */}
      {queryParam.trim().length === 0 ? (
        <div className="py-16 text-center text-slate-400 font-medium">
          Enter search terms above to explore The News Report archive.
        </div>
      ) : isLoading || isFetching ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse h-28 bg-white dark:bg-navy-900 rounded-2xl border border-slate-200 dark:border-navy-800" />
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="py-20 text-center">
          <h2 className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-1">
            No articles found.
          </h2>
          <p className="text-xs text-slate-400">
            Try refining your keywords or checking for spelling errors.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="text-xs text-slate-500 font-medium">
            Found {pagination?.total || posts.length} article(s) matching &quot;{queryParam}&quot;
          </div>

          <div className="space-y-4">
            {posts.map((post) => (
              <ArticleCard key={post._id} post={post} variant="horizontal" />
            ))}
          </div>

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
      )}
    </div>
  );
};
