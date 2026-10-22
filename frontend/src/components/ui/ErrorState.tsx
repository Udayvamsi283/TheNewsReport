import React from 'react';
import { cn } from '../../lib/utils';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from './Button';

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  message = 'An error occurred while loading this section. Please try again.',
  onRetry,
  className
}) => {
  return (
    <div className={cn('p-8 text-center flex flex-col items-center justify-center border border-red-200 dark:border-red-950 bg-red-50/50 dark:bg-red-950/20 rounded my-6', className)}>
      <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-950 flex items-center justify-center text-editorial-red mb-3.5">
        <AlertTriangle className="w-6 h-6" />
      </div>
      <h3 className="font-bold text-base text-slate-900 dark:text-white mb-1.5">{title}</h3>
      <p className="text-xs text-slate-600 dark:text-slate-400 max-w-sm mb-5 leading-relaxed">{message}</p>
      {onRetry && (
        <Button onClick={onRetry} size="sm" variant="outline" leftIcon={<RefreshCw className="w-3.5 h-3.5" />}>
          Try Again
        </Button>
      )}
    </div>
  );
};
