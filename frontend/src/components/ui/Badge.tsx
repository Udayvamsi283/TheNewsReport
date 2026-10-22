import React from 'react';
import { cn } from '../../lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'breaking' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...props
}) => {
  const variants = {
    primary: 'bg-navy-900 text-white dark:bg-slate-100 dark:text-navy-950',
    secondary: 'bg-slate-200 text-slate-800 dark:bg-navy-800 dark:text-slate-200',
    outline: 'border border-slate-300 dark:border-navy-700 text-slate-700 dark:text-slate-300',
    breaking: 'bg-editorial-red text-white font-bold tracking-wider animate-pulse',
    danger: 'bg-editorial-red text-white font-bold tracking-wider',
    success: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800',
    warning: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
  };

  const sizes = {
    sm: 'text-[10px] px-2 py-0.5 uppercase tracking-wider font-semibold rounded-sm',
    md: 'text-xs px-2.5 py-1 uppercase tracking-wider font-semibold rounded'
  };

  return (
    <span
      className={cn('inline-flex items-center font-medium select-none', variants[variant], sizes[size], className)}
      {...props}
    >
      {children}
    </span>
  );
};
