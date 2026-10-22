import React from 'react';
import { cn } from '../../lib/utils';
import { FileQuestion } from 'lucide-react';
import { Button } from './Button';

export interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  actionLabel,
  onAction,
  className
}) => {
  return (
    <div className={cn('p-10 text-center flex flex-col items-center justify-center border border-dashed border-slate-300 dark:border-navy-700 rounded bg-slate-50/50 dark:bg-navy-900/40 my-6', className)}>
      <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-navy-800 flex items-center justify-center text-slate-500 dark:text-slate-400 mb-3.5">
        {icon || <FileQuestion className="w-6 h-6" />}
      </div>
      <h3 className="font-bold text-base text-slate-900 dark:text-white mb-1.5">{title}</h3>
      <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mb-5 leading-relaxed">{description}</p>
      {actionLabel && onAction && (
        <Button onClick={onAction} size="sm" variant="outline">
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
