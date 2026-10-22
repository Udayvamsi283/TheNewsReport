import React from 'react';
import { OFFICIAL_SOCIAL_LINKS } from '../../config/social';
import { useLanguage } from '../../context/LanguageContext';
import { cn } from '../../lib/utils';

interface SocialFollowBarProps {
  className?: string;
  variant?: 'sidebar' | 'inline';
}

export const SocialFollowBar: React.FC<SocialFollowBarProps> = ({
  className,
  variant = 'sidebar'
}) => {
  const { t } = useLanguage();

  const renderIcon = (id: string) => {
    switch (id) {
      case 'x':
        return (
          <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
        );
      case 'facebook':
        return (
          <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
          </svg>
        );
      case 'youtube':
        return (
          <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
          </svg>
        );
      case 'linkedin':
        return (
          <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451c.979 0 1.778-.773 1.778-1.729V1.73C24 .774 23.205 0 22.225 0z" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div
      className={cn(
        'rounded-2xl border border-slate-200/90 dark:border-navy-700/80 bg-white dark:bg-navy-900 p-4 sm:p-5 shadow-xs',
        className
      )}
    >
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-navy-800 pb-3 mb-3.5">
        <span className="text-xs font-black uppercase tracking-wider text-navy-900 dark:text-white">
          {t('followUs')}
        </span>
        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-sans">
          The News Report
        </span>
      </div>

      <div
        className={cn(
          'grid gap-2',
          variant === 'sidebar' ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-4'
        )}
      >
        {OFFICIAL_SOCIAL_LINKS.map((item) => (
          <a
            key={item.id}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={item.label}
            title={item.label}
            className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200/70 dark:border-navy-750 bg-slate-50/70 dark:bg-navy-800/50 hover:bg-white dark:hover:bg-navy-750 hover:border-slate-300 dark:hover:border-navy-600 text-slate-700 dark:text-slate-300 hover:text-editorial-red dark:hover:text-editorial-red-dark transition-all text-xs font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-editorial-red"
          >
            <span className="flex-shrink-0 text-slate-600 dark:text-slate-400 group-hover:text-editorial-red">
              {renderIcon(item.id)}
            </span>
            <span className="truncate">{item.name}</span>
          </a>
        ))}
      </div>
    </div>
  );
};
