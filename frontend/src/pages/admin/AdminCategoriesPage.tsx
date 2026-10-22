import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../services/apiClient';
import { Category } from '../../types';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';
import {
  FolderTree,
  Plus,
  Edit2,
  Trash2,
  ChevronRight,
  Folder,
  Layers,
  Search,
  CheckCircle2,
  XCircle
} from 'lucide-react';

export const AdminCategoriesPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [parentId, setParentId] = useState<string>('');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');

  // Fetch all categories
  const { data: categories = [], isLoading } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: () => apiClient.getCategories()
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
    if (!editingCategory) {
      setSlug(slugify(val));
    }
  };

  const resetForm = () => {
    setName('');
    setSlug('');
    setDescription('');
    setParentId('');
    setStatus('active');
    setEditingCategory(null);
  };

  const openCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (cat: Category) => {
    setEditingCategory(cat);
    setName(cat.name);
    setSlug(cat.slug);
    setDescription(cat.description || '');
    const pId = typeof cat.parent === 'object' && cat.parent ? (cat.parent._id || cat.parent.id || '') : ((cat.parent as string) || '');
    setParentId(pId);
    setStatus(cat.status || 'active');
    setIsModalOpen(true);
  };

  // Create Mutation
  const createMutation = useMutation({
    mutationFn: (data: { name: string; slug: string; description?: string; parent?: string | null; status: 'active' | 'inactive' }) =>
      apiClient.createCategory(data),
    onSuccess: () => {
      showToast('Category created successfully', 'success');
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setIsModalOpen(false);
      resetForm();
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : 'Failed to create category';
      showToast(msg, 'error');
    }
  });

  // Update Mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Category> }) =>
      apiClient.updateCategory(id, data),
    onSuccess: () => {
      showToast('Category updated successfully', 'success');
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setIsModalOpen(false);
      resetForm();
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : 'Failed to update category';
      showToast(msg, 'error');
    }
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.deleteCategory(id),
    onSuccess: () => {
      showToast('Category deleted successfully', 'success');
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : 'Failed to delete category';
      showToast(msg, 'error');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !slug.trim()) {
      showToast('Name and slug are required', 'error');
      return;
    }

    if (editingCategory) {
      const editId = editingCategory._id || editingCategory.id || '';
      updateMutation.mutate({
        id: editId,
        data: {
          name: name.trim(),
          slug: slug.trim(),
          description: description.trim() || undefined,
          parent: parentId ? parentId : null,
          status
        }
      });
    } else {
      createMutation.mutate({
        name: name.trim(),
        slug: slug.trim(),
        description: description.trim() || undefined,
        parent: parentId ? parentId : null,
        status
      });
    }
  };

  const handleDelete = (cat: Category) => {
    const catId = cat._id || cat.id || '';
    if (window.confirm(`Are you sure you want to delete category "${cat.name}"?`)) {
      deleteMutation.mutate(catId);
    }
  };

  // Build hierarchical view
  const rootCategories = categories.filter((c) => !c.parent);
  const getSubcategories = (parentId: string) =>
    categories.filter((c) => {
      if (!c.parent) return false;
      const pid = typeof c.parent === 'object' ? (c.parent._id || c.parent.id) : c.parent;
      return pid === parentId;
    });

  // Filter based on search term
  const filteredCategories = categories.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-navy-750">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black uppercase tracking-tight text-slate-900 dark:text-white">
              Category Taxonomies
            </h1>
            <Badge variant="primary" size="sm">
              {categories.length} Total
            </Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage editorial desks, primary navigation sections, and nested regional hierarchies.
          </p>
        </div>

        <Button onClick={openCreateModal} leftIcon={<Plus className="w-4 h-4" />}>
          Add Category
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="max-w-md w-full">
          <Input
            placeholder="Search categories or slugs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />
        </div>
      </div>

      {/* Categories Hierarchy / Table */}
      <Card className="p-0 overflow-hidden bg-white dark:bg-navy-850 border-slate-200 dark:border-navy-700">
        {isLoading ? (
          <div className="p-12 text-center text-sm text-slate-500">Loading categories from database...</div>
        ) : categories.length === 0 ? (
          <div className="p-12 text-center text-sm text-slate-500">
            No categories defined yet. Click "Add Category" to create one.
          </div>
        ) : searchTerm ? (
          /* Flat search results when filtering */
          <div className="divide-y divide-slate-100 dark:divide-navy-750">
            {filteredCategories.map((cat) => (
              <div
                key={cat._id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-navy-800 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Folder className="w-5 h-5 text-editorial-red" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-white text-sm">{cat.name}</span>
                      <span className="text-xs text-slate-400 font-mono">/{cat.slug}</span>
                      <Badge variant={cat.status === 'active' ? 'success' : 'outline'} size="sm">
                        {cat.status}
                      </Badge>
                    </div>
                    {cat.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{cat.description}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <Button size="sm" variant="ghost" onClick={() => openEditModal(cat)}>
                    <Edit2 className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(cat)}
                    className="text-editorial-red hover:bg-red-50 dark:hover:bg-red-950"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Hierarchical View */
          <div className="divide-y divide-slate-100 dark:divide-navy-750">
            {rootCategories.map((root) => {
              const rootId = root._id || root.id || '';
              const children = getSubcategories(rootId);
              return (
                <div key={rootId} className="p-4 space-y-3">
                  {/* Root Row */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <FolderTree className="w-5 h-5 text-editorial-red" />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 dark:text-white text-base">
                            {root.name}
                          </span>
                          <span className="text-xs text-slate-400 font-mono">/{root.slug}</span>
                          <Badge variant={root.status === 'active' ? 'success' : 'outline'} size="sm">
                            {root.status}
                          </Badge>
                          {children.length > 0 && (
                            <Badge variant="secondary" size="sm">
                              {children.length} sub-desks
                            </Badge>
                          )}
                        </div>
                        {root.description && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{root.description}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <Button size="sm" variant="outline" onClick={() => openEditModal(root)}>
                        <Edit2 className="w-3.5 h-3.5 mr-1" /> Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(root)}
                        className="text-editorial-red hover:bg-red-50 dark:hover:bg-red-950"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>

                  {/* Nested Subcategories */}
                  {children.length > 0 && (
                    <div className="ml-6 sm:ml-8 pl-4 border-l-2 border-slate-200 dark:border-navy-700 space-y-2 mt-2">
                      {children.map((sub) => (
                        <div
                          key={sub._id}
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded bg-slate-50 dark:bg-navy-900/60"
                        >
                          <div className="flex items-center gap-2">
                            <ChevronRight className="w-4 h-4 text-slate-400" />
                            <span className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
                              {sub.name}
                            </span>
                            <span className="text-xs text-slate-400 font-mono">/{sub.slug}</span>
                            <Badge variant={sub.status === 'active' ? 'success' : 'outline'} size="sm">
                              {sub.status}
                            </Badge>
                          </div>

                          <div className="flex items-center gap-2 self-end sm:self-center">
                            <Button size="sm" variant="ghost" onClick={() => openEditModal(sub)}>
                              <Edit2 className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDelete(sub)}
                              className="text-editorial-red hover:bg-red-50 dark:hover:bg-red-950"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCategory ? `Edit Category: ${editingCategory.name}` : 'Create New Category'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Category Name"
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="e.g. Regional or Andhra Pradesh"
            required
          />

          <Input
            label="URL Slug"
            value={slug}
            onChange={(e) => setSlug(slugify(e.target.value))}
            placeholder="e.g. regional or andhra-pradesh"
            helperText="Unique identifier used in URL paths (/category/:slug)."
            required
          />

          <Input
            label="Description (Optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief editorial charter of this desk"
          />

          {/* Parent Category Dropdown */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-editorial-red" />
              <span>Parent Desk (Hierarchy)</span>
            </label>
            <select
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-editorial-red"
            >
              <option value="">None (Top-Level Primary Desk)</option>
              {categories
                .filter((c) => !editingCategory || c._id !== editingCategory._id) // Prevent self-parent
                .filter((c) => !c.parent) // Only allow 1 level of nesting per MVP
                .map((cat) => (
                  <option key={cat._id} value={cat._id}>
                    {cat.name} (/{cat.slug})
                  </option>
                ))}
            </select>
          </div>

          {/* Status Radio */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Publishing Status
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  value="active"
                  checked={status === 'active'}
                  onChange={() => setStatus('active')}
                  className="text-editorial-red focus:ring-editorial-red"
                />
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Active (Public)
                </span>
              </label>
              <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  value="inactive"
                  checked={status === 'inactive'}
                  onChange={() => setStatus('inactive')}
                  className="text-editorial-red focus:ring-editorial-red"
                />
                <span className="flex items-center gap-1">
                  <XCircle className="w-3.5 h-3.5 text-slate-400" /> Inactive (Hidden)
                </span>
              </label>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-navy-750 flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={createMutation.isPending || updateMutation.isPending}
            >
              {editingCategory ? 'Update Category' : 'Create Category'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
