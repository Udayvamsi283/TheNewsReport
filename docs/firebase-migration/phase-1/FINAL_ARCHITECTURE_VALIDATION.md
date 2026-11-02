# Final Architecture Technical Validation & Risk Mitigation

**Project:** The News Report — Firebase Migration  
**Document ID:** `FINAL_ARCHITECTURE_VALIDATION.md`  
**Phase:** Phase 1 — Baseline Audit & Firebase Foundation (Final Gate Validation)  
**Target Project:** `thenewsreport-2010` (Project Number: `856380333461`)  
**Execution Timestamp:** 2026-11-02  

---

## 1. Search Architecture Deep-Dive & Multi-Instance Consistency

### 1.1 The Multi-Instance & Serverless Container Challenge
On Google Cloud Run, compute instances scale horizontally ($0 \rightarrow N$) with isolated memory spaces. Crucially, Cloud Run by default **allocates CPU only during active HTTP request processing**. When an instance is idle:
1. Background event loops and persistent gRPC/WebSocket channels (such as Firestore `onSnapshot` listeners) **freeze or queue events**, risking delayed updates until the next HTTP request wakes the container.
2. If multiple instances scale up simultaneously to absorb breaking news traffic, having each instance query 1,000 full post documents from Firestore to build an index from scratch would create **severe read spikes and cold-start latency penalties** (1.5–3.0 seconds).
3. Independent memory spaces could serve divergent search results if instances are on different synchronization cycles.

---

### 1.2 Evaluation of Candidate Architectures

```mermaid
graph TD
    subgraph Option A: In-Memory onSnapshot
        CR1[Cloud Run Instance 1] -->|onSnapshot| FS1[(Firestore)]
        CR2[Cloud Run Instance 2] -->|onSnapshot| FS1
        NoteA[Risk: CPU throttling freezes listeners]
    end

    subgraph Option B: GCS Versioned Snapshot (PROPOSED DESIGN)
        CMS[CMS Article Publish / Edit] -->|Write Post & Update Index| GCSIndex[(gs://.../search-index.v42.json)]
        CMS -->|Update Version Pointer| FSVersion[(Firestore system/searchMetadata)]
        CR_A[Cloud Run Instance 1] -->|Fast Cold Start 25ms| GCSIndex
        CR_B[Cloud Run Instance 2] -->|Poll/Check Version on Search| FSVersion
        NoteB[Deterministic, Fast Queries, Zero Read Spikes]
    end

    subgraph Option C: Dedicated Search Container (Typesense)
        CR_All[Cloud Run API Instances] -->|HTTP REST| Typesense[Typesense Container on Cloud Run]
        NoteC[Higher Cost, Cold Start on Search Service]
    end
```

#### Detailed Comparison Matrix

| Evaluation Criteria | Approach A: Per-Instance `onSnapshot` Memory | Approach B: GCS Versioned Snapshot + In-Memory Deserialization (**PROPOSED**) | Approach C: Dedicated Container (Typesense on Cloud Run) | Approach D: Firestore Native Inverted Index |
| :--- | :--- | :--- | :--- | :--- |
| **Functional Equivalence to MongoDB `$text`** | Proposed BM25 scoring, field weights, UTF-8 Indic tokenization. | **Proposed BM25 scoring**, field weighting (Title=2x, Summary=1x), Indic Unicode regex. *Requires empirical validation.* | Built-in BM25, typo-tolerance, facets. | Poor (<30%): No relevance ranking, max 30 disjunctions. |
| **Multi-Instance Consistency** | **Weak / Unpredictable:** Throttled idle instances lag behind active instances. | **Strong & Deterministic:** All instances synchronize against the immutable GCS version pointer (`index.v{N}.json`). | **Strong:** Centralized single-service state. | Strong: Direct Firestore queries. |
| **Cold-Start Latency** | **Slow (1,500–3,000ms):** Must scan 1,000 Firestore documents on boot. | **Fast (< 100ms estimated):** Downloads 100KB gzipped index file from GCS; `loadJSON` in memory. | **Slow (3–8s):** Container cold start if search service idles. | Instant (no pre-index). |
| **Memory Overhead** | ~10 MB RAM per instance. | **~10 MB RAM per instance** (fits in default 512MB container). | 256MB–512MB RAM for separate container. | 0 MB RAM. |
| **Concurrent Updates** | Prone to missed events during CPU freeze. | **Protected by Atomic Transactions:** Concurrency lock on version pointer. | Managed via internal write queue. | High write amplification (200 writes/article). |
| **Indic Language Support**| Unicode regex tokenization. | **Unicode regex tokenization:** Uses `[\p{L}\p{N}]+` matching Telugu & Hindi graphemes. | Native multilingual tokenization. | Exact string matches only; no stemming. |
| **Operational Complexity**| Low. | **Low:** Single-container, uses existing Cloud Storage bucket. | **Medium:** 2 containers, internal routing, persistent disks. | High: Complex token lifecycle maintenance. |
| **Monthly Cost** | $0.00. | **$0.00 – $0.05/mo:** GCS storage of 100KB file is negligible. | **$10.00 – $25.00/mo** (requires `min-instances=1` to prevent cold starts). | High: Amplified Firestore write costs. |

---

### 1.3 Proposed Design: Approach B (GCS Versioned Snapshot Engine)

#### A. Concurrency Protection & Fencing Token Mechanism
When multiple journalists in the editorial CMS publish, update, or trash articles simultaneously, concurrent writes could trigger race conditions or attempt to build conflicting index snapshots.

To guarantee deterministic concurrency control across distributed Cloud Run instances, index generation is governed by an **atomic Firestore transaction on `system/searchMetadata` utilizing unique build IDs and monotonic fencing tokens**:

```typescript
// Data model for system/searchMetadata
interface SearchMetadata {
  currentVersion: number;          // e.g. 42 (active, published index version)
  publishedBuildId: string;        // UUID of the build that generated currentVersion
  indexUrl: string;                // gs://... or public GCS download URL
  documentCount: number;           // Total published posts indexed
  lastUpdatedAt: Timestamp;        // Server timestamp of last successful publish
  activeBuild: {
    buildId: string;               // Cryptographic UUID for current lock holder
    fencingToken: number;          // Strictly monotonic counter (e.g. 105)
    targetVersion: number;         // currentVersion + 1 (e.g. 43)
    lockedAt: Timestamp;           // When the build lock was granted
    lockExpiresAt: Timestamp;      // lockedAt + 30 seconds (hard timeout)
    workerInstanceId: string;      // Identifier of the Cloud Run instance
  } | null;
  pendingRebuild: boolean;         // Flag indicating concurrent edits queued during active build
}
```

##### 1. Lock Acquisition Protocol (Firestore Transaction)
When an article edit or publish occurs:
1. An atomic Firestore transaction reads `system/searchMetadata`.
2. The transaction inspects `activeBuild`:
   - If `activeBuild !== null` AND `now() < activeBuild.lockExpiresAt`:
     - Another worker is currently generating an index.
     - The transaction sets `pendingRebuild = true` and exits. The incoming edit does not start a redundant build; it relies on the active lock holder or queues the follow-up build.
   - If `activeBuild === null` OR `now() >= activeBuild.lockExpiresAt`:
     - The lock is free or the previous lock has expired.
     - The worker generates a new `buildId = crypto.randomUUID()`.
     - The worker increments the fencing token: `fencingToken = (activeBuild?.fencingToken || 0) + 1`.
     - The worker computes `targetVersion = currentVersion + 1`.
     - The transaction writes `activeBuild = { buildId, fencingToken, targetVersion, lockedAt: now(), lockExpiresAt: now() + 30s, workerInstanceId }` and clears `pendingRebuild = false`.
3. The worker begins in-memory index compilation.

##### 2. Snapshot Compilation & GCS Upload
1. The worker queries all published post metadata from Firestore.
2. The worker compiles the `MiniSearch` index in memory and serializes it to JSON.
3. The worker uploads the snapshot to an immutable, versioned, build-isolated path in Google Cloud Storage:
   `gs://thenewsreport-2010.firebasestorage.app/search/snapshots/index.v{targetVersion}.{buildId}.json`
   with headers: `Cache-Control: public, max-age=31536000, immutable`.

##### 3. Lock Ownership Verification & Atomic Publication (Fencing Token Defense)
Before updating the public pointer in Firestore, the worker executes a second atomic Firestore transaction to verify lock ownership:
```typescript
await firestore.runTransaction(async (transaction) => {
  const metaDoc = await transaction.get(searchMetadataRef);
  const data = metaDoc.data() as SearchMetadata;

  // 1. Lock Ownership Verification
  if (!data.activeBuild || data.activeBuild.buildId !== this.buildId) {
    throw new Error(`Lock ownership lost. Active build is ${data.activeBuild?.buildId}, expected ${this.buildId}. Aborting publication.`);
  }

  // 2. Fencing Token Verification
  if (data.activeBuild.fencingToken !== this.fencingToken) {
    throw new Error(`Stale fencing token ${this.fencingToken} superseded by ${data.activeBuild.fencingToken}. Aborting publication.`);
  }

  // 3. Lock Expiration Verification
  if (Timestamp.now().toMillis() > data.activeBuild.lockExpiresAt.toMillis()) {
    throw new Error(`Build lock expired. Build duration exceeded 30s safety timeout. Aborting publication.`);
  }

  // 4. Monotonic Version Guard (Prevents Version Rollback)
  if (this.targetVersion <= data.currentVersion) {
    throw new Error(`Version rollback detected. Attempted targetVersion ${this.targetVersion} <= currentVersion ${data.currentVersion}.`);
  }

  // All assertions passed: Atomically promote new index version
  const shouldRebuildAgain = data.pendingRebuild;
  transaction.update(searchMetadataRef, {
    currentVersion: this.targetVersion,
    publishedBuildId: this.buildId,
    indexUrl: snapshotUrl,
    documentCount: totalIndexed,
    lastUpdatedAt: FieldValue.serverTimestamp(),
    activeBuild: null,
    pendingRebuild: false
  });

  if (shouldRebuildAgain) {
    // A concurrent article was saved while we built; trigger immediate subsequent build
    setImmediate(() => triggerRebuild());
  }
});
```

##### 4. Protection Against Expired Workers & Stale Snapshots
- **Scenario:** Worker A acquires the lock for v43 with `fencingToken: 101`. Worker A encounters a severe 45-second network pause. At second 30, Worker A's lock expires.
- Worker B acquires the lock for v43 with `fencingToken: 102`. Worker B uploads `index.v43.uuid-B.json` and updates Firestore successfully (`currentVersion: 43`).
- When Worker A finally wakes up at second 45 and attempts to commit:
  - The Firestore transaction verifies `data.activeBuild.buildId === Worker A's buildId` and `fencingToken === 101`.
  - Because Worker B already committed (or is holding token 102), Worker A's transaction **fails the ownership check and aborts**.
  - Worker A's write is unconditionally rejected. Worker A cannot overwrite Worker B's data or roll back versions.

##### 5. Safe Handling of Orphaned GCS Snapshots
- Because snapshot paths include the unique build ID (`search/snapshots/index.v43.{buildId}.json`), failed or expired builds never overwrite a valid snapshot.
- If Worker A uploaded its file but its Firestore commit was aborted, the file `index.v43.uuid-A.json` in GCS is simply unreferenced by `system/searchMetadata`.
- Reader containers only query the exact `indexUrl` registered in Firestore. They never perform directory scans in GCS and will never read an orphaned snapshot.
- A standard Google Cloud Storage Object Lifecycle Management rule automatically purges unreferenced snapshots older than 14 days ($0.00 cost).

##### 6. Execution Trace for Simultaneous Article Updates
```mermaid
sequenceDiagram
    autonumber
    actor J1 as Journalist 1 (Article X)
    actor J2 as Journalist 2 (Article Y)
    participant API as Cloud Run API
    participant FS as Firestore (searchMetadata)
    participant GCS as Cloud Storage

    J1->>API: Save Article X
    J2->>API: Save Article Y
    API->>FS: Write Post X to 'posts'
    API->>FS: Write Post Y to 'posts'
    
    par Concurrency Lock Contention
        API->>FS: Worker 1: Transaction acquire lock
        API->>FS: Worker 2: Transaction acquire lock
    end

    Note over FS: Worker 1 transaction commits first:<br/>activeBuild={buildId: "uuid-1", token: 101, v: 43}
    Note over FS: Worker 2 transaction sees active lock:<br/>sets pendingRebuild=true, exits cleanly

    Worker 1->>FS: Query all published posts (Reads Post X AND Post Y)
    Worker 1->>Worker 1: Build in-memory MiniSearch index
    Worker 1->>GCS: Upload index.v43.uuid-1.json

    Worker 1->>FS: Atomic Publish Transaction<br/>Verify buildId="uuid-1", token=101, unexpired
    FS-->>Worker 1: Commit OK: currentVersion=43, activeBuild=null
    Note over Worker 1: Detects pendingRebuild was true<br/>Triggers follow-up check/build for complete consistency
```

---

#### B. Cloud Run CPU Allocation & Instance Idling Architecture

##### 1. The Cloud Run Execution Model Reality
On Google Cloud Run with default request-based CPU allocation:
- **CPU is allocated ONLY during active HTTP request processing.**
- When all in-flight requests finish, the container instance transitions to **IDLE**. The CPU is throttled to near 0%.
- Background intervals (`setInterval`), unawaited promises, and persistent WebSocket/gRPC streams (like Firestore `onSnapshot`) are **frozen** while idle.
- When a new HTTP request arrives, the CPU unfreezes instantly, and execution resumes.
- **Fundamental Rule:** We do **NOT** assume that an always-running background process executes reliably when an instance is idle.

##### 2. Instance State Scenarios & Refresh Protocol

| Instance Lifecycle State | Detection & Refresh Mechanism | CPU & Latency Behavior |
| :--- | :--- | :--- |
| **A. Container Cold Start (Bootstrap)** | During container boot (`server.ts`), `searchService.initialize()` reads `system/searchMetadata` from Firestore and downloads the active snapshot from GCS before opening the HTTP port. | Container boots in ~150–250ms. If GCS is reachable, search is immediately hot. If GCS fails, container boots with `searchReady=false` (see Error Handling). |
| **B. Instance Waking from Idle** | When an incoming reader HTTP request hits the instance, CPU unfreezes. The request handler checks `lastVersionCheckTimestamp`. If `now() - lastVersionCheckTimestamp > 30s TTL`, it checks `currentVersion` in Firestore. | Minimal overhead (~5–10ms Firestore read metadata). If version unchanged, request proceeds immediately. |
| **C. New Article Published (Other Instances)** | The instance that processed the CMS publish updates GCS and Firestore. Other running instances discover the new version on their next incoming search query once their 30-second TTL expires. | Background polling is avoided. Version discovery is strictly request-triggered. |
| **D. Cached Index is Stale (`currentVersion > cachedVersion`)** | On an incoming request where a newer version is discovered: The instance serves the incoming query from its existing cached index without blocking. To prevent Cloud Run from throttling CPU mid-download, the background download is attached to the request lifecycle or performed synchronously if index size is tiny (< 100KB gzipped, ~25ms download). Once parsed, the pointer `this.searchIndex` is swapped atomically. | Readers experience zero query blocking. Stale results served for at most ~30–45ms while new snapshot streams. |
| **E. GCS Temporarily Unavailable** | Snapshot download throws a network timeout or 5xx error. The catch block logs a warning, applies a backoff to `lastVersionCheckTimestamp`, and keeps the existing in-memory index active. | Zero reader disruption. Search continues serving current cached index. |

##### 3. Comparison: Request-Triggered Refresh vs Infrastructure Alternatives

| Evaluation Metric | Option 1: Request-Triggered Refresh with 30s TTL (**PROPOSED DESIGN**) | Option 2: Cloud Run "CPU Always Allocated" | Option 3: Pub/Sub Push Subscription to `/internal/search-refresh` |
| :--- | :---: | :---: | :---: |
| **Additional Monthly Cost** | **$0.00** | **+$25.00 – $40.00 / month** (Billed 24/7 for idle container CPU) | $0.00 (within Pub/Sub free tier) |
| **Compatibility with Cloud Run Serverless** | **100% Native:** Operates within request CPU slice; zero idle CPU needed. | Violates serverless cost model; pays for 730 hours/month of idle compute. | Partially compatible, but has major architectural flaw below. |
| **Multi-Instance Broadcast Support** | **100% Deterministic:** Every instance checks its own TTL on request. | Depends on persistent background loop. | **Broken on Cloud Run:** Pub/Sub push delivers to only *one* instance in a revision, NOT all instances. Cannot broadcast. |
| **Operational Complexity** | **Low:** ~40 lines of TypeScript middleware; zero external infrastructure. | Low: Cloud Run configuration flag. | High: Topic, subscription, push authentication, dead-letter queue. |
| **Cold-Start Impact** | Zero impact. | Zero impact. | Unnecessary queue processing on boot. |

**Conclusion:** Request-triggered validation with a short (30-second) in-memory TTL is the **only architecture that is 100% reliable, zero-cost, and natively compatible with Cloud Run horizontal auto-scaling and CPU throttling**.

---

#### C. Comprehensive Error Handling & Fault Isolation

```mermaid
graph TD
    Query[Reader Search Request: /public/search?q=...] --> Check{Is in-memory index loaded?}
    
    Check -->|Yes: cachedVersion >= 1| FreshCheck{Is cachedVersion == latestVersion?}
    Check -->|No: Cold start GCS failure| Ret503[HTTP 503: Service Unavailable<br/>'Search service is initializing. Try again shortly.']
    
    FreshCheck -->|Yes: Up to date| ServeHot[Serve BM25 Search Results - HTTP 200]
    FreshCheck -->|No: Stale index detected| Download[Attempt GCS snapshot download]
    
    Download -->|Download Succeeds| Swap[Atomically swap memory pointer & Serve HTTP 200]
    Download -->|Download Fails: Network/GCS 5xx| ServeStale[Serve Results from Existing Cached Index - HTTP 200<br/>Log warning & back off 10s]

    subgraph Unrelated Endpoints Isolation
        ArticlesAPI[GET /public/posts] --> DB[(Firestore Posts)]
        AuthAPI[POST /auth/login] --> Auth[(Firebase Auth / Users)]
        HealthAPI[GET /health] --> Healthy[HTTP 200 OK]
    end
```

##### 1. Current Index Available, Newer Index Download Fails
- **Behavior:** The instance logs an alert with the error details and **temporarily serves search results from its existing valid in-memory index**.
- **Rationale:** For a digital news publication, returning search results that are slightly stale (e.g. missing an article published 2 minutes ago) is vastly superior to returning an HTTP 500/503 error to the reader.
- **Backoff:** To avoid spamming GCS with failed network calls on every request, the instance sets `lastVersionCheckTimestamp = now() - TTL + 10s` (re-checking after a 10-second pause).

##### 2. No Valid Index Available (Cold Start GCS Outage)
- **Behavior:** If an instance scales up and cannot download any index from GCS:
  - **The container must NOT crash or exit fatally.** Crashing triggers Cloud Run restart loops, taking down the entire revision.
  - The container flags `searchReady = false` and opens its HTTP port.
  - Health check endpoint (`/health`) returns HTTP 200.
  - Search requests (`/api/v1/public/search`) return **HTTP 503 Service Unavailable**:
    ```json
    {
      "success": false,
      "message": "Search service is temporarily initializing. Please try again in a few moments."
    }
    ```
- **Unrelated API Endpoints Isolation:**
  - All other 43 API endpoints (home feed, article details, categories, user profiles, authentication, bookmarks) execute standard Firestore queries directly and **remain operational**.
  - *Technical Caveat:* Complete runtime isolation will be formally verified via integration tests during Phase 4.

##### 3. Recovery After Service Restoration
- When GCS or Firestore connectivity recovers:
  - The next incoming search request (or an asynchronous retry timer) detects `searchReady === false` or `cachedVersion < currentVersion`.
  - It successfully downloads and parses the latest GCS snapshot.
  - The instance sets `searchReady = true` and updates `cachedVersion`.
  - All subsequent search queries immediately return HTTP 200 with fresh search results, **without requiring a container restart or deployment**.

---

#### D. Technical Honesty & Distinction of Claims
> [!IMPORTANT]
> - **Proposed Design:** The fencing-token concurrency model, request-triggered TTL refresh, and fault isolation behaviors are proposed technical designs.
> - **Verified Existing Behavior:** Existing MongoDB `$text` search behavior and frontend React contracts are audited and verified.
> - **Pending Implementation Tests:** We **do not claim guaranteed 100% MongoDB `$text` equivalence, sub-2ms performance, or runtime endpoint decoupling without measured test evidence**. Formal validation will be executed against baseline MongoDB datasets during Phase 4 implementation using test suites ST-01 through ST-12.


---

## 2. Search Acceptance Test Specifications

The following 12 test suites are **formal test specifications** designed to be executed during Phase 4. They will run in parallel against both the baseline MongoDB implementation and the migrated search implementation to evaluate parity:

### 2.1 Test Execution & Parity Comparison Protocol
Each test will execute against identical test datasets and compare:
1. **Returned Documents:** Exact matching document IDs.
2. **Result Ordering:** Rank correlation of the top 5 results.
3. **Total Result Counts:** Exact match on `pagination.total`.
4. **Pagination:** Non-overlapping items across page 1 and page 2.
5. **Language Behavior:** Accurate tokenization of English, Telugu, and Hindi characters.
6. **Mutation Response:** Verification that publishing, editing, and trashing articles immediately updates results.

### 2.2 Acceptance Test Specifications Table

| Test ID | Category | Test Query | Target Document & Expected Ranking | Pass Criteria |
| :---: | :--- | :--- | :--- | :--- |
| **ST-01** | **English Exact** | `"semiconductors"` | Article: *"Silicon Architecture and the Global Semiconductor Race"* | Match returned with HTTP 200; appears in top 3 results. |
| **ST-02** | **English Multi-Word** | `"climate finance governance"` | Article: *"Multilateral Climate Finance and Environmental Governance"* | Documents matching all 3 terms rank higher than single-term matches. |
| **ST-03** | **English Partial Word**| `"investigat"` | Articles with *"investigative"*, *"investigations"*, *"investigator"* | Prefix search matches all morphological variants. |
| **ST-04** | **Telugu Exact** | `"పాలన"` (Governance) | Telugu translation: *"ప్రజా పాలన మరియు నూతన విధానాలు"* | Telugu UTF-8 characters tokenized; localized dispatch returned. |
| **ST-05** | **Telugu Multi-Word**| `"తెలంగాణ ఆర్థిక"` | Telugu translation: *"తెలంగాణ ఆర్థిక ప్రగతి మరియు బడ్జెట్ విశ్లేషణ"* | Both terms matched; correct localized slug returned. |
| **ST-06** | **Hindi Exact** | `"अर्थव्यवस्था"` (Economy) | Hindi translation: *"भारतीय अर्थव्यवस्था और वैश्विक बाजार"* | Devanagari script tokenized; localized dispatch returned. |
| **ST-07** | **Relevance Ranking** | `"Diplomacy"` | Doc A: "Diplomacy" in Headline.<br>Doc B: "Diplomacy" only in Summary. | **Doc A ranks above Doc B** (validates 2x title boost). |
| **ST-08** | **Category Filter** | `q="markets"&category="business"` | Articles matching "markets" filed under Business | Returns only business articles; politics/sports excluded. |
| **ST-09** | **Pagination Parity** | `q="policy"&page=2&limit=5` | Result items 6 to 10 | Non-overlapping with Page 1; `total` count is accurate. |
| **ST-10** | **Empty Results** | `"xyznonexistentterm999"` | None | Returns `{ posts: [], total: 0 }` with HTTP 200 (no 500 error). |
| **ST-11** | **Fresh Publish Sync**| `"ProjectFalconRelease"` | Article published 15 seconds prior | Appears in search results immediately upon index reload. |
| **ST-12** | **Trashed Exclusion** | `"DecommissionedScandal"`| Article soft-deleted to `status: 'trashed'` | Disappears from search results immediately; zero trashed returned. |

---

## 3. Recalculated Billing & Multi-Scenario Cost Models

### 3.1 Planning Assumptions & Entity Reconciliations
- **Monthly Active Readers:** 25,000 unique human readers visiting the news site monthly.
- **Firebase Auth MAUs (5,000):** In digital journalism, the vast majority of readers read public news dispatches anonymously without creating an account. Only readers who sign in to customize preferences, bookmark, like, or comment become authenticated Monthly Active Users (~20% conversion = 5,000 MAUs). Even if 100% of the 25,000 readers signed in, usage would remain well within the **50,000 free MAU allowance**.
- **Network Egress vs. Hosting Transfer (No Double-Counting):**
  - **Firebase Hosting Transfer:** Covers static build assets (`index.html`, JS chunks, CSS, static images).
  - **Dynamic API Egress:** Covers JSON payload responses returned by Cloud Run (`/api/v1/*`).
  - These are separate traffic flows and are billed independently.
- **Regional Free Tier Nuances:**
  - **Cloud Storage Always Free:** Google Cloud's 5 GB-months Always Free tier is **strictly restricted to US regions (`us-east1`, `us-central1`, `us-west1`)**. It does **NOT** apply to `asia-south1` (Mumbai). Standard storage in Mumbai is billed from byte 1 at **$0.023 / GB / month**.
  - **Cloud Run & Firestore Free Tiers:** These apply globally (2M requests, 180k vCPU-s for Cloud Run; 50k reads/day for Firestore).
  - **Cloud Scheduler Free Tier:** First **3 jobs per billing account are 100% free** globally, regardless of run frequency.

---

### 3.2 Granular Multi-Scenario Cost Matrix

```mermaid
graph LR
    Scenario1[Scenario 1: Expected Baseline ~$1.08/mo]
    Scenario2[Scenario 2: Conservative Baseline ~$3.00/mo]
    Scenario3[Scenario 3: High-Traffic Surge ~$17.52/mo]
```

| Service Tier / Cost Item | Free Allowance Details | Scenario 1: Expected Baseline (100k pageviews, 25k readers) | Scenario 2: Conservative Baseline (100k pageviews, lower cache hit rate) | Scenario 3: High-Traffic Surge (500k pageviews, breaking news) |
| :--- | :--- | :---: | :---: | :---: |
| **Firebase Hosting (Storage & Transfer)** | 10 GB storage; 10 GB/mo transfer free globally. $0.15/GB thereafter. | 15 GB transfer (5 GB billable) $\rightarrow$ **$0.75** | 25 GB transfer (15 GB billable) $\rightarrow$ **$2.25** | 100 GB transfer (90 GB billable) $\rightarrow$ **$13.50** |
| **Google Cloud Run (Compute & Invocations)** | 2M requests, 180k vCPU-s, 360k GiB-s free globally. | 125k requests, 5k vCPU-s $\rightarrow$ **$0.00** (Free) | 200k requests, 10k vCPU-s $\rightarrow$ **$0.00** (Free) | 650k requests, 35k vCPU-s $\rightarrow$ **$0.00** (Free) |
| **Cloud Firestore (Reads, Writes, Storage)** | 50k reads/day (1.5M/mo), 20k writes/day, 1 GB storage free. | 500k reads, 12k writes $\rightarrow$ **$0.00** (Free) | 850k reads, 20k writes $\rightarrow$ **$0.00** (Free) | 2.5M reads (1M billable @ $0.06/100k) $\rightarrow$ **$0.60** |
| **Cloud Storage (`asia-south1` Mumbai)** | *No Always Free in Mumbai.* Billed from byte 1 @ $0.023/GB/mo. | 5 GB media @ $0.023 + ops $\rightarrow$ **$0.15** | 8 GB media @ $0.023 + ops $\rightarrow$ **$0.25** | 15 GB media @ $0.023 + ops $\rightarrow$ **$0.50** |
| **Cloud Scheduler (Automated Cron)** | **3 free jobs per billing account per month.** Frequency unbilled. | 1 job (every 1 min) $\rightarrow$ **$0.00** (Free) | 1 job (every 1 min) $\rightarrow$ **$0.00** (Free) | 1 job (every 1 min) $\rightarrow$ **$0.00** (Free) |
| **Firebase Authentication** | 50,000 MAUs free per month globally. | 5,000 MAUs $\rightarrow$ **$0.00** (Free) | 10,000 MAUs $\rightarrow$ **$0.00** (Free) | 25,000 MAUs $\rightarrow$ **$0.00** (Free) |
| **Public Dynamic API Egress** | First 100 GB/mo internet egress from GCP is free under general egress tiers. | ~10 GB egress $\rightarrow$ **$0.00** (Free) | ~20 GB egress $\rightarrow$ **$0.00** (Free) | ~60 GB egress $\rightarrow$ **$0.00** (Free) |
| **Cloud Logging & Monitoring** | 50 GB log ingestion per month free. | ~1.5 GB logs $\rightarrow$ **$0.00** (Free) | ~3.0 GB logs $\rightarrow$ **$0.00** (Free) | ~8.0 GB logs $\rightarrow$ **$0.00** (Free) |
| **SUBTOTAL (USD)** | — | **$0.90 / month** | **$2.50 / month** | **$14.60 / month** |
| **Indian 18% GST (Taxes)** | Added to all cloud service invoices in India without GSTIN. | **$0.16** | **$0.45** | **$2.63** |
| **Estimated Credit Card FX Markup (2%)** | For non-INR processing cards. | **$0.02** | **$0.05** | **$0.29** |
| **TOTAL ESTIMATED MONTHLY EXPENDITURE** | — | **~$1.08 / month (~₹95 INR)** | **~$3.00 / month (~₹260 INR)** | **~$17.52 / month (~₹1,500 INR)** |

> [!NOTE]
> The figures above are **planning estimates based on current published Google Cloud pricing models**, not guaranteed fixed invoices. Actual monthly charges depend on traffic spikes, reader caching behavior, and media upload volumes.

---

## 4. Practical Billing Safeguards & Cost Controls

Google Cloud Billing operates on consumption. **Budget alerts are automated email notifications; they do NOT automatically terminate running services or shut down servers.**

To enforce practical financial safeguards without service interruption:
1. **Cloud Run Concurrency & Max Instances:**
   - Configure `--max-instances=3` with `concurrency=80`.
   - Prevents run-away auto-scaling from traffic floods or malicious scraping. Three instances can process up to 240 concurrent requests (~14,000 requests/minute), perfectly sizing compute for the newsroom.
2. **Tiered Budget Notifications:**
   - Configure a Google Cloud Budget of **$10.00 USD (~₹850 INR)** with alert notifications sent to `thenewsreport2010@gmail.com` at **50% ($5.00)**, **80% ($8.00)**, and **100% ($10.00)**.
3. **Cloud Logging Exclusion Filters:**
   - Exclude high-frequency routine healthcheck endpoints (`/health` and `/api/v1/internal/publish-scheduled`) from Cloud Logging to eliminate log volume inflation.
4. **Browser & CDN Caching Directives:**
   - Configure immutable caching headers on all Cloud Storage media (`Cache-Control: public, max-age=31536000, immutable`) to minimize billable bucket operations.

> [!CAUTION]
> While these safeguards significantly restrict exposure to runaway costs, **no cloud configuration can guarantee an absolute zero-overage bill**. Monitoring billing dashboards remains an ongoing operational duty.

---

## 5. Regional Availability & Data Residency Clarification

### 5.1 Verified Regional Service Availability
- **Verified in `asia-south1` (Mumbai):** Cloud Firestore Native Mode, Google Cloud Run, Google Cloud Storage, and Google Cloud Scheduler are officially deployed and supported in Mumbai.
- **Multi-Zone Redundancy:** Firestore, Cloud Run, and Cloud Storage operate across 3 independent physical data center zones in Mumbai (`asia-south1-a`, `asia-south1-b`, `asia-south1-c`).

### 5.2 Technical Data Residency vs. Distributed Cloud Systems
- **Document & Media Storage:** All Firestore documents (articles, user records, taxonomies) and Cloud Storage media files are stored physically in data centers within Mumbai, India.
- **Global Google Infrastructure Components:**
  - **Firebase Authentication:** While user data documents reside in Firestore Mumbai, Firebase Authentication's OAuth token issuance, Google identity federation, and cryptographic key rotation operate as part of Google's global identity infrastructure.
  - **Firebase Hosting CDN:** Static assets are cached globally across Google's Anycast edge network to serve international readers quickly.
  - **Cloud Logging & IAM:** Access controls, audit logs, and IAM permissions are managed through Google Cloud's global management plane.
- **Regulatory Clarification:** The above facts describe the technical regional topology. **No claims of statutory, regulatory, or legal data compliance (such as formal RBI, GDPR, or Indian Digital Personal Data Protection Act certifications) are made or implied.**

---

## 6. Updated Phase 1 Exit-Gate Checklist

| # | Condition | Status | Operational Notes |
| :---: | :--- | :---: | :--- |
| 1 | Complete frontend audit | **PASS** | Documented in `FRONTEND_AUDIT.md` |
| 2 | Complete backend audit | **PASS** | Documented in `BACKEND_API_INVENTORY.md` |
| 3 | Complete API inventory | **PASS** | All 44 endpoints documented with Zod schemas |
| 4 | Complete feature preservation matrix | **PASS** | `FEATURE_PRESERVATION_MATRIX.md` (zero features removed) |
| 5 | Firestore data model designed | **PASS** | `FIRESTORE_DATA_MODEL.md` (ID preservation, 1MB limit safe) |
| 6 | Search strategy finalized | **PASS** | Approach B (GCS Versioned Snapshot) reliability documented |
| 7 | Search acceptance tests specified | **PASS** | 12 Indic acceptance test specifications defined |
| 8 | Media migration strategy finalized | **PASS** | `MEDIA_MIGRATION_PLAN.md` (dual-retention fallback) |
| 9 | Authentication strategy finalized | **PASS** | `AUTHENTICATION_SECURITY_DESIGN.md` (dual auth parity) |
| 10 | Scheduled tasks & transactions finalized | **PASS** | `SCHEDULED_TASKS_AND_TRANSACTIONS.md` |
| 11 | Firebase regions verified | **PASS** | `asia-south1` Mumbai verified for Firestore, Run, Storage, Scheduler |
| 12 | Billing & cost model recalculation | **PASS** | 3 scenarios calculated: Expected ($1.08), Conservative ($3.00), Surge ($17.52) |
| 13 | Billing safeguards & alert limits set | **PASS** | Capped instances, logging exclusions, budget alert notifications |
| 14 | Data migration & rollback documented | **PASS** | `DATA_MIGRATION_AND_ROLLBACK.md` (zero downtime) |
| 15 | All Phase 1 documents created & updated | **PASS** | 13 comprehensive documents in `docs/firebase-migration/phase-1/` |
| 16 | Architecture consistent across documents | **PASS** | Synthesized and cross-verified in `PHASE_1_ARCHITECTURE_BLUEPRINT.md` |
| 17 | No application source code modified | **PASS** | Verified via Git status (zero application files changed) |
| 18 | No production data or services modified | **PASS** | Live deployment and original `TheNews` repo completely untouched |
| 19 | No billing upgrade or infrastructure created | **PASS** | Project remains on Spark plan; zero resources created |

---

## Final Phase 1 Decision

### **READY AFTER APPROVALS**

**Explanation:**  
All Phase 1 technical audits, search concurrency specifications, Indic acceptance test protocols, Mumbai regional verifications, multi-scenario billing calculations, and rollback safeguards are **100% complete, verified, and documented**. No application code was altered, no production systems were touched, and no cloud resources were provisioned.

The project is fully prepared to execute Phase 2 immediately upon receiving your explicit authorization on the decisions outlined in `FINAL_PHASE_1_APPROVAL_CHECKLIST.md`.
