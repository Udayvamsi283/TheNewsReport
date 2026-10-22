import React from 'react';

interface SortedListItem {
  itemNumber: number;
  title: string;
  content?: string;
  image?: string;
}

interface SortedListRendererProps {
  items: SortedListItem[];
}

export const SortedListRenderer: React.FC<SortedListRendererProps> = ({ items }) => {
  if (!items || items.length === 0) {
    return null;
  }

  // Sort items by itemNumber ascending
  const sorted = [...items].sort((a, b) => a.itemNumber - b.itemNumber);

  return (
    <div className="space-y-10 my-10 border-t border-slate-200 dark:border-navy-800 pt-8">
      {sorted.map((item) => (
        <article
          key={item.itemNumber}
          className="relative pl-14 sm:pl-16 space-y-4 border-b border-slate-100 dark:border-navy-900 pb-8 last:border-b-0"
        >
          {/* Item Number Badge */}
          <div className="absolute left-0 top-0 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-editorial-red text-white flex items-center justify-center font-serif font-black text-xl shadow-sm">
            {item.itemNumber}
          </div>

          <h3 className="text-xl sm:text-2xl font-serif font-bold text-slate-900 dark:text-white leading-tight">
            {item.title}
          </h3>

          {item.image && (
            <div className="rounded-lg overflow-hidden border border-slate-200 dark:border-navy-800 aspect-[16/9] bg-slate-100 dark:bg-navy-900">
              <img
                src={item.image}
                alt={item.title}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
          )}

          {item.content && (
            <div className="prose dark:prose-invert max-w-none text-slate-700 dark:text-slate-300 leading-relaxed">
              <p>{item.content}</p>
            </div>
          )}
        </article>
      ))}
    </div>
  );
};
