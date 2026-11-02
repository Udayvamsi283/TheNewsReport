# Frontend Architecture Audit & Component Inventory

**Project:** The News Report — Firebase Migration  
**Document ID:** `FRONTEND_AUDIT.md`  
**Phase:** Phase 1 — Baseline Audit & Firebase Foundation  
**Audited Source Directory:** `D:\UDAY\Projects\TheNewsReport\frontend`  
**Execution Timestamp:** 2026-11-02  

---

## 1. Executive Summary

The frontend of **The News Report** is a modern, single-page application (SPA) engineered with **React 18.3.1**, **TypeScript 5.7.3**, **Vite 6.4.3**, and **Tailwind CSS 3.4.17**. It delivers an authoritative digital journalism presentation paired with a dedicated editorial Content Management System (CMS).

The frontend relies completely on client-side routing (`react-router-dom` v6.28.2) and server-state caching (`@tanstack/react-query` v5.64.2). All editorial content originates dynamically from the backend REST API (`/api/v1`). There is zero synthetic or hardcoded editorial mock data.

This audit documents every architectural layer, route, page, UI component, state container, and network interaction in the frontend codebase, establishing the exact baseline to ensure 100% feature and visual preservation during the Firebase migration.

---

## 2. Application Entry Points & Bootstrap

| File | Role / Responsibility | Key Implementations |
| :--- | :--- | :--- |
| `frontend/index.html` | Root HTML Document | - Viewport configuration, UTF-8 charset.<br>- Favicon link (`/favicon.svg`).<br>- Font preloading (Inter, Merriweather editorial typography).<br>- Root DOM mount point `<div id="root"></div>`.<br>- Vite entry script `<script type="module" src="/src/main.tsx"></script>`. |
| `frontend/src/main.tsx` | React DOM Hydration | - Mounts `<App />` into `document.getElementById('root')` using `ReactDOM.createRoot`.<br>- Strict mode enabled (`<React.StrictMode>`). |
| `frontend/src/App.tsx` | Global Application Provider Shell | - Wraps application in `QueryClientProvider` with configured `QueryClient`.<br>- Injects `AuthProvider` for session and role state.<br>- Injects `LanguageProvider` for multilingual navigation and locale state.<br>- Injects `ToastProvider` for notifications.<br>- Renders `<RouterProvider router={router} />`. |
| `frontend/src/index.css` | Global Styling & Design System | - Tailwind CSS base directives (`@tailwind base; @tailwind components; @tailwind utilities;`).<br>- Custom font variables (`font-serif`, `font-sans`).<br>- Editorial color palette (`editorial-red`, `navy-900`, `navy-950`).<br>- Custom print stylesheets and tip-tap editor typography styles. |
| `frontend/src/config/env.ts` | Frontend Environment Variables | - Resolves `API_BASE_URL` from `import.meta.env.VITE_API_BASE_URL` (defaults to `http://localhost:5000/api/v1` in dev, `/api/v1` in prod).<br>- Resolves `SITE_URL` from `import.meta.env.VITE_SITE_URL`. |

---

## 3. Routing Architecture

Routing is configured in `frontend/src/routes/index.tsx` using `createBrowserRouter` with route-level code splitting via `React.lazy` and Suspense fallbacks.

```mermaid
graph TD
    App[App.tsx RouterProvider] --> Shell{Layout Shells}
    Shell -->|Public Routes| PublicLayout[PublicLayout.tsx]
    Shell -->|Admin Routes| AdminLayout[AdminLayout.tsx (Protected + Admin Role)]

    PublicLayout --> Home[HomePage /]
    PublicLayout --> Latest[LatestPage /latest]
    PublicLayout --> Trending[TrendingPage /trending]
    PublicLayout --> Videos[VideosPage /videos]
    PublicLayout --> Category[CategoryPage /category/:slug]
    PublicLayout --> Article[ArticlePage /article/:slug]
    PublicLayout --> Search[SearchPage /search]
    PublicLayout --> Login[LoginPage /login]
    PublicLayout --> Register[RegisterPage /register]
    PublicLayout --> Forgot[ForgotPasswordPage /forgot-password]
    PublicLayout --> Saved[SavedArticlesPage /saved (Protected)]
    PublicLayout --> Liked[LikedArticlesPage /liked (Protected)]
    PublicLayout --> Profile[ProfilePage /profile & /settings (Protected)]
    PublicLayout --> NotFound[NotFoundPage *]

    AdminLayout --> AdminDash[AdminDashboardPage /admin]
    AdminLayout --> AdminPosts[AdminPostsPage /admin/posts]
    AdminLayout --> AdminNewPost[AdminNewPostPage /admin/posts/new]
    AdminLayout --> AdminEditPost[AdminEditPostPage /admin/posts/:id/edit]
    AdminLayout --> AdminPreview[AdminPostPreviewPage /admin/posts/:id/preview]
    AdminLayout --> AdminBulk[AdminBulkUploadPage /admin/bulk-upload]
    AdminLayout --> AdminMedia[AdminMediaPage /admin/media]
    AdminLayout --> AdminCats[AdminCategoriesPage /admin/categories]
    AdminLayout --> AdminTags[AdminTagsPage /admin/tags]
    AdminLayout --> AdminLangs[AdminLanguagesPage /admin/languages]
    AdminLayout --> AdminComments[AdminCommentsPage /admin/comments]
    AdminLayout --> AdminUsers[AdminUsersPage /admin/users]
```

### Detailed Route Inventory

| Route Path | Shell Layout | Component | Access Control | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `/` | `PublicLayout` | `HomePage` | Public | Main editorial front page with hero story, breaking news, latest dispatches, and category grids. |
| `/latest` | `PublicLayout` | `LatestPage` | Public | Chronological wire feed of all published dispatches with pagination. |
| `/trending` | `PublicLayout` | `TrendingPage` | Public | High-velocity articles sorted by view velocity and recent engagement metrics. |
| `/videos` | `PublicLayout` | `VideosPage` | Public | Video journalism dispatches featuring embedded video players. |
| `/category/:slug`| `PublicLayout` | `CategoryPage` | Public | Category archive page displaying articles filed under the specified category taxonomy. |
| `/article/:slug` | `PublicLayout` | `ArticlePage` | Public / Gated | Full article detail view, format renderers, like/bookmark, comments, and related dispatches. |
| `/search` | `PublicLayout` | `SearchPage` | Public | Editorial archive keyword search with category filtering and paginated results. |
| `/login` | `PublicLayout` | `LoginPage` | Public | Reader & administrator email/password sign-in form. |
| `/register` | `PublicLayout` | `RegisterPage` | Public | Reader account registration form. |
| `/forgot-password`| `PublicLayout` | `ForgotPasswordPage`| Public | Password recovery notification view. |
| `/saved` | `PublicLayout` | `SavedArticlesPage` | Authenticated | Personal reader library displaying bookmarked articles. |
| `/liked` | `PublicLayout` | `LikedArticlesPage` | Authenticated | Personal reader library displaying liked articles. |
| `/profile`, `/settings` | `PublicLayout` | `ProfilePage` | Authenticated | Account management, profile photo upload, preferred language, category interests. |
| `/admin` | `AdminLayout` | `AdminDashboardPage`| Admin Only | Real-time database metrics, total posts, users, comments, category tallies. |
| `/admin/posts` | `AdminLayout` | `AdminPostsPage` | Admin Only | Tabbed post table (Published, Scheduled, Draft, Trashed) with search and filters. |
| `/admin/posts/new` | `AdminLayout` | `AdminNewPostPage` | Admin Only | Full editorial CMS editor (TipTap, format selectors, media, scheduling, translations). |
| `/admin/posts/:id/edit`| `AdminLayout`| `AdminEditPostPage`| Admin Only | Edit existing draft, scheduled, or published articles. |
| `/admin/posts/:id/preview`| `AdminLayout`| `AdminPostPreviewPage`| Admin Only | Pre-publication preview rendering exact public layout. |
| `/admin/bulk-upload`| `AdminLayout` | `AdminBulkUploadPage` | Admin Only | CSV / JSON batch article importer with validation preview. |
| `/admin/media` | `AdminLayout` | `AdminMediaPage` | Admin Only | Visual media library management, asset uploads, filtering, and deletion. |
| `/admin/categories` | `AdminLayout` | `AdminCategoriesPage`| Admin Only | Taxonomy management: create, edit, nest, and delete categories. |
| `/admin/tags` | `AdminLayout` | `AdminTagsPage` | Admin Only | Taxonomy management: create, edit, search, and delete tags. |
| `/admin/languages` | `AdminLayout` | `AdminLanguagesPage` | Admin Only | Multilingual configuration: add language codes, toggle status, set defaults. |
| `/admin/comments` | `AdminLayout` | `AdminCommentsPage` | Admin Only | Reader comment moderation queue: toggle visibility (`visible`, `hidden`, `deleted`). |
| `/admin/users` | `AdminLayout` | `AdminUsersPage` | Admin Only | User governance: inspect users, toggle role (`user`/`admin`), toggle status (`active`/`disabled`). |
| `*` | Both | `NotFoundPage` | Public | Editorial 404 error page with quick links back to front page. |

---

## 4. Component Architecture & UI Hierarchy

### 4.1 Layout Shells
- **`PublicLayout` (`frontend/src/components/layout/PublicLayout.tsx`):**
  - Incorporates `BreakingNewsBar` (auto-hides when no breaking stories are active).
  - Renders top `Header` with live timestamp, edition selector, and account controls.
  - Renders primary `Navbar` with sticky category links, search trigger, and theme toggle.
  - Embeds `<Outlet />` for page contents.
  - Renders comprehensive `Footer` with editorial charter, copyright, taxonomy sitemap, and language switcher.
- **`AdminLayout` (`frontend/src/components/layout/AdminLayout.tsx`):**
  - Left navigation sidebar containing all CMS module links with active state highlighting.
  - Top administrative navigation bar with user avatar, profile quick link, and "Exit to Site" shortcut.
  - Collapsible sidebar for responsive desktop/tablet workflows.

### 4.2 Editorial Article Format Renderers
The application implements 8 specialized article format renderers located in `frontend/src/components/public/format-renderers/`:

| Format | Renderer Component | Rendered Data Elements |
| :--- | :--- | :--- |
| **Standard Article** | Default TipTap HTML | Sanitized rich text, inline images, pull quotes, lead paragraphs. |
| **Gallery** | `GalleryRenderer.tsx` | Carousel and grid views of `galleryItems` with fullscreen lightbox, captions, and photo credits. |
| **Sorted List** | `SortedListRenderer.tsx` | Ordered countdown cards (`itemNumber`, title, description, custom imagery). |
| **Table of Contents**| `TocRenderer.tsx` | Automatically extracted anchor navigation for in-depth longform investigations. |
| **Video** | `VideoRenderer.tsx` | Responsive 16:9 embedded player (YouTube, Vimeo, or direct HTML5 video stream). |
| **Audio** | `AudioRenderer.tsx` | Waveform audio player for podcasts, speech recordings, and newsroom dispatches. |
| **Poll** | `PollRenderer.tsx` | Interactive reader voting module with real-time percentage bars and vote validation. |
| **Event** | `EventRenderer.tsx` | Structured event schedule cards with date, time, location, venue address, and external ticket/map links. |

### 4.3 Editorial CMS Panels
Located in `frontend/src/components/cms/`:
- `TranslationsPanel.tsx`: Tabbed editor allowing simultaneous input of localized titles, slugs, summaries, and contents in English, Telugu, and Hindi.
- `SeoSettingsPanel.tsx`: Inputs for canonical URLs, OpenGraph titles, meta descriptions, search engine preview snippets, and keyword tags.
- `FaqEditorPanel.tsx`: Dynamic schema FAQ builder (question/answer pairs) for structured data extraction.
- `PollEditor.tsx`: Allows journalists to configure poll questions, add/remove dynamic voting options, and set opening/closing schedules.
- `GalleryEditor.tsx`: Re-orderable photo gallery uploader with caption and attribution fields.
- `SortedListEditor.tsx`: Drag-and-drop or indexed list authoring module.
- `VideoEditor.tsx` / `AudioEditor.tsx`: Media URL inputs with automatic embed URL parsing.
- `EventEditor.tsx`: Date-time pickers and location fields.

### 4.4 Rich Text Authoring: `TipTapEditor.tsx`
Located in `frontend/src/components/editor/TipTapEditor.tsx`:
- TipTap v3.31.4 rich-text engine with extensions for StarterKit, Bold, Italic, Underline, Link, Image, Table, TableRow, TableCell, TableHeader, TextAlign, and Placeholder.
- Media Modal Integration: Includes custom button "Insert Image from Media Library", which opens `MediaLibraryModal`, preserves cursor location, and inserts the selected asset's secure URL.
- Source Code Mode: Allows raw HTML editing with instant two-way synchronization.

---

## 5. State Management & API Client Layer

### 5.1 React Query Configuration
- Handled via `@tanstack/react-query`.
- Default query options set `staleTime: 5 minutes` and `refetchOnWindowFocus: false` to minimize unnecessary round trips.
- Explicit query invalidations on mutations:
  - Auth mutations (`login`, `register`, `logout`) clear or update query key `['auth-me']`.
  - Engagement mutations (`like`, `bookmark`, `comment`, `pollVote`) invalidate specific post queries (`['public', 'post', slug]`, `['engagement', 'comments', postId]`).

### 5.2 Context Providers
- **`AuthContext` (`frontend/src/context/AuthContext.tsx`):**
  - Manages `user: User | null`, `isLoading`, `isAuthenticated`, `isAdmin`.
  - Wraps mutations for `login`, `register`, `logout`, `updateProfile`, `uploadAvatar`, `removeAvatar`.
  - Automatically queries `/api/v1/auth/me` on boot with cookies enabled (`credentials: 'include'`).
- **`LanguageContext` (`frontend/src/context/LanguageContext.tsx`):**
  - Supported languages: `en` (English), `te` (Telugu), `hi` (Hindi).
  - Manages `language: SupportedLanguage`, `setLanguage`, `t(key)` translation helper.
  - Synchronizes user preference with `/api/v1/users/me/preferences` when authenticated.
  - Persists preference locally in `localStorage.getItem('the_news_lang')`.
- **`useTheme` (`frontend/src/hooks/useTheme.ts`):**
  - Toggles `theme: 'light' | 'dark'`.
  - Directly toggles the `dark` CSS class on `document.documentElement`.
  - Persists preference in `localStorage.getItem('the_news_theme')`.

### 5.3 Centralized API Client (`frontend/src/services/apiClient.ts`)
The entire application communicates with the backend exclusively via `ApiClient`:
- **Base URL:** Resolved from `env.API_BASE_URL`.
- **Credentials:** Every request includes `credentials: 'include'` to transmit secure HTTP-only cookies (`token` and `csrf-token`).
- **CSRF Protection:** Mutating requests (`POST`, `PUT`, `PATCH`, `DELETE`) automatically attach the `X-CSRF-Token` header, reading from cookie or pre-fetching via `GET /api/v1/auth/csrf-token`.
- **Timeout & Error Handling:** Built-in 20-second timeout via `AbortController` and custom `ApiError` class encapsulating status codes and backend error response payloads.

---

## 6. Complete Frontend API Call Inventory

The following table documents every API call initiated by the frontend application:

| Method Name | HTTP Method | Endpoint | Triggering Component / Hook | Payload / Params |
| :--- | :---: | :--- | :--- | :--- |
| `getHealth` | GET | `/health` | `useHealth.ts` | None |
| `fetchCsrfToken` | GET | `/auth/csrf-token` | `apiClient.ts` | None |
| `register` | POST | `/auth/register` | `RegisterPage.tsx` | `{ name, email, password }` |
| `login` | POST | `/auth/login` | `LoginPage.tsx` | `{ email, password }` |
| `logout` | POST | `/auth/logout` | `Header.tsx`, `AdminLayout.tsx` | None |
| `getMe` | GET | `/auth/me` | `AuthContext.tsx` | None |
| `updateProfile` | PATCH | `/users/me` | `ProfilePage.tsx` | `{ name, preferredLanguage, interests }` |
| `uploadAvatar` | POST | `/users/me/avatar` | `ProfilePage.tsx` | `FormData({ avatar: File })` |
| `removeAvatar` | DELETE | `/users/me/avatar` | `ProfilePage.tsx` | None |
| `changePassword` | POST | `/users/me/change-password` | `ProfilePage.tsx` | `{ currentPassword, newPassword }` |
| `updatePreferences` | PATCH | `/users/me/preferences`| `LanguageContext.tsx` | `{ preferredLanguage, interests }` |
| `getUserBookmarks` | GET | `/users/me/bookmarks` | `SavedArticlesPage.tsx` | Query: `page, limit` |
| `getUserLikes` | GET | `/users/me/likes` | `LikedArticlesPage.tsx` | Query: `page, limit` |
| `listUsers` / `getUsers` | GET | `/users` | `AdminUsersPage.tsx` | Query: `page, limit, search, role, status` |
| `updateUser` | PATCH | `/users/:id` | `AdminUsersPage.tsx` | `{ role, status }` |
| `deleteUser` | DELETE | `/users/:id` | `AdminUsersPage.tsx` | None |
| `getCategories` | GET | `/categories` | `Navbar.tsx`, `AdminCategoriesPage.tsx` | Query: `status` |
| `createCategory` | POST | `/categories` | `AdminCategoriesPage.tsx` | `{ name, slug, description, image, parent }` |
| `updateCategory` | PATCH | `/categories/:id` | `AdminCategoriesPage.tsx` | `{ name, slug, description, image, parent, status }` |
| `deleteCategory` | DELETE | `/categories/:id` | `AdminCategoriesPage.tsx` | None |
| `getTags` | GET | `/tags` | `TrendingTagsWidget.tsx`, `AdminTagsPage.tsx` | Query: `search` |
| `createTag` | POST | `/tags` | `AdminTagsPage.tsx`, `AdminNewPostPage.tsx` | `{ name, slug }` |
| `updateTag` | PATCH | `/tags/:id` | `AdminTagsPage.tsx` | `{ name, slug }` |
| `deleteTag` | DELETE | `/tags/:id` | `AdminTagsPage.tsx` | None |
| `getLanguages` | GET | `/languages` | `AdminLanguagesPage.tsx`, `AdminNewPostPage.tsx` | Query: `status` |
| `createLanguage` | POST | `/languages` | `AdminLanguagesPage.tsx` | `{ name, code, isDefault, status }` |
| `updateLanguage` | PATCH | `/languages/:id` | `AdminLanguagesPage.tsx` | `{ name, code, isDefault, status }` |
| `deleteLanguage` | DELETE | `/languages/:id` | `AdminLanguagesPage.tsx` | None |
| `getMedia` | GET | `/media` | `AdminMediaPage.tsx`, `MediaLibraryModal.tsx` | Query: `page, limit, resourceType, search` |
| `uploadMedia` | POST | `/media` | `AdminMediaPage.tsx`, `MediaLibraryModal.tsx` | `FormData({ file: File, folder, alt, caption })` |
| `updateMedia` | PATCH | `/media/:id` | `AdminMediaPage.tsx` | `{ alt, caption }` |
| `deleteMedia` | DELETE | `/media/:id` | `AdminMediaPage.tsx` | None |
| `getPosts` | GET | `/posts` | `AdminPostsPage.tsx` | Query: `page, limit, status, format, category, language, search` |
| `getPost` | GET | `/posts/:id` | `AdminEditPostPage.tsx` | None |
| `getPostPreview` | GET | `/posts/preview/:tokenOrId` | `AdminPostPreviewPage.tsx` | None |
| `createPost` | POST | `/posts` | `AdminNewPostPage.tsx` | Full post JSON payload |
| `updatePost` | PATCH | `/posts/:id` | `AdminEditPostPage.tsx` | Full post JSON payload |
| `deletePost` | DELETE | `/posts/:id` | `AdminPostsPage.tsx` | Query: `permanent=true` (optional) |
| `restorePost` | POST | `/posts/:id/restore` | `AdminPostsPage.tsx` | None |
| `duplicatePost` | POST | `/posts/:id/duplicate` | `AdminPostsPage.tsx` | None |
| `publishPost` | POST | `/posts/:id/publish` | `AdminPostsPage.tsx`, `AdminEditPostPage.tsx` | None |
| `unpublishPost` | POST | `/posts/:id/unpublish` | `AdminPostsPage.tsx`, `AdminEditPostPage.tsx` | None |
| `bulkUploadPosts` | POST | `/posts/bulk-upload` | `AdminBulkUploadPage.tsx` | `FormData` or JSON `{ rows, action, targetStatus }` |
| `getAdminDashboardStats`| GET | `/posts/admin/stats` | `AdminDashboardPage.tsx` | None |
| `getHomepageData` | GET | `/public/home` | `HomePage.tsx` | Query: `lang` |
| `getFeed` | GET | `/public/feed` | `HomePage.tsx` (For You tab) | Query: `language, category, page, limit` |
| `getPublicPosts` | GET | `/public/posts` | `HomePage.tsx` | Query: `language, category, page, limit` |
| `getPostBySlug` | GET | `/public/posts/:slug` | `ArticlePage.tsx` | Query: `lang` |
| `recordView` | POST | `/public/posts/:id/view` | `ArticlePage.tsx` | None |
| `getCategoryPosts` | GET | `/public/categories/:slug/posts` | `CategoryPage.tsx` | Query: `page, limit, lang` |
| `getLatestPosts` | GET | `/public/latest` | `LatestPage.tsx` | Query: `page, limit, lang` |
| `getTrendingPosts` | GET | `/public/trending` | `TrendingPage.tsx` | Query: `limit, lang` |
| `getVideoPosts` | GET | `/public/videos` | `VideosPage.tsx` | Query: `page, limit` |
| `searchPosts` | GET | `/public/search` | `SearchPage.tsx` | Query: `q, page, limit` |
| `likePost` | POST | `/engagement/posts/:id/like` | `LikeButton.tsx`, `ArticlePage.tsx` | None |
| `unlikePost` | DELETE | `/engagement/posts/:id/like` | `LikeButton.tsx`, `ArticlePage.tsx` | None |
| `bookmarkPost` | POST | `/engagement/posts/:id/bookmark` | `BookmarkButton.tsx`, `ArticlePage.tsx` | None |
| `removeBookmark` | DELETE | `/engagement/posts/:id/bookmark` | `BookmarkButton.tsx`, `ArticlePage.tsx` | None |
| `getComments` | GET | `/engagement/posts/:id/comments` | `CommentSection.tsx` | Query: `page, limit` |
| `createComment` | POST | `/engagement/posts/:id/comments` | `CommentSection.tsx` | `{ content }` |
| `deleteComment` | DELETE | `/engagement/comments/:id` | `CommentSection.tsx` | None |
| `getAdminComments` | GET | `/engagement/admin/comments` | `AdminCommentsPage.tsx` | Query: `page, limit, status` |
| `updateAdminCommentStatus`| PATCH | `/engagement/admin/comments/:id/status` | `AdminCommentsPage.tsx` | `{ status: 'visible' \| 'hidden' \| 'deleted' }` |
| `votePoll` | POST | `/engagement/posts/:id/poll/vote` | `PollRenderer.tsx` | `{ optionId }` |
| `getPollResults` | GET | `/engagement/posts/:id/poll/results` | `PollRenderer.tsx` | None |

---

## 7. Media & Image Handling Audit

1. **Image Rendering:**
   - Articles render imagery using standard HTML `<img />` tags wrapped in Tailwind responsive containers (e.g. `aspect-[16/10]`, `aspect-[4/3]`, `object-cover`).
   - Image URLs are consumed directly from `featuredImage.url`, `images[i].url`, `galleryItems[i].image`, or `avatar`.
   - The frontend performs **zero URL manipulation or proprietary CDN transformations** (such as dynamic Cloudinary path splicing `w_500,f_auto`).
   - If an image fails to load or is absent, the fallback component `ArticleImagePlaceholder.tsx` renders a graceful editorial gradient placeholder with category insignia.
2. **Media Uploading:**
   - Handled via `apiClient.uploadMedia` (sending `FormData` to `/api/v1/media`) or `apiClient.uploadAvatar` (sending `FormData` to `/api/v1/users/me/avatar`).
   - The backend processes the upload and returns standard HTTPS URLs (`url` and `secureUrl`).
   - The frontend stores these URLs directly in post document payloads.

---

## 8. Minimum Required Frontend Changes for Firebase Migration

In accordance with the permanent project requirements (preserving 100% of existing UI, layouts, styles, and workflows), frontend changes are strictly minimized to the following isolated additions:

1. **Google Sign-in Integration:**
   - Add a "Sign in with Google" button on `LoginPage.tsx` and `RegisterPage.tsx` matching the existing editorial styling (navy/white button with official Google "G" icon).
   - Use the Firebase Client SDK (`firebase/auth`) method `signInWithPopup(auth, googleProvider)`.
   - Add an endpoint call `apiClient.loginWithGoogle(idToken)` that passes the resulting Google ID token to the backend (`POST /api/v1/auth/google`).
   - The backend will verify the token, create/link the reader account, set the HTTP-only session cookie, and return the authenticated `User` record.
2. **Client Environment Configuration:**
   - Add Firebase Client SDK configuration keys to `frontend/src/config/firebase.ts` (API Key, Auth Domain, Project ID, Storage Bucket, Messaging Sender ID, App ID).
3. **Copy / Label Corrections:**
   - In `MediaLibraryModal.tsx` and `AdminMediaPage.tsx`, update user-facing text from "Upload to Cloudinary" to "Upload Media" or "Upload to Cloud Storage".
4. **Hosting Configuration:**
   - Add single-page application rewrite rule in `firebase.json` for Firebase Hosting (`"rewrites": [{ "source": "**", "destination": "/index.html" }]`).

**What Must NOT Be Changed:**
- No changes to page routes, URLs, or layout components.
- No changes to Tailwind configuration, fonts, or colors.
- No removal of email/password login or registration forms.
- No changes to editorial TipTap authoring, post format renderers, or CMS workflows.
- No changes to existing reader engagement features (bookmarks, likes, comments, poll votes).

