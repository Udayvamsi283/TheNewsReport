import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../services/apiClient';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import {
  FileText,
  Eye,
  ArrowUpRight,
  TrendingUp,
  ExternalLink,
  Clock,
  Users as UsersIcon,
  MessageSquare,
  CheckCircle2,
  Calendar,
  Layers
} from 'lucide-react';

export const AdminDashboardPage: React.FC = () => {
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['adminDashboardStats'],
    queryFn: () => apiClient.getAdminDashboardStats(),
    refetchInterval: 30000
  });

  const counts = dashboardData?.counts || {
    totalPosts: 0,
    published: 0,
    drafts: 0,
    scheduled: 0,
    users: 0,
    comments: 0,
    views: 0
  };

  const recentPosts: any[] = dashboardData?.recentPosts || [];
  const recentlyUpdated: any[] = dashboardData?.recentlyUpdated || [];
  const mostViewed: any[] = dashboardData?.mostViewed || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-editorial-red"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Dashboard Top Greeting & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-navy-750">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-slate-900 dark:text-white">
            Editorial CMS Console
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Overview of published content, reader engagement, and platform activity.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link to="/admin/posts/new">
            <Button size="sm" variant="primary" leftIcon={<FileText className="w-4 h-4" />}>
              New Article
            </Button>
          </Link>
          <Link to="/" target="_blank" rel="noreferrer">
            <Button size="sm" variant="outline" rightIcon={<ExternalLink className="w-3.5 h-3.5" />}>
              View Live Site
            </Button>
          </Link>
        </div>
      </div>

      {/* Real Core Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3.5">
        {/* Total Posts */}
        <Link to="/admin/posts">
          <Card className="p-3.5 bg-white dark:bg-navy-850 hover:border-editorial-red/50 transition-colors">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mb-1">
              <Layers className="w-3.5 h-3.5 text-editorial-red" />
              Total Posts
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {counts.totalPosts}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">All active records</div>
          </Card>
        </Link>

        {/* Published */}
        <Link to="/admin/posts?status=published">
          <Card className="p-3.5 bg-white dark:bg-navy-850 hover:border-editorial-red/50 transition-colors">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mb-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              Published
            </div>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
              {counts.published}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Live on wire</div>
          </Card>
        </Link>

        {/* Drafts */}
        <Link to="/admin/posts?status=draft">
          <Card className="p-3.5 bg-white dark:bg-navy-850 hover:border-editorial-red/50 transition-colors">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mb-1">
              <FileText className="w-3.5 h-3.5 text-amber-500" />
              Drafts
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {counts.drafts}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">In progress</div>
          </Card>
        </Link>

        {/* Scheduled */}
        <Link to="/admin/posts?status=scheduled">
          <Card className="p-3.5 bg-white dark:bg-navy-850 hover:border-editorial-red/50 transition-colors">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mb-1">
              <Calendar className="w-3.5 h-3.5 text-blue-500" />
              Scheduled
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {counts.scheduled}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Future embargo</div>
          </Card>
        </Link>

        {/* Registered Users */}
        <Link to="/admin/users">
          <Card className="p-3.5 bg-white dark:bg-navy-850 hover:border-editorial-red/50 transition-colors">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mb-1">
              <UsersIcon className="w-3.5 h-3.5 text-indigo-500" />
              Users
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {counts.users}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Registered readers</div>
          </Card>
        </Link>

        {/* Comments */}
        <Link to="/admin/comments">
          <Card className="p-3.5 bg-white dark:bg-navy-850 hover:border-editorial-red/50 transition-colors">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mb-1">
              <MessageSquare className="w-3.5 h-3.5 text-purple-500" />
              Comments
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {counts.comments}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">Reader feedback</div>
          </Card>
        </Link>

        {/* Total Views */}
        <Card className="p-3.5 bg-white dark:bg-navy-850">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mb-1">
            <Eye className="w-3.5 h-3.5 text-teal-500" />
            Total Views
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {counts.views.toLocaleString()}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Article impressions</div>
        </Card>
      </div>

      {/* Main Grid: Recent Articles Table & Sidebar Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Recent Posts Table (8 Cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-editorial-red" />
              Recent Posts
            </h2>
            <Link to="/admin/posts" className="text-xs font-semibold text-editorial-red hover:underline flex items-center gap-1">
              <span>View all posts</span>
              <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>

          {recentPosts.length === 0 ? (
            <Card className="p-8 text-center bg-white dark:bg-navy-850">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                No articles created in the database yet.
              </p>
              <Link to="/admin/posts/new" className="inline-block mt-3">
                <Button size="sm" variant="primary">Create First Article</Button>
              </Link>
            </Card>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Headline</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Author</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Views</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentPosts.map((post) => (
                  <TableRow key={post._id}>
                    <TableCell className="font-semibold text-slate-900 dark:text-white max-w-[280px] truncate">
                      <Link to={`/admin/posts/${post._id}/edit`} className="hover:text-editorial-red transition-colors flex items-center gap-1.5">
                        <span className="truncate">{post.title}</span>
                        {post.isFeatured && (
                          <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 font-bold shrink-0">
                            Featured
                          </span>
                        )}
                        {post.isBreaking && (
                          <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-red-100 text-editorial-red dark:bg-red-900/40 dark:text-red-300 font-bold shrink-0">
                            Breaking
                          </span>
                        )}
                      </Link>
                    </TableCell>
                    <TableCell className="text-xs font-medium text-slate-600 dark:text-slate-300">
                      {post.category?.name || 'Unassigned'}
                    </TableCell>
                    <TableCell className="text-xs text-slate-500 dark:text-slate-400">
                      {post.author?.name || 'The News Report'}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          post.status === 'published'
                            ? 'success'
                            : post.status === 'draft'
                            ? 'outline'
                            : 'warning'
                        }
                        size="sm"
                      >
                        {post.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs text-slate-600 dark:text-slate-300">
                      {post.views || 0}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        {/* Right Column: Most Viewed & Recently Updated (4 Cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Most Viewed Stories */}
          <div className="bg-white dark:bg-navy-850 p-5 rounded border border-slate-200 dark:border-navy-700 space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-navy-750">
              <TrendingUp className="w-4 h-4 text-editorial-red" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Most Viewed Published Stories
              </h3>
            </div>
            {mostViewed.length === 0 ? (
              <p className="text-xs text-slate-400 py-3 text-center">
                No published readership data yet.
              </p>
            ) : (
              <div className="space-y-3">
                {mostViewed.map((story, i) => (
                  <div key={story._id} className="flex items-start gap-3">
                    <span className="text-lg font-black text-slate-300 dark:text-navy-700 leading-none shrink-0 w-4">
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <Link
                        to={`/article/${story.slug}`}
                        target="_blank"
                        className="text-xs font-semibold text-slate-800 dark:text-slate-200 hover:text-editorial-red transition-colors block truncate"
                      >
                        {story.title}
                      </Link>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                        <span>{story.category?.name || 'General'}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1 font-mono">
                          <Eye className="w-3 h-3" />
                          {(story.views || 0).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recently Updated Posts (Option B from Audit) */}
          <div className="bg-white dark:bg-navy-850 p-5 rounded border border-slate-200 dark:border-navy-700 space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-navy-750">
              <Clock className="w-4 h-4 text-editorial-red" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Recently Updated Posts
              </h3>
            </div>
            {recentlyUpdated.length === 0 ? (
              <p className="text-xs text-slate-400 py-3 text-center">
                No recent post modifications.
              </p>
            ) : (
              <div className="space-y-3">
                {recentlyUpdated.map((post) => (
                  <div key={post._id} className="text-xs space-y-0.5">
                    <div className="text-slate-800 dark:text-slate-200 font-medium">
                      <Link
                        to={`/admin/posts/${post._id}/edit`}
                        className="hover:text-editorial-red transition-colors font-semibold text-slate-900 dark:text-white block truncate"
                      >
                        {post.title}
                      </Link>
                    </div>
                    <div className="text-[10px] text-slate-400 flex items-center justify-between">
                      <span>Updated {new Date(post.updatedAt).toLocaleDateString()}</span>
                      <span className="capitalize">{post.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
