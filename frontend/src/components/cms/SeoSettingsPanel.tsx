import React, { useState } from 'react';
import { SeoMetadata, MediaAsset } from '../../types';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { MediaLibraryModal } from '../media/MediaLibraryModal';
import { Globe, Image as ImageIcon, Trash2 } from 'lucide-react';

interface SeoSettingsPanelProps {
  seo: SeoMetadata;
  onChange: (seo: SeoMetadata) => void;
  defaultTitle?: string;
  defaultDescription?: string;
}

export const SeoSettingsPanel: React.FC<SeoSettingsPanelProps> = ({
  seo,
  onChange,
  defaultTitle = '',
  defaultDescription = ''
}) => {
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);

  const handleChange = (field: keyof SeoMetadata, value: any) => {
    onChange({ ...seo, [field]: value });
  };

  const handleMediaSelect = (asset: MediaAsset) => {
    handleChange('ogImage', asset.secureUrl || asset.url);
  };

  return (
    <div className="space-y-4 p-4 rounded-lg border border-slate-200 dark:border-navy-750 bg-slate-50 dark:bg-navy-900">
      <div className="flex items-center gap-2">
        <Globe className="w-4 h-4 text-editorial-red" />
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
          Editorial SEO & Social Graph (Open Graph)
        </h3>
      </div>
      <p className="text-xs text-slate-500">
        Fine-tune search engine indexes and social media preview cards. Left blank, defaults are derived from the article title and summary.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input
          label="Meta Title (Search snippet)"
          placeholder={defaultTitle || 'Meta title...'}
          value={seo.metaTitle || ''}
          onChange={(e) => handleChange('metaTitle', e.target.value)}
        />
        <Input
          label="Canonical URL"
          placeholder="https://thenews.org/world/investigation-exclusive"
          value={seo.canonicalUrl || ''}
          onChange={(e) => handleChange('canonicalUrl', e.target.value)}
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
          Meta Description (Search & Snippet preview)
        </label>
        <textarea
          rows={2}
          className="w-full p-2.5 text-xs rounded border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-850 text-slate-900 dark:text-white focus:outline-none focus:border-editorial-red"
          placeholder={defaultDescription || 'Summary for search result snippets...'}
          value={seo.metaDescription || ''}
          onChange={(e) => handleChange('metaDescription', e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200 dark:border-navy-750">
        <Input
          label="Social Share Title (OG Title)"
          placeholder={defaultTitle || 'Social headline...'}
          value={seo.ogTitle || ''}
          onChange={(e) => handleChange('ogTitle', e.target.value)}
        />
        <Input
          label="Social Share Description (OG Description)"
          placeholder="Engaging summary for Facebook, X/Twitter cards..."
          value={seo.ogDescription || ''}
          onChange={(e) => handleChange('ogDescription', e.target.value)}
        />
      </div>

      {/* OG Image */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
          Social Share Card Image (OG Image)
        </label>
        {seo.ogImage ? (
          <div className="flex items-center gap-3">
            <div className="relative w-28 h-16 rounded overflow-hidden border border-slate-200 dark:border-navy-750">
              <img src={seo.ogImage} alt="" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => handleChange('ogImage', '')}
                className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
            <span className="text-xs text-slate-500 truncate max-w-sm">{seo.ogImage}</span>
          </div>
        ) : (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setIsMediaModalOpen(true)}
            leftIcon={<ImageIcon className="w-3.5 h-3.5" />}
          >
            Select Social Preview Image
          </Button>
        )}
      </div>

      <MediaLibraryModal
        isOpen={isMediaModalOpen}
        onClose={() => setIsMediaModalOpen(false)}
        onSelect={handleMediaSelect}
        allowedTypes={['image']}
        title="Select Open Graph Social Image"
      />
    </div>
  );
};
