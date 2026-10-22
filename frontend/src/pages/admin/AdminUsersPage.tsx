import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../services/apiClient';
import { User, Pagination } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Avatar } from '../../components/ui/Avatar';
import { Modal } from '../../components/ui/Modal';
import { useToast } from '../../components/ui/Toast';
import {
  Search,
  Shield,
  Trash2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

export const AdminUsersPage: React.FC = () => {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { user: currentAuthUser } = useAuth();

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  // Edit User Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editRole, setEditRole] = useState<'user' | 'admin'>('user');
  const [editStatus, setEditStatus] = useState<'active' | 'disabled'>('active');

  // Fetch users with TanStack Query
  const { data, isLoading } = useQuery<{ users: User[]; pagination: Pagination }>({
    queryKey: ['adminUsers', { page, limit, search, role: roleFilter }],
    queryFn: () => apiClient.getUsers({ page, limit, search: search || undefined, role: roleFilter || undefined })
  });

  const users = data?.users || [];
  const pagination = data?.pagination;

  // Update User Mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { role?: 'user' | 'admin'; status?: 'active' | 'disabled' } }) =>
      apiClient.updateUser(id, data),
    onSuccess: () => {
      showToast('User account updated successfully', 'success');
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
      setIsModalOpen(false);
      setSelectedUser(null);
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : 'Failed to update user';
      showToast(msg, 'error');
    }
  });

  // Delete User Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.deleteUser(id),
    onSuccess: () => {
      showToast('User deleted successfully', 'success');
      queryClient.invalidateQueries({ queryKey: ['adminUsers'] });
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : 'Failed to delete user';
      showToast(msg, 'error');
    }
  });

  const openEditModal = (u: User) => {
    setSelectedUser(u);
    setEditRole(u.role);
    setEditStatus(u.status);
    setIsModalOpen(true);
  };

  const handleUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    const selId = selectedUser._id || selectedUser.id || '';
    const currentId = currentAuthUser?._id || currentAuthUser?.id || '';

    if (selId === currentId && editRole !== 'admin') {
      showToast('You cannot revoke your own administrator privileges', 'error');
      return;
    }

    updateMutation.mutate({
      id: selId,
      data: { role: editRole, status: editStatus }
    });
  };

  const handleDelete = (u: User) => {
    const targetId = u._id || u.id || '';
    const currentId = currentAuthUser?._id || currentAuthUser?.id || '';

    if (targetId === currentId) {
      showToast('You cannot delete your own account from the administrator console', 'error');
      return;
    }
    if (window.confirm(`Are you sure you want to permanently delete user "${u.name}" (${u.email})?`)) {
      deleteMutation.mutate(targetId);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-navy-750">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black uppercase tracking-tight text-slate-900 dark:text-white">
              User Accounts
            </h1>
            <Badge variant="primary" size="sm">
              {pagination?.total || 0} Registered
            </Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage subscriber and staff credentials, assign administrative roles, and enforce account governance.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="max-w-md w-full">
          <Input
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            leftIcon={<Search className="w-4 h-4" />}
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 text-xs rounded bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700 text-slate-700 dark:text-slate-300 font-medium"
          >
            <option value="">All Roles</option>
            <option value="admin">Administrators</option>
            <option value="user">Subscribers / Readers</option>
          </select>
        </div>
      </div>

      {/* Users Table / List */}
      <Card className="p-0 overflow-hidden bg-white dark:bg-navy-850 border-slate-200 dark:border-navy-700">
        {isLoading ? (
          <div className="p-12 text-center text-sm text-slate-500">Loading user accounts...</div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center text-sm text-slate-500">
            {search ? 'No users found matching your search.' : 'No user accounts found.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-navy-750 bg-slate-50 dark:bg-navy-900 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Locale</th>
                  <th className="py-3 px-4">Registered</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-navy-750 text-sm">
                {users.map((u) => {
                  const uId = u._id || u.id || '';
                  const isSelf = uId === (currentAuthUser?._id || currentAuthUser?.id);
                  return (
                    <tr
                      key={uId}
                      className="hover:bg-slate-50/50 dark:hover:bg-navy-800/50 transition-colors"
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <Avatar name={u.name} src={u.avatar} size="sm" />
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                              <span>{u.name}</span>
                              {isSelf && (
                                <span className="text-[10px] font-bold text-editorial-red bg-red-50 dark:bg-red-950/50 px-1.5 py-0.2 rounded">
                                  You
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                              {u.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <Badge variant={u.role === 'admin' ? 'danger' : 'secondary'} size="sm">
                          {u.role.toUpperCase()}
                        </Badge>
                      </td>

                      <td className="py-3.5 px-4">
                        <Badge
                          variant={u.status === 'active' ? 'success' : 'outline'}
                          size="sm"
                          className="capitalize"
                        >
                          {u.status}
                        </Badge>
                      </td>

                      <td className="py-3.5 px-4 text-xs font-mono uppercase text-slate-500 dark:text-slate-400">
                        {u.preferredLanguage || 'en'}
                      </td>

                      <td className="py-3.5 px-4 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>

                      <td className="py-3.5 px-4 text-right space-x-2 whitespace-nowrap">
                        <Button size="sm" variant="outline" onClick={() => openEditModal(u)}>
                          Manage
                        </Button>
                        {!isSelf && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(u)}
                            className="text-editorial-red hover:bg-red-50 dark:hover:bg-red-950"
                            title="Delete User"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Controls */}
        {pagination && (pagination.pages || pagination.totalPages || 1) > 1 && (
          <div className="p-4 border-t border-slate-100 dark:border-navy-750 flex items-center justify-between text-xs text-slate-500">
            <div>
              Showing Page {pagination.page} of {pagination.pages || pagination.totalPages} ({pagination.total} users)
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={page >= (pagination.pages || pagination.totalPages || 1)}
                onClick={() => setPage((p) => p + 1)}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Edit User Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedUser ? `Account Governance: ${selectedUser.name}` : 'Edit User'}
        size="sm"
      >
        {selectedUser && (
          <form onSubmit={handleUpdateSubmit} className="space-y-4">
            <div className="p-3 rounded bg-slate-50 dark:bg-navy-900 border border-slate-200 dark:border-navy-750 flex items-center gap-3">
              <Avatar name={selectedUser.name} src={selectedUser.avatar} size="md" />
              <div className="min-w-0">
                <div className="font-bold text-sm text-slate-900 dark:text-white truncate">
                  {selectedUser.name}
                </div>
                <div className="text-xs text-slate-500 font-mono truncate">{selectedUser.email}</div>
              </div>
            </div>

            {/* Role Selector */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-editorial-red" />
                <span>Authorization Role</span>
              </label>
              <select
                value={editRole}
                onChange={(e) => setEditRole(e.target.value as 'user' | 'admin')}
                className="w-full px-3 py-2 text-sm rounded bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-editorial-red"
              >
                <option value="user">User (Subscriber/Reader - Public Access)</option>
                <option value="admin">Admin (Staff & Full Newsroom Control)</option>
              </select>
            </div>

            {/* Status Selector */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Account Status
              </label>
              <select
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value as 'active' | 'disabled')}
                className="w-full px-3 py-2 text-sm rounded bg-white dark:bg-navy-900 border border-slate-200 dark:border-navy-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-editorial-red"
              >
                <option value="active">Active (Permitted to sign in and read)</option>
                <option value="disabled">Disabled (Access revoked)</option>
              </select>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-navy-750 flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" isLoading={updateMutation.isPending}>
                Save Changes
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
