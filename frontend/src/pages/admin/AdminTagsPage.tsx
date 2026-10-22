import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../services/apiClient';
import { Tag } from '../../types';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';
import { Tag as TagIcon, Plus, Edit2, Trash2, Search } from 'lucide-react';

export const AdminTagsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');

  // Fetch all tags
  const { data: tags = [], isLoading } = useQuery<Tag[]>({
    queryKey: ['tags'],
    queryFn: () => apiClient.getTags()
  });

  const slugify = (text: string) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleNameChange = (val: string) => {
    setName(val);
    if (!editingTag) {
      setSlug(slugify(val));
    }
  };

  const resetForm = () => {
    setName('');
    setSlug('');
    setEditingTag(null);
  };

  const openCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (t: Tag) => {
    setEditingTag(t);
    setName(t.name);
    setSlug(t.slug);
    setIsModalOpen(true);
  };

  // Create Mutation
  const createMutation = useMutation({
    mutationFn: (data: { name: string; slug: string }) => apiClient.createTag(data),
    onSuccess: () => {
      showToast('Tag created successfully', 'success');
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      setIsModalOpen(false);
      resetForm();
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : 'Failed to create tag';
      showToast(msg, 'error');
    }
  });

  // Update Mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name?: string; slug?: string } }) =>
      apiClient.updateTag(id, data),
    onSuccess: () => {
      showToast('Tag updated successfully', 'success');
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      setIsModalOpen(false);
      resetForm();
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : 'Failed to update tag';
      showToast(msg, 'error');
    }
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.deleteTag(id),
    onSuccess: () => {
      showToast('Tag deleted successfully', 'success');
      queryClient.invalidateQueries({ queryKey: ['tags'] });
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : 'Failed to delete tag';
      showToast(msg, 'error');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !slug.trim()) {
      showToast('Name and slug are required', 'error');
      return;
    }

    if (editingTag) {
      const editId = editingTag._id || editingTag.id || '';
      updateMutation.mutate({
        id: editId,
        data: { name: name.trim(), slug: slug.trim() }
      });
    } else {
      createMutation.mutate({
        name: name.trim(),
        slug: slug.trim()
      });
    }
  };

  const handleDelete = (t: Tag) => {
    const tagId = t._id || t.id || '';
    if (window.confirm(`Are you sure you want to delete tag "#${t.name}"?`)) {
      deleteMutation.mutate(tagId);
    }
  };

  const filteredTags = tags.filter(
    (t) =>
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-navy-750">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black uppercase tracking-tight text-slate-900 dark:text-white">
              Editorial Tags
            </h1>
            <Badge variant="primary" size="sm">
              {tags.length} Total
            </Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage reusable subject-matter tags, cross-desk topics, and investigative indexing keys.
          </p>
        </div>

        <Button onClick={openCreateModal} leftIcon={<Plus className="w-4 h-4" />}>
          Add Tag
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="max-w-md w-full">
          <Input
            placeholder="Search tags by name or slug..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />
        </div>
      </div>

      {/* Tags Grid / Card View */}
      <Card className="p-6 bg-white dark:bg-navy-850 border-slate-200 dark:border-navy-700">
        {isLoading ? (
          <div className="p-8 text-center text-sm text-slate-500">Loading tags from database...</div>
        ) : filteredTags.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">
            {searchTerm ? 'No tags match your search query.' : 'No tags created yet. Click "Add Tag" to create one.'}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {filteredTags.map((t) => (
              <div
                key={t._id}
                className="flex items-center justify-between p-3 rounded border border-slate-200 dark:border-navy-750 bg-slate-50/50 dark:bg-navy-900 hover:border-editorial-red/50 transition-colors group"
              >
                <div className="min-w-0 pr-2">
                  <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white text-xs truncate">
                    <TagIcon className="w-3.5 h-3.5 text-editorial-red shrink-0" />
                    <span className="truncate">{t.name}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono truncate">#{t.slug}</div>
                </div>

                <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => openEditModal(t)}
                    className="p-1 rounded text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors"
                    title="Edit tag"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(t)}
                    className="p-1 rounded text-slate-400 hover:text-editorial-red transition-colors"
                    title="Delete tag"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingTag ? `Edit Tag: #${editingTag.name}` : 'Create New Tag'}
        size="sm"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Tag Name"
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="e.g. Artificial Intelligence"
            required
          />

          <Input
            label="Tag Slug"
            value={slug}
            onChange={(e) => setSlug(slugify(e.target.value))}
            placeholder="e.g. artificial-intelligence"
            helperText="Normalized lowercase identifier."
            required
          />

          <div className="pt-4 border-t border-slate-100 dark:border-navy-750 flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={createMutation.isPending || updateMutation.isPending}
            >
              {editingTag ? 'Update Tag' : 'Create Tag'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
