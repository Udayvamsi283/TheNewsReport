import React, { useEffect, useMemo } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../services/apiClient';
import {
  Share2,
  ChevronRight,
  ArrowLeft,
  Lock,
  Globe,
  Tag as TagIcon,
  HelpCircle,
  Clock,
  Sparkles,
  Radio
} from 'lucide-react';
import { LikeButton } from '../components/public/engagement/LikeButton';
import { BookmarkButton } from '../components/public/engagement/BookmarkButton';
import { CommentSection } from '../components/public/engagement/CommentSection';
import { GalleryRenderer } from '../components/public/format-renderers/GalleryRenderer';
import { SortedListRenderer } from '../components/public/format-renderers/SortedListRenderer';
import { TocRenderer } from '../components/public/format-renderers/TocRenderer';
import { VideoRenderer } from '../components/public/format-renderers/VideoRenderer';
import { AudioRenderer } from '../components/public/format-renderers/AudioRenderer';
import { PollRenderer } from '../components/public/format-renderers/PollRenderer';
import { EventRenderer } from '../components/public/format-renderers/EventRenderer';
import { CompactArticleItem } from '../components/public/CompactArticleItem';
import { ArticleCard } from '../components/public/ArticleCard';
import { ArticleNavigation } from '../components/public/ArticleNavigation';
import { TrendingTagsWidget } from '../components/public/TrendingTagsWidget';
import { SocialFollowBar } from '../components/public/SocialFollowBar';
import { updateSeoMetadata } from '../utils/seo';
import { useToast } from '../components/ui/Toast';
import { Avatar } from '../components/ui/Avatar';
import { useLanguage } from '../context/LanguageContext';

export const ArticlePage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { currentLanguage, t, getCategoryName } = useLanguage();
  const explicitLang = searchParams.get('lang');
  const effectiveLang = explicitLang || currentLanguage;
  const { showToast } = useToast();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['public', 'post', slug, effectiveLang],
    queryFn: () => apiClient.getPostBySlug(slug!, effectiveLang),
    enabled: !!slug
  });

  const post = data?.post;
  const isGated = data?.isGated ?? false;

  // Record view on mount & update dynamic SEO metadata
  useEffect(() => {
    if (post?._id) {
      apiClient.recordView(post._id);
      updateSeoMetadata({
        title: post.title,
        description: post.summary || post.seo?.metaDescription || '',
        image: post.featuredImage?.url || post.images?.[0]?.url || '',
        type: 'article'
      });
    }
  }, [post?._id, post?.title, post?.summary]);

  // Fetch category stories for related reading
  const { data: categoryData } = useQuery({
    queryKey: ['public', 'category-posts-sidebar', post?.category?.slug, effectiveLang],
    queryFn: () => apiClient.getCategoryPosts(post!.category!.slug, { limit: 8, lang: effectiveLang }),
    enabled: !!post?.category?.slug
  });

  // Fetch latest stories for reading sidebar
  const { data: latestData } = useQuery({
    queryKey: ['public', 'latest-posts-sidebar', effectiveLang],
    queryFn: () => apiClient.getLatestPosts({ limit: 6, lang: effectiveLang }),
    enabled: !!post
  });

  // Deterministic recommendations:
  // Priority 1: Same category + overlapping tags
  // Priority 2: Same category
  // Priority 3: Latest published articles (excluding current and already chosen related)
  const relatedArticles = useMemo(() => {
    if (!post) return [];
    if (data?.relatedPosts && data.relatedPosts.length > 0) {
      return data.relatedPosts.filter((p) => p._id !== post._id && p.slug !== post.slug);
    }
    const currentPostTags = (post.tags || []).map((t: any) =>
      (typeof t === 'string' ? t : t.name || t.slug || '').toLowerCase()
    );

    const categoryList = (categoryData?.posts || []).filter(
      (p) => p._id !== post._id && p.slug !== post.slug
    );

    const sorted = [...categoryList].sort((a, b) => {
      const aTags = (a.tags || []).map((t: any) =>
        (typeof t === 'string' ? t : t.name || t.slug || '').toLowerCase()
      );
      const bTags = (b.tags || []).map((t: any) =>
        (typeof t === 'string' ? t : t.name || t.slug || '').toLowerCase()
      );
      const aOverlap = aTags.filter((t: string) => currentPostTags.includes(t)).length;
      const bOverlap = bTags.filter((t: string) => currentPostTags.includes(t)).length;
      return bOverlap - aOverlap;
    });

    return sorted.slice(0, 4);
  }, [post, data?.relatedPosts, categoryData]);

  const latestArticles = useMemo(() => {
    if (!post) return [];
    const relatedIds = new Set(relatedArticles.map((p) => p._id));
    return (latestData?.posts || [])
      .filter((p) => p._id !== post._id && p.slug !== post.slug && !relatedIds.has(p._id))
      .slice(0, 4);
  }, [post, latestData, relatedArticles]);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-pulse">
          <div className="lg:col-span-8 space-y-6">
            <div className="h-6 w-32 bg-slate-200 dark:bg-navy-800 rounded" />
            <div className="h-12 bg-slate-200 dark:bg-navy-800 rounded-xl w-3/4" />
            <div className="h-96 bg-slate-200 dark:bg-navy-800 rounded-3xl" />
            <div className="space-y-3">
              <div className="h-4 bg-slate-200 dark:bg-navy-800 rounded" />
              <div className="h-4 bg-slate-200 dark:bg-navy-800 rounded w-5/6" />
            </div>
          </div>
          <div className="hidden lg:block lg:col-span-4 space-y-4">
            <div className="h-64 bg-slate-200 dark:bg-navy-800 rounded-2xl" />
            <div className="h-64 bg-slate-200 dark:bg-navy-800 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !post) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-24 text-center">
        <h1 className="text-3xl font-bold font-serif text-navy-900 dark:text-white mb-3">
          Dispatch Not Located
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
          The requested article could not be located in The News Report archives.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white bg-navy-900 hover:bg-navy-800 dark:bg-white dark:text-navy-950 shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Front Page</span>
        </Link>
      </div>
    );
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: post.title,
          text: post.summary || '',
          url: window.location.href
        });
      } catch {
        // Ignored
      }
    } else {
      await navigator.clipboard.writeText(window.location.href);
      showToast('Link copied to clipboard', 'info');
    }
  };

  const handleLanguageChange = (newLangCode: string) => {
    if (!newLangCode || newLangCode === 'en') {
      searchParams.delete('lang');
      setSearchParams(searchParams);
    } else {
      searchParams.set('lang', newLangCode);
      setSearchParams(searchParams);
    }
  };

  const publishedDate = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString(undefined, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      })
    : '';

  const wordCount = post.content
    ? post.content.split(/\s+/).length
    : post.summary
    ? post.summary.split(/\s+/).length * 4
    : 200;
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

  const imageUrl =
    post.featuredImage?.url ||
    post.images?.[0]?.url ||
    (post.postFormat === 'gallery' && post.galleryItems?.[0]?.image) ||
    '';

  const availableTranslations = post.translations || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* 1. Breadcrumbs & Language Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/80 dark:border-navy-800 pb-4 mb-8">
        <nav aria-label="Breadcrumbs" className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <Link to="/" className="hover:text-navy-900 dark:hover:text-white flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{t('home')}</span>
          </Link>
          <ChevronRight className="w-3 h-3 text-slate-300 dark:text-navy-700" />
          {post.category && (
            <Link
              to={`/category/${post.category.slug}`}
              className="font-bold uppercase tracking-wider text-editorial-red dark:text-editorial-red-dark hover:underline"
            >
              {getCategoryName(post.category.slug, post.category.name)}
            </Link>
          )}
        </nav>

        {/* Translation Switcher */}
        {availableTranslations.length > 0 && (
          <div className="flex items-center gap-2 text-xs">
            <Globe className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-500 dark:text-slate-400 font-medium">Edition:</span>
            <button
              type="button"
              onClick={() => handleLanguageChange('en')}
              className={`px-2 py-0.5 rounded font-bold uppercase transition-colors ${
                effectiveLang === 'en'
                  ? 'bg-editorial-red text-white'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-800'
              }`}
            >
              EN
            </button>
            {availableTranslations.map((tr) => (
              <button
                key={tr.slug || tr.languageCode}
                type="button"
                onClick={() => handleLanguageChange(tr.languageCode)}
                className={`px-2 py-0.5 rounded font-bold uppercase transition-colors ${
                  effectiveLang === tr.languageCode
                    ? 'bg-editorial-red text-white'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-800'
                }`}
              >
                {tr.languageCode}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main 12-Column Editorial Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* Main Article Content (Col 8) */}
        <article className="lg:col-span-8 min-w-0 space-y-8">
          {/* Article Header */}
          <header className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              {post.category && (
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-editorial-red/10 text-editorial-red dark:bg-editorial-red/20 dark:text-editorial-red-dark">
                  {post.category.name}
                </span>
              )}
              {post.postFormat && post.postFormat !== 'article' && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-navy-900 text-white dark:bg-slate-100 dark:text-navy-950">
                  {post.postFormat.replace('_', ' ')}
                </span>
              )}
              {post.registeredOnly && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300">
                  <Lock className="w-3 h-3" /> Exclusive
                </span>
              )}
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black font-serif text-navy-900 dark:text-white leading-[1.15]">
              {post.title}
            </h1>

            {post.summary && (
              <p className="text-lg sm:text-xl text-slate-700 dark:text-slate-300 font-serif leading-relaxed italic border-l-4 border-editorial-red pl-4 py-1">
                {post.summary}
              </p>
            )}

            {/* Byline & Engagement Row */}
            <div className="pt-4 border-y border-slate-200 dark:border-navy-800 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Avatar src={post.author?.avatar} name={post.author?.name} size="md" />
                <div>
                  <div className="text-sm font-bold text-navy-900 dark:text-white">
                    {t('by')} {post.author?.name || t('theNewsReport')}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                    <span>{publishedDate}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1 font-mono">
                      <Clock className="w-3 h-3" /> {readingTime} {t('minRead')}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <LikeButton
                  postId={post._id}
                  initialLikeCount={post.likeCount || 0}
                  initialIsLiked={post.isLiked || false}
                />
                <BookmarkButton
                  postId={post._id}
                  initialIsBookmarked={post.isBookmarked || false}
                />
                <button
                  type="button"
                  onClick={handleShare}
                  title={t('shareStory')}
                  aria-label={t('shareStory')}
                  className="p-2 rounded-full border border-slate-200 dark:border-navy-750 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-navy-800 transition-colors"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </header>

          {/* Featured Image */}
          {imageUrl && post.postFormat !== 'video' && (
            <figure className="space-y-2">
              <div className="rounded-3xl overflow-hidden bg-slate-100 dark:bg-navy-800 aspect-[16/9] shadow-md">
                <img
                  src={imageUrl}
                  alt={post.featuredImage?.alt || post.title}
                  className="w-full h-full object-cover"
                />
              </div>
              {post.featuredImage?.caption && (
                <figcaption className="text-xs text-slate-500 dark:text-slate-400 px-2 font-sans italic">
                  {post.featuredImage.caption}
                </figcaption>
              )}
            </figure>
          )}

          {/* Format-Specific Content & Server-Side Registered Gating */}
          <section className="article-body">
            {isGated ? (
              <div className="my-8 border-t-2 border-b-2 border-editorial-red bg-white dark:bg-navy-900 p-6 md:p-8 rounded-2xl shadow-sm">
                <div className="max-w-2xl mx-auto space-y-4">
                  <div className="flex items-center gap-2 text-editorial-red dark:text-editorial-red-dark font-sans font-bold text-xs uppercase tracking-widest">
                    <Lock className="w-3.5 h-3.5" />
                    <span>Reader Account Required</span>
                  </div>

                  <h2 className="text-xl md:text-2xl font-serif font-bold text-navy-900 dark:text-white leading-tight">
                    Continue reading this story with free reader access
                  </h2>

                  <p className="text-sm text-slate-600 dark:text-slate-400 font-sans leading-relaxed">
                    This report is reserved for registered readers of The News Report. Create a free account or sign in to access full reporting, participate in discussions, and save stories.
                  </p>

                  <div className="pt-2 flex flex-wrap items-center gap-3">
                    <Link
                      to="/login"
                      className="px-5 py-2 rounded font-sans text-xs font-semibold text-white bg-navy-900 hover:bg-navy-800 dark:bg-white dark:text-navy-950 dark:hover:bg-slate-100 transition-colors"
                    >
                      Sign In
                    </Link>
                    <Link
                      to="/register"
                      className="px-5 py-2 rounded font-sans text-xs font-semibold text-editorial-red dark:text-editorial-red-dark border border-editorial-red dark:border-editorial-red-dark hover:bg-editorial-red/10 transition-colors"
                    >
                      Create Free Account
                    </Link>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                {post.postFormat === 'gallery' && (
                  <GalleryRenderer items={post.galleryItems || []} title={post.title} />
                )}
                {post.postFormat === 'sorted_list' && (
                  <SortedListRenderer items={post.sortedListItems || []} />
                )}
                {post.postFormat === 'video' && (
                  <VideoRenderer details={post.videoDetails} title={post.title} />
                )}
                {post.postFormat === 'audio' && (
                  <AudioRenderer details={post.audioDetails} title={post.title} />
                )}
                {post.postFormat === 'poll' && (
                  <PollRenderer postId={post._id} pollDetails={post.pollDetails} />
                )}
                {post.postFormat === 'event' && (
                  <EventRenderer eventDetails={post.eventDetails} />
                )}
                {post.postFormat === 'table_of_contents' && (
                  <TocRenderer content={post.content || ''} />
                )}
                {post.content && post.postFormat !== 'table_of_contents' && (
                  <div
                    className="article-content-body prose dark:prose-invert max-w-none prose-lg font-serif text-slate-800 dark:text-slate-200 leading-relaxed pt-2"
                    dangerouslySetInnerHTML={{ __html: post.content }}
                  />
                )}
              </div>
            )}
          </section>

          {/* FAQ Section */}
          {post.faq && post.faq.length > 0 && !isGated && (
            <section className="pt-8 border-t border-slate-200 dark:border-navy-800">
              <div className="flex items-center gap-2 mb-6 text-xl font-bold font-serif text-navy-900 dark:text-white">
                <HelpCircle className="w-5 h-5 text-editorial-red" />
                <span>Frequently Asked Questions</span>
              </div>

              <div className="space-y-4">
                {post.faq.map((item, idx) => (
                  <details
                    key={idx}
                    className="group rounded-2xl border border-slate-200/90 dark:border-navy-700/80 bg-white dark:bg-navy-900 p-5 open:bg-slate-50 dark:open:bg-navy-850 transition-colors"
                  >
                    <summary className="font-bold text-base text-navy-900 dark:text-white cursor-pointer list-none flex items-center justify-between">
                      <span>{item.question}</span>
                      <span className="text-slate-400 group-open:rotate-180 transition-transform">↓</span>
                    </summary>
                    <p className="mt-3 text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
                      {item.answer}
                    </p>
                  </details>
                ))}
              </div>
            </section>
          )}

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 pt-6">
              <TagIcon className="w-4 h-4 text-slate-400" />
              {post.tags.map((tag: any) => {
                const tagName = typeof tag === 'string' ? tag : tag.name || tag.slug;
                return (
                  <Link
                    key={tag._id || tagName}
                    to={`/search?q=${encodeURIComponent(tagName)}`}
                    className="px-3 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-navy-800 text-slate-700 dark:text-slate-300 hover:bg-editorial-red/10 hover:text-editorial-red dark:hover:bg-editorial-red/20 dark:hover:text-editorial-red-dark transition-colors"
                  >
                    #{tagName}
                  </Link>
                );
              })}
            </div>
          )}

          {/* Previous / Next Article Navigation (Ordered chronologically by publication date) */}
          <ArticleNavigation
            prevPost={data?.prevPost}
            nextPost={data?.nextPost}
          />

          {/* Inline Follow Us Social Bar */}
          <SocialFollowBar variant="inline" className="my-8" />

          {/* Reader Comments Section */}
          <CommentSection postId={post._id} initialCommentCount={post.commentCount || 0} />
        </article>

        {/* Desktop Reading Sidebar (Col 4 - Sticky) */}
        <aside className="hidden lg:block lg:col-span-4 sticky top-28 space-y-6">
          {/* Follow Us Module */}
          <SocialFollowBar variant="sidebar" />

          {/* Trending Topics / Tags */}
          <TrendingTagsWidget articleTags={post.tags} limit={12} />

          {/* Related Stories */}
          {relatedArticles.length > 0 && (
            <div className="rounded-2xl border border-slate-200/90 dark:border-navy-700/80 bg-white dark:bg-navy-900 p-5 shadow-xs space-y-3">
              <div className="flex items-center gap-2 border-b border-slate-100 dark:border-navy-800 pb-3 text-xs font-black uppercase tracking-wider text-navy-900 dark:text-white">
                <Sparkles className="w-4 h-4 text-editorial-red" />
                <span>{t('relatedStories')}</span>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-navy-800/70">
                {relatedArticles.map((rel) => (
                  <CompactArticleItem
                    key={rel._id}
                    post={rel}
                    imageSize="sm"
                    showEngagement={false}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Latest News Wire */}
          {latestArticles.length > 0 && (
            <div className="rounded-2xl border border-slate-200/90 dark:border-navy-700/80 bg-white dark:bg-navy-900 p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-navy-800 pb-3">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-navy-900 dark:text-white">
                  <Radio className="w-4 h-4 text-editorial-red animate-pulse" />
                  <span>{t('latestNews')}</span>
                </div>
                <Link
                  to="/latest"
                  className="text-xs font-bold uppercase tracking-wider text-editorial-red dark:text-editorial-red-dark hover:underline"
                >
                  {t('fullWire')} →
                </Link>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-navy-800/70">
                {latestArticles.map((lat) => (
                  <CompactArticleItem
                    key={lat._id}
                    post={lat}
                    imageSize="sm"
                    showEngagement={false}
                  />
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>

      {/* Mobile/Tablet Stacked Recommendations (<1024px) */}
      <div className="lg:hidden mt-16 pt-10 border-t border-slate-200 dark:border-navy-800 space-y-10">
        {/* Mobile Trending Topics */}
        <TrendingTagsWidget articleTags={post.tags} limit={10} />

        {/* Mobile Related Stories */}
        {relatedArticles.length > 0 && (
          <section className="space-y-6">
            <div className="flex items-center gap-2 text-xl font-bold font-serif text-navy-900 dark:text-white">
              <Sparkles className="w-5 h-5 text-editorial-red" />
              <span>{t('relatedStories')}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {relatedArticles.map((rel) => (
                <ArticleCard key={rel._id} post={rel} variant="grid" />
              ))}
            </div>
          </section>
        )}

        {/* Mobile Latest News */}
        {latestArticles.length > 0 && (
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xl font-bold font-serif text-navy-900 dark:text-white">
                <Radio className="w-5 h-5 text-editorial-red" />
                <span>{t('latestNews')}</span>
              </div>
              <Link
                to="/latest"
                className="text-xs font-bold uppercase tracking-wider text-editorial-red hover:underline"
              >
                {t('fullWire')} →
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {latestArticles.map((lat) => (
                <ArticleCard key={lat._id} post={lat} variant="grid" />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};
