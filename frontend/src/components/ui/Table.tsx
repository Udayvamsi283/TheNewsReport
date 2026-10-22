import React from 'react';
import { cn } from '../../lib/utils';

export const Table: React.FC<React.TableHTMLAttributes<HTMLTableElement>> = ({ className, ...props }) => (
  <div className="w-full overflow-x-auto rounded border border-slate-200 dark:border-navy-700">
    <table className={cn('w-full text-left text-sm text-slate-800 dark:text-slate-200', className)} {...props} />
  </div>
);

export const TableHeader: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({ className, ...props }) => (
  <thead className={cn('bg-slate-100 dark:bg-navy-800 border-b border-slate-200 dark:border-navy-700 text-xs uppercase font-semibold text-slate-600 dark:text-slate-300 tracking-wider', className)} {...props} />
);

export const TableBody: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({ className, ...props }) => (
  <tbody className={cn('divide-y divide-slate-200 dark:divide-navy-700 bg-white dark:bg-navy-850', className)} {...props} />
);

export const TableRow: React.FC<React.HTMLAttributes<HTMLTableRowElement>> = ({ className, ...props }) => (
  <tr className={cn('hover:bg-slate-50 dark:hover:bg-navy-800/50 transition-colors', className)} {...props} />
);

export const TableHead: React.FC<React.ThHTMLAttributes<HTMLTableCellElement>> = ({ className, ...props }) => (
  <th className={cn('px-4 py-3 font-semibold text-xs text-slate-700 dark:text-slate-300', className)} {...props} />
);

export const TableCell: React.FC<React.TdHTMLAttributes<HTMLTableCellElement>> = ({ className, ...props }) => (
  <td className={cn('px-4 py-3 text-sm text-slate-800 dark:text-slate-200 align-middle', className)} {...props} />
);
