import React from 'react';
import { cn } from '../../lib/utils';
import { Check } from 'lucide-react';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  description?: string;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, description, id, checked, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <label htmlFor={inputId} className="inline-flex items-start gap-3 cursor-pointer select-none group">
        <div className="relative flex items-center justify-center mt-0.5">
          <input
            id={inputId}
            type="checkbox"
            ref={ref}
            checked={checked}
            className="peer sr-only"
            {...props}
          />
          <div
            className={cn(
              'w-4 h-4 rounded border border-slate-300 dark:border-navy-700 bg-white dark:bg-navy-850 peer-checked:bg-navy-900 peer-checked:border-navy-900 dark:peer-checked:bg-white dark:peer-checked:border-white transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-navy-900 dark:peer-focus-visible:ring-slate-200 flex items-center justify-center',
              className
            )}
          >
            <Check className="w-3 h-3 text-white dark:text-navy-950 opacity-0 peer-checked:opacity-100 transition-opacity" />
          </div>
        </div>
        {(label || description) && (
          <div className="flex flex-col text-sm">
            {label && <span className="font-medium text-slate-800 dark:text-slate-200">{label}</span>}
            {description && <span className="text-xs text-slate-500 dark:text-slate-400">{description}</span>}
          </div>
        )}
      </label>
    );
  }
);

Checkbox.displayName = 'Checkbox';
