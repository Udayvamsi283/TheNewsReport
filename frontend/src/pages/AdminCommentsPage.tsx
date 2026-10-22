import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../services/apiClient';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import { MessageSquare, EyeOff, Eye, Trash2, ExternalLink } from 'lucide-react';

export const AdminCommentsPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['adminComments', page, statusFilter],
    queryFn: () =>
      apiClient.getAdminComments({
        page,
        limit: 15,
        status: statusFilter === 'all' ? undefined : statusFilter
      })
  });

  const comments = data?.comments || [];
  const pagination = data?.pagination || { page: 1, limit: 15, total: 0, pages: 1 };

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'visible' | 'hidden' | 'deleted' }) =>
      apiClient.updateAdminCommentStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminComments'] });
      queryClient.invalidateQueries({ queryKey: ['adminDashboardStats'] });
    }
  });

  const handleStatusChange = (id: string, newStatus: 'visible' | 'hidden' | 'deleted') => {
    updateStatusMutation.mutate({ id, status: newStatus });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-navy-750">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <MessageSquare className="w-6 h-6 text-editorial-red" />
            Comment Moderation
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Review reader comments, moderate community feedback, and manage visible discussions.
          </p>
        </div>

        {/* Filter controls */}
        <div className="flex items-center gap-2">
          {['all', 'visible', 'hidden', 'deleted'].map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => {
                setStatusFilter(status);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded text-xs font-semibold uppercase tracking-wider transition-colors ${
                statusFilter === status
                  ? 'bg-navy-900 text-white dark:bg-white dark:text-navy-950'
                  : 'bg-slate-100 text-slate-600 dark:bg-navy-800 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-navy-750'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Main Table */}
      {isLoading ? (
        <div className="py-16 text-center text-xs text-slate-400">Loading reader comments...</div>
      ) : comments.length === 0 ? (
        <Card className="p-12 text-center bg-white dark:bg-navy-850">
          <MessageSquare className="w-10 h-10 text-slate-300 dark:text-navy-700 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            No comments found
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            {statusFilter === 'all'
              ? 'Readers have not posted any comments yet.'
              : `No comments with status "${statusFilter}".`}
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Comment & Reader</TableHead>
                <TableHead>Article</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {comments.map((comment) => {
                const postInfo = typeof comment.post === 'object' ? comment.post : null;
                return (
                  <TableRow key={comment._id}>
                    <TableCell className="max-w-[340px]">
                      <p className="text-xs text-slate-900 dark:text-white font-medium line-clamp-2">
                        "{comment.content}"
                      </p>
                      <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-2">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {comment.user?.name || 'Anonymous Reader'}
                        </span>
                        {comment.user?.email && (
                          <span className="text-[10px] text-slate-400">({comment.user.email})</span>
                        )}
                        <span className="text-[10px] uppercase font-bold text-slate-400 px-1 py-0.5 rounded bg-slate-100 dark:bg-navy-800">
                          {comment.user?.role || 'reader'}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell className="max-w-[200px] truncate text-xs">
                      {postInfo ? (
                        <Link
                          to={`/article/${postInfo.slug}`}
                          target="_blank"
                          className="text-editorial-red hover:underline flex items-center gap-1 truncate"
                        >
                          <span className="truncate">{postInfo.title}</span>
                          <ExternalLink className="w-3 h-3 shrink-0" />
                        </Link>
                      ) : (
                        <span className="text-slate-400">Article deleted</span>
                      )}
                    </TableCell>

                    <TableCell className="text-xs text-slate-500 whitespace-nowrap">
                      {new Date(comment.createdAt).toLocaleDateString()}
                    </TableCell>

                    <TableCell>
                      <Badge
                        variant={
                          comment.status === 'visible'
                            ? 'success'
                            : comment.status === 'hidden'
                            ? 'warning'
                            : 'danger'
                        }
                        size="sm"
                      >
                        {comment.status}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {comment.status !== 'visible' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleStatusChange(comment._id, 'visible')}
                            title="Show comment"
                            className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Button>
                        )}
                        {comment.status === 'visible' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleStatusChange(comment._id, 'hidden')}
                            title="Hide comment"
                            className="text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/30"
                          >
                            <EyeOff className="w-3.5 h-3.5" />
                          </Button>
                        )}
                        {comment.status !== 'deleted' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleStatusChange(comment._id, 'deleted')}
                            title="Delete comment"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {/* Pagination */}
          {pagination.pages && pagination.pages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-navy-750 text-xs">
              <span className="text-slate-500">
                Page {pagination.page} of {pagination.pages} ({pagination.total} total)
              </span>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page >= (pagination.pages || 1)}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
