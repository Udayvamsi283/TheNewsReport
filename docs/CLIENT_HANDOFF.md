# The News — Editorial CMS & Platform Client Handoff Guide

Welcome to **The News**, your production-ready, multilingual digital newsroom and public platform. This manual walks you through editorial operations, content publishing, media management, comment moderation, and everyday workflows.

---

## 1. Accessing the Editorial CMS

- **CMS Dashboard URL:** `https://<your-frontend-domain>/admin` (or `/login` from the public site)
- **Sign In:** Enter your journalist administrator email and password.
- **Security:** Sessions are preserved securely via HTTP-only encrypted cookies. If inactive for 7 days, you will be prompted to sign in again.
- **Top Bar Controls:**
  - Quick link to **View Live Platform** at any time.
  - Dark/Light editorial theme toggle.
  - Active author profile badge and sign-out action.

---

## 2. Managing News Articles & Formats

The News supports **8 distinct post formats** tailored for investigative journalism:

### 2.1 The 8 Post Formats
1. **Article (Standard Prose):** Longform reporting, investigative prose, and essays rendered with clean typography, reading time estimates, and formatted callouts.
2. **Gallery (Photo Essay):** Curated sequence of photography with photo credits, individual captions, and public lightbox expansion.
3. **Sorted List (Countdown/Ranking):** Ordered editorial lists (e.g., "Top 10 Global Policy Decisions") with custom badges, item headers, and narratives.
4. **Table of Contents (Longform Guide):** In-depth guides where major sections (`H2`, `H3`) are automatically indexed into a sticky navigation sidebar with smooth anchor scrolling.
5. **Video (Broadcast Report):** Embeds from YouTube, Vimeo, or MP4 streams with responsive aspect-ratio framing, view metrics, and channel details.
6. **Audio (Dispatch / Podcast):** Daily news briefings or audio dispatches with custom artwork, HTML5 audio controls, duration metrics, and author details.
7. **Poll (Reader Civic Sentiment):** Interactive single-choice questions with live vote counts, current percentage bars, opening/closing dates, and duplicate-vote prevention.
8. **Event (Summit / Live Schedule):** Structured event announcements with dates, start/end times, venue names, physical addresses, and external map navigation links.

### 2.2 Publishing Workflow
- **Creating a Post:** Go to `Posts` ➔ `New Post`.
- **Selecting Format:** Choose one of the 8 formats from the format dropdown. The editor dynamically displays fields specific to your selected format.
- **Drafting:** Click **Save Draft** at any time. Drafts are private and never exposed to public feeds, search engines, or RSS feeds.
- **Publishing Immediately:** Click **Publish Live**. The story is immediately available on the public homepage, category archive, and wire.
- **Scheduling for Later:** Select a future date/time in the **Schedule Publication** field. The platform's automated background worker publishes scheduled stories automatically when the time arrives.
- **Registered-Only Gating:** Check **Exclusive for Registered Readers** to gate the full story body behind a clean reader sign-in card. Unauthenticated visitors see the headline, lead excerpt, and cover image, while the full body is strictly guarded server-side.

---

## 3. Multilingual Translations

The News is built from the ground up for multilingual journalism:
1. Open any published or draft post in `Posts` ➔ `Edit`.
2. Expand the **Translations Panel** on the right sidebar.
3. Click **Add Translation** and select a target language (e.g., Telugu, Hindi, Spanish).
4. Enter the localized title, slug, and translated body.
5. Once saved, readers on the public site can switch languages instantly using the language selector bar at the top of the article.

---

## 4. Media Library & Assets

- **Location:** `Admin` ➔ `Media Library`.
- **Uploading:** Drag and drop or browse files. Images are streamed directly to Cloudinary and converted to responsive WebP/PNG assets.
- **Metadata:** Add descriptive alt text and captions to maintain high accessibility standards and search engine visibility.
- **Reuse:** Insert uploaded assets into articles directly from TipTap or cover image pickers.
- **Deletion:** Deleting an image in the CMS immediately cleans up the Cloudinary cloud asset and removes the database record.

---

## 5. Taxonomies: Categories & Tags

- **Categories:** Manage reporting desks (e.g., Politics, Technology, World, Business). Categories support hierarchical sub-categories (e.g., Regional ➔ Andhra Pradesh).
- **Tags:** Tag stories with cross-cutting keywords (e.g., `Investigation`, `Climate`, `Elections`).
- **Languages:** Configure supported system languages and ISO codes.

---

## 6. Reader Discussion & Moderation

- Readers can participate in flat chronological discussions below articles.
- In `Admin` ➔ `Comments`, staff can:
  - **Hide** inappropriate or flagged remarks (removes them from public view).
  - **Delete** remarks (soft-deletes text while preserving discussion counters accurately).

---

## 7. Homepage Editorial Controls

- **Hero Lead Story:** Pin your primary investigative lead story to the top of the homepage.
- **Breaking News Ticker:** Broadcast urgent news alerts across the animated ticker on the front page.
- **Curated Showcases:** Highlight specific desks and editorial categories on the home grid.

---

## 8. Common Troubleshooting

| Issue | Solution |
| :--- | :--- |
| **"Upload failed: File exceeds limit"** | Images must be under 10 MB. Recommended formats: JPG, PNG, WebP. |
| **"Story not appearing on homepage"** | Verify status is set to **Published** and `publishedAt` is not set to a future date. |
| **"Translation not showing"** | Ensure the target language translation is saved and has a unique localized slug. |
| **"Need to rotate admin password"** | Sign in, navigate to Staff Settings, enter your current password, and choose a new secure password (min. 8 characters). |
