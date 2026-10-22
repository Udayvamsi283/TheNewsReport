import React, { useState } from 'react';
import { SortedListItem, MediaAsset } from '../../types';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { MediaLibraryModal } from '../media/MediaLibraryModal';
import { Plus, Trash2, ArrowUp, ArrowDown, Image as ImageIcon } from 'lucide-react';

interface SortedListEditorProps {
  items: SortedListItem[];
  onChange: (items: SortedListItem[]) => void;
}

export const SortedListEditor: React.FC<SortedListEditorProps> = ({ items, onChange }) => {
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
  const [activeItemIndex, setActiveItemIndex] = useState<number | null>(null);

  const handleAddItem = () => {
    const newItem: SortedListItem = {
      itemNumber: items.length + 1,
      title: '',
      content: '',
      image: ''
    };
    onChange([...items, newItem]);
  };

  const handleRemove = (index: number) => {
    const updated = items.filter((_, i) => i !== index);
    onChange(updated.map((item, i) => ({ ...item, itemNumber: i + 1 })));
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= items.length) return;

    const updated = [...items];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;

    onChange(updated.map((item, i) => ({ ...item, itemNumber: i + 1 })));
  };

  const handleItemChange = (index: number, field: keyof SortedListItem, value: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const handleMediaSelect = (asset: MediaAsset) => {
    if (activeItemIndex !== null) {
      handleItemChange(activeItemIndex, 'image', asset.secureUrl || asset.url);
      handleItemChange(activeItemIndex, 'publicId', asset.publicId);
      setActiveItemIndex(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Sorted List Items ({items.length})
          </h3>
          <p className="text-xs text-slate-500">
            Create numbered, countdown, or ranked entries.
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={handleAddItem}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Add Item
        </Button>
      </div>

      {items.length === 0 ? (
        <div
          onClick={handleAddItem}
          className="border-2 border-dashed border-slate-300 dark:border-navy-700 rounded-lg p-6 text-center cursor-pointer hover:border-editorial-red transition-colors"
        >
          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            No items in list yet
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Click here to add your first ranked item.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item, index) => (
            <div
              key={index}
              className="p-4 rounded-lg border border-slate-200 dark:border-navy-750 bg-slate-50 dark:bg-navy-900 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="w-7 h-7 rounded-full bg-editorial-red text-white flex items-center justify-center font-bold text-xs shadow-sm">
                  #{item.itemNumber}
                </span>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleMove(index, 'up')}
                    disabled={index === 0}
                    className="p-1 rounded hover:bg-slate-200 dark:hover:bg-navy-800 disabled:opacity-30"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMove(index, 'down')}
                    disabled={index === items.length - 1}
                    className="p-1 rounded hover:bg-slate-200 dark:hover:bg-navy-800 disabled:opacity-30"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemove(index)}
                    className="p-1 rounded hover:bg-rose-50 text-rose-500"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <Input
                label="Item Title"
                placeholder="e.g. 10. Renewable Solar Farms in Atacama"
                value={item.title}
                onChange={(e) => handleItemChange(index, 'title', e.target.value)}
              />

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Description / Editorial Content
                </label>
                <textarea
                  rows={3}
                  className="w-full p-2.5 text-xs rounded border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-850 text-slate-900 dark:text-white focus:outline-none focus:border-editorial-red"
                  placeholder="Detail the significance of this ranked item..."
                  value={item.content || ''}
                  onChange={(e) => handleItemChange(index, 'content', e.target.value)}
                />
              </div>

              {/* Item image */}
              <div className="flex items-center gap-3">
                {item.image ? (
                  <div className="relative w-16 h-16 rounded overflow-hidden border border-slate-200 dark:border-navy-700">
                    <img src={item.image} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleItemChange(index, 'image', '')}
                      className="absolute top-0.5 right-0.5 bg-black/60 text-white rounded-full p-0.5"
                    >
                      <Trash2 className="w-2.5 h-2.5" />
                    </button>
                  </div>
                ) : (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setActiveItemIndex(index);
                      setIsMediaModalOpen(true);
                    }}
                    leftIcon={<ImageIcon className="w-3.5 h-3.5" />}
                  >
                    Attach Item Image
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <MediaLibraryModal
        isOpen={isMediaModalOpen}
        onClose={() => {
          setIsMediaModalOpen(false);
          setActiveItemIndex(null);
        }}
        onSelect={handleMediaSelect}
        allowedTypes={['image']}
        title="Select Item Image"
      />
    </div>
  );
};
