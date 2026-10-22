import React, { Suspense, lazy } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { PublicLayout } from '../components/layout/PublicLayout';
import { AdminLayout } from '../components/layout/AdminLayout';
import { ProtectedRoute } from '../components/common/ProtectedRoute';

// Loading fallback spinner for lazy-loaded route segments
const RouteLoadingSpinner = () => (
  <div className="min-h-[50vh] flex items-center justify-center">
    <div className="w-8 h-8 border-4 border-slate-200 border-t-editorial-red rounded-full animate-spin" />
  </div>
);

// Helper wrapper for Suspense
const withSuspense = (Component: React.ComponentType<any>, props?: any) => (
  <Suspense fallback={<RouteLoadingSpinner />}>
    <Component {...props} />
  </Suspense>
);

// Public Pages (Code-split)
const HomePage = lazy(() => import('../pages/HomePage').then((m) => ({ default: m.HomePage })));
const ArticlePage = lazy(() => import('../pages/ArticlePage').then((m) => ({ default: m.ArticlePage })));
const CategoryPage = lazy(() => import('../pages/CategoryPage').then((m) => ({ default: m.CategoryPage })));
const SearchPage = lazy(() => import('../pages/SearchPage').then((m) => ({ default: m.SearchPage })));
const LoginPage = lazy(() => import('../pages/LoginPage').then((m) => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('../pages/RegisterPage').then((m) => ({ default: m.RegisterPage })));
const ForgotPasswordPage = lazy(() => import('../pages/ForgotPasswordPage').then((m) => ({ default: m.ForgotPasswordPage })));
const ProfilePage = lazy(() => import('../pages/ProfilePage').then((m) => ({ default: m.ProfilePage })));
const SavedArticlesPage = lazy(() => import('../pages/SavedArticlesPage').then((m) => ({ default: m.SavedArticlesPage })));
const LikedArticlesPage = lazy(() => import('../pages/LikedArticlesPage').then((m) => ({ default: m.LikedArticlesPage })));
const LatestPage = lazy(() => import('../pages/LatestPage').then((m) => ({ default: m.LatestPage })));
const TrendingPage = lazy(() => import('../pages/TrendingPage').then((m) => ({ default: m.TrendingPage })));
const VideosPage = lazy(() => import('../pages/VideosPage').then((m) => ({ default: m.VideosPage })));
const NotFoundPage = lazy(() => import('../pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })));

// Admin Pages (Code-split)
const AdminDashboardPage = lazy(() => import('../pages/AdminDashboardPage').then((m) => ({ default: m.AdminDashboardPage })));
const AdminCategoriesPage = lazy(() => import('../pages/admin/AdminCategoriesPage').then((m) => ({ default: m.AdminCategoriesPage })));
const AdminTagsPage = lazy(() => import('../pages/admin/AdminTagsPage').then((m) => ({ default: m.AdminTagsPage })));
const AdminLanguagesPage = lazy(() => import('../pages/admin/AdminLanguagesPage').then((m) => ({ default: m.AdminLanguagesPage })));
const AdminUsersPage = lazy(() => import('../pages/admin/AdminUsersPage').then((m) => ({ default: m.AdminUsersPage })));
const AdminCommentsPage = lazy(() => import('../pages/AdminCommentsPage').then((m) => ({ default: m.AdminCommentsPage })));
const AdminPostsPage = lazy(() => import('../pages/admin/AdminPostsPage').then((m) => ({ default: m.AdminPostsPage })));
const AdminNewPostPage = lazy(() => import('../pages/admin/AdminNewPostPage').then((m) => ({ default: m.AdminNewPostPage })));
const AdminEditPostPage = lazy(() => import('../pages/admin/AdminEditPostPage').then((m) => ({ default: m.AdminEditPostPage })));
const AdminPostPreviewPage = lazy(() => import('../pages/admin/AdminPostPreviewPage').then((m) => ({ default: m.AdminPostPreviewPage })));
const AdminMediaPage = lazy(() => import('../pages/admin/AdminMediaPage').then((m) => ({ default: m.AdminMediaPage })));
const AdminBulkUploadPage = lazy(() => import('../pages/admin/AdminBulkUploadPage').then((m) => ({ default: m.AdminBulkUploadPage })));

export const router = createBrowserRouter([
  // Public Editorial Shell
  {
    path: '/',
    element: <PublicLayout />,
    children: [
      { index: true, element: withSuspense(HomePage) },
      { path: 'latest', element: withSuspense(LatestPage) },
      { path: 'trending', element: withSuspense(TrendingPage) },
      { path: 'videos', element: withSuspense(VideosPage) },
      { path: 'category/:slug', element: withSuspense(CategoryPage) },
      { path: 'article/:slug', element: withSuspense(ArticlePage) },
      { path: 'search', element: withSuspense(SearchPage) },
      { path: 'login', element: withSuspense(LoginPage) },
      { path: 'register', element: withSuspense(RegisterPage) },
      { path: 'forgot-password', element: withSuspense(ForgotPasswordPage) },
      {
        path: 'saved',
        element: (
          <ProtectedRoute>
            {withSuspense(SavedArticlesPage)}
          </ProtectedRoute>
        )
      },
      {
        path: 'liked',
        element: (
          <ProtectedRoute>
            {withSuspense(LikedArticlesPage)}
          </ProtectedRoute>
        )
      },
      {
        path: 'settings',
        element: (
          <ProtectedRoute>
            {withSuspense(ProfilePage)}
          </ProtectedRoute>
        )
      },
      {
        path: 'profile',
        element: (
          <ProtectedRoute>
            {withSuspense(ProfilePage)}
          </ProtectedRoute>
        )
      },
      { path: '*', element: withSuspense(NotFoundPage) }
    ]
  },

  // Admin CMS Shell (Requires Authentication & Admin Role)
  {
    path: '/admin',
    element: (
      <ProtectedRoute requireAdmin>
        <AdminLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: withSuspense(AdminDashboardPage)
      },
      {
        path: 'posts',
        element: withSuspense(AdminPostsPage)
      },
      {
        path: 'posts/new',
        element: withSuspense(AdminNewPostPage)
      },
      {
        path: 'posts/:id/edit',
        element: withSuspense(AdminEditPostPage)
      },
      {
        path: 'posts/:id/preview',
        element: withSuspense(AdminPostPreviewPage)
      },
      {
        path: 'bulk-upload',
        element: withSuspense(AdminBulkUploadPage)
      },
      {
        path: 'posts/bulk',
        element: withSuspense(AdminBulkUploadPage)
      },
      {
        path: 'media',
        element: withSuspense(AdminMediaPage)
      },
      {
        path: 'categories',
        element: withSuspense(AdminCategoriesPage)
      },
      {
        path: 'tags',
        element: withSuspense(AdminTagsPage)
      },
      {
        path: 'languages',
        element: withSuspense(AdminLanguagesPage)
      },
      {
        path: 'comments',
        element: withSuspense(AdminCommentsPage)
      },
      {
        path: 'users',
        element: withSuspense(AdminUsersPage)
      },
      { path: '*', element: withSuspense(NotFoundPage) }
    ]
  }
]);
