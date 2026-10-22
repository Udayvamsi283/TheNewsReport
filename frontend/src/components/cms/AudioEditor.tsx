import React, { useState } from 'react';
import { AudioDetails, MediaAsset } from '../../types';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { MediaLibraryModal } from '../media/MediaLibraryModal';
import { Music, Image as ImageIcon, Trash2 } from 'lucide-react';

interface AudioEditorProps {
  details: AudioDetails;
  onChange: (details: AudioDetails) => void;
}

export const AudioEditor: React.FC<AudioEditorProps> = ({ details, onChange }) => {
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
  const [modalTarget, setModalTarget] = useState<'audio' | 'cover'>('audio');

  const handleChange = (field: keyof AudioDetails, value: any) => {
    onChange({ ...details, [field]: value });
  };

  const handleMediaSelect = (asset: MediaAsset) => {
    if (modalTarget === 'audio') {
      handleChange('audioUrl', asset.secureUrl || asset.url);
    } else {
      handleChange('coverImage', asset.secureUrl || asset.url);
    }
  };

  return (
    <div className="space-y-4 p-4 rounded-lg border border-slate-200 dark:border-navy-750 bg-slate-50 dark:bg-navy-900">
      <div className="flex items-center gap-2">
        <Music className="w-4 h-4 text-editorial-red" />
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
          Audio Dispatch Configuration
        </h3>
      </div>
      <p className="text-xs text-slate-500">
        Attach an audio file or streaming link, cover art, and speaker / journalist attribution.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <Input
            label="Audio Stream / File URL"
            placeholder="https://.../dispatch.mp3"
            value={details.audioUrl || ''}
            onChange={(e) => handleChange('audioUrl', e.target.value)}
          />
          <button
            type="button"
            onClick={() => {
              setModalTarget('audio');
              setIsMediaModalOpen(true);
            }}
            className="text-[11px] text-editorial-red font-semibold hover:underline"
          >
            + Choose Audio from Media Library
          </button>
        </div>

        <Input
          label="Narrator / Journalist / Artist"
          placeholder="e.g. Maria Gonzalez, Chief Foreign Correspondent"
          value={details.artist || ''}
          onChange={(e) => handleChange('artist', e.target.value)}
        />
      </div>

      {/* Cover Image */}
      <div className="pt-2 border-t border-slate-200 dark:border-navy-750">
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
          Audio Cover Art
        </label>
        {details.coverImage ? (
          <div className="flex items-center gap-3">
            <div className="relative w-20 h-20 rounded overflow-hidden border border-slate-200 dark:border-navy-700">
              <img src={details.coverImage} alt="" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => handleChange('coverImage', '')}
                className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
            <span className="text-xs text-slate-500 truncate max-w-xs">{details.coverImage}</span>
          </div>
        ) : (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => {
              setModalTarget('cover');
              setIsMediaModalOpen(true);
            }}
            leftIcon={<ImageIcon className="w-3.5 h-3.5" />}
          >
            Select Cover Art
          </Button>
        )}
      </div>

      {/* Audio Player Preview */}
      {details.audioUrl && (
        <div className="mt-3 p-3 rounded bg-white dark:bg-navy-850 border border-slate-200 dark:border-navy-700">
          <label className="block text-[11px] font-semibold text-slate-500 mb-2">
            Audio Player Preview
          </label>
          <audio controls className="w-full h-9">
            <source src={details.audioUrl} />
            Your browser does not support audio playback.
          </audio>
        </div>
      )}

      <MediaLibraryModal
        isOpen={isMediaModalOpen}
        onClose={() => setIsMediaModalOpen(false)}
        onSelect={handleMediaSelect}
        allowedTypes={modalTarget === 'audio' ? ['audio'] : ['image']}
        title={modalTarget === 'audio' ? 'Select Audio File' : 'Select Cover Art'}
      />
    </div>
  );
};
