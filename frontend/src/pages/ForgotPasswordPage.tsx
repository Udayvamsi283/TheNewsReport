import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, KeyRound } from 'lucide-react';

export const ForgotPasswordPage: React.FC = () => {
  return (
    <div className="max-w-md mx-auto py-8 sm:py-16">
      <div className="bg-white dark:bg-navy-850 p-6 sm:p-8 rounded border border-slate-200 dark:border-navy-700 shadow-sm space-y-6">
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-baseline gap-1 focus:outline-none">
            <span className="text-2xl font-black uppercase tracking-tight text-navy-900 dark:text-white">
              THE NEWS REPORT
            </span>
            <span className="w-2 h-2 rounded-full bg-editorial-red inline-block" />
          </Link>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            Password Assistance
          </h1>
        </div>

        <div className="p-4 rounded bg-slate-50 dark:bg-navy-900 border border-slate-200 dark:border-navy-750 text-xs text-slate-600 dark:text-slate-300 space-y-3">
          <div className="flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-200">
            <KeyRound className="w-4 h-4 text-editorial-red shrink-0" />
            <span>Account Recovery</span>
          </div>
          <p className="leading-relaxed">
            Automated password reset is currently unavailable. Please contact the system administrator to reset your credentials.
          </p>
        </div>

        <div className="pt-4 border-t border-slate-100 dark:border-navy-750 text-center text-xs">
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-slate-600 hover:text-navy-900 dark:text-slate-400 dark:hover:text-white font-medium transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Sign In</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
