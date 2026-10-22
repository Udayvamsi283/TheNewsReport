# The News — Production Acceptance & Quality Verification Checklist

This document serves as the master production acceptance verification checklist for **The News** digital news platform.

---

## 1. Public Reader Platform

| Feature / Surface | Verification Item | Status |
| :--- | :--- | :---: |
| **Homepage** | Hero lead story, breaking news ticker, trending stories, category blocks load seamlessly. | **PASSED** |
| **Latest Wire** | Chronological wire list with refetching and pagination. | **PASSED** |
| **Trending Feed** | 7-day weighted rolling trending stories (`views*1 + likes*3 + comments*5 + recencyBoost`). | **PASSED** |
| **Videos Wire** | Responsive video embed gallery. | **PASSED** |
| **Category Archives** | Hierarchical category routing (e.g. `/category/politics`, `/category/regional`). | **PASSED** |
| **Full-Text Search** | Bounded text search querying MongoDB text index without regex denial of service. | **PASSED** |
| **Gated Content** | Server-side content completely stripped for `registeredOnly` stories; clean registration card displayed. | **PASSED** |
| **All 8 Post Formats** | Full rendering for Article, Gallery, Sorted List, ToC, Video, Audio, Poll, and Event. | **PASSED** |
| **Multilingual Routing** | Alternate translation resolution via `?lang=<code>` with seamless original fallback. | **PASSED** |

---

## 2. Reader Engagement Invariants

| Action | Invariant / Behavior Verified | Status |
| :--- | :--- | :---: |
| **Likes** | Idempotent toggle; counter strictly non-negative; enforced by unique `(postId, userId)` index. | **PASSED** |
| **Bookmarks** | Idempotent save/unsave; reader personal saved list at `/saved`. | **PASSED** |
| **Comments** | Flat chronological list only; HTML sanitized; soft-delete transitions `visible` $\to$ `deleted` once. | **PASSED** |
| **Poll Voting** | MongoDB atomic transaction; duplicate votes rejected with HTTP 409 Conflict. | **PASSED** |
| **View Counting** | Non-PII sliding window token; duplicate views throttled within 10 minutes; no IP stored. | **PASSED** |

---

## 3. Editorial CMS Operations

| CMS Surface | Verification Item | Status |
| :--- | :--- | :---: |
| **Authentication** | Admin login via HTTP-only cookie; session persistence; zero JWT in JSON. | **PASSED** |
| **Post Authoring** | Draft, publish, schedule for future date, select format, assign categories & tags. | **PASSED** |
| **Translations** | Add/edit multilingual translations with separate localized slugs. | **PASSED** |
| **Media Library** | Buffer streaming to Cloudinary; WebP generation; delete cleans both cloud and DB. | **PASSED** |
| **Taxonomies** | Categories, tags, and languages CRUD operations with integrity protection. | **PASSED** |
| **Discussion Moderation** | Staff can hide or delete reader comments. | **PASSED** |

---

## 4. Security & Production Hardening

| Check | Requirement | Status |
| :--- | :--- | :---: |
| **Cookie Flags** | `HttpOnly=true`, `Secure=true`, `SameSite=None` in production for cross-origin Vercel $\to$ Render. | **PASSED** |
| **CSRF Defense** | State mutations require matching `X-CSRF-Token` header. | **PASSED** |
| **CORS Policy** | Restricted strictly to `CLIENT_URL` in production. | **PASSED** |
| **Error Handling** | Generic messages in production; stack traces, collection names, and Mongo errors suppressed. | **PASSED** |
| **Rate Limiting** | Active on `/api` routes with stricter bounds on auth and mutations. | **PASSED** |
| **Secret Audit** | Zero exposed secrets in code, git commits, `.env.example`, or client JS bundles. | **PASSED** |

---

## 5. Performance, SEO & Accessibility

| Optimization | Verification Item | Status |
| :--- | :--- | :---: |
| **Code Splitting** | Route-level `React.lazy` splits admin CMS and non-critical pages; main bundle is ~83 kB. | **PASSED** |
| **Vendor Chunks** | Separate chunks for React, TanStack Query, Lucide icons, and TipTap editor. | **PASSED** |
| **Sitemap & Robots** | `robots.txt` disallows private routes; dynamic `sitemap.xml` indexes only public published stories. | **PASSED** |
| **Dynamic Metadata** | Dynamic `<title>`, description, Open Graph, and Twitter card tags on articles. | **PASSED** |
| **Responsive Viewports**| Clean layouts verified across 320px, 375px, 412px, 768px, 1024px, 1440px, and 1920px. | **PASSED** |
| **Accessibility** | Semantic HTML5, visible focus indicators, alt text, and accessible interactive controls. | **PASSED** |
