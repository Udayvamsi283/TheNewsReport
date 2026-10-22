import React from 'react';
import { Volume2 } from 'lucide-react';

interface AudioDetails {
  audioUrl: string;
  coverImage?: string;
  duration?: number;
  artist?: string;
}

interface AudioRendererProps {
  details?: AudioDetails;
  title: string;
}

export const AudioRenderer: React.FC<AudioRendererProps> = ({ details, title }) => {
  if (!details || !details.audioUrl) {
    return null;
  }

  return (
    <div className="my-8 p-6 bg-slate-50 dark:bg-navy-900 border border-slate-200 dark:border-navy-800 rounded-lg shadow-sm space-y-4">
      <div className="flex items-center gap-4">
        {details.coverImage ? (
          <img
            src={details.coverImage}
            alt=""
            className="w-16 h-16 rounded object-cover flex-shrink-0"
          />
        ) : (
          <div className="w-16 h-16 rounded bg-editorial-red/10 dark:bg-editorial-red/20 text-editorial-red flex items-center justify-center flex-shrink-0">
            <Volume2 className="w-8 h-8" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <span className="text-xs font-bold text-editorial-red uppercase tracking-wider block mb-1">
            Audio Dispatch
          </span>
          <h4 className="font-serif font-bold text-slate-900 dark:text-white truncate">
            {title}
          </h4>
          {details.artist && (
            <p className="text-xs text-slate-500 dark:text-slate-400">{details.artist}</p>
          )}
        </div>
      </div>

      <audio controls className="w-full mt-2">
        <source src={details.audioUrl} />
        Your browser does not support the audio element.
      </audio>
    </div>
  );
};
