import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../services/apiClient';

export const Footer: React.FC = () => {
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => apiClient.getCategories(),
    staleTime: 5 * 60 * 1000
  });

  const activeCategories = categories.filter((c) => c.status === 'active');

  return (
    <footer className="bg-navy-950 text-slate-300 border-t-4 border-editorial-red mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand column */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="inline-block group focus:outline-none">
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-black uppercase tracking-tight text-white font-sans">
                  THE NEWS REPORT
                </span>
                <span className="w-2.5 h-2.5 rounded-full bg-editorial-red inline-block mb-1" />
              </div>
            </Link>
            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              Multilingual digital news publication covering global affairs, national developments, technology, and business.
            </p>
          </div>

          {/* Categories */}
          {activeCategories.length > 0 && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4 border-b border-navy-800 pb-2">
                Categories
              </h4>
              <ul className="space-y-2 text-xs">
                {activeCategories.map((cat) => (
                  <li key={cat.id || cat._id}>
                    <Link
                      to={`/category/${cat.slug}`}
                      className="hover:text-white transition-colors"
                    >
                      {cat.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Navigation Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-4 border-b border-navy-800 pb-2">
              Explore
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <Link to="/latest" className="text-slate-300 hover:text-white">
                  Latest News
                </Link>
              </li>
              <li>
                <Link to="/trending" className="text-slate-300 hover:text-white">
                  Trending Stories
                </Link>
              </li>
              <li>
                <Link to="/videos" className="text-slate-300 hover:text-white">
                  Videos
                </Link>
              </li>
              <li>
                <Link to="/search" className="text-slate-300 hover:text-white">
                  Search
                </Link>
              </li>
              <li>
                <Link to="/login" className="text-slate-300 hover:text-white">
                  Sign In
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright line */}
        <div className="mt-12 pt-8 border-t border-navy-800/80 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4">
          <div>
            © {new Date().getFullYear()} The News Report. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
};
