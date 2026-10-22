import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../services/apiClient';
import { BreakingNewsBar } from '../components/public/BreakingNewsBar';
import { HeroStory } from '../components/public/HeroStory';
import { CategorySection } from '../components/public/CategorySection';
import { ArticleCard } from '../components/public/ArticleCard';
import { CompactArticleItem } from '../components/public/CompactArticleItem';
import { Flame, Radio, ArrowRight, Newspaper } from 'lucide-react';
import { updateSeoMetadata } from '../utils/seo';
import { useLanguage } from '../context/LanguageContext';

export const HomePage: React.FC = () => {
  const [feedFilter, setFeedFilter] = useState<'for-you' | 'all'>('for-you');
  const { currentLanguage, t } = useLanguage();

  // Dynamic SEO metadata
  useEffect(() => {
    updateSeoMetadata({
      title: 'The News Report — Multilingual Digital Journalism',
      description: 'Authoritative, independent, and multilingual digital journalism covering global affairs, national developments, technology, and business.',
      url: window.location.origin
    });
  }, []);

  // Fetch Homepage Curation from backend
  const { data: homeData, isLoading: homeLoading } = useQuery({
    queryKey: ['public', 'home', currentLanguage],
    queryFn: () => apiClient.getHomepageData({ lang: currentLanguage })
  });

  // Fetch Continuous wire feed
  const { data: feedData } = useQuery({
    queryKey: ['public', 'feed', feedFilter, currentLanguage],
    queryFn: () => apiClient.getFeed({ limit: 8, language: currentLanguage })
  });

  // Fetch Trending stories (7-day window)
  const { data: trendingPosts = [] } = useQuery({
    queryKey: ['public', 'trending', currentLanguage],
    queryFn: () => apiClient.getTrendingPosts({ limit: 5, lang: currentLanguage })
  });

  if (homeLoading && !homeData) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-pulse">
        <div className="h-96 bg-slate-200 dark:bg-navy-900 rounded-3xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 bg-slate-200 dark:bg-navy-900 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  const heroStory = homeData?.heroStory;
  const breakingNews = homeData?.breakingNews || [];
  const featuredArticles = homeData?.featuredArticles || [];
  const categorySections = homeData?.categorySections || [];
  const feedPosts = feedData?.posts || [];

  const hasContent = Boolean(heroStory) || featuredArticles.length > 0 || feedPosts.length > 0;

  return (
    <div className="space-y-12 pb-16">
      {/* 1. Breaking News Alert Bar (Visible ONLY if real breaking posts exist) */}
      {breakingNews.length > 0 && <BreakingNewsBar breakingPosts={breakingNews} />}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {!hasContent ? (
          /* Empty state when 0 posts exist in database */
          <div className="py-24 text-center max-w-lg mx-auto space-y-3">
            <Newspaper className="w-12 h-12 text-slate-300 dark:text-navy-700 mx-auto" />
            <h2 className="text-xl font-bold font-serif text-navy-900 dark:text-white">
              {t('noStoriesPublished')}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t('emptyStateHelp')}
            </p>
          </div>
        ) : (
          <>
            {/* 2. Lead Hero Story */}
            {heroStory && (
              <section aria-label="Lead Story">
                <HeroStory post={heroStory} />
              </section>
            )}

            {/* 3. Primary Editorial Area & Trending Module */}
            {(featuredArticles.length > 0 || trendingPosts.length > 0 || feedPosts.length > 0) && (
              <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Main Editorial Column (8 Cols) */}
                <div className="lg:col-span-8 space-y-10">
                  {/* Featured Stories */}
                  {featuredArticles.length > 0 && (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between border-b-2 border-slate-200 dark:border-navy-750 pb-3">
                        <div className="flex items-center gap-3">
                          <span className="w-2.5 h-2.5 rounded-full bg-editorial-red" />
                          <h3 className="text-xl sm:text-2xl font-black font-serif text-navy-900 dark:text-white">
                            {t('featuredStories')}
                          </h3>
                        </div>
                        <Link
                          to="/latest"
                          className="text-xs font-bold uppercase tracking-wider text-editorial-red dark:text-editorial-red-dark hover:underline flex items-center gap-1"
                        >
                          <span>{t('fullWire')}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {featuredArticles.map((post) => (
                          <ArticleCard key={post._id} post={post} variant="grid" />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Wire Dispatches Stream */}
                  {feedPosts.length > 0 && (
                    <div className="space-y-6 pt-4 border-t border-slate-200/80 dark:border-navy-800">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-slate-200 dark:border-navy-750 pb-3">
                        <div className="flex items-center gap-2.5">
                          <Radio className="w-4 h-4 text-editorial-red animate-pulse" />
                          <h3 className="text-xl sm:text-2xl font-black font-serif text-navy-900 dark:text-white">
                            {t('latestDispatches')}
                          </h3>
                        </div>

                        <div className="flex items-center gap-1 bg-slate-200/80 dark:bg-navy-800 p-1 rounded-xl text-xs font-semibold self-start sm:self-auto">
                          <button
                            type="button"
                            onClick={() => setFeedFilter('for-you')}
                            className={`px-3 py-1.5 rounded-lg transition-all ${
                              feedFilter === 'for-you'
                                ? 'bg-white dark:bg-navy-900 text-editorial-red dark:text-editorial-red-dark shadow-xs font-bold'
                                : 'text-slate-600 dark:text-slate-400 hover:text-navy-900 dark:hover:text-white'
                            }`}
                          >
                            {t('forYou')}
                          </button>
                          <button
                            type="button"
                            onClick={() => setFeedFilter('all')}
                            className={`px-3 py-1.5 rounded-lg transition-all ${
                              feedFilter === 'all'
                                ? 'bg-white dark:bg-navy-900 text-editorial-red dark:text-editorial-red-dark shadow-xs font-bold'
                                : 'text-slate-600 dark:text-slate-400 hover:text-navy-900 dark:hover:text-white'
                            }`}
                          >
                            {t('chronological')}
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        {feedPosts.slice(0, 4).map((post) => (
                          <ArticleCard key={post._id} post={post} variant="grid" />
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Sidebar Column (4 Cols): Trending News This Week & Editorial Desk */}
                <div className="lg:col-span-4 space-y-6">
                  {trendingPosts.length > 0 && (
                    <div className="rounded-2xl border border-slate-200/90 dark:border-navy-700/80 bg-white dark:bg-navy-900 p-5 shadow-xs space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-100 dark:border-navy-800 pb-3">
                        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">
                          <Flame className="w-4 h-4 fill-amber-500/20 text-amber-500" />
                          <span>{t('trendingThisWeek')}</span>
                        </div>
                        <Link
                          to="/trending"
                          className="text-xs font-bold uppercase tracking-wider text-editorial-red dark:text-editorial-red-dark hover:underline"
                        >
                          {t('top10')}
                        </Link>
                      </div>

                      <div className="divide-y divide-slate-100 dark:divide-navy-800/80">
                        {trendingPosts.map((post, idx) => (
                          <CompactArticleItem
                            key={post._id}
                            post={post}
                            rank={idx + 1}
                            imageSize="md"
                            showEngagement={true}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Editorial Mission Card to balance vertical space */}
                  <div className="rounded-2xl border border-slate-200/90 dark:border-navy-700/80 bg-slate-100/60 dark:bg-navy-900/60 p-5 space-y-3">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                      {t('editorialCharter')}
                    </span>
                    <h4 className="text-base font-bold font-serif text-navy-900 dark:text-white leading-snug">
                      {t('charterHeadline')}
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
                      {t('charterBody')}
                    </p>
                    <div className="pt-2 flex items-center justify-between text-xs font-bold">
                      <Link to="/latest" className="text-editorial-red hover:underline">
                        {t('exploreFullArchive')}
                      </Link>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* 4. Category-Curated Sections */}
            {categorySections.map((sec) => (
              <CategorySection key={sec.category._id} category={sec.category} posts={sec.posts} />
            ))}

            {/* 5. Additional Feed Stories (if feed has more than 4 stories) */}
            {feedPosts.length > 4 && (
              <section className="pt-8 border-t border-slate-200 dark:border-navy-800">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <span className="w-2.5 h-2.5 rounded-full bg-editorial-red" />
                    <h3 className="text-2xl font-black font-serif text-navy-900 dark:text-white">
                      {t('moreStoriesFromToday')}
                    </h3>
                  </div>
                  <Link
                    to="/latest"
                    className="text-xs font-bold uppercase tracking-wider text-editorial-red hover:underline"
                  >
                    {t('viewAll')}
                  </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {feedPosts.slice(4, 8).map((post) => (
                    <ArticleCard key={post._id} post={post} variant="grid" />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
};
