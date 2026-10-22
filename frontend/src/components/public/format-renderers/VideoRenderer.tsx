import React from 'react';
import { Play } from 'lucide-react';

interface VideoDetails {
  videoUrl: string;
  embedUrl?: string;
  provider?: 'youtube' | 'vimeo' | 'direct' | 'other';
  duration?: number;
}

interface VideoRendererProps {
  details?: VideoDetails;
  title: string;
}

export const VideoRenderer: React.FC<VideoRendererProps> = ({ details, title }) => {
  if (!details || (!details.videoUrl && !details.embedUrl)) {
    return null;
  }

  // Derive embed URL if missing for YouTube
  let finalEmbedUrl = details.embedUrl;
  if (!finalEmbedUrl && details.videoUrl) {
    if (details.videoUrl.includes('youtube.com/watch?v=')) {
      const videoId = details.videoUrl.split('watch?v=')[1]?.split('&')[0];
      if (videoId) finalEmbedUrl = `https://www.youtube.com/embed/${videoId}`;
    } else if (details.videoUrl.includes('youtu.be/')) {
      const videoId = details.videoUrl.split('youtu.be/')[1]?.split('?')[0];
      if (videoId) finalEmbedUrl = `https://www.youtube.com/embed/${videoId}`;
    } else if (details.videoUrl.includes('vimeo.com/')) {
      const videoId = details.videoUrl.split('vimeo.com/')[1]?.split('?')[0];
      if (videoId) finalEmbedUrl = `https://player.vimeo.com/video/${videoId}`;
    }
  }

  return (
    <div className="my-8 space-y-3">
      <div className="relative aspect-[16/9] w-full rounded-lg overflow-hidden bg-slate-900 border border-slate-200 dark:border-navy-800 shadow-md">
        {finalEmbedUrl ? (
          <iframe
            src={finalEmbedUrl}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full border-0"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-6 text-white text-center">
            <Play className="w-12 h-12 text-editorial-red mb-3" />
            <a
              href={details.videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-white hover:underline text-sm font-medium"
            >
              Watch Video: {details.videoUrl}
            </a>
          </div>
        )}
      </div>

      {details.duration && (
        <div className="text-xs text-slate-500 dark:text-slate-400">
          Duration: {Math.floor(details.duration / 60)}m {details.duration % 60}s
        </div>
      )}
    </div>
  );
};
