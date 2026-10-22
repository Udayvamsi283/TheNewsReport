import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../services/apiClient';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import {
  ArrowLeft,
  Smartphone,
  Monitor,
  ExternalLink,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

export const AdminPostPreviewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [viewport, setViewport] = useState<'desktop' | 'mobile'>('desktop');
  const [activeFaqIndex, setActiveFaqIndex] = useState<number | null>(null);

  const { data: post, isLoading, error } = useQuery({
    queryKey: ['post-preview', id],
    queryFn: () => apiClient.getPostPreview(id!),
    enabled: Boolean(id)
  });

  if (isLoading) {
    return <div className="py-24 text-center text-xs text-slate-400">Loading live preview...</div>;
  }

  if (error || !post) {
    return (
      <div className="py-24 text-center space-y-3">
        <h2 className="text-base font-bold text-slate-800 dark:text-slate-200">
          Preview Unavailable
        </h2>
        <p className="text-xs text-slate-400">
          Could not locate post preview with the provided identifier.
        </p>
        <Link to="/admin/posts">
          <Button size="sm">Back to Dispatches</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-navy-950 pb-20">
      {/* Top Preview Control Bar */}
      <div className="sticky top-0 z-30 bg-navy-900 text-white px-4 py-2.5 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <Link to={`/admin/posts/${post._id}/edit`}>
            <button
              type="button"
              className="text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Editor</span>
            </button>
          </Link>
          <div className="hidden sm:flex items-center gap-2 border-l border-slate-700 pl-3">
            <span className="text-[11px] text-slate-400">Status:</span>
            <Badge
              variant={
                post.status === 'published'
                  ? 'success'
                  : post.status === 'scheduled'
                  ? 'warning'
                  : 'outline'
              }
              size="sm"
              className="capitalize"
            >
              {post.status} Preview
            </Badge>
          </div>
        </div>

        {/* Viewport Switcher */}
        <div className="flex items-center gap-1 bg-navy-800 p-0.5 rounded border border-navy-700">
          <button
            type="button"
            onClick={() => setViewport('desktop')}
            className={`px-2.5 py-1 rounded text-xs flex items-center gap-1 transition-colors ${
              viewport === 'desktop' ? 'bg-editorial-red text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Desktop</span>
          </button>
          <button
            type="button"
            onClick={() => setViewport('mobile')}
            className={`px-2.5 py-1 rounded text-xs flex items-center gap-1 transition-colors ${
              viewport === 'mobile' ? 'bg-editorial-red text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Mobile (390px)</span>
          </button>
        </div>
      </div>

      {/* Main Preview Container */}
      <div className="py-6 px-4 flex justify-center">
        <div
          className={`transition-all duration-300 bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700 shadow-sm rounded-lg overflow-hidden ${
            viewport === 'mobile' ? 'w-[390px] min-h-[844px]' : 'max-w-4xl w-full'
          }`}
        >
          {/* Article Header */}
          <div className="p-6 sm:p-10 space-y-4 border-b border-slate-100 dark:border-navy-800">
            {/* Category & Format badge */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-editorial-red">
                {post.category?.name || 'Top Story'}
              </span>
              <span className="text-slate-300 dark:text-navy-700">•</span>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                {post.postFormat.replace('_', ' ')}
              </span>
            </div>

            {/* Headline */}
            <h1 className="text-2xl sm:text-4xl font-serif font-black tracking-tight text-slate-900 dark:text-white leading-tight">
              {post.title}
            </h1>

            {/* Dek / Summary */}
            {post.summary && (
              <p className="text-base sm:text-lg font-serif italic text-slate-600 dark:text-slate-300 leading-relaxed">
                {post.summary}
              </p>
            )}

            {/* Author Byline & Date */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-navy-800 text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-navy-800 flex items-center justify-center font-bold text-slate-700 dark:text-slate-300">
                  {post.author?.name ? post.author.name[0] : 'J'}
                </div>
                <div>
                  <span className="font-bold text-slate-900 dark:text-white block">
                    {post.author?.name || 'The News Report'}
                  </span>
                </div>
              </div>

              <div className="text-right text-[11px]">
                <span>{new Date(post.publishedAt || post.createdAt).toLocaleDateString()}</span>
                {post.status === 'scheduled' && post.scheduledAt && (
                  <span className="block text-amber-500 font-semibold">
                    Scheduled for {new Date(post.scheduledAt).toLocaleString()}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Featured Image */}
          {post.featuredImage?.url && (
            <div className="relative">
              <img
                src={post.featuredImage.url}
                alt={post.featuredImage.alt || post.title}
                className="w-full h-auto max-h-[500px] object-cover"
              />
              {post.featuredImage.caption && (
                <div className="p-2.5 text-xs text-slate-500 dark:text-slate-400 italic bg-slate-50 dark:bg-navy-850 border-b border-slate-100 dark:border-navy-800">
                  {post.featuredImage.caption}
                </div>
              )}
            </div>
          )}

          {/* Format Specific Body Components */}
          <div className="p-6 sm:p-10 space-y-8">
            {/* 1. Photo Gallery Format */}
            {post.postFormat === 'gallery' && post.galleryItems && post.galleryItems.length > 0 && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {post.galleryItems.map((item, idx) => (
                    <div key={idx} className="rounded-lg overflow-hidden border border-slate-200 dark:border-navy-800 bg-slate-50 dark:bg-navy-850">
                      <img src={item.image} alt={item.title || ''} className="w-full h-56 object-cover" />
                      <div className="p-3 space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-editorial-red">
                          Slide #{item.order || idx + 1}
                        </span>
                        <h4 className="font-bold text-xs text-slate-900 dark:text-white">{item.title}</h4>
                        {item.description && <p className="text-[11px] text-slate-500">{item.description}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 2. Sorted List Format */}
            {post.postFormat === 'sorted_list' && post.sortedListItems && post.sortedListItems.length > 0 && (
              <div className="space-y-6">
                {post.sortedListItems.map((item, idx) => (
                  <div key={idx} className="p-5 rounded-lg border border-slate-200 dark:border-navy-800 bg-slate-50 dark:bg-navy-850 space-y-3">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-full bg-editorial-red text-white flex items-center justify-center font-black text-sm">
                        {item.itemNumber}
                      </span>
                      <h3 className="font-bold text-base text-slate-900 dark:text-white">{item.title}</h3>
                    </div>
                    {item.image && (
                      <div className="rounded overflow-hidden max-h-72">
                        <img src={item.image} alt="" className="w-full h-full object-cover" />
                      </div>
                    )}
                    {item.content && (
                      <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-serif">
                        {item.content}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* 3. Video Format */}
            {post.postFormat === 'video' && post.videoDetails?.embedUrl && (
              <div className="relative aspect-video rounded-lg overflow-hidden shadow-lg border border-slate-300 dark:border-navy-700 bg-black">
                <iframe
                  src={post.videoDetails.embedUrl}
                  title={post.title}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            )}

            {/* 4. Audio Format */}
            {post.postFormat === 'audio' && post.audioDetails?.audioUrl && (
              <div className="p-6 rounded-lg bg-gradient-to-r from-navy-900 to-navy-800 text-white space-y-4 shadow-md">
                <div className="flex items-center gap-4">
                  {post.audioDetails.coverImage && (
                    <img
                      src={post.audioDetails.coverImage}
                      alt=""
                      className="w-16 h-16 rounded object-cover shadow"
                    />
                  )}
                  <div>
                    <span className="text-[10px] uppercase font-bold text-editorial-red tracking-wider">
                      Audio Dispatch
                    </span>
                    <h3 className="font-bold text-sm">{post.title}</h3>
                    {post.audioDetails.artist && (
                      <p className="text-xs text-slate-300">Narrated by {post.audioDetails.artist}</p>
                    )}
                  </div>
                </div>
                <audio controls className="w-full h-10">
                  <source src={post.audioDetails.audioUrl} />
                </audio>
              </div>
            )}

            {/* 5. Poll Format */}
            {post.postFormat === 'poll' && post.pollDetails && (
              <div className="p-6 rounded-lg border border-slate-200 dark:border-navy-800 bg-slate-50 dark:bg-navy-850 space-y-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-editorial-red">
                    Audience Opinion Poll
                  </span>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    {post.pollDetails.question}
                  </h3>
                </div>
                <div className="space-y-2">
                  {post.pollDetails.options.map((opt) => (
                    <label
                      key={opt.id}
                      className="flex items-center gap-3 p-3 rounded border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-900 cursor-pointer hover:border-editorial-red transition-colors"
                    >
                      <input type="radio" name="preview-poll" className="text-editorial-red focus:ring-editorial-red" />
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                        {opt.text}
                      </span>
                    </label>
                  ))}
                </div>
                <Button size="sm" className="w-full" disabled>
                  Vote (Live during publication)
                </Button>
              </div>
            )}

            {/* 6. Event Format */}
            {post.postFormat === 'event' && post.eventDetails && (
              <div className="p-5 rounded-lg border border-slate-200 dark:border-navy-800 bg-slate-50 dark:bg-navy-850 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {post.eventDetails.startDate && (
                    <div>
                      <span className="text-slate-400 font-semibold block">Date & Time</span>
                      <p className="font-bold text-slate-900 dark:text-white">
                        {new Date(post.eventDetails.startDate).toLocaleString()}
                      </p>
                    </div>
                  )}
                  {post.eventDetails.locationName && (
                    <div>
                      <span className="text-slate-400 font-semibold block">Location</span>
                      <p className="font-bold text-slate-900 dark:text-white">
                        {post.eventDetails.locationName}
                      </p>
                      {post.eventDetails.address && (
                        <p className="text-slate-500 text-[11px]">{post.eventDetails.address}</p>
                      )}
                    </div>
                  )}
                </div>
                {post.eventDetails.eventUrl && (
                  <a
                    href={post.eventDetails.eventUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-editorial-red hover:underline pt-2"
                  >
                    <span>Official Registration Link</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            )}

            {/* Rich Article HTML Content */}
            {post.content && (
              <div
                className="article-content-body prose dark:prose-invert max-w-none text-slate-800 dark:text-slate-200 leading-relaxed font-serif text-sm sm:text-base space-y-4"
                dangerouslySetInnerHTML={{ __html: post.content }}
              />
            )}

            {/* Structured FAQ Section */}
            {post.faq && post.faq.length > 0 && (
              <div className="pt-6 border-t border-slate-200 dark:border-navy-800 space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  Frequently Asked Questions
                </h3>
                <div className="space-y-2">
                  {post.faq.map((item, idx) => (
                    <div
                      key={idx}
                      className="border border-slate-200 dark:border-navy-700 rounded-lg overflow-hidden"
                    >
                      <button
                        type="button"
                        onClick={() => setActiveFaqIndex(activeFaqIndex === idx ? null : idx)}
                        className="w-full p-3 text-left font-bold text-xs flex items-center justify-between bg-slate-50 dark:bg-navy-850 hover:bg-slate-100 dark:hover:bg-navy-800"
                      >
                        <span>{item.question}</span>
                        {activeFaqIndex === idx ? (
                          <ChevronUp className="w-4 h-4 text-slate-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-400" />
                        )}
                      </button>
                      {activeFaqIndex === idx && (
                        <div className="p-3 text-xs text-slate-600 dark:text-slate-300 bg-white dark:bg-navy-900 border-t border-slate-100 dark:border-navy-800 leading-relaxed">
                          {item.answer}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-6 border-t border-slate-100 dark:border-navy-800">
                {post.tags.map((t) => (
                  <span
                    key={typeof t === 'object' ? t._id || t.id : t}
                    className="px-2.5 py-1 rounded bg-slate-100 dark:bg-navy-800 text-[11px] font-semibold text-slate-600 dark:text-slate-300"
                  >
                    #{typeof t === 'object' ? t.name : t}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
