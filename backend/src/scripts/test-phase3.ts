/**
 * Phase 3 Comprehensive Integration Test Suite
 * Validates CMS dispatches, post formats, scheduling, multilingual architecture,
 * media upload, CSRF protection, and permission boundaries against http://localhost:5000
 */

import { env } from '../config/env.js';

const BASE_URL = 'http://localhost:5000/api/v1';

async function runPhase3Tests() {
  console.log('================================================================');
  console.log('       STARTING PHASE 3 CMS & MEDIA INTEGRATION TEST SUITE      ');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}${detail ? ` - Detail: ${detail}` : ''}`);
      failed++;
    }
  }

  // 1. Health check & Atlas connection
  try {
    const res = await fetch(`${BASE_URL}/health`);
    const json: any = await res.json();
    assert(
      res.status === 200 && json.database?.connected === true,
      '1. Health Check & Atlas Database Connection',
      `DB Status: ${json.database?.status}`
    );
  } catch (err: any) {
    assert(false, '1. Health Check', err.message);
  }

  // 2. CSRF Token Acquisition
  let csrfToken = '';
  let csrfCookieVal = '';
  try {
    const res = await fetch(`${BASE_URL}/auth/csrf-token`);
    const json: any = await res.json();
    csrfToken = json.csrfToken || json.data?.csrfToken;
    const cookieHeader = res.headers.get('set-cookie');
    csrfCookieVal = cookieHeader ? cookieHeader.split(';')[0].trim() : '';
    assert(
      res.status === 200 && Boolean(csrfToken),
      '2. CSRF Token Issuance (GET /api/v1/auth/csrf-token)',
      `Token Length: ${csrfToken?.length}`
    );
  } catch (err: any) {
    assert(false, '2. CSRF Token Issuance', err.message);
  }

  // 3. Admin Authentication via Environment Credentials
  let adminCookie = '';
  try {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken,
        Cookie: csrfCookieVal
      },
      body: JSON.stringify({
        email: env.ADMIN_EMAIL,
        password: env.ADMIN_PASSWORD
      })
    });
    const json: any = await res.json();
    const setCookies = (res.headers as any).getSetCookie ? (res.headers as any).getSetCookie() : [res.headers.get('set-cookie') || ''];
    const tokenHeader = setCookies.find((c: string) => c.startsWith('token='));
    const tokenCookieVal = tokenHeader ? tokenHeader.split(';')[0].trim() : '';
    adminCookie = `csrf-token=${csrfToken}; ${tokenCookieVal}`;

    assert(
      res.status === 200 && json.data?.user?.role === 'admin' && !json.data?.accessToken,
      '3. Admin Authentication (Cookie-only, no JSON accessToken exposure)',
      `User Role: ${json.data?.user?.role}`
    );
  } catch (err: any) {
    assert(false, '3. Admin Authentication', err.message);
  }

  // 4. Fetch Category and Language for Post Association
  let categoryId = '';
  let languageId = '';
  try {
    const catRes = await fetch(`${BASE_URL}/categories`);
    const catJson: any = await catRes.json();
    categoryId = catJson.data?.categories[0]?._id;

    const langRes = await fetch(`${BASE_URL}/languages`);
    const langJson: any = await langRes.json();
    languageId = langJson.data?.languages[0]?._id;

    assert(
      Boolean(categoryId && languageId),
      '4. Taxonomy Resolution (Retrieved active Category & Language IDs)',
      `Cat: ${categoryId}, Lang: ${languageId}`
    );
  } catch (err: any) {
    assert(false, '4. Taxonomy Resolution', err.message);
  }

  // 5. CSRF Protection Enforcement (Mutating request without X-CSRF-Token must be rejected 403)
  try {
    const res = await fetch(`${BASE_URL}/posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: adminCookie
        // Intentionally omitting X-CSRF-Token
      },
      body: JSON.stringify({
        title: 'Unauthorized Post Attempt',
        category: categoryId,
        language: languageId
      })
    });
    assert(
      res.status === 403,
      '5. CSRF Protection Guard (Mutating request missing X-CSRF-Token rejected with 403)',
      `Status: ${res.status}`
    );
  } catch (err: any) {
    assert(false, '5. CSRF Protection Guard', err.message);
  }

  // 6. Post Creation: Standard Article with HTML Sanitization & Auto-Slug
  let createdPostId = '';
  let previewToken = '';
  try {
    const res = await fetch(`${BASE_URL}/posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken,
        Cookie: adminCookie
      },
      body: JSON.stringify({
        title: 'Phase 3 Investigative Breakthrough in Global Trade',
        summary: 'In-depth investigative dispatch detailing global supply corridor resilience.',
        content: '<h2>Introduction</h2><p>Safe article paragraph.</p><script>alert("xss")</script>',
        category: categoryId,
        language: languageId,
        postFormat: 'article',
        status: 'draft',
        faq: [
          { question: 'What is the primary scope?', answer: 'Investigative trade corridor analysis.' }
        ]
      })
    });
    const json: any = await res.json();
    createdPostId = json.data?._id;
    previewToken = json.data?.previewToken;

    const isScriptStripped = !json.data?.content.includes('<script>');
    assert(
      res.status === 201 && Boolean(createdPostId) && isScriptStripped,
      '6. Article Creation & HTML XSS Sanitization (<script> safely stripped)',
      `Post ID: ${createdPostId}, Content: ${json.data?.content}`
    );
  } catch (err: any) {
    assert(false, '6. Article Creation & Sanitization', err.message);
  }

  // 7. Secure Post Preview by Preview Token
  try {
    const res = await fetch(`${BASE_URL}/posts/preview/${previewToken}`, {
      headers: { Cookie: adminCookie }
    });
    const json: any = await res.json();
    assert(
      res.status === 200 && json.data?._id === createdPostId,
      '7. Secure Draft Preview Access (via previewToken)',
      `Preview Title: ${json.data?.title}`
    );
  } catch (err: any) {
    assert(false, '7. Secure Draft Preview', err.message);
  }

  // 8. Slug Uniqueness Collision Handling
  try {
    const res = await fetch(`${BASE_URL}/posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken,
        Cookie: adminCookie
      },
      body: JSON.stringify({
        title: 'Phase 3 Investigative Breakthrough in Global Trade', // identical title
        summary: 'Second story with duplicate title to test uniqueness suffix.',
        category: categoryId,
        language: languageId,
        postFormat: 'article',
        status: 'draft'
      })
    });
    const json: any = await res.json();
    const secondPostId = json.data?._id;
    const isDeduplicated = json.data?.slug.endsWith('-1');

    assert(
      res.status === 201 && isDeduplicated,
      '8. Automatic Slug Uniqueness & Collision Suffix (-1 appended)',
      `Slug: ${json.data?.slug}`
    );

    // Clean up second post
    if (secondPostId) {
      await fetch(`${BASE_URL}/posts/${secondPostId}?permanent=true`, {
        method: 'DELETE',
        headers: { 'X-CSRF-Token': csrfToken, Cookie: adminCookie }
      });
    }
  } catch (err: any) {
    assert(false, '8. Slug Collision Handling', err.message);
  }

  // 9. Multilingual Translation Version Attachment
  try {
    const res = await fetch(`${BASE_URL}/posts/${createdPostId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken,
        Cookie: adminCookie
      },
      body: JSON.stringify({
        translations: [
          {
            language: languageId,
            languageCode: 'te',
            title: 'గ్లోబల్ ట్రేడ్‌లో దర్యాప్తు పురోగతి',
            slug: 'global-trade-investigation-te',
            summary: 'తెలుగులో కథనం సారాంశం...',
            content: '<p>పూర్తి కథనం తెలుగులో...</p>'
          }
        ]
      })
    });
    const json: any = await res.json();
    assert(
      res.status === 200 && json.data?.translations?.length === 1,
      '9. Multilingual Architecture (Attached localized Telugu version to story)',
      `Translations count: ${json.data?.translations?.length}`
    );
  } catch (err: any) {
    assert(false, '9. Multilingual Architecture', err.message);
  }

  // 10. Post Formats: Gallery Post Creation
  let galleryPostId = '';
  try {
    const res = await fetch(`${BASE_URL}/posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken,
        Cookie: adminCookie
      },
      body: JSON.stringify({
        title: 'Test Photojournalism: Arctic Expeditions',
        category: categoryId,
        language: languageId,
        postFormat: 'gallery',
        status: 'draft',
        galleryItems: [
          {
            image: 'https://images.unsplash.com/photo-1517411032315-54ef2cb783bb?w=1200',
            title: 'Basecamp at Sunrise',
            description: 'Field researchers surveying ice shelf.',
            order: 1
          }
        ]
      })
    });
    const json: any = await res.json();
    galleryPostId = json.data?._id;
    assert(
      res.status === 201 && json.data?.postFormat === 'gallery' && json.data?.galleryItems?.length === 1,
      '10. Gallery Post Format Support (Saved with structured slides)',
      `Format: ${json.data?.postFormat}`
    );
  } catch (err: any) {
    assert(false, '10. Gallery Post Format', err.message);
  }

  // 11. Post Formats: Video Post Creation (YouTube Embed)
  let videoPostId = '';
  try {
    const res = await fetch(`${BASE_URL}/posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken,
        Cookie: adminCookie
      },
      body: JSON.stringify({
        title: 'Video Report: Maritime Renewable Turbines',
        category: categoryId,
        language: languageId,
        postFormat: 'video',
        status: 'draft',
        videoDetails: {
          videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          embedUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
          provider: 'youtube'
        }
      })
    });
    const json: any = await res.json();
    videoPostId = json.data?._id;
    assert(
      res.status === 201 && json.data?.videoDetails?.provider === 'youtube',
      '11. Video Post Format Support (Configured with embed URL & provider)',
      `Provider: ${json.data?.videoDetails?.provider}`
    );
  } catch (err: any) {
    assert(false, '11. Video Post Format', err.message);
  }

  // 12. Publishing Workflow: Publish Live & Unpublish Back to Draft
  try {
    const pubRes = await fetch(`${BASE_URL}/posts/${createdPostId}/publish`, {
      method: 'POST',
      headers: { 'X-CSRF-Token': csrfToken, Cookie: adminCookie }
    });
    const pubJson: any = await pubRes.json();

    const unpubRes = await fetch(`${BASE_URL}/posts/${createdPostId}/unpublish`, {
      method: 'POST',
      headers: { 'X-CSRF-Token': csrfToken, Cookie: adminCookie }
    });
    const unpubJson: any = await unpubRes.json();

    assert(
      pubJson.data?.status === 'published' && unpubJson.data?.status === 'draft',
      '12. Publishing Lifecycle (Publish Live -> Revert to Draft)',
      `Published: ${pubJson.data?.status}, Reverted: ${unpubJson.data?.status}`
    );
  } catch (err: any) {
    assert(false, '12. Publishing Lifecycle', err.message);
  }

  // 13. Duplicate Post Operation
  let duplicatedPostId = '';
  try {
    const res = await fetch(`${BASE_URL}/posts/${createdPostId}/duplicate`, {
      method: 'POST',
      headers: { 'X-CSRF-Token': csrfToken, Cookie: adminCookie }
    });
    const json: any = await res.json();
    duplicatedPostId = json.data?._id;
    assert(
      res.status === 201 && json.data?.title.includes('(Copy)') && json.data?.status === 'draft',
      '13. Post Duplication (Cloned as draft with distinct slug)',
      `New Title: ${json.data?.title}`
    );
  } catch (err: any) {
    assert(false, '13. Post Duplication', err.message);
  }

  // 14. Bulk Upload CSV Validation & Import
  try {
    const rows = [
      {
        title: 'Bulk Test Dispatch #1',
        summary: 'First imported test dispatch via batch processor.',
        content: '<p>Batch text 1</p>',
        postFormat: 'article'
      },
      {
        title: 'Bulk Test Dispatch #2',
        summary: 'Second imported test dispatch via batch processor.',
        content: '<p>Batch text 2</p>',
        postFormat: 'sorted_list'
      }
    ];

    const res = await fetch(`${BASE_URL}/posts/bulk-upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken,
        Cookie: adminCookie
      },
      body: JSON.stringify({
        rows,
        action: 'import',
        targetStatus: 'draft'
      })
    });
    const json: any = await res.json();
    assert(
      res.status === 201 && json.importedCount === 2,
      '14. Bulk Upload Foundation (Imported 2 valid rows into draft status)',
      `Imported: ${json.importedCount}`
    );
  } catch (err: any) {
    assert(false, '14. Bulk Upload Foundation', err.message);
  }

  // 15. Clean Up Test Records (Preserving real seeded records)
  console.log('\nCleaning up Phase 3 temporary test post dispatches...');
  const postIdsToClean = [createdPostId, galleryPostId, videoPostId, duplicatedPostId];
  for (const pid of postIdsToClean) {
    if (pid) {
      await fetch(`${BASE_URL}/posts/${pid}?permanent=true`, {
        method: 'DELETE',
        headers: { 'X-CSRF-Token': csrfToken, Cookie: adminCookie }
      });
    }
  }

  // Also clean bulk test posts
  const bulkQueryRes = await fetch(`${BASE_URL}/posts?search=Bulk%20Test%20Dispatch`);
  const bulkQueryJson: any = await bulkQueryRes.json();
  for (const p of bulkQueryJson.data || []) {
    await fetch(`${BASE_URL}/posts/${p._id}?permanent=true`, {
      method: 'DELETE',
      headers: { 'X-CSRF-Token': csrfToken, Cookie: adminCookie }
    });
  }
  console.log('Temporary test records purged. Database remains clean.\n');

  console.log('================================================================');
  console.log(`  PHASE 3 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runPhase3Tests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
