import React, { useState } from 'react';
import { GalleryItem, MediaAsset } from '../../types';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { MediaLibraryModal } from '../media/MediaLibraryModal';
import { Plus, Trash2, ArrowUp, ArrowDown, Image as ImageIcon } from 'lucide-react';

interface GalleryEditorProps {
  items: GalleryItem[];
  onChange: (items: GalleryItem[]) => void;
}

export const GalleryEditor: React.FC<GalleryEditorProps> = ({ items, onChange }) => {
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);

  const handleAddMedia = (asset: MediaAsset) => {
    const newItem: GalleryItem = {
      image: asset.secureUrl || asset.url,
      publicId: asset.publicId,
      title: asset.alt || asset.originalFilename,
      description: asset.caption || '',
      order: items.length + 1
    };
    onChange([...items, newItem]);
  };

  const handleRemove = (index: number) => {
    const updated = items.filter((_, i) => i !== index);
    onChange(updated.map((item, i) => ({ ...item, order: i + 1 })));
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= items.length) return;

    const updated = [...items];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;

    onChange(updated.map((item, i) => ({ ...item, order: i + 1 })));
  };

  const handleItemChange = (index: number, field: keyof GalleryItem, value: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Photo Gallery Items ({items.length})
          </h3>
          <p className="text-xs text-slate-500">
            Add images, captions, and reorder photo slides.
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => setIsMediaModalOpen(true)}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Add Images
        </Button>
      </div>

      {items.length === 0 ? (
        <div
          onClick={() => setIsMediaModalOpen(true)}
          className="border-2 border-dashed border-slate-300 dark:border-navy-700 rounded-lg p-8 text-center cursor-pointer hover:border-editorial-red transition-colors"
        >
          <ImageIcon className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            No images in gallery yet
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Click here to choose images from the Media Library.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item, index) => (
            <div
              key={index}
              className="flex flex-col sm:flex-row gap-3 p-3 rounded-lg border border-slate-200 dark:border-navy-750 bg-slate-50 dark:bg-navy-900 items-start sm:items-center"
            >
              {/* Thumbnail */}
              <div className="w-20 h-20 rounded overflow-hidden shrink-0 bg-slate-200 dark:bg-navy-800">
                <img
                  src={item.image}
                  alt={item.title || 'Gallery item'}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Form fields */}
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2 w-full">
                <Input
                  label="Slide Title / Headline"
                  value={item.title || ''}
                  onChange={(e) => handleItemChange(index, 'title', e.target.value)}
                  placeholder="e.g. Protesters gathered outside parliament"
                />
                <Input
                  label="Caption & Credit"
                  value={item.description || ''}
                  onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                  placeholder="e.g. Photo by AP / John Doe"
                />
              </div>

              {/* Ordering and remove controls */}
              <div className="flex items-center gap-1 shrink-0 self-end sm:self-center">
                <button
                  type="button"
                  onClick={() => handleMove(index, 'up')}
                  disabled={index === 0}
                  className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-navy-800 disabled:opacity-30"
                  title="Move Up"
                >
                  <ArrowUp className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleMove(index, 'down')}
                  disabled={index === items.length - 1}
                  className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-navy-800 disabled:opacity-30"
                  title="Move Down"
                >
                  <ArrowDown className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleRemove(index)}
                  className="p-1.5 rounded hover:bg-rose-50 text-rose-500"
                  title="Remove from Gallery"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <MediaLibraryModal
        isOpen={isMediaModalOpen}
        onClose={() => setIsMediaModalOpen(false)}
        onSelect={handleAddMedia}
        allowedTypes={['image']}
        title="Select Image for Gallery"
      />
    </div>
  );
};
