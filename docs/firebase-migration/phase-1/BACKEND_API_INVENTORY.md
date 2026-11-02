# Backend Architecture Audit & Complete API Inventory

**Project:** The News Report — Firebase Migration  
**Document ID:** `BACKEND_API_INVENTORY.md`  
**Phase:** Phase 1 — Baseline Audit & Firebase Foundation  
**Audited Source Directory:** `D:\UDAY\Projects\TheNewsReport\backend`  
**Execution Timestamp:** 2026-11-02  

---

## 1. Executive Summary

The backend of **The News Report** is a production-grade RESTful API engineered in **TypeScript 5.7.3** running on **Node.js** with **Express.js 4.21.2**. It handles all platform operations, including authentication, user authorization, editorial content lifecycle management (drafting, scheduling, publishing, soft deletion), taxonomies (categories, tags, languages), media asset cataloging, public discovery feeds, and real-time reader engagement.

Data persistence currently relies on **MongoDB Atlas** via **Mongoose 8.9.5**, and media storage relies on **Cloudinary v2.11.0**.

This audit provides an exhaustive inventory of the application bootstrap, middleware pipeline, every API endpoint, data validation rule, and MongoDB-specific construct that must be cleanly adapted for **Google Cloud Run**, **Cloud Firestore**, and **Google Cloud Storage**.

---

## 2. Server Architecture & Middleware Pipeline

```mermaid
graph TD
    Client[HTTP Client / Frontend Browser] --> Proxy[Reverse Proxy / Cloud Run]
    Proxy --> Express[Express Application createApp]
    Express --> Helmet[Helmet Security Headers]
    Express --> CORS[CORS Origin Validation & Credentials]
    Express --> CookieParser[Cookie Parser with COOKIE_SECRET]
    Express --> CSRF[Double-Submit Cookie CSRF Protection]
    Express --> RateLimit[API Rate Limiter]
    Express --> Morgan[Morgan Request Logger]
    Express --> BodyParser[JSON & URL-Encoded Body Parsers 10MB]
    Express --> ApiRouter[/api/v1 Router]

    ApiRouter --> AuthMod[/auth]
    ApiRouter --> UserMod[/users]
    ApiRouter --> PostMod[/posts]
    ApiRouter --> MediaMod[/media]
    ApiRouter --> CatMod[/categories]
    ApiRouter --> TagMod[/tags]
    ApiRouter --> LangMod[/languages]
    ApiRouter --> PubMod[/public]
    ApiRouter --> EngMod[/engagement]
    ApiRouter --> HealthMod[/health]

    ApiRouter --> NotFound[notFoundHandler 404]
    Express --> ErrorHandler[Centralized errorHandler 500/Custom]
```

### 2.1 Server Lifecycle (`backend/src/server.ts`)
- **Initialization:** Connects to database (`connectDatabase()`), triggers background publishing timer (`startPostScheduler()`), boots HTTP listener on `PORT` (defaults to 5000).
- **Graceful Shutdown:** Intercepts `SIGINT` and `SIGTERM`. Halts the scheduled post interval, closes active HTTP listener connections, closes database connection pool, and enforces a 10-second timeout failsafe.

### 2.2 Middleware Pipeline Inventory

| Middleware | File Location | Purpose & Implementation Details |
| :--- | :--- | :--- |
| `trust proxy` | `app.ts` | Configured to `1` so Express accurately trusts reverse proxies (Render / Cloud Run) for client IP detection and `Secure` cookie attributes. |
| `helmet` | `app.ts` | Sets secure HTTP response headers (HSTS, DNS prefetch control, frameguard, etc.). |
| `cors` | `app.ts` | Validates origin against `env.CLIENT_URL` (comma-separated origins). Permissive in development for localhost ports; enforces exact whitelist in production. Always allows credentials (`credentials: true`). |
| `cookieParser` | `app.ts` | Parses signed and unsigned cookies using `env.COOKIE_SECRET`. |
| `csrfProtection` | `csrf.middleware.ts` | Validates double-submit CSRF cookie pattern. Exempts `GET`, `HEAD`, `OPTIONS` and specific safe onboarding endpoints. Enforces `X-CSRF-Token` header match for all mutating methods (`POST`, `PUT`, `PATCH`, `DELETE`). |
| `apiRateLimiter` | `rateLimiter.middleware.ts` | IP-based sliding window rate limiter (100 requests per 15 minutes across all `/api` routes). |
| `commentRateLimiter` | `rateLimiter.middleware.ts` | Restricts reader comment submissions to 5 comments per 5 minutes per IP. |
| `voteRateLimiter` | `rateLimiter.middleware.ts` | Restricts poll voting attempts to 10 submissions per 10 minutes per IP. |
| `morgan` | `app.ts` | Structured HTTP request logger (`dev` mode in development, `combined` Apache format in production). |
| `upload` | `upload.middleware.ts` | Multer memory storage (`limits: { fileSize: 10MB }`) with MIME-type filtering for images, audio, video, PDF, and CSV. |
| `avatarUpload` | `upload.middleware.ts` | Multer memory storage (`limits: { fileSize: 5MB }`) strictly restricted to JPEG, PNG, and WebP. |
| `authenticate` | `auth.middleware.ts` | Reads HTTP-only `token` cookie (or fallback `Authorization: Bearer <token>`), verifies JWT against `env.JWT_SECRET`, retrieves user, verifies `status !== 'disabled'`, attaches user to `req.user`. |
| `requireRole` | `auth.middleware.ts` | Authorization guard verifying `req.user.role` matches specified permitted roles (e.g. `'admin'`). |
| `optionalAuthenticate`| `auth.middleware.ts` | Inspects token; if valid, populates `req.user` without rejecting unauthenticated guests. Used for public post reads, content gating, and like/bookmark state resolution. |
| `notFoundHandler` | `notFound.middleware.ts` | Returns standardized 404 JSON response for unmatched endpoints. |
| `errorHandler` | `error.middleware.ts` | Centralized exception catcher. Normalizes Zod validation errors, JWT expiration errors, and MongoDB duplicate key errors (`code: 11000`) into clean client responses without leaking internal stack traces. |

---

## 3. Complete Endpoint Inventory

Below is the exhaustive inventory of all 44 endpoints implemented across the 10 Express route modules:

### 3.1 Base & Health Routes (`/api/v1`)
| Method | Route | Auth / Role | Input Validation | Response Behavior | DB & External Operations |
| :---: | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/health` | Public | None | Returns `{ success: true, message, environment, database: { connected, name, host } }` | Checks Mongoose connection state (`readyState === 1`). |

### 3.2 Authentication Routes (`/api/v1/auth`)
| Method | Route | Auth / Role | Input Validation | Response Behavior | DB & External Operations |
| :---: | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/auth/csrf-token` | Public | None | Returns CSRF token in body and sets HTTP-only `csrf-token` cookie. | None. Cryptographic token generation. |
| `POST` | `/auth/register` | Public | `registerSchema` (name, email, password >= 8 chars) | Hashes password (bcrypt, 10 rounds), sets 7-day `token` cookie, returns `{ user }` with 201 status. | Checks email uniqueness in `User` collection; inserts new user record. |
| `POST` | `/auth/login` | Public | `loginSchema` (email, password) | Compares bcrypt hash, checks `status !== 'disabled'`, sets 7-day `token` cookie, returns `{ user }`. | Queries `User` collection including `passwordHash`. |
| `POST` | `/auth/logout` | Public | None | Clears `token` and `csrf-token` cookies. Returns success message. | None. |
| `GET` | `/auth/me` | Authenticated | None | Returns populated authenticated user record. | Queries `User` by `req.user._id`, populates `interests`. |

### 3.3 User Profile & Administration Routes (`/api/v1/users`)
| Method | Route | Auth / Role | Input Validation | Response Behavior | DB & External Operations |
| :---: | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/users/me` | Authenticated | None | Returns authenticated user profile. | Queries `User` by `req.user._id`. |
| `PATCH` | `/users/me` | Authenticated | `updateProfileSchema` (name, preferredLanguage, interests) | Updates profile and returns updated user. | Updates `User` document in database. |
| `POST` | `/users/me/avatar` | Authenticated | `avatarUpload.single('avatar')`, max 5MB, JPEG/PNG/WebP | Uploads avatar to cloud storage, removes old avatar asset if present, updates user profile. | Cloudinary stream upload, Cloudinary destroy old asset, updates `User.avatar` and `User.avatarPublicId`. |
| `DELETE`| `/users/me/avatar` | Authenticated | None | Removes avatar asset from storage, resets user avatar fields to empty. | Cloudinary asset deletion; updates `User` document. |
| `POST` | `/users/me/change-password` | Authenticated | `changePasswordSchema` (currentPassword, newPassword >= 8) | Verifies current password hash, hashes new password with bcrypt, saves. | Queries user with `passwordHash`, updates password. |
| `PATCH` | `/users/me/preferences` | Authenticated | Preferences schema (preferredLanguage, interests) | Updates user language and interests; returns updated record. | Updates `User` document. |
| `GET` | `/users/me/bookmarks` | Authenticated | Query: `page, limit` | Returns paginated list of bookmarked posts. | Queries `Bookmark` collection, populates `post`. |
| `GET` | `/users/me/likes` | Authenticated | Query: `page, limit` | Returns paginated list of liked posts. | Queries `Like` collection, populates `post`. |
| `GET` | `/users` | Admin Only | Query: `page, limit, search, role, status` | Returns paginated user list with search filtering. | Queries `User` collection with regex/filters. |
| `GET` | `/users/:id` | Admin Only | Params: `id` | Returns single user details. | Queries `User.findById`. |
| `PATCH` | `/users/:id` | Admin Only | `updateUserAdminSchema` (role, status) | Updates user role or account status; returns updated user. | Updates `User` document. |
| `DELETE`| `/users/:id` | Admin Only | Params: `id` | Permanently deletes user account. Prevents self-deletion. | Deletes `User` document. |

### 3.4 Category Taxonomy Routes (`/api/v1/categories`)
| Method | Route | Auth / Role | Input Validation | Response Behavior | DB & External Operations |
| :---: | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/categories` | Public | Query: `status` | Returns list of categories (sorted by name) with parent population. | Queries `Category` collection. |
| `GET` | `/categories/:id` | Public | Params: `id` | Returns single category details. | Queries `Category.findById`. |
| `POST` | `/categories` | Admin Only | `createCategorySchema` (name, slug, description, image, parent) | Creates new category, auto-generates slug if missing. | Inserts into `Category` collection. |
| `PATCH` | `/categories/:id` | Admin Only | `updateCategorySchema` | Updates category attributes and returns updated document. | Updates `Category` document. |
| `DELETE`| `/categories/:id` | Admin Only | Params: `id` | Reassigns child categories to parent and deletes category. | Updates child categories, deletes `Category` record. |

### 3.5 Tag Taxonomy Routes (`/api/v1/tags`)
| Method | Route | Auth / Role | Input Validation | Response Behavior | DB & External Operations |
| :---: | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/tags` | Public | Query: `search` | Returns tags matching query (sorted by usage / name). | Queries `Tag` collection. |
| `POST` | `/tags` | Admin Only | `createTagSchema` (name, slug) | Creates new tag with sanitized slug. | Inserts into `Tag` collection. |
| `PATCH` | `/tags/:id` | Admin Only | `updateTagSchema` | Updates tag name and slug. | Updates `Tag` document. |
| `DELETE`| `/tags/:id` | Admin Only | Params: `id` | Deletes tag document. | Deletes `Tag` document. |

### 3.6 Language Taxonomy Routes (`/api/v1/languages`)
| Method | Route | Auth / Role | Input Validation | Response Behavior | DB & External Operations |
| :---: | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/languages` | Public | Query: `status` | Returns supported platform languages. | Queries `Language` collection. |
| `POST` | `/languages` | Admin Only | `createLanguageSchema` (name, code, isDefault, status) | Creates new platform language. | Inserts into `Language` collection. |
| `PATCH` | `/languages/:id` | Admin Only | `updateLanguageSchema` | Updates language configuration. | Updates `Language` document. |
| `DELETE`| `/languages/:id` | Admin Only | Params: `id` | Deletes language document. | Deletes `Language` document. |

### 3.7 Editorial Posts CMS Routes (`/api/v1/posts`)
| Method | Route | Auth / Role | Input Validation | Response Behavior | DB & External Operations |
| :---: | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/posts/admin/stats` | Admin Only | None | Aggregates platform statistics: total posts, drafts, scheduled, published, comments, users, categories. | Multiple `countDocuments` queries across collections. |
| `GET` | `/posts/preview/:tokenOrId` | Admin Only | Params: `tokenOrId` | Returns post for editorial preview regardless of status. | Queries `Post` by `_id` or `previewToken`, populates all relations. |
| `GET` | `/posts` | Admin Only | Query: `page, limit, status, format, category, language, search` | Returns paginated posts with editorial metadata and author details. | Queries `Post` collection with compound filters. |
| `GET` | `/posts/:id` | Admin Only | Params: `id` | Returns complete post document for editing. | Queries `Post.findById`. |
| `POST` | `/posts` | Admin Only | `createPostSchema` (format, title, slug, summary, content, category, tags, language, etc.) | Generates unique slug and previewToken, validates format fields, saves draft or scheduled post. | Inserts into `Post` collection. |
| `PATCH` | `/posts/:id` | Admin Only | `updatePostSchema` | Updates post document, format specifics, SEO metadata, translations. | Updates `Post` document. |
| `DELETE`| `/posts/:id` | Admin Only | Params: `id`, Query: `permanent` | If `permanent=true`, hard deletes post. Otherwise soft deletes by setting `status = 'trashed'`. | Hard or soft delete on `Post` document. |
| `POST` | `/posts/:id/publish` | Admin Only | Params: `id` | Updates status to `'published'` and sets `publishedAt = now`. | Updates `Post` document. |
| `POST` | `/posts/:id/unpublish`| Admin Only | Params: `id` | Sets status back to `'draft'`. | Updates `Post` document. |
| `POST` | `/posts/:id/restore` | Admin Only | Params: `id` | Restores trashed article to `'draft'`. | Updates `Post` document. |
| `POST` | `/posts/:id/duplicate`| Admin Only | Params: `id` | Clones article into new draft with `[Copy]` headline and unique slug. | Queries original `Post`, inserts cloned `Post`. |
| `POST` | `/posts/bulk-upload` | Admin Only | `upload.single('file')` or JSON rows | Previews or imports batch articles from CSV / JSON. | Parses CSV/JSON, validates against schema, bulk inserts posts. |

### 3.8 Media Library Routes (`/api/v1/media`)
| Method | Route | Auth / Role | Input Validation | Response Behavior | DB & External Operations |
| :---: | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/media` | Admin Only | `upload.single('file')`, max 10MB | Streams file to storage, computes dimensions and metadata, indexes asset. | Cloudinary upload stream, inserts `Media` document. |
| `GET` | `/media` | Admin Only | Query: `page, limit, resourceType, search` | Returns paginated media assets. | Queries `Media` collection. |
| `PATCH` | `/media/:id` | Admin Only | `updateMediaSchema` (alt, caption) | Updates asset accessibility metadata. | Updates `Media` document. |
| `DELETE`| `/media/:id` | Admin Only | Params: `id` | Deletes file from storage bucket and removes database record. | Cloudinary destroy asset, deletes `Media` record. |

### 3.9 Public Portal & Reader Discovery Routes (`/api/v1/public`)
| Method | Route | Auth / Role | Input Validation | Response Behavior | DB & External Operations |
| :---: | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/public/sitemap.xml` | Public | None | Generates dynamic XML sitemap with latest 1000 published articles and active categories. | Queries `Post` and `Category`, renders XML string. |
| `GET` | `/public/home` | Public | Query: `lang` | Returns aggregated homepage data: hero story, secondary featured, latest dispatches, breaking news, category sections. | Complex aggregation pipeline querying `Post` collection with localization. |
| `GET` | `/public/feed` | Optional Auth | Query: `language, category, page, limit` | Returns reader dispatches. If user is authenticated and has selected interests, delivers personalized category feed (`isPersonalized: true`). | Queries `User.interests`, queries `Post` collection. |
| `GET` | `/public/posts` | Optional Auth | Query: `language, category, page, limit` | Returns paginated public posts matching query. | Queries `Post` collection. |
| `GET` | `/public/posts/:slug` | Optional Auth | Params: `slug`, Query: `lang` | Returns full article detail, localized translations, related stories, prev/next navigation, gated content masking for guests (`isGated: true`). | Queries `Post` by slug or translation slug, queries related posts by category/tags. |
| `POST` | `/public/posts/:id/view`| Public | Params: `id` | Increments article view counter (`views + 1`). Throttled by in-memory IP/cookie window. | Atomically increments `Post.views`. |
| `GET` | `/public/categories/:slug/posts` | Public | Params: `slug`, Query: `page, limit, lang` | Returns category details and paginated posts. | Queries `Category`, queries `Post` by category ID. |
| `GET` | `/public/latest` | Public | Query: `page, limit, lang` | Returns latest chronological published dispatches. | Queries `Post` sorted by `publishedAt: -1`. |
| `GET` | `/public/trending` | Public | Query: `limit, lang` | Returns top 10 trending articles based on views and recent engagement. | Queries `Post` sorted by views and recency. |
| `GET` | `/public/videos` | Public | Query: `page, limit` | Returns articles with format `'video'`. | Queries `Post` where `postFormat: 'video'`. |
| `GET` | `/public/search` | Public | Query: `q, page, limit, category` | Full-text keyword search across title, summary, and translations with relevance scoring (`textScore`). | MongoDB `$text` search query on `Post` collection. |

### 3.10 Reader Engagement Routes (`/api/v1/engagement`)
| Method | Route | Auth / Role | Input Validation | Response Behavior | DB & External Operations |
| :---: | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/engagement/posts/:id/like` | Authenticated | Params: `id` | Creates `Like` record and atomically increments `likeCount`. Idempotent. | Inserts `Like`, `$inc: { likeCount: 1 }` on `Post`. |
| `DELETE`| `/engagement/posts/:id/like` | Authenticated | Params: `id` | Removes `Like` record and atomically decrements `likeCount`. | Deletes `Like`, `$inc: { likeCount: -1 }` on `Post`. |
| `POST` | `/engagement/posts/:id/bookmark` | Authenticated | Params: `id` | Creates `Bookmark` record. Idempotent. | Inserts `Bookmark` record. |
| `DELETE`| `/engagement/posts/:id/bookmark` | Authenticated | Params: `id` | Removes `Bookmark` record. | Deletes `Bookmark` record. |
| `GET` | `/engagement/posts/:id/comments` | Public | Params: `id`, Query: `page, limit` | Returns paginated visible reader comments. | Queries `Comment` where `status: 'visible'`. |
| `POST` | `/engagement/posts/:id/comments` | Authenticated | `createCommentSchema` (content <= 1000 chars), rate limited | Sanitizes HTML, inserts comment, atomically increments `commentCount`. | Inserts `Comment`, `$inc: { commentCount: 1 }` on `Post`. |
| `DELETE`| `/engagement/comments/:id` | Authenticated | Params: `id` | Allows author or admin to delete comment, atomically decrements `commentCount`. | Deletes `Comment`, `$inc: { commentCount: -1 }` on `Post`. |
| `GET` | `/engagement/admin/comments` | Admin Only | Query: `page, limit, status` | Moderation queue: returns all comments across all statuses. | Queries `Comment` collection. |
| `PATCH` | `/engagement/admin/comments/:id/status`| Admin Only | Status schema (`visible`, `hidden`, `deleted`) | Updates comment moderation status. | Updates `Comment.status`. |
| `POST` | `/engagement/posts/:id/poll/vote` | Authenticated | `pollVoteSchema` (optionId), rate limited | Verifies poll schedule window, executes multi-document atomic transaction: inserts `PollVote` and increments option vote count. | Multi-document transaction on `PollVote` and `Post`. |
| `GET` | `/engagement/posts/:id/poll/results` | Optional Auth | Params: `id` | Returns aggregated vote totals, percentages, and user voted option. | Queries `Post.pollDetails`, queries `PollVote` if user authenticated. |

---

## 4. MongoDB-Specific Behaviors Requiring Replacement

The backend currently utilizes several MongoDB and Mongoose features that do not translate directly to Cloud Firestore:

| MongoDB Feature in Existing Code | Where Used | Firestore Equivalent / Replacement Strategy |
| :--- | :--- | :--- |
| **ObjectIds (`mongoose.Types.ObjectId`)** | All models (User, Post, Category, etc.) | Firestore document IDs are 20-character auto-generated strings (e.g. `c7jK9d...`). The migration must either preserve existing 24-character hexadecimal IDs as document IDs or maintain an `originalId` mapping index. |
| **Relational `.populate()` Joins** | `Post.populate('category author tags language')` | Firestore has **zero join capabilities**. Denormalize essential display metadata (`category: { id, name, slug }`, `author: { id, name, avatar }`, `language: { id, code, name }`) directly into the article document at write time. |
| **Multi-document Transactions** | Poll voting (`engagement.controller.ts`) | Replace `mongoose.startSession()` and `session.startTransaction()` with native Firestore transactions (`firestore.runTransaction()`). |
| **Atomic Increments (`$inc`)** | View count, likes, comment count, poll votes | Replace `$inc` with Firestore's atomic `FieldValue.increment(1)` / `FieldValue.increment(-1)`. |
| **Full-Text Text Index (`$text`, `$meta: 'textScore'`)** | Public search (`public.controller.ts`) | Firestore does not support native text indexing or relevance scoring. Replace with the recommended search architecture (evaluated in Task E). |
| **Compound & Unique Indexes** | Unique likes `{ user: 1, post: 1 }`, unique votes `{ pollPost: 1, user: 1 }` | Firestore does not support unique constraints across arbitrary fields. Enforce uniqueness deterministically by using composite Document IDs: `likes/${userId}_${postId}` and `pollVotes/${postId}_${userId}`. |
| **Array Filters / Positional Updates (`options.$.votes`)** | Incrementing poll vote options in array | Firestore cannot update nested elements of an array by matching criteria. Poll options must be updated via a transaction reading the options array, updating the matching option object, and writing back the modified array (or storing options as a map or subcollection). |
| **In-Process `setInterval` Scheduler** | `scheduler.service.ts` (scheduled post publishing) | In Cloud Run, instances scale to zero when idle; `setInterval` cannot run. Replace with **Cloud Scheduler** triggering a secured endpoint on Cloud Run (`POST /api/v1/internal/publish-scheduled`). |
| **Cloudinary SDK (`cloudinary.uploader`)** | `cloudinary.ts`, `media.controller.ts`, `user.controller.ts` | Replace with `@google-cloud/storage` creating read streams, saving files to Google Cloud Storage buckets, and serving assets via public CDN URLs. |

