import React from 'react';
import { NavLink } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../services/apiClient';
import { cn } from '../../lib/utils';
import { Flame, Radio, Film } from 'lucide-react';

import { useLanguage } from '../../context/LanguageContext';

export interface NavbarProps {
  className?: string;
  onItemClick?: () => void;
  orientation?: 'horizontal' | 'vertical';
}

export const Navbar: React.FC<NavbarProps> = ({
  className,
  onItemClick,
  orientation = 'horizontal'
}) => {
  const isHorizontal = orientation === 'horizontal';
  const { t, getCategoryName } = useLanguage();

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: () => apiClient.getCategories(),
    staleTime: 5 * 60 * 1000
  });

  const activeCategories = categories.filter((c) => c.status === 'active');

  const baseNavLinkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      'text-xs font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-lg transition-all whitespace-nowrap flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-editorial-red',
      isActive
        ? 'bg-editorial-red text-white shadow-sm font-extrabold'
        : 'text-slate-700 hover:text-navy-900 hover:bg-slate-200/80 dark:text-slate-300 dark:hover:text-white dark:hover:bg-navy-800'
    );

  return (
    <nav
      aria-label="Main Navigation"
      className={cn(
        isHorizontal
          ? 'overflow-x-auto no-scrollbar flex items-center justify-start md:justify-center py-2 px-4 max-w-7xl mx-auto'
          : 'flex flex-col space-y-1',
        className
      )}
    >
      <div className={cn(isHorizontal ? 'flex items-center space-x-1 sm:space-x-1.5' : 'flex flex-col space-y-1')}>
        <NavLink to="/" onClick={onItemClick} end className={baseNavLinkClass}>
          {t('frontPage')}
        </NavLink>

        <NavLink to="/latest" onClick={onItemClick} className={baseNavLinkClass}>
          <Radio className="w-3 h-3 text-red-500 animate-pulse" />
          <span>{t('latest')}</span>
        </NavLink>

        <NavLink to="/trending" onClick={onItemClick} className={baseNavLinkClass}>
          <Flame className="w-3 h-3 text-amber-500" />
          <span>{t('trending')}</span>
        </NavLink>

        <NavLink to="/videos" onClick={onItemClick} className={baseNavLinkClass}>
          <Film className="w-3 h-3 text-blue-500" />
          <span>{t('videos')}</span>
        </NavLink>

        {activeCategories.slice(0, 6).map((category) => (
          <NavLink
            key={category._id}
            to={`/category/${category.slug}`}
            onClick={onItemClick}
            className={baseNavLinkClass}
          >
            {getCategoryName(category.slug, category.name)}
          </NavLink>
        ))}
      </div>
    </nav>
  );
};
