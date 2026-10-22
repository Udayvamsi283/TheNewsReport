import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Post } from '../../types';
import { AlertCircle, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

interface BreakingNewsBarProps {
  breakingPosts: Post[];
}

export const BreakingNewsBar: React.FC<BreakingNewsBarProps> = ({ breakingPosts }) => {
  const { t } = useLanguage();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || !breakingPosts || breakingPosts.length === 0) {
    return null;
  }

  const current = breakingPosts[currentIndex];

  const handlePrev = (e: React.MouseEvent) => {
    e.preventDefault();
    setCurrentIndex((prev) => (prev === 0 ? breakingPosts.length - 1 : prev - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.preventDefault();
    setCurrentIndex((prev) => (prev === breakingPosts.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="bg-red-600 text-white shadow-md relative z-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 overflow-hidden flex-1">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-black tracking-wider uppercase bg-white text-red-700 animate-pulse flex-shrink-0">
            <AlertCircle className="w-3.5 h-3.5" />
            {t('breaking')}
          </span>

          <Link
            to={`/article/${current.slug}`}
            className="text-xs sm:text-sm font-semibold hover:underline truncate transition-all text-white hover:text-red-100"
          >
            {current.title}
          </Link>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {breakingPosts.length > 1 && (
            <div className="flex items-center gap-1 text-xs">
              <span className="text-red-200 hidden sm:inline">
                {currentIndex + 1} of {breakingPosts.length}
              </span>
              <button
                type="button"
                onClick={handlePrev}
                aria-label="Previous breaking news"
                className="p-1 rounded hover:bg-red-700 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleNext}
                aria-label="Next breaking news"
                className="p-1 rounded hover:bg-red-700 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => setDismissed(true)}
            aria-label="Dismiss breaking news bar"
            className="p-1 rounded hover:bg-red-700 transition-colors text-red-200 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
