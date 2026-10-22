# The News — Developer Technical Architecture & Handoff Guide

This document outlines the technical architecture, data contracts, security model, and operational guidelines for **The News** digital platform.

---

## 1. System Architecture

```text
       [ Public Visitors & Editorial Staff ]
                         |
             HTTPS / DNS (Vercel CDN)
                         |
           +-----------------------------+
           |   Frontend React SPA (Vite) |
           |  Tailwind CSS + TanStack    |
           +-----------------------------+
                         |
           HTTPS REST API (with credentials)
                         |
             Render.com Web Service
           +-----------------------------+
           |   Express API (TypeScript)  |
           |   Helmet + CSRF + RateLimit |
           +-----------------------------+
               /                      \
    MongoDB Atlas (Mongoose)     Cloudinary API
   (Multi-region cluster)      (Media Storage & CDN)
```

---

## 2. Technology Stack & Key Dependencies

### Frontend
- **Framework:** React 18 + Vite + TypeScript
- **Routing:** React Router v6 with `React.lazy` route-level code splitting
- **Data Layer:** TanStack Query v5 with optimistic updates and cache invalidation
- **Rich Text Editor:** TipTap v3 (StarterKit, Image, Table, Link, TextAlign)
- **Styling:** Tailwind CSS with custom editorial design tokens (`navy-900`, `editorial-red`)
- **Icons:** Lucide React

### Backend
- **Runtime:** Node.js 20+ with Express 4 & TypeScript
- **Database Driver:** Mongoose 8
- **Authentication:** JWT (JSON Web Tokens) stored in HTTP-only, `SameSite=None`, `Secure=true` cookies
- **Password Hashing:** `bcrypt` (10 salt rounds)
- **Security:** Helmet, CORS with dynamic origin whitelisting, Express Rate Limit, Double Submit Cookie CSRF protection
- **Media Ingestion:** Multer (in-memory streaming) to Cloudinary SDK v2

---

## 3. Security Model & Data Invariants

### 3.1 Authentication & CSRF
- **Zero Token in JSON:** Auth JWTs are never transmitted in JSON response bodies. They exist only in HTTP-only cookies (`token`).
- **CSRF Protection:** State-changing requests (`POST`, `PUT`, `PATCH`, `DELETE`) require the `X-CSRF-Token` header matching the readable `csrf-token` cookie. Login and register endpoints are exempt to allow session establishment.
- **Reverse Proxy Trust:** `app.set('trust proxy', 1)` ensures that Express correctly respects the `X-Forwarded-Proto` header from Render's edge proxy, preventing cookie rejection.

### 3.2 Counter Invariants
- **Likes:** Enforced by unique compound index `(postId, userId)`. Increments/decrements use conditional atomic operators with non-negative bounds:
  ```typescript
  await Post.updateOne({ _id: postId, likeCount: { $gt: 0 } }, { $inc: { likeCount: -1 } });
  ```
- **Comments:** Deletions only transition from `status: 'visible'` $\to$ `'deleted'`. Decrements only execute when that transition occurs, preventing double-decrements.
- **Polls:** Cast votes execute inside a MongoDB multi-document session transaction (`session.startTransaction()`) writing the `PollVote` and updating option vote tallies atomically.

### 3.3 Server-Side Content Gating
- When `registeredOnly: true` on an article, unauthenticated requests to `/public/posts/:slug` strictly omit the `content`, `galleryItems`, `sortedListItems`, and detailed format fields. Only metadata (`title`, `excerpt`, `author`, `publishedAt`, `format`) is returned with `isGated: true`.

---

## 4. Database Schema & Index Topology

| Collection | Key Compound Indexes | Purpose |
| :--- | :--- | :--- |
| `posts` | `{ status: 1, publishedAt: -1 }` | Fast wire and homepage queries |
| `posts` | `{ slug: 1 }` (unique) | O(1) article retrieval |
| `posts` | Text index on `title`, `summary`, `content` | Full-text public search |
| `comments` | `{ post: 1, status: 1, createdAt: -1 }` | Paginated flat discussions |
| `likes` | `{ post: 1, user: 1 }` (unique) | Idempotent single likes |
| `bookmarks` | `{ post: 1, user: 1 }` (unique) | Idempotent reader bookmarks |
| `pollvotes` | `{ post: 1, user: 1 }` (unique) | One vote per user guarantee |
| `categories` | `{ slug: 1 }` (unique), `{ parent: 1 }` | Hierarchical category routing |

---

## 5. API Route Architecture

- `/api/v1/auth`: Login, register, logout, CSRF token, session check.
- `/api/v1/public`: Aggregated homepage (`/home`), feed (`/feed`), slug resolution (`/posts/:slug`), sitemap (`/sitemap.xml`), and search (`/search`).
- `/api/v1/engagement`: Likes, bookmarks, flat comments, poll voting, and current vote breakdowns.
- `/api/v1/posts`: Admin CMS CRUD, publishing, scheduling, and translations.
- `/api/v1/media`: Cloudinary upload and media library management.
- `/api/v1/categories`, `/languages`, `/tags`: Taxonomy CRUD.
- `/api/v1/health`: Cluster connectivity and system readiness.
