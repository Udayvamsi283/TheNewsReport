# The News — Multilingual Digital News Platform

> **Status:** Production-Ready MVP  
> **Target Audience:** Modern digital journalism with mobile-first readership and desktop editorial workflows.

---

## 1. Project Overview

**The News** is a production-quality digital news platform engineered for independent journalism. It pairs an authoritative, clean editorial presentation with a robust, type-safe full-stack architecture.

All editorial content originates directly from the database and is created and managed through the real Editorial Content Management System (CMS). The platform contains zero fabricated articles, zero mock statistics, and zero synthetic media.

### Key Capabilities

- **Real Editorial CMS:** Rich-text article authoring (TipTap), headline management, format selection (Article, Video, Gallery, Audio, Opinion, LiveBlog, Explainer, Poll), tags, categories, language assignment, and direct publishing or scheduling.
- **Editorial Homepage Controls:** Direct editorial curation over hero stories (`isFeatured`) and breaking news alerts (`isBreaking`). The breaking news banner automatically hides when no active breaking alerts are flagged.
- **Multilingual Support:** English, Spanish, and French post translations with language switching.
- **Media Library:** Direct integration with Cloudinary for asset upload, indexing, metadata management, and deletion.
- **Reader Engagement:** User registration, profile personalization (category interests, language preference), bookmarking, liking, flat reader comments, and interactive poll voting.
- **Admin Moderation:** Comments moderation console (visibility toggling and deletion), user management, taxonomy control (categories, tags, languages), and real-time database metric counters.
- **Production Security:** HTTP-only cookie JWT authentication, CSRF tokens, strict role-based access control, server-side content gating for registered users, rate limiting, and Helmet security headers.

---

## 2. Architecture & Tech Stack

```text
TheNews/
├── frontend/             # React 18 + Vite + TypeScript (Client SPA)
│   ├── src/
│   │   ├── components/   # UI primitives, editorial cards, layouts
│   │   ├── context/      # Auth & Theme context providers
│   │   ├── hooks/        # React Query hooks & auth utilities
│   │   ├── pages/        # Public newsroom & Admin CMS views
│   │   ├── routes/       # React Router routing table with role protection
│   │   ├── services/     # Centralized API client (Axios)
│   │   ├── types/        # TypeScript contracts & data schemas
│   │   └── index.css     # Tailwind CSS & editorial typography
│   ├── package.json
│   └── vite.config.ts
├── backend/              # Node.js + Express + TypeScript + Mongoose
│   ├── src/
│   │   ├── config/       # Environment parsing, MongoDB, Cloudinary
│   │   ├── controllers/  # Posts, public, engagement, taxonomies, auth
│   │   ├── middleware/   # Auth, CSRF, error handling, rate limiting
│   │   ├── models/       # Mongoose schemas (Post, User, Comment, Poll, etc.)
│   │   ├── routes/       # Versioned API routes (/api/v1)
│   │   ├── validators/   # Zod validation schemas
│   │   └── server.ts     # Express server bootstrap & graceful shutdown
│   ├── package.json
│   └── tsconfig.json
└── README.md
```

### Technology Stack
- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, TanStack Query v5, React Router v6, TipTap rich text, Lucide React icons.
- **Backend:** Node.js, Express.js, TypeScript, Mongoose, Zod validation, bcrypt, jsonwebtoken.
- **Database:** MongoDB Atlas.
- **Media:** Cloudinary.

---

## 3. Environment Variables

### Backend (`backend/.env`)
```bash
PORT=5000
NODE_ENV=production
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/the_news?retryWrites=true&w=majority
CLIENT_URL=http://localhost:5173
JWT_SECRET=your_strong_jwt_secret_at_least_32_characters
COOKIE_SECRET=your_strong_cookie_secret_at_least_32_characters
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
ADMIN_EMAIL=admin@thenews.com
ADMIN_PASSWORD=your_initial_admin_password
```

### Frontend (`frontend/.env`)
```bash
VITE_API_BASE_URL=http://localhost:5000/api/v1
```

> **Security Note:** Usable secrets are never committed to the repository. The application enforces validation of required secrets at startup.

---

## 4. Local Setup & Execution

### Prerequisites
- **Node.js:** v18+ (tested on Node v20+)
- **MongoDB:** Active MongoDB Atlas cluster or local MongoDB instance

### Step 1: Backend
```bash
cd backend
npm install
npm run build
npm run dev        # Development mode with hot reload
# or
npm start          # Run compiled production server
```

Verify backend health:
```bash
curl http://localhost:5000/api/v1/health
```

### Step 2: Frontend
```bash
cd frontend
npm install
npm run dev        # Starts Vite dev server on http://localhost:5173
```

To build production bundles:
```bash
npm run build      # Generates optimized output in frontend/dist/
```

---

## 5. Public Routes & Navigation
- `/` — Curated Homepage (Breaking news bar, Hero story, Secondary stories, Latest wire, Desks, Trending)
- `/latest` — Real-time chronological news feed
- `/trending` — High-engagement stories (last 7 days by views, likes, comments)
- `/videos` — Video format articles
- `/category/:slug` — Category-specific news feed
- `/article/:slug` — Full article page with engagement, related stories, and comments
- `/search` — Live keyword and category search
- `/saved` — Reader bookmarked articles (authenticated readers)
- `/profile` — Reader profile & reading preferences
- `/login` — User & administrator sign in
- `/register` — Reader account registration
- `/forgot-password` — Password assistance notice

---

## 6. Admin Editorial CMS Routes (Admin Only)
- `/admin` — CMS Dashboard with real database metrics and recent posts
- `/admin/posts` — Article catalog with filters, status badges, and edit/preview links
- `/admin/posts/new` — Article composer (TipTap editor, featured/breaking toggles)
- `/admin/posts/:id/edit` — Article editor
- `/admin/posts/:id/preview` — Authenticated draft/scheduled article preview
- `/admin/media` — Cloudinary media library
- `/admin/categories` — Category management
- `/admin/tags` — Tag management
- `/admin/languages` — Language management
- `/admin/users` — User account management
- `/admin/comments` — Comment moderation (hide/delete reader comments)

---

## 7. Testing & Quality Verification

Run backend integration test suite:
```bash
cd backend
npm test
```

Run production type-checking and builds:
```bash
# Backend build verification
cd backend && npm run build

# Frontend build verification
cd frontend && npm run build
```
