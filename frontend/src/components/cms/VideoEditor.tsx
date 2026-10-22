import React from 'react';
import { VideoDetails } from '../../types';
import { Input } from '../ui/Input';
import { Youtube, Film } from 'lucide-react';

interface VideoEditorProps {
  details: VideoDetails;
  onChange: (details: VideoDetails) => void;
}

export const VideoEditor: React.FC<VideoEditorProps> = ({ details, onChange }) => {
  const handleChange = (field: keyof VideoDetails, value: any) => {
    onChange({ ...details, [field]: value });
  };

  // Helper to extract YouTube video ID and embed URL
  const getEmbedUrl = (url: string): string => {
    if (!url) return '';
    const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
    if (ytMatch && ytMatch[1]) {
      return `https://www.youtube.com/embed/${ytMatch[1]}`;
    }
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch && vimeoMatch[1]) {
      return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
    }
    return url;
  };

  const handleUrlChange = (url: string) => {
    const embedUrl = getEmbedUrl(url);
    let provider: 'youtube' | 'vimeo' | 'direct' | 'other' = 'other';
    if (url.includes('youtube.com') || url.includes('youtu.be')) provider = 'youtube';
    else if (url.includes('vimeo.com')) provider = 'vimeo';
    else if (url.match(/\.(mp4|webm)$/i)) provider = 'direct';

    onChange({
      ...details,
      videoUrl: url,
      embedUrl,
      provider
    });
  };

  return (
    <div className="space-y-4 p-4 rounded-lg border border-slate-200 dark:border-navy-750 bg-slate-50 dark:bg-navy-900">
      <div className="flex items-center gap-2">
        <Film className="w-4 h-4 text-editorial-red" />
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
          Video Dispatch Configuration
        </h3>
      </div>
      <p className="text-xs text-slate-500">
        Enter a YouTube, Vimeo, or web video URL. The video embed will be dynamically rendered.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input
          label="Video Source URL"
          placeholder="https://www.youtube.com/watch?v=..."
          value={details.videoUrl || ''}
          onChange={(e) => handleUrlChange(e.target.value)}
          leftIcon={<Youtube className="w-4 h-4 text-red-600" />}
        />

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Provider Platform
          </label>
          <select
            value={details.provider || 'youtube'}
            onChange={(e) => handleChange('provider', e.target.value)}
            className="w-full px-3 py-2 text-xs rounded border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-850 text-slate-900 dark:text-white focus:outline-none focus:border-editorial-red"
          >
            <option value="youtube">YouTube</option>
            <option value="vimeo">Vimeo</option>
            <option value="direct">Direct MP4/WebM Video</option>
            <option value="other">Other Embed Provider</option>
          </select>
        </div>
      </div>

      {details.embedUrl && (
        <div className="mt-3">
          <label className="block text-xs font-semibold text-slate-500 mb-1">
            Live Embed Preview
          </label>
          <div className="relative aspect-video rounded-lg overflow-hidden border border-slate-300 dark:border-navy-700 bg-black">
            <iframe
              src={details.embedUrl}
              title="Video Preview"
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      )}
    </div>
  );
};
