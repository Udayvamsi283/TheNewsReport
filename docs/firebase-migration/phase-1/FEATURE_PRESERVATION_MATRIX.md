# Feature Preservation Matrix

**Project:** The News Report — Firebase Migration  
**Document ID:** `FEATURE_PRESERVATION_MATRIX.md`  
**Phase:** Phase 1 — Baseline Audit & Firebase Foundation  
**Audited Source Directory:** `D:\UDAY\Projects\TheNewsReport`  
**Execution Timestamp:** 2026-11-02  

---

## 1. Executive Summary

This matrix establishes a strict inventory of every user-visible and administrative feature across **The News Report**. Under the non-negotiable project requirements, **zero existing features may be removed or degraded** during the migration to Google Cloud and Firebase. 

Every feature is classified under one of three statuses:
- **Preserve Exactly:** Application logic and UI code remain identical; data models and frontend components operate as-is.
- **Infrastructure Replacement Required:** Feature is preserved 100% identically from the user and editorial perspective, but the underlying backend engine (MongoDB, Cloudinary, in-process timers) is transitioned to Firebase/Google Cloud (Firestore, Cloud Storage, Cloud Scheduler).
- **Needs Further Investigation:** Architectural trade-offs require alignment prior to Phase 2 implementation.

> [!IMPORTANT]
> In accordance with project rules, **NO feature is marked for removal**. The only authorized addition is Google Sign-in as an alternative authentication method.

---

## 2. Public Website Features

| Feature ID | Feature Name | Description & Existing Code Evidence | Status | Preservation & Replacement Strategy |
| :--- | :--- | :--- | :---: | :--- |
| **PUB-01** | **Hero Story Curation** | Primary featured story at top of homepage (`HomePage.tsx`). Prioritizes `isFeatured: true`, falls back to latest published. | **Preserve Exactly** | Firestore query for `isFeatured == true && status == 'published'` ordered by `publishedAt DESC`, limit 1. |
| **PUB-02** | **Breaking News Alert Bar** | Ticker banner above header (`BreakingNewsBar.tsx`). Automatically mounts when `isBreaking: true` articles exist; auto-hides when empty. | **Preserve Exactly** | Firestore query for `isBreaking == true && status == 'published'`. Auto-hiding logic in React remains untouched. |
| **PUB-03** | **Secondary Featured Grid** | Two secondary lead stories flanking the hero story on desktop (`HomePage.tsx`). | **Preserve Exactly** | Query published posts excluding hero story ID; renders using existing `ArticleCard` component. |
| **PUB-04** | **Personalized "For You" Feed** | Feed tab (`HomePage.tsx`, `/public/feed`) tailored to registered reader's category interests stored in `user.interests`. | **Preserve Exactly** | Query reader's `interests` array; execute Firestore `in` query on `category.id` field. |
| **PUB-05** | **Chronological Wire Feed** | Reverse-chronological published dispatches (`/latest`, `LatestPage.tsx`) with pagination. | **Preserve Exactly** | Firestore query: `status == 'published'` ordered by `publishedAt DESC`. Cursor-based or offset pagination. |
| **PUB-06** | **Trending Dispatches** | Top 10 high-velocity articles (`/trending`, `TrendingPage.tsx`) based on views and recency. | **Preserve Exactly** | Query published articles ordered by `views DESC, publishedAt DESC`, limit 10. |
| **PUB-07** | **Video Journalism Portal** | Multimedia feed (`/videos`, `VideosPage.tsx`) filtering posts where `postFormat == 'video'`. | **Preserve Exactly** | Firestore query: `postFormat == 'video' && status == 'published'`. Responsive video player preserved. |
| **PUB-08** | **Category Archive** | Taxonomy landing page (`/category/:slug`, `CategoryPage.tsx`) with category description, banner, and posts. | **Preserve Exactly** | Query category by `slug`, retrieve articles with `category.slug == slug && status == 'published'`. |
| **PUB-09** | **Tag Discovery & Trending Tags** | Sidebar widget (`TrendingTagsWidget.tsx`) displaying popular tags; clicking filters archive. | **Preserve Exactly** | Tags collection in Firestore; articles maintain `tags` array of `{ id, name, slug }`. |
| **PUB-10** | **Article Detail View** | Complete longform reading view (`/article/:slug`, `ArticlePage.tsx`) with hero image, author card, and date. | **Preserve Exactly** | Query post by `slug` (or localized translation slug). Display identical typography and layout. |
| **PUB-11** | **Content Gating for Exclusive Stories** | Masking full content for unregistered readers on stories marked `registeredOnly: true` (`ArticleCard.tsx`). | **Preserve Exactly** | Backend inspects `optionalAuthenticate`. If guest, returns truncated preview snippet with `isGated: true`. |
| **PUB-12** | **Related Articles Grid** | 3 contextual stories at bottom of article detail (`ArticlePage.tsx`) matched by category and tags. | **Preserve Exactly** | Query posts with same `category.id` excluding current post ID, limit 3. |
| **PUB-13** | **Prev / Next Article Navigation** | Editorial navigation footer (`ArticleNavigation.tsx`) providing links to chronologically adjacent dispatches. | **Preserve Exactly** | Query post where `publishedAt < current` (limit 1) and `publishedAt > current` (limit 1). |
| **PUB-14** | **Social Follow Bar** | Newsroom social presence links (`SocialFollowBar.tsx`) in header, article view, and footer. | **Preserve Exactly** | Static configuration (`frontend/src/config/social.ts`); zero backend dependencies. |
| **PUB-15** | **Dynamic XML Sitemap** | Endpoint `/api/v1/public/sitemap.xml` generating search-engine crawl index. | **Infrastructure Replacement** | Express route queries published articles from Firestore and streams compliant XML response. |
| **PUB-16** | **Search Engine Optimization** | Meta tags, OpenGraph previews, canonical URLs, and structured data schemas (`seo.ts`). | **Preserve Exactly** | Metadata extracted from `post.seo` and `post.faq` items; dynamically injected into document head. |
| **PUB-17** | **Theme Switcher** | Dark / Light theme toggle (`useTheme.ts`, `document.documentElement` class). | **Preserve Exactly** | LocalStorage state management; completely client-side. |

---

## 3. Multilingual Content & Translation Features

Verified against application code in `frontend/src/context/LanguageContext.tsx` and `backend/src/models/post.model.ts`:

| Feature ID | Feature Name | Description & Implementation Details | Status | Preservation & Replacement Strategy |
| :--- | :--- | :--- | :---: | :--- |
| **LANG-01** | **Supported Languages** | Exactly 3 languages supported: English (`en`), Telugu (`te`), and Hindi (`hi`). | **Preserve Exactly** | Maintained in `languages` collection and frontend `SUPPORTED_LANGUAGES`. |
| **LANG-02** | **Language Switcher UI** | Global edition and locale switcher in Header and Footer (`LanguageContext.tsx`). | **Preserve Exactly** | Switches UI translation strings (`NAV_TRANSLATIONS`) and appends `?lang=` query parameter to API calls. |
| **LANG-03** | **Localized Post Content** | Articles support an array of `translations` with localized `title`, `slug`, `summary`, `content`, and `seo`. | **Preserve Exactly** | Stored inside article document in Firestore. Public endpoint automatically substitutes localized text. |
| **LANG-04** | **Language-Specific Slugs** | Each translation maintains its own unique URL slug (e.g. `telangana-election-hi` in Hindi). | **Preserve Exactly** | Slugs indexed in Firestore; public API resolves post by checking primary `slug` and `translations.slug`. |
| **LANG-05** | **Language-Sensitive Homepage** | When switched to Telugu or Hindi, homepage sections display localized headlines where available. | **Preserve Exactly** | Helper function `localizePost(post, targetLang)` operates identically on Firestore documents. |
| **LANG-06** | **Editorial Charter Localization**| The newsroom charter in the homepage footer renders localized editorial mission text. | **Preserve Exactly** | Client-side dictionary in `NAV_TRANSLATIONS[lang]` preserved. |

---

## 4. Article Format Renderers

The platform provides 8 specialized presentation formats. Each has dedicated fields in `post.model.ts` and dedicated components in `frontend/src/components/public/format-renderers/`:

| Format Name | Unique Data Fields in Model | UI Renderer Component | Preservation & Firestore Storage Strategy |
| :--- | :--- | :--- | :--- |
| **`article`** | `content` (HTML), `images` (array of `{ url, alt, caption }`) | Default TipTap Article view | **Preserve Exactly.** Stored as string and array in Firestore post document. |
| **`gallery`** | `galleryItems: [{ image, title, description, order }]` | `GalleryRenderer.tsx` | **Preserve Exactly.** Stored as array of objects in Firestore post document. |
| **`sorted_list`** | `sortedListItems: [{ itemNumber, title, content, image }]` | `SortedListRenderer.tsx` | **Preserve Exactly.** Stored as ordered list in Firestore post document. |
| **`table_of_contents`** | `content` (with H2/H3 headers) | `TocRenderer.tsx` | **Preserve Exactly.** Frontend extracts headers dynamically; no extra schema fields needed. |
| **`video`** | `videoDetails: { videoUrl, embedUrl, provider, duration }` | `VideoRenderer.tsx` | **Preserve Exactly.** Stored as nested map in Firestore post document. |
| **`audio`** | `audioDetails: { audioUrl, coverImage, duration, artist }` | `AudioRenderer.tsx` | **Preserve Exactly.** Stored as nested map in Firestore post document. |
| **`poll`** | `pollDetails: { question, options: [{ id, text, votes }], startTime, endTime }` | `PollRenderer.tsx` | **Preserve Exactly.** Stored as nested map with atomic transaction voting support. |
| **`event`** | `eventDetails: { startDate, endDate, locationName, address, mapUrl, eventUrl }` | `EventRenderer.tsx` | **Preserve Exactly.** Stored as nested map in Firestore post document. |

---

## 5. Reader Account & Engagement Features

| Feature ID | Feature Name | Description & Existing Code Evidence | Status | Preservation & Replacement Strategy |
| :--- | :--- | :--- | :---: | :--- |
| **RDR-01** | **Email/Password Registration**| Reader account creation with bcrypt password hashing (`RegisterPage.tsx`). | **Preserve Exactly** | Retained identically. User document stored in Firestore `users` collection. |
| **RDR-02** | **Email/Password Login** | Credential authentication setting 7-day HTTP-only `token` cookie (`LoginPage.tsx`). | **Preserve Exactly** | Retained identically. Backend verifies bcrypt hash and issues JWT session cookie. |
| **RDR-03** | **Google Sign-in (NEW)** | Optional one-click Google authentication via Firebase Auth. | **NEW (Authorized)** | Added to `LoginPage` and `RegisterPage`. Backend verifies Firebase ID token and issues standard session cookie. |
| **RDR-04** | **Session Verification & Logout**| `GET /auth/me` and `POST /auth/logout` clearing cookies. | **Preserve Exactly** | Express cookie handling and session validation preserved identically. |
| **RDR-05** | **Reader Profile Management** | Reader settings view (`ProfilePage.tsx`): change name, password, language, interests. | **Preserve Exactly** | Updates Firestore `users` document. |
| **RDR-06** | **Profile Avatar Upload** | Reader custom profile photo upload (`POST /users/me/avatar`). | **Infrastructure Replacement** | Replace Cloudinary with Google Cloud Storage bucket. URL saved to user document. |
| **RDR-07** | **Article Bookmarking** | Readers save articles for later reading (`/saved`, `SavedArticlesPage.tsx`). | **Infrastructure Replacement** | Store in Firestore `bookmarks` collection with document ID `${userId}_${postId}`. |
| **RDR-08** | **Article Likes** | Readers like articles with real-time counter updates (`LikeButton.tsx`). | **Infrastructure Replacement** | Store in Firestore `likes` collection with document ID `${userId}_${postId}`. Atomic increment on post. |
| **RDR-09** | **Reader Comments** | Flat public commenting on articles with moderation status (`CommentSection.tsx`). | **Infrastructure Replacement** | Store in Firestore `comments` collection. Atomic increment of `commentCount` on post. |
| **RDR-10** | **Poll Voting** | Interactive voting on poll articles (`POST /engagement/posts/:id/poll/vote`). | **Infrastructure Replacement** | Replicate MongoDB transaction using `firestore.runTransaction()` to insert vote and update tallies. |
| **RDR-11** | **Article View Counter** | Best-effort view logging (`POST /public/posts/:id/view`). | **Preserve Exactly** | Atomically increment `views` field on article in Firestore using `FieldValue.increment(1)`. |

---

## 6. Editorial CMS & Administrative Features

| Feature ID | Feature Name | Description & Existing Code Evidence | Status | Preservation & Replacement Strategy |
| :--- | :--- | :--- | :---: | :--- |
| **CMS-01** | **Admin Authentication & RBAC** | Restricting `/admin/*` routes to users with `role: 'admin'` (`AdminLayout.tsx`). | **Preserve Exactly** | Preserved via `requireRole('admin')` middleware and frontend `ProtectedRoute`. |
| **CMS-02** | **Admin Dashboard Metrics** | Platform summary metrics (`AdminDashboardPage.tsx`): posts, drafts, users, comments. | **Preserve Exactly** | Firestore collection count queries (`count().get()`) aggregated in `/posts/admin/stats`. |
| **CMS-03** | **Article Lifecycle Management**| Draft, Published, Scheduled, Trashed status states (`AdminPostsPage.tsx`). | **Preserve Exactly** | Preserved via `status` field in Firestore post documents. |
| **CMS-04** | **Rich Text Editorial Authoring**| TipTap rich text editor with tables, links, images, blockquotes, and HTML source mode. | **Preserve Exactly** | Frontend component unchanged; stores HTML string in Firestore document. |
| **CMS-05** | **Pre-Publication Preview** | Previewing unreleased articles using `previewToken` (`AdminPostPreviewPage.tsx`). | **Preserve Exactly** | Query Firestore by `_id` or `previewToken` with admin authentication. |
| **CMS-06** | **Scheduled Publishing** | Journalists schedule articles for future publication with `scheduledAt` timestamp. | **Infrastructure Replacement** | Replace in-process `setInterval` with **Cloud Scheduler** invoking secured Cloud Run publishing job. |
| **CMS-07** | **Soft Deletion & Trash Restore**| Trashing articles, restoring from trash, and permanent deletion (`AdminPostsPage.tsx`). | **Preserve Exactly** | Soft delete sets `status: 'trashed'`. Permanent delete removes document from Firestore. |
| **CMS-08** | **Article Duplication** | One-click cloning of articles into draft mode (`POST /posts/:id/duplicate`). | **Preserve Exactly** | Reads original Firestore document, modifies title/slug, and writes new document. |
| **CMS-09** | **Bulk Article Upload** | Batch CSV / JSON importer with preview validation (`AdminBulkUploadPage.tsx`). | **Preserve Exactly** | Parses file on backend and writes batch to Firestore using `db.batch()`. |
| **CMS-10** | **Media Library Management** | Asset upload, preview grid, folder categorization, metadata tagging (`AdminMediaPage.tsx`). | **Infrastructure Replacement** | Transition storage to **Google Cloud Storage** bucket while maintaining identical API contracts. |
| **CMS-11** | **Category Taxonomy Control** | Create, edit, nest parent/child, and delete categories (`AdminCategoriesPage.tsx`). | **Preserve Exactly** | Stored in Firestore `categories` collection. |
| **CMS-12** | **Tag Taxonomy Control** | Create, search, rename, and delete tags (`AdminTagsPage.tsx`). | **Preserve Exactly** | Stored in Firestore `tags` collection. |
| **CMS-13** | **Language Configuration** | Enable/disable languages, set default language (`AdminLanguagesPage.tsx`). | **Preserve Exactly** | Stored in Firestore `languages` collection. |
| **CMS-14** | **Comment Moderation Console** | Inspect reader comments, toggle visibility (`visible`, `hidden`, `deleted`). | **Preserve Exactly** | Updates `status` field in Firestore `comments` collection. |
| **CMS-15** | **User Governance Console** | Inspect users, toggle `role` (`user`/`admin`), disable abusive accounts (`status: disabled`). | **Preserve Exactly** | Updates `role` and `status` in Firestore `users` collection. |

---

## 7. Search Feature Classification

| Feature ID | Feature Name | Existing MongoDB Behavior | Status | Decision & Reference |
| :--- | :--- | :--- | :---: | :--- |
| **SRCH-01** | **Archive Keyword Search** | Full-text query (`/public/search`) across `title`, `summary`, and localized translations using `$text: { $search: q }`. | **Needs Further Investigation** | Firestore does not support native `$text`. A rigorous trade-off evaluation of Typesense, Algolia, Vertex AI Search, and in-memory search is detailed in `SEARCH_ARCHITECTURE_DECISION.md`. |

