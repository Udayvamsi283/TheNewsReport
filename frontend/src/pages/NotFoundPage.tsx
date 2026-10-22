import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { ArrowLeft, Search, FileQuestion } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4 py-16">
      <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-navy-850 border border-slate-200 dark:border-navy-700 flex items-center justify-center text-editorial-red mb-6">
        <FileQuestion className="w-8 h-8" />
      </div>

      <div className="text-xs font-mono font-bold tracking-widest text-editorial-red dark:text-editorial-red-dark uppercase mb-2">
        Error 404 • Missing Dispatch
      </div>

      <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-slate-900 dark:text-white mb-3">
        Page Not Located
      </h1>

      <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md leading-relaxed mb-8">
        The dispatch or archive file you requested could not be found. It may have been retracted, renamed, or relocated to an alternate desk.
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link to="/">
          <Button variant="primary" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Return to Front Page
          </Button>
        </Link>
        <Link to="/search">
          <Button variant="outline" leftIcon={<Search className="w-4 h-4" />}>
            Search Editorial Archives
          </Button>
        </Link>
      </div>
    </div>
  );
};
