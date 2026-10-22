import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../services/apiClient';
import { Language } from '../../types';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Checkbox } from '../../components/ui/Checkbox';
import { Modal } from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';
import { Plus, Edit2, Trash2, CheckCircle, Globe } from 'lucide-react';

export const AdminLanguagesPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLanguage, setEditingLanguage] = useState<Language | null>(null);

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [status, setStatus] = useState<'active' | 'inactive'>('active');

  // Fetch languages
  const { data: languages = [], isLoading } = useQuery<Language[]>({
    queryKey: ['languages'],
    queryFn: () => apiClient.getLanguages()
  });

  const resetForm = () => {
    setCode('');
    setName('');
    setIsDefault(false);
    setStatus('active');
    setEditingLanguage(null);
  };

  const openCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (lang: Language) => {
    setEditingLanguage(lang);
    setCode(lang.code);
    setName(lang.name);
    setIsDefault(lang.isDefault);
    setStatus(lang.status);
    setIsModalOpen(true);
  };

  // Create Mutation
  const createMutation = useMutation({
    mutationFn: (data: { code: string; name: string; isDefault?: boolean; status?: 'active' | 'inactive' }) =>
      apiClient.createLanguage(data),
    onSuccess: () => {
      showToast('Language added successfully', 'success');
      queryClient.invalidateQueries({ queryKey: ['languages'] });
      setIsModalOpen(false);
      resetForm();
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : 'Failed to create language';
      showToast(msg, 'error');
    }
  });

  // Update Mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Language> }) =>
      apiClient.updateLanguage(id, data),
    onSuccess: () => {
      showToast('Language updated successfully', 'success');
      queryClient.invalidateQueries({ queryKey: ['languages'] });
      setIsModalOpen(false);
      resetForm();
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : 'Failed to update language';
      showToast(msg, 'error');
    }
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.deleteLanguage(id),
    onSuccess: () => {
      showToast('Language deleted successfully', 'success');
      queryClient.invalidateQueries({ queryKey: ['languages'] });
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : 'Failed to delete language';
      showToast(msg, 'error');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !name.trim()) {
      showToast('Code and Name are required', 'error');
      return;
    }

    if (editingLanguage) {
      const editId = editingLanguage._id || editingLanguage.id || '';
      updateMutation.mutate({
        id: editId,
        data: {
          code: code.trim().toLowerCase(),
          name: name.trim(),
          isDefault,
          status
        }
      });
    } else {
      createMutation.mutate({
        code: code.trim().toLowerCase(),
        name: name.trim(),
        isDefault,
        status
      });
    }
  };

  const handleDelete = (lang: Language) => {
    if (lang.isDefault) {
      showToast('The platform default language cannot be deleted', 'error');
      return;
    }
    const langId = lang._id || lang.id || '';
    if (window.confirm(`Are you sure you want to delete ${lang.name} (${lang.code})?`)) {
      deleteMutation.mutate(langId);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-navy-750">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black uppercase tracking-tight text-slate-900 dark:text-white">
              Multilingual Locales
            </h1>
            <Badge variant="primary" size="sm">
              {languages.length} Configured
            </Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Foundation for platform multilingual editions, reader locale selection, and future localized dispatches.
          </p>
        </div>

        <Button onClick={openCreateModal} leftIcon={<Plus className="w-4 h-4" />}>
          Add Language
        </Button>
      </div>

      {/* Languages Table */}
      <Card className="p-0 overflow-hidden bg-white dark:bg-navy-850 border-slate-200 dark:border-navy-700">
        {isLoading ? (
          <div className="p-8 text-center text-sm text-slate-500">Loading languages...</div>
        ) : languages.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">No languages found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-navy-750 bg-slate-50 dark:bg-navy-900 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <th className="py-3 px-4">Language</th>
                  <th className="py-3 px-4">ISO Code</th>
                  <th className="py-3 px-4">Default</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-navy-750 text-sm">
                {languages.map((lang) => (
                  <tr key={lang._id} className="hover:bg-slate-50/50 dark:hover:bg-navy-800/50 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Globe className="w-4 h-4 text-editorial-red" />
                      <span>{lang.name}</span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs uppercase text-slate-500 dark:text-slate-400">
                      {lang.code}
                    </td>
                    <td className="py-3.5 px-4">
                      {lang.isDefault ? (
                        <Badge variant="primary" size="sm" className="gap-1">
                          <CheckCircle className="w-3 h-3" /> System Default
                        </Badge>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant={lang.status === 'active' ? 'success' : 'outline'} size="sm">
                        {lang.status}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <Button size="sm" variant="ghost" onClick={() => openEditModal(lang)}>
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                      {!lang.isDefault && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(lang)}
                          className="text-editorial-red hover:bg-red-50 dark:hover:bg-red-950"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingLanguage ? `Edit Language: ${editingLanguage.name}` : 'Add New Language'}
        size="sm"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Language Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Telugu"
            required
          />

          <Input
            label="ISO Code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="e.g. te"
            helperText="Lowercase 2 to 5 character code."
            required
          />

          <div className="pt-2">
            <Checkbox
              label="Make System Default"
              description="Default locale served to logged-out readers."
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as 'active' | 'inactive')}
              className="w-full px-3 py-2 text-sm rounded bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-editorial-red"
            >
              <option value="active">Active (Available)</option>
              <option value="inactive">Inactive (Disabled)</option>
            </select>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-navy-750 flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={createMutation.isPending || updateMutation.isPending}
            >
              {editingLanguage ? 'Update Language' : 'Save Language'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
