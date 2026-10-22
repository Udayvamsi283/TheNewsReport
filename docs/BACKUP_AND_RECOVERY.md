# The News — Backup, Disaster Recovery & Operational Runbook

This operational runbook provides step-by-step procedures for database backups, disaster recovery, credential rotation, and production rollbacks.

---

## 1. MongoDB Atlas Backup & Restoration

### 1.1 Automated Backups
- The News database operates on MongoDB Atlas with automated continuous cloud backups.
- **Snapshot Retention:** Rolling daily snapshots retained automatically by Atlas.

### 1.2 On-Demand Snapshot Creation (Before Major Upgrades)
1. Log in to [cloud.mongodb.com](https://cloud.mongodb.com).
2. Select the `the_news` cluster.
3. Navigate to **Backup** ➔ **Take Snapshot Now**.
4. Label the snapshot (e.g., `pre-release-phase5`).

### 1.3 Disaster Recovery / Point-In-Time Restore
1. In the Atlas dashboard, go to **Backup** ➔ **Snapshots**.
2. Select the desired restore point or select **Point-in-Time Restore**.
3. Choose **Restore to an existing cluster** (or select a new cluster to test integrity without downtime).
4. Verify the cluster URI matches `MONGODB_URI` in the backend environment variables.

### 1.4 Local Logical Backup using mongodump (Cold Storage)
```bash
mongodump --uri="<MONGODB_URI>" --out=./backups/$(date +%Y%m%d)_the_news_dump
```

---

## 2. Cloudinary Media Asset Recovery

- **Asset Storage:** Media files are stored securely across Cloudinary's multi-region cloud storage with automatic redundancy.
- **Metadata:** Cloudinary public IDs, URLs, and dimensions are indexed in MongoDB's `media` collection.
- **Asset Export:** In the Cloudinary Management Console, navigate to **Settings** ➔ **Account** ➔ **Backup & Export** to generate a full ZIP archive of all media library assets for cold-storage archiving.

---

## 3. Administrator Credential Rotation

If an administrator's credentials must be rotated immediately:

### Option A: Standard CMS Password Update
1. Sign in as Administrator at `/login`.
2. Navigate to `/profile` or `/admin/settings/account`.
3. Submit a new secure password (minimum 8 characters with numbers and special symbols).

### Option B: Emergency CLI Rotation
Run the administrative reset script from the server environment:
```bash
cd backend
node dist/scripts/seed.js
```
*Note: Ensure `ADMIN_PASSWORD` in `backend/.env` is set to the new secure password before running the seed script.*

---

## 4. Production Deployment & Rollback Procedures

### 4.1 Frontend (Vercel)
- **Deployment:** Commits to the production branch trigger automatic atomic builds on Vercel.
- **Instant Rollback:**
  1. Go to the [Vercel Dashboard](https://vercel.com).
  2. Select **The News Frontend** project.
  3. Navigate to **Deployments**.
  4. Find the last known healthy deployment and click `...` ➔ **Rollback to this Deployment**.
  5. Traffic switches instantly with zero downtime.

### 4.2 Backend (Render)
- **Deployment:** Pushes to the production repository trigger automatic Docker/Node builds on Render.
- **Rollback:**
  1. In the [Render Dashboard](https://dashboard.render.com), select the `the-news-backend` Web Service.
  2. Go to the **Events** tab.
  3. Find the previous successful deploy and click **Rollback**.
  4. Render redirects traffic to the previous healthy container instance.

---

## 5. Health Monitoring & Log Inspection

- **Health Check Endpoint:** `GET /api/v1/health`
  - Returns HTTP 200 with `{ "database": { "status": "connected", "connected": true } }`.
- **Log Inspection on Render:**
  - In the Render dashboard, open the **Logs** tab. Filter by `[ERROR]` or `[WARN]` to inspect runtime anomalies.
- **Alert Conditions:**
  - Database connectivity loss: Health check returns status other than 200.
  - Spike in HTTP 429: Indicates potential brute-force attack blocked by rate limiters.
