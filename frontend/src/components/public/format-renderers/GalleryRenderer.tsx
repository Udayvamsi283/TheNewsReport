import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Maximize2, X } from 'lucide-react';

interface GalleryItem {
  image: string;
  title?: string;
  description?: string;
  order?: number;
}

interface GalleryRendererProps {
  items: GalleryItem[];
  title: string;
}

export const GalleryRenderer: React.FC<GalleryRendererProps> = ({ items, title }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  if (!items || items.length === 0) {
    return null;
  }

  const currentItem = items[activeIndex] || items[0];

  const handlePrev = () => {
    setActiveIndex((prev) => (prev === 0 ? items.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setActiveIndex((prev) => (prev === items.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="space-y-6 my-8">
      <div className="relative aspect-[16/10] bg-slate-900 rounded-lg overflow-hidden group">
        <img
          src={currentItem.image}
          alt={currentItem.title || `Gallery slide ${activeIndex + 1}`}
          className="w-full h-full object-contain"
        />

        {/* Navigation Buttons */}
        {items.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              aria-label="Previous image"
              className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-slate-900/70 text-white hover:bg-slate-900 transition-opacity"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={handleNext}
              aria-label="Next image"
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-slate-900/70 text-white hover:bg-slate-900 transition-opacity"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}

        {/* Counter and Fullscreen Trigger */}
        <div className="absolute top-3 right-3 flex items-center gap-2">
          <span className="px-2.5 py-1 text-xs font-semibold rounded bg-slate-900/80 text-white">
            {activeIndex + 1} / {items.length}
          </span>
          <button
            onClick={() => setIsLightboxOpen(true)}
            aria-label="Open fullscreen gallery"
            className="p-1.5 rounded bg-slate-900/80 text-white hover:bg-slate-900"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Slide Caption */}
      <div className="p-4 bg-slate-50 dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-lg">
        {currentItem.title && (
          <h4 className="font-bold text-slate-900 dark:text-white mb-1">{currentItem.title}</h4>
        )}
        {currentItem.description && (
          <p className="text-sm text-slate-600 dark:text-slate-300">{currentItem.description}</p>
        )}
      </div>

      {/* Thumbnails Strip */}
      {items.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {items.map((item, idx) => (
            <button
              key={idx}
              onClick={() => setActiveIndex(idx)}
              className={`relative flex-shrink-0 w-20 h-14 rounded overflow-hidden border-2 transition-all ${
                idx === activeIndex
                  ? 'border-editorial-red opacity-100'
                  : 'border-transparent opacity-60 hover:opacity-100'
              }`}
            >
              <img src={item.image} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox Modal */}
      {isLightboxOpen && (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col justify-between p-4">
          <div className="flex justify-between items-center text-white">
            <span className="text-sm font-medium">{title} ({activeIndex + 1}/{items.length})</span>
            <button
              onClick={() => setIsLightboxOpen(false)}
              className="p-2 text-white hover:text-slate-300"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="relative flex-1 flex items-center justify-center p-4">
            <img
              src={currentItem.image}
              alt=""
              className="max-h-full max-w-full object-contain"
            />
            {items.length > 1 && (
              <>
                <button
                  onClick={handlePrev}
                  className="absolute left-4 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={handleNext}
                  className="absolute right-4 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}
          </div>
          <div className="text-center text-slate-300 text-sm max-w-xl mx-auto">
            {currentItem.title && <div className="font-bold text-white mb-0.5">{currentItem.title}</div>}
            {currentItem.description}
          </div>
        </div>
      )}
    </div>
  );
};
