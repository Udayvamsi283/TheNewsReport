import React from 'react';
import { cn } from '../../lib/utils';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, helperText, id, rows = 4, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
            {label}
          </label>
        )}
        <textarea
          id={inputId}
          rows={rows}
          ref={ref}
          className={cn(
            'w-full p-3 text-sm bg-white dark:bg-navy-850 text-slate-900 dark:text-slate-100 rounded border border-slate-300 dark:border-navy-700 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-colors focus:outline-none focus:ring-2 focus:ring-navy-900 dark:focus:ring-slate-300 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed',
            error && 'border-editorial-red focus:ring-editorial-red dark:border-editorial-red-dark',
            className
          )}
          {...props}
        />
        {error && <p className="mt-1 text-xs text-editorial-red dark:text-editorial-red-dark">{error}</p>}
        {!error && helperText && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{helperText}</p>}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
