import React, { useMemo } from 'react';
import { ListOrdered } from 'lucide-react';

interface TocRendererProps {
  content: string;
}

interface TocItem {
  id: string;
  text: string;
  level: number;
}

export const TocRenderer: React.FC<TocRendererProps> = ({ content }) => {
  const headings = useMemo(() => {
    if (!content) return [];
    const div = document.createElement('div');
    div.innerHTML = content;
    const elements = div.querySelectorAll('h2, h3');
    const items: TocItem[] = [];

    elements.forEach((el, index) => {
      const text = el.textContent || '';
      const id = el.id || `section-${index + 1}`;
      el.id = id;
      items.push({
        id,
        text,
        level: el.tagName === 'H2' ? 2 : 3
      });
    });

    return items;
  }, [content]);

  if (headings.length === 0) {
    return null;
  }

  const handleScrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <nav
      aria-label="Table of contents"
      className="p-5 my-6 bg-slate-50 dark:bg-navy-900 border-l-4 border-editorial-red rounded-r-lg shadow-sm"
    >
      <div className="flex items-center gap-2 mb-3 text-slate-900 dark:text-white font-bold text-sm uppercase tracking-wider">
        <ListOrdered className="w-4 h-4 text-editorial-red" />
        <span>Table of Contents</span>
      </div>
      <ul className="space-y-2 text-sm">
        {headings.map((h, i) => (
          <li
            key={i}
            className={`${h.level === 3 ? 'pl-4' : 'pl-0'} text-slate-700 dark:text-slate-300`}
          >
            <button
              onClick={() => handleScrollTo(h.id)}
              className="text-left hover:text-editorial-red dark:hover:text-editorial-red hover:underline transition-colors"
            >
              {h.text}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
};
