import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../services/apiClient';
import { Flame, Tag as TagIcon } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { cn } from '../../lib/utils';
import { Tag } from '../../types';

interface TrendingTagsWidgetProps {
  className?: string;
  articleTags?: Tag[];
  limit?: number;
}

export const TrendingTagsWidget: React.FC<TrendingTagsWidgetProps> = ({
  className,
  articleTags = [],
  limit = 10
}) => {
  const { t } = useLanguage();

  const { data: dbTags } = useQuery({
    queryKey: ['public', 'tags-trending-widget'],
    queryFn: () => apiClient.getTags(),
    staleTime: 1000 * 60 * 10
  });

  // Prioritize tags related to active article, followed by published tags in database
  const combinedTags = React.useMemo(() => {
    const seen = new Set<string>();
    const list: Array<{ name: string; slug: string }> = [];

    // Add article tags first
    for (const tag of articleTags) {
      const name = typeof tag === 'string' ? tag : tag.name;
      const slug = typeof tag === 'string' ? tag : tag.slug || tag.name;
      if (name && !seen.has(name.toLowerCase())) {
        seen.add(name.toLowerCase());
        list.push({ name, slug });
      }
    }

    // Add general tags from database
    for (const tag of dbTags || []) {
      if (tag.name && !seen.has(tag.name.toLowerCase())) {
        seen.add(tag.name.toLowerCase());
        list.push({ name: tag.name, slug: tag.slug || tag.name });
      }
    }

    return list.slice(0, limit);
  }, [articleTags, dbTags, limit]);

  if (combinedTags.length === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        'rounded-2xl border border-slate-200/90 dark:border-navy-700/80 bg-white dark:bg-navy-900 p-4 sm:p-5 shadow-xs space-y-3',
        className
      )}
    >
      <div className="flex items-center gap-2 border-b border-slate-100 dark:border-navy-800 pb-3 text-xs font-black uppercase tracking-wider text-navy-900 dark:text-white">
        <Flame className="w-4 h-4 text-editorial-red" />
        <span>{t('trendingTopics')}</span>
      </div>

      <div className="flex flex-wrap gap-2 pt-1">
        {combinedTags.map((tag) => (
          <Link
            key={tag.name}
            to={`/search?q=${encodeURIComponent(tag.name)}`}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100/80 dark:bg-navy-800/80 hover:bg-editorial-red/10 hover:text-editorial-red dark:hover:bg-editorial-red/20 dark:hover:text-editorial-red-dark text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-navy-700/60 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-editorial-red"
          >
            <TagIcon className="w-3 h-3 text-slate-400 group-hover:text-editorial-red" />
            <span>#{tag.name}</span>
          </Link>
        ))}
      </div>
    </div>
  );
};
