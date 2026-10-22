import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../services/apiClient';
import { MediaAsset, MediaResourceType } from '../../types';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { useToast } from '../ui/Toast';
import {
  Upload,
  Search,
  Check,
  Image as ImageIcon,
  Film,
  Music,
  FileText
} from 'lucide-react';

interface MediaLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (media: MediaAsset) => void;
  allowedTypes?: MediaResourceType[];
  title?: string;
}

export const MediaLibraryModal: React.FC<MediaLibraryModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  allowedTypes,
  title = 'Select Media Asset'
}) => {
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'browse' | 'upload'>('browse');
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState<string>(
    allowedTypes && allowedTypes.length === 1 ? allowedTypes[0] : 'all'
  );
  const [selectedAsset, setSelectedAsset] = useState<MediaAsset | null>(null);

  // Upload state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadAlt, setUploadAlt] = useState('');
  const [uploadCaption, setUploadCaption] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const { data: mediaResponse, isLoading } = useQuery({
    queryKey: ['media-library', selectedType, search],
    queryFn: () =>
      apiClient.getMedia({
        limit: 30,
        resourceType: selectedType !== 'all' ? selectedType : undefined,
        search: search || undefined
      }),
    enabled: isOpen
  });

  const mediaList = mediaResponse?.data || [];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadFile(e.target.files[0]);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) {
      showToast('Please select a file to upload', 'error');
      return;
    }

    setIsUploading(true);
    try {
      const uploaded = await apiClient.uploadMedia(uploadFile, {
        alt: uploadAlt,
        caption: uploadCaption
      });
      showToast('Media uploaded successfully!', 'success');
      queryClient.invalidateQueries({ queryKey: ['media-library'] });
      setSelectedAsset(uploaded);
      setActiveTab('browse');
      setUploadFile(null);
      setUploadAlt('');
      setUploadCaption('');
    } catch (err: any) {
      showToast(err.message || 'Upload failed', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleConfirmSelect = () => {
    if (selectedAsset) {
      onSelect(selectedAsset);
      onClose();
    }
  };

  const renderIcon = (type: MediaResourceType) => {
    switch (type) {
      case 'video':
        return <Film className="w-5 h-5 text-amber-500" />;
      case 'audio':
        return <Music className="w-5 h-5 text-emerald-500" />;
      case 'document':
        return <FileText className="w-5 h-5 text-blue-500" />;
      default:
        return <ImageIcon className="w-5 h-5 text-slate-400" />;
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="xl">
      <div className="space-y-4">
        {/* Tab switchers */}
        <div className="flex border-b border-slate-200 dark:border-navy-750">
          <button
            type="button"
            onClick={() => setActiveTab('browse')}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 ${
              activeTab === 'browse'
                ? 'border-editorial-red text-editorial-red'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Media Library
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 flex items-center gap-1.5 ${
              activeTab === 'upload'
                ? 'border-editorial-red text-editorial-red'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            Upload New File
          </button>
        </div>

        {activeTab === 'browse' ? (
          <div className="space-y-4">
            {/* Search & filter toolbar */}
            <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search media assets..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded bg-slate-50 dark:bg-navy-900 border border-slate-200 dark:border-navy-700 text-slate-900 dark:text-white focus:outline-none focus:border-editorial-red"
                />
              </div>

              <div className="flex items-center gap-1.5 text-xs">
                {['all', 'image', 'video', 'audio', 'document'].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setSelectedType(t)}
                    className={`px-2.5 py-1 rounded text-[11px] font-semibold capitalize transition-colors ${
                      selectedType === t
                        ? 'bg-navy-900 text-white dark:bg-white dark:text-navy-900'
                        : 'bg-slate-100 dark:bg-navy-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Media Grid */}
            <div className="h-72 overflow-y-auto pr-1">
              {isLoading ? (
                <div className="flex items-center justify-center h-full text-xs text-slate-400">
                  Loading assets...
                </div>
              ) : mediaList.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-2 text-slate-400">
                  <ImageIcon className="w-8 h-8 opacity-40" />
                  <p className="text-xs">No media assets found.</p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setActiveTab('upload')}
                  >
                    Upload an asset
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
                  {mediaList.map((asset) => {
                    const isSelected = selectedAsset?._id === asset._id;
                    return (
                      <div
                        key={asset._id}
                        onClick={() => setSelectedAsset(asset)}
                        className={`group relative rounded border cursor-pointer overflow-hidden aspect-square flex items-center justify-center bg-slate-100 dark:bg-navy-900 transition-all ${
                          isSelected
                            ? 'border-editorial-red ring-2 ring-editorial-red/50 shadow-sm'
                            : 'border-slate-200 dark:border-navy-750 hover:border-slate-400'
                        }`}
                      >
                        {asset.resourceType === 'image' ? (
                          <img
                            src={asset.secureUrl || asset.url}
                            alt={asset.alt || asset.originalFilename}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="flex flex-col items-center gap-1 p-2 text-center">
                            {renderIcon(asset.resourceType)}
                            <span className="text-[10px] font-mono text-slate-500 truncate max-w-full">
                              {asset.originalFilename}
                            </span>
                          </div>
                        )}

                        {isSelected && (
                          <div className="absolute top-1 right-1 bg-editorial-red text-white p-1 rounded-full shadow">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Selected asset preview bar & Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-200 dark:border-navy-750">
              <div className="text-xs text-slate-500 truncate max-w-sm">
                {selectedAsset ? (
                  <span>
                    Selected:{' '}
                    <strong className="text-slate-800 dark:text-slate-200">
                      {selectedAsset.originalFilename}
                    </strong>{' '}
                    ({Math.round(selectedAsset.bytes / 1024)} KB)
                  </span>
                ) : (
                  <span>Click an image to select it</span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleConfirmSelect}
                  disabled={!selectedAsset}
                >
                  Confirm Selection
                </Button>
              </div>
            </div>
          </div>
        ) : (
          /* Upload Form */
          <form onSubmit={handleUploadSubmit} className="space-y-4 py-2">
            <div className="border-2 border-dashed border-slate-300 dark:border-navy-700 rounded-lg p-6 text-center space-y-3">
              <Upload className="w-8 h-8 text-slate-400 mx-auto" />
              <div>
                <label className="cursor-pointer text-xs font-bold text-editorial-red hover:underline">
                  Browse workstation files
                  <input
                    type="file"
                    className="hidden"
                    onChange={handleFileChange}
                    accept="image/*,video/mp4,audio/*,application/pdf"
                  />
                </label>
                <p className="text-[11px] text-slate-400 mt-1">
                  Supports JPEG, PNG, WebP, GIF, SVG, MP4, MP3 up to 10MB
                </p>
              </div>
              {uploadFile && (
                <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  Ready: {uploadFile.name} ({Math.round(uploadFile.size / 1024)} KB)
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Alt Text (SEO & Accessibility)"
                placeholder="Brief description of image content"
                value={uploadAlt}
                onChange={(e) => setUploadAlt(e.target.value)}
              />
              <Input
                label="Caption / Photo Credit"
                placeholder="e.g. Photo by Reuters / Jane Doe"
                value={uploadCaption}
                onChange={(e) => setUploadCaption(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setActiveTab('browse')}
              >
                Back to Library
              </Button>
              <Button
                type="submit"
                size="sm"
                isLoading={isUploading}
                disabled={!uploadFile || isUploading}
              >
                Upload to Cloudinary
              </Button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
};
