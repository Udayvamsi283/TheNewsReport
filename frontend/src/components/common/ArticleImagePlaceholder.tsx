import React from 'react';
import { Newspaper } from 'lucide-react';

interface ArticleImagePlaceholderProps {
  className?: string;
  category?: string;
}

export const ArticleImagePlaceholder: React.FC<ArticleImagePlaceholderProps> = ({
  className = '',
  category
}) => {
  return (
    <div
      className={`w-full h-full min-h-[140px] bg-gradient-to-br from-slate-100 via-slate-200/70 to-slate-100 dark:from-navy-900 dark:via-navy-850 dark:to-navy-900 flex flex-col items-center justify-center p-4 text-center select-none ${className}`}
    >
      <div className="w-10 h-10 rounded-full bg-slate-200/80 dark:bg-navy-800 flex items-center justify-center text-slate-400 dark:text-slate-500 mb-2">
        <Newspaper className="w-5 h-5" />
      </div>
      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
        {category || 'The News Report'}
      </span>
    </div>
  );
};
