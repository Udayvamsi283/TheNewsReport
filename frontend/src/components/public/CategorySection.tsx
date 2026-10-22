import React from 'react';
import { Link } from 'react-router-dom';
import { Category, Post } from '../../types';
import { ArrowRight, Clock, Lock } from 'lucide-react';
import { ArticleImagePlaceholder } from '../common/ArticleImagePlaceholder';
import { useLanguage } from '../../context/LanguageContext';

interface CategorySectionProps {
  category: Category;
  posts: Post[];
}

export const CategorySection: React.FC<CategorySectionProps> = ({ category, posts }) => {
  const { t, getCategoryName } = useLanguage();
  if (!posts || posts.length === 0) return null;

  const categoryTitle = getCategoryName(category.slug, category.name);

  return (
    <section className="my-12">
      {/* Section Header */}
      <div className="flex items-center justify-between border-b-2 border-editorial-red pb-3 mb-8">
        <div className="flex items-center gap-3">
          <span className="w-2.5 h-2.5 rounded-full bg-editorial-red" />
          <h3 className="text-2xl font-black font-serif text-navy-900 dark:text-white tracking-tight">
            {categoryTitle}
          </h3>
        </div>
        <Link
          to={`/category/${category.slug}`}
          className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-editorial-red dark:text-editorial-red-dark hover:underline transition-colors"
        >
          <span>{t('moreIn')} {categoryTitle}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Posts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts.slice(0, 6).map((post) => {
          const imageUrl = post.featuredImage?.url || post.images?.[0]?.url || '';
          const publishedDate = post.publishedAt
            ? new Date(post.publishedAt).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric'
              })
            : '';

          return (
            <article
              key={post._id}
              className="group flex flex-col justify-between rounded-2xl border border-slate-200/90 dark:border-navy-700/80 bg-white dark:bg-navy-900 overflow-hidden shadow-xs hover:border-slate-300 dark:hover:border-navy-600 hover:shadow-md transition-all duration-200"
            >
              <div>
                <div className="relative aspect-[16/10] overflow-hidden bg-slate-100 dark:bg-navy-800">
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={post.featuredImage?.alt || post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                      loading="lazy"
                    />
                  ) : (
                    <ArticleImagePlaceholder category={categoryTitle} className="h-full aspect-[16/10]" />
                  )}
                  {post.registeredOnly && (
                    <div className="absolute top-3 left-3 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-navy-950/85 backdrop-blur text-amber-300 border border-amber-400/20">
                      <Lock className="w-3 h-3" /> {t('exclusive')}
                    </div>
                  )}
                  {post.postFormat && post.postFormat !== 'article' && (
                    <div className="absolute bottom-3 right-3 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-black/75 backdrop-blur text-white">
                      {post.postFormat.replace('_', ' ')}
                    </div>
                  )}
                </div>

                <div className="p-5">
                  <h4 className="text-base sm:text-lg font-bold font-serif text-navy-900 dark:text-white leading-snug group-hover:text-editorial-red dark:group-hover:text-editorial-red-dark transition-colors line-clamp-2 mb-2">
                    <Link to={`/article/${post.slug}`} className="focus:outline-none">
                      {post.title}
                    </Link>
                  </h4>

                  {post.summary && (
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                      {post.summary}
                    </p>
                  )}
                </div>
              </div>

              <div className="px-5 pb-5 pt-0 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-navy-800/60 pt-3">
                <span className="font-medium text-slate-700 dark:text-slate-300 truncate max-w-[140px]">
                  {post.author?.name || t('theNewsReport')}
                </span>
                <span className="flex items-center gap-1 font-mono text-[11px]">
                  <Clock className="w-3 h-3 text-slate-400" />
                  {publishedDate}
                </span>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
};
