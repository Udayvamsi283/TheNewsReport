import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../services/apiClient';
import { MediaAsset, MediaResourceType } from '../../types';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';
import {
  Upload,
  Search,
  Image as ImageIcon,
  Film,
  Music,
  FileText,
  Trash2,
  Copy,
  ExternalLink,
  Check
} from 'lucide-react';

export const AdminMediaPage: React.FC = () => {
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedAsset, setSelectedAsset] = useState<MediaAsset | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  // Upload Form State
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadAlt, setUploadAlt] = useState('');
  const [uploadCaption, setUploadCaption] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  const { data: mediaResponse, isLoading } = useQuery({
    queryKey: ['admin-media', selectedType, search],
    queryFn: () =>
      apiClient.getMedia({
        limit: 48,
        resourceType: selectedType !== 'all' ? selectedType : undefined,
        search: search || undefined
      })
  });

  const mediaList = mediaResponse?.data || [];

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) {
      showToast('Please select a file to upload', 'error');
      return;
    }

    setIsUploading(true);
    try {
      await apiClient.uploadMedia(uploadFile, {
        alt: uploadAlt,
        caption: uploadCaption
      });
      showToast('Media asset uploaded successfully', 'success');
      queryClient.invalidateQueries({ queryKey: ['admin-media'] });
      setIsUploadModalOpen(false);
      setUploadFile(null);
      setUploadAlt('');
      setUploadCaption('');
    } catch (err: any) {
      showToast(err.message || 'Upload failed', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (asset: MediaAsset) => {
    if (!window.confirm(`Are you sure you want to delete "${asset.originalFilename}"?`)) return;

    try {
      await apiClient.deleteMedia(asset._id);
      showToast('Media asset deleted', 'success');
      queryClient.invalidateQueries({ queryKey: ['admin-media'] });
      if (selectedAsset?._id === asset._id) {
        setSelectedAsset(null);
      }
    } catch (err: any) {
      showToast(err.message || 'Delete failed', 'error');
    }
  };

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(true);
    showToast('Asset URL copied to clipboard', 'info');
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const renderIcon = (type: MediaResourceType) => {
    switch (type) {
      case 'video':
        return <Film className="w-8 h-8 text-amber-500" />;
      case 'audio':
        return <Music className="w-8 h-8 text-emerald-500" />;
      case 'document':
        return <FileText className="w-8 h-8 text-blue-500" />;
      default:
        return <ImageIcon className="w-8 h-8 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Upload Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-navy-750">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-slate-900 dark:text-white">
            Media Library
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Cloudinary media assets, photography archive, and newsroom audio/video dispatches.
          </p>
        </div>

        <Button
          onClick={() => setIsUploadModalOpen(true)}
          leftIcon={<Upload className="w-4 h-4" />}
        >
          Upload Asset
        </Button>
      </div>

      {/* Toolbar: Search & Type Filter */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-white dark:bg-navy-850 p-3 rounded-lg border border-slate-200 dark:border-navy-750 shadow-sm">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search media by filename, alt text, or caption..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded bg-slate-50 dark:bg-navy-900 border border-slate-200 dark:border-navy-700 text-slate-900 dark:text-white focus:outline-none focus:border-editorial-red"
          />
        </div>

        <div className="flex items-center gap-1.5 text-xs overflow-x-auto pb-1 sm:pb-0">
          <span className="text-[11px] font-semibold text-slate-400 uppercase mr-1">Filter:</span>
          {['all', 'image', 'video', 'audio', 'document'].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setSelectedType(t)}
              className={`px-3 py-1 rounded text-xs font-semibold capitalize transition-colors ${
                selectedType === t
                  ? 'bg-editorial-red text-white'
                  : 'bg-slate-100 dark:bg-navy-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid & Preview Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Media Grid */}
        <div className={selectedAsset ? 'lg:col-span-8' : 'lg:col-span-12'}>
          {isLoading ? (
            <div className="py-20 text-center text-xs text-slate-400">Loading media library...</div>
          ) : mediaList.length === 0 ? (
            <Card className="p-12 text-center space-y-3">
              <ImageIcon className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">
                No Media Assets Found
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Upload your first image or dispatch to start populating the Cloudinary media library.
              </p>
              <Button size="sm" onClick={() => setIsUploadModalOpen(true)}>
                Upload File
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {mediaList.map((asset) => {
                const isSelected = selectedAsset?._id === asset._id;
                return (
                  <div
                    key={asset._id}
                    onClick={() => setSelectedAsset(asset)}
                    className={`group relative rounded-lg border cursor-pointer overflow-hidden aspect-square flex items-center justify-center bg-slate-100 dark:bg-navy-900 transition-all ${
                      isSelected
                        ? 'border-editorial-red ring-2 ring-editorial-red shadow-md'
                        : 'border-slate-200 dark:border-navy-750 hover:border-slate-400'
                    }`}
                  >
                    {asset.resourceType === 'image' ? (
                      <img
                        src={asset.secureUrl || asset.url}
                        alt={asset.alt || asset.originalFilename}
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-1.5 p-2 text-center">
                        {renderIcon(asset.resourceType)}
                        <span className="text-[10px] font-mono text-slate-500 truncate max-w-full">
                          {asset.originalFilename}
                        </span>
                      </div>
                    )}

                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-1.5">
                      <span className="text-[10px] text-white font-medium truncate">
                        {asset.originalFilename}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Selected Asset Details Sidebar */}
        {selectedAsset && (
          <div className="lg:col-span-4">
            <Card className="p-4 space-y-4 sticky top-20 bg-white dark:bg-navy-850">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-navy-750">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  Asset Details
                </h3>
                <button
                  type="button"
                  onClick={() => setSelectedAsset(null)}
                  className="text-xs text-slate-400 hover:text-slate-600"
                >
                  Close
                </button>
              </div>

              {/* Preview preview */}
              <div className="rounded-lg overflow-hidden border border-slate-200 dark:border-navy-700 bg-slate-100 dark:bg-navy-900 aspect-video flex items-center justify-center">
                {selectedAsset.resourceType === 'image' ? (
                  <img
                    src={selectedAsset.secureUrl || selectedAsset.url}
                    alt={selectedAsset.alt || ''}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="text-center p-4">
                    {renderIcon(selectedAsset.resourceType)}
                    <p className="text-xs font-bold mt-2">{selectedAsset.originalFilename}</p>
                  </div>
                )}
              </div>

              {/* Metadata Attributes */}
              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-slate-400">Filename:</span>
                  <p className="font-semibold text-slate-800 dark:text-slate-200 break-all">
                    {selectedAsset.originalFilename}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-slate-400">Dimensions:</span>
                    <p className="font-semibold text-slate-800 dark:text-slate-200">
                      {selectedAsset.width && selectedAsset.height
                        ? `${selectedAsset.width} × ${selectedAsset.height}`
                        : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400">Filesize:</span>
                    <p className="font-semibold text-slate-800 dark:text-slate-200">
                      {Math.round(selectedAsset.bytes / 1024)} KB
                    </p>
                  </div>
                </div>

                <div>
                  <span className="text-slate-400">Public ID:</span>
                  <p className="font-mono text-[11px] text-slate-600 dark:text-slate-400 break-all">
                    {selectedAsset.publicId}
                  </p>
                </div>

                {selectedAsset.alt && (
                  <div>
                    <span className="text-slate-400">Alt Text:</span>
                    <p className="text-slate-800 dark:text-slate-200">{selectedAsset.alt}</p>
                  </div>
                )}

                {selectedAsset.caption && (
                  <div>
                    <span className="text-slate-400">Caption:</span>
                    <p className="text-slate-800 dark:text-slate-200">{selectedAsset.caption}</p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-navy-750">
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full"
                  onClick={() => handleCopyUrl(selectedAsset.secureUrl || selectedAsset.url)}
                  leftIcon={copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                >
                  {copiedUrl ? 'URL Copied!' : 'Copy Asset URL'}
                </Button>

                <div className="flex gap-2">
                  <a
                    href={selectedAsset.secureUrl || selectedAsset.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold border border-slate-200 dark:border-navy-700 hover:bg-slate-100 dark:hover:bg-navy-800 text-slate-700 dark:text-slate-200 transition-colors"
                  >
                    <span>Open Asset</span>
                    <ExternalLink className="w-3 h-3 text-slate-400" />
                  </a>

                  <button
                    type="button"
                    onClick={() => handleDelete(selectedAsset)}
                    className="p-1.5 rounded text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                    title="Delete permanently"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* Upload Modal */}
      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        title="Upload Media Asset"
        size="md"
      >
        <form onSubmit={handleUploadSubmit} className="space-y-4">
          <div className="border-2 border-dashed border-slate-300 dark:border-navy-700 rounded-lg p-6 text-center space-y-2">
            <Upload className="w-8 h-8 text-slate-400 mx-auto" />
            <label className="cursor-pointer text-xs font-bold text-editorial-red hover:underline">
              Choose file from workstation
              <input
                type="file"
                className="hidden"
                onChange={(e) => e.target.files && setUploadFile(e.target.files[0])}
                accept="image/*,video/mp4,audio/*,application/pdf"
              />
            </label>
            <p className="text-[11px] text-slate-400">
              Supports JPEG, PNG, WebP, GIF, SVG, MP4, MP3 up to 10MB
            </p>
            {uploadFile && (
              <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 pt-1">
                Selected: {uploadFile.name} ({Math.round(uploadFile.size / 1024)} KB)
              </div>
            )}
          </div>

          <Input
            label="Alt Text (SEO & Accessibility)"
            placeholder="Description of the image content"
            value={uploadAlt}
            onChange={(e) => setUploadAlt(e.target.value)}
          />

          <Input
            label="Caption / Photo Credit"
            placeholder="e.g. Photograph by Reuters"
            value={uploadCaption}
            onChange={(e) => setUploadCaption(e.target.value)}
          />

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-navy-750">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsUploadModalOpen(false)}
            >
              Cancel
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
      </Modal>
    </div>
  );
};
