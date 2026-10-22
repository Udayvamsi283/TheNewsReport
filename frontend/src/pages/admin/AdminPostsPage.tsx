import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../services/apiClient';
import { PostStatus, PostFormat } from '../../types';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { useToast } from '../../components/ui/Toast';
import {
  FilePlus,
  Search,
  Eye,
  Edit3,
  Copy,
  Trash2,
  RotateCcw,
  CheckCircle,
  Archive,
  UploadCloud,
  FileText
} from 'lucide-react';

export const AdminPostsPage: React.FC = () => {
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<string>('all');
  const [selectedFormat, setSelectedFormat] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data: postsResponse, isLoading } = useQuery({
    queryKey: ['admin-posts', activeTab, selectedFormat, search, page],
    queryFn: () =>
      apiClient.getPosts({
        page,
        limit: 20,
        status: activeTab !== 'all' ? activeTab : undefined,
        format: selectedFormat !== 'all' ? selectedFormat : undefined,
        search: search || undefined
      })
  });

  const posts = postsResponse?.data || [];

  // Actions
  const handlePublish = async (id: string) => {
    try {
      await apiClient.publishPost(id);
      showToast('Post published live!', 'success');
      queryClient.invalidateQueries({ queryKey: ['admin-posts'] });
    } catch (err: any) {
      showToast(err.message || 'Publish failed', 'error');
    }
  };

  const handleUnpublish = async (id: string) => {
    try {
      await apiClient.unpublishPost(id);
      showToast('Post unpublished and reverted to draft', 'info');
      queryClient.invalidateQueries({ queryKey: ['admin-posts'] });
    } catch (err: any) {
      showToast(err.message || 'Unpublish failed', 'error');
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      const duplicated = await apiClient.duplicatePost(id);
      showToast(`Post duplicated as "${duplicated.title}"`, 'success');
      queryClient.invalidateQueries({ queryKey: ['admin-posts'] });
    } catch (err: any) {
      showToast(err.message || 'Duplicate failed', 'error');
    }
  };

  const handleTrash = async (id: string) => {
    try {
      await apiClient.deletePost(id, false);
      showToast('Post moved to trash', 'info');
      queryClient.invalidateQueries({ queryKey: ['admin-posts'] });
    } catch (err: any) {
      showToast(err.message || 'Move to trash failed', 'error');
    }
  };

  const handleRestore = async (id: string) => {
    try {
      await apiClient.restorePost(id);
      showToast('Post restored to drafts', 'success');
      queryClient.invalidateQueries({ queryKey: ['admin-posts'] });
    } catch (err: any) {
      showToast(err.message || 'Restore failed', 'error');
    }
  };

  const handlePermanentDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to permanently delete this post? This cannot be undone.')) return;
    try {
      await apiClient.deletePost(id, true);
      showToast('Post permanently deleted', 'success');
      queryClient.invalidateQueries({ queryKey: ['admin-posts'] });
    } catch (err: any) {
      showToast(err.message || 'Delete failed', 'error');
    }
  };

  const renderFormatBadge = (format: PostFormat) => {
    switch (format) {
      case 'gallery':
        return <Badge variant="secondary" size="sm">Gallery</Badge>;
      case 'sorted_list':
        return <Badge variant="secondary" size="sm">Sorted List</Badge>;
      case 'table_of_contents':
        return <Badge variant="outline" size="sm">TOC</Badge>;
      case 'video':
        return <Badge variant="warning" size="sm">Video</Badge>;
      case 'audio':
        return <Badge variant="success" size="sm">Audio</Badge>;
      case 'poll':
        return <Badge variant="primary" size="sm">Poll</Badge>;
      case 'event':
        return <Badge variant="primary" size="sm">Event</Badge>;
      default:
        return <Badge variant="outline" size="sm">Article</Badge>;
    }
  };

  const renderStatusBadge = (status: PostStatus, scheduledAt?: string) => {
    switch (status) {
      case 'published':
        return <Badge variant="success" size="sm">Published</Badge>;
      case 'scheduled':
        return (
          <Badge variant="warning" size="sm">
            Scheduled {scheduledAt ? `(${new Date(scheduledAt).toLocaleDateString()})` : ''}
          </Badge>
        );
      case 'trashed':
        return <Badge variant="danger" size="sm">Trash</Badge>;
      default:
        return <Badge variant="outline" size="sm">Draft</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-navy-750">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-slate-900 dark:text-white">
            Articles
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage articles, galleries, multimedia, schedules, and multilingual translations.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link to="/admin/bulk-upload">
            <Button variant="outline" size="sm" leftIcon={<UploadCloud className="w-4 h-4" />}>
              Bulk CSV
            </Button>
          </Link>
          <Link to="/admin/posts/new">
            <Button size="sm" leftIcon={<FilePlus className="w-4 h-4" />}>
              New Article
            </Button>
          </Link>
        </div>
      </div>

      {/* Tabs & Filters */}
      <div className="space-y-3">
        {/* Status Tabs */}
        <div className="flex border-b border-slate-200 dark:border-navy-750 gap-2 overflow-x-auto">
          {[
            { id: 'all', label: 'All Posts' },
            { id: 'published', label: 'Published' },
            { id: 'draft', label: 'Drafts' },
            { id: 'scheduled', label: 'Scheduled' },
            { id: 'trashed', label: 'Trash' }
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setActiveTab(tab.id);
                setPage(1);
              }}
              className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-editorial-red text-editorial-red'
                  : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search & Format Bar */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-white dark:bg-navy-850 p-3 rounded-lg border border-slate-200 dark:border-navy-750 shadow-sm">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search posts by headline, summary, or slug..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded bg-slate-50 dark:bg-navy-900 border border-slate-200 dark:border-navy-700 text-slate-900 dark:text-white focus:outline-none focus:border-editorial-red"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-slate-400 uppercase">Format:</span>
            <select
              value={selectedFormat}
              onChange={(e) => {
                setSelectedFormat(e.target.value);
                setPage(1);
              }}
              className="px-2.5 py-1 text-xs rounded border border-slate-200 dark:border-navy-700 bg-white dark:bg-navy-900 text-slate-700 dark:text-slate-300 focus:outline-none focus:border-editorial-red"
            >
              <option value="all">All Formats</option>
              <option value="article">Article</option>
              <option value="gallery">Photo Gallery</option>
              <option value="sorted_list">Sorted List</option>
              <option value="table_of_contents">Table of Contents</option>
              <option value="video">Video</option>
              <option value="audio">Audio</option>
              <option value="poll">Poll</option>
              <option value="event">Event</option>
            </select>
          </div>
        </div>
      </div>

      {/* Posts Table */}
      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="py-20 text-center text-xs text-slate-400">Loading dispatches...</div>
        ) : posts.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <FileText className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">
              No Dispatches Found
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              No posts match the current filter or search criteria.
            </p>
            <Link to="/admin/posts/new">
              <Button size="sm">Create First Post</Button>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Media</TableHead>
                  <TableHead>Headline & Summary</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Format</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {posts.map((post) => (
                  <TableRow key={post._id}>
                    {/* Thumbnail */}
                    <TableCell>
                      <div className="w-12 h-12 rounded bg-slate-100 dark:bg-navy-900 border border-slate-200 dark:border-navy-700 overflow-hidden flex items-center justify-center shrink-0">
                        {post.featuredImage?.url ? (
                          <img
                            src={post.featuredImage.url}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <FileText className="w-5 h-5 text-slate-400" />
                        )}
                      </div>
                    </TableCell>

                    {/* Headline */}
                    <TableCell>
                      <div className="max-w-md space-y-1">
                        <Link
                          to={`/admin/posts/${post._id}/edit`}
                          className="font-bold text-slate-900 dark:text-white hover:text-editorial-red transition-colors text-xs line-clamp-1 flex items-center gap-1.5"
                        >
                          <span className="truncate">{post.title}</span>
                          {post.isFeatured && (
                            <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 font-bold shrink-0">
                              Featured
                            </span>
                          )}
                          {post.isBreaking && (
                            <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-red-100 text-editorial-red dark:bg-red-900/40 dark:text-red-300 font-bold shrink-0">
                              Breaking
                            </span>
                          )}
                        </Link>
                        <p className="text-[11px] text-slate-400 line-clamp-1 font-sans">
                          {post.summary || 'No summary provided'}
                        </p>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400">
                          <span>By {post.author?.name || 'The News Report'}</span>
                          <span>•</span>
                          <span className="font-mono">/{post.slug}</span>
                          {post.translations && post.translations.length > 0 && (
                            <>
                              <span>•</span>
                              <span className="text-editorial-red font-semibold">
                                +{post.translations.length} locale(s)
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </TableCell>

                    {/* Category */}
                    <TableCell>
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        {post.category?.name || 'Unassigned'}
                      </span>
                    </TableCell>

                    {/* Format */}
                    <TableCell>{renderFormatBadge(post.postFormat)}</TableCell>

                    {/* Status */}
                    <TableCell>{renderStatusBadge(post.status, post.scheduledAt)}</TableCell>

                    {/* Date */}
                    <TableCell>
                      <span className="text-[11px] text-slate-500 whitespace-nowrap">
                        {post.publishedAt
                          ? new Date(post.publishedAt).toLocaleDateString()
                          : new Date(post.createdAt).toLocaleDateString()}
                      </span>
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {/* Preview */}
                        <Link
                          to={`/admin/posts/${post._id}/preview`}
                          className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-navy-800 text-slate-500 hover:text-slate-900 dark:hover:text-white"
                          title="Preview Post"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Link>

                        {/* Edit */}
                        <Link
                          to={`/admin/posts/${post._id}/edit`}
                          className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-navy-800 text-slate-500 hover:text-slate-900 dark:hover:text-white"
                          title="Edit Post"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </Link>

                        {/* Duplicate */}
                        <button
                          type="button"
                          onClick={() => handleDuplicate(post._id)}
                          className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-navy-800 text-slate-500 hover:text-slate-900 dark:hover:text-white"
                          title="Duplicate Post"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>

                        {/* Publish / Unpublish */}
                        {post.status === 'published' ? (
                          <button
                            type="button"
                            onClick={() => handleUnpublish(post._id)}
                            className="p-1.5 rounded hover:bg-amber-50 dark:hover:bg-amber-950/30 text-amber-600"
                            title="Revert to Draft"
                          >
                            <Archive className="w-3.5 h-3.5" />
                          </button>
                        ) : post.status !== 'trashed' ? (
                          <button
                            type="button"
                            onClick={() => handlePublish(post._id)}
                            className="p-1.5 rounded hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-emerald-600"
                            title="Publish Live"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                          </button>
                        ) : null}

                        {/* Trash / Restore / Permanent Delete */}
                        {post.status === 'trashed' ? (
                          <>
                            <button
                              type="button"
                              onClick={() => handleRestore(post._id)}
                              className="p-1.5 rounded hover:bg-emerald-50 text-emerald-600"
                              title="Restore to Draft"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handlePermanentDelete(post._id)}
                              className="p-1.5 rounded hover:bg-rose-50 text-rose-600"
                              title="Delete Permanently"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleTrash(post._id)}
                            className="p-1.5 rounded hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-500"
                            title="Move to Trash"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
    </div>
  );
};
