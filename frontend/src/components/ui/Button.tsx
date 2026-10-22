import React from 'react';
import { cn } from '../../lib/utils';
import { Spinner } from './Spinner';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none active:scale-[0.98] rounded';

    const variants = {
      primary:
        'bg-navy-900 text-white hover:bg-navy-800 focus-visible:ring-navy-900 dark:bg-white dark:text-navy-950 dark:hover:bg-slate-100 dark:focus-visible:ring-white',
      secondary:
        'bg-slate-200 text-slate-900 hover:bg-slate-300 dark:bg-navy-800 dark:text-slate-100 dark:hover:bg-navy-700 focus-visible:ring-slate-400',
      outline:
        'border border-slate-300 bg-transparent text-slate-800 hover:bg-slate-100 dark:border-navy-700 dark:text-slate-200 dark:hover:bg-navy-800 focus-visible:ring-slate-400',
      ghost:
        'bg-transparent text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-navy-800 focus-visible:ring-slate-400',
      destructive:
        'bg-editorial-red text-white hover:bg-editorial-red-hover dark:bg-editorial-red-dark focus-visible:ring-editorial-red'
    };

    const sizes = {
      sm: 'h-8 px-3 text-xs gap-1.5 min-w-[32px]',
      md: 'h-10 px-4 text-sm gap-2 min-w-[40px]',
      lg: 'h-12 px-6 text-base gap-2.5 min-w-[48px]'
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading && <Spinner size="sm" className="mr-2" />}
        {!isLoading && leftIcon && <span className="shrink-0">{leftIcon}</span>}
        <span>{children}</span>
        {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';
