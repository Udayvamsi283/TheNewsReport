import React, { useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  FilePlus,
  UploadCloud,
  Image as ImageIcon,
  FolderTree,
  Tag,
  Languages,
  MessageSquare,
  Users,
  Sun,
  Moon,
  ExternalLink,
  Menu,
  X,
  ChevronRight,
  LogOut
} from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../hooks/useAuth';
import { cn } from '../../lib/utils';
import { Avatar } from '../ui/Avatar';

interface NavSection {
  title: string;
  items: { label: string; to: string; icon: React.ReactNode }[];
}

export const AdminLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navSections: NavSection[] = [
    {
      title: 'EDITORIAL',
      items: [
        { label: 'Dashboard', to: '/admin', icon: <LayoutDashboard className="w-4 h-4" /> },
        { label: 'Articles', to: '/admin/posts', icon: <FileText className="w-4 h-4" /> },
        { label: 'New Article', to: '/admin/posts/new', icon: <FilePlus className="w-4 h-4" /> },
        { label: 'Bulk Import', to: '/admin/bulk-upload', icon: <UploadCloud className="w-4 h-4" /> }
      ]
    },
    {
      title: 'ASSETS',
      items: [
        { label: 'Media Library', to: '/admin/media', icon: <ImageIcon className="w-4 h-4" /> }
      ]
    },
    {
      title: 'TAXONOMIES',
      items: [
        { label: 'Categories', to: '/admin/categories', icon: <FolderTree className="w-4 h-4" /> },
        { label: 'Tags', to: '/admin/tags', icon: <Tag className="w-4 h-4" /> },
        { label: 'Languages', to: '/admin/languages', icon: <Languages className="w-4 h-4" /> }
      ]
    },
    {
      title: 'COMMUNITY',
      items: [
        { label: 'Users', to: '/admin/users', icon: <Users className="w-4 h-4" /> },
        { label: 'Comments', to: '/admin/comments', icon: <MessageSquare className="w-4 h-4" /> }
      ]
    }
  ];

  // Breadcrumbs calculation
  const pathSegments = location.pathname.split('/').filter(Boolean);

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-navy-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans">
      {/* Mobile Top Header */}
      <header className="lg:hidden bg-white dark:bg-navy-900 border-b border-slate-200 dark:border-navy-700/80 px-4 py-3 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 rounded text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-navy-800"
            aria-label="Toggle admin sidebar"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <Link to="/admin" className="font-black text-lg text-navy-900 dark:text-white flex items-center gap-1.5">
            <span>THE NEWS REPORT</span>
            <span className="text-[10px] font-bold bg-editorial-red text-white px-1.5 py-0.2 rounded uppercase">
              Admin
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-navy-800 text-slate-700 dark:text-slate-300"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Responsive Sidebar */}
        <aside
          className={cn(
            'fixed inset-y-0 left-0 z-50 w-64 bg-navy-900 text-slate-300 transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-auto flex flex-col border-r border-navy-800 shadow-lg lg:shadow-none',
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          {/* Sidebar Header */}
          <div className="p-4 border-b border-navy-800 flex items-center justify-between">
            <Link to="/admin" className="flex items-center gap-2">
              <span className="font-black text-xl text-white tracking-tight">THE NEWS REPORT</span>
              <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-editorial-red text-white">
                CMS
              </span>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1 text-slate-400 hover:text-white"
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Sidebar Links Navigation */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-6 text-xs">
            {navSections.map((section) => (
              <div key={section.title} className="space-y-1">
                <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 px-3 py-1">
                  {section.title}
                </div>
                {section.items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/admin'}
                    onClick={() => setSidebarOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-3 px-3 py-2 rounded font-medium transition-colors',
                        isActive
                          ? 'bg-editorial-red text-white font-semibold shadow-sm'
                          : 'text-slate-300 hover:bg-navy-800 hover:text-white'
                      )
                    }
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </NavLink>
                ))}
              </div>
            ))}
          </nav>

          {/* Sidebar Footer: Quick View Live Site & Author info */}
          <div className="p-4 border-t border-navy-800 bg-navy-950/60 space-y-3">
            <Link
              to="/"
              className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded bg-navy-800 hover:bg-navy-750 text-slate-200 text-xs font-semibold uppercase tracking-wider transition-colors"
            >
              <span>View Live Platform</span>
              <ExternalLink className="w-3.5 h-3.5 text-editorial-red" />
            </Link>

            <div className="flex items-center justify-between gap-2 px-1 pt-1">
              <div className="flex items-center gap-2.5 min-w-0">
                <Avatar name={user?.name || 'Admin'} src={user?.avatar} size="sm" />
                <div className="truncate">
                  <div className="text-xs font-semibold text-white truncate">{user?.name || 'Administrator'}</div>
                  <div className="text-[10px] text-editorial-red uppercase tracking-wider font-bold">
                    {user?.role || 'admin'}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-navy-800 transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </aside>

        {/* Backdrop for mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          {/* Top Bar for Desktop */}
          <div className="hidden lg:flex items-center justify-between px-8 py-3.5 bg-white dark:bg-navy-900 border-b border-slate-200 dark:border-navy-750 sticky top-0 z-30">
            {/* Breadcrumbs */}
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              <Link to="/admin" className="hover:text-slate-900 dark:hover:text-white font-medium">
                Admin
              </Link>
              {pathSegments.slice(1).map((seg, i) => (
                <React.Fragment key={i}>
                  <ChevronRight className="w-3 h-3 text-slate-400" />
                  <span className="capitalize font-semibold text-slate-800 dark:text-slate-200">
                    {seg.replace(/-/g, ' ')}
                  </span>
                </React.Fragment>
              ))}
            </div>

            {/* Actions: theme toggle, live site */}
            <div className="flex items-center gap-4">
              <button
                onClick={toggleTheme}
                type="button"
                className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-navy-800 text-slate-600 dark:text-slate-300 transition-colors"
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
              </button>

              <Link
                to="/"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded bg-slate-100 hover:bg-slate-200 dark:bg-navy-800 dark:hover:bg-navy-750 text-slate-700 dark:text-slate-200 transition-colors"
              >
                <span>Live Site</span>
                <ExternalLink className="w-3 h-3 text-editorial-red" />
              </Link>
            </div>
          </div>

          {/* Subview Outlet */}
          <main className="p-4 sm:p-6 lg:p-8 flex-1">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};
