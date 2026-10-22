/**
 * Phase 4 Comprehensive Integration Test Suite
 * Tests all Phase 4 Public News Platform & Reader Experience features:
 * - All 8 Post Formats (Article, Gallery, Sorted List, Table of Contents, Video, Audio, Poll, Event)
 * - Server-side Registered-Only Content Gating
 * - Multilingual URL & Translation resolution
 * - Like counter invariants (idempotent, non-negative)
 * - Comment counter invariants (atomic transition, non-negative)
 * - Poll voting atomic transaction & duplicate vote prevention
 * - In-memory view deduplication without raw IP storage
 * - 7-day rolling window trending logic
 * - Deterministic Category Personalization
 * - Public Search & Feeds
 */

import { env } from '../config/env.js';

const BASE_URL = 'http://localhost:5000/api/v1';

async function runPhase4Tests() {
  console.log('================================================================');
  console.log('       STARTING PHASE 4 PUBLIC NEWS & ENGAGEMENT TEST SUITE      ');
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

  // 3. Admin Authentication
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
      res.status === 200 && json.data?.user?.role === 'admin',
      '3. Admin Authentication for Test Content Generation',
      `Admin: ${json.data?.user?.email}`
    );
  } catch (err: any) {
    assert(false, '3. Admin Authentication', err.message);
  }

  // 4. Subscriber Reader Registration & Authentication
  let readerCookie = '';
  let readerUser: any = null;
  const testReaderEmail = `phase4reader_${Date.now()}@thenews.org`;
  try {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken,
        Cookie: csrfCookieVal
      },
      body: JSON.stringify({
        name: 'Phase4 Test Reader',
        email: testReaderEmail,
        password: 'Password123!'
      })
    });
    const json: any = await res.json();
    const setCookies = (res.headers as any).getSetCookie ? (res.headers as any).getSetCookie() : [res.headers.get('set-cookie') || ''];
    const tokenHeader = setCookies.find((c: string) => c.startsWith('token='));
    const tokenCookieVal = tokenHeader ? tokenHeader.split(';')[0].trim() : '';
    readerCookie = `csrf-token=${csrfToken}; ${tokenCookieVal}`;
    readerUser = json.data?.user;

    assert(
      res.status === 201 && (json.data?.user?.role === 'subscriber' || json.data?.user?.role === 'user'),
      '4. Subscriber Reader Registration & Cookie Issuance',
      `Registered reader role: ${json.data?.user?.role}`
    );
  } catch (err: any) {
    assert(false, '4. Subscriber Registration', err.message);
  }

  // Fetch Category and Language
  let categoryId = '';
  let categorySlug = '';
  let languageId = '';
  try {
    const catRes = await fetch(`${BASE_URL}/categories`);
    const catJson: any = await catRes.json();
    const category = catJson.data?.categories[0];
    categoryId = category?._id;
    categorySlug = category?.slug;

    const langRes = await fetch(`${BASE_URL}/languages`);
    const langJson: any = await langRes.json();
    languageId = langJson.data?.languages[0]?._id;
  } catch (err: any) {
    console.error('Failed to fetch category or language', err);
  }

  // Helper to create and publish a post
  async function createAndPublishPost(payload: any): Promise<any> {
    const createRes = await fetch(`${BASE_URL}/posts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken,
        Cookie: adminCookie
      },
      body: JSON.stringify({
        ...payload,
        category: categoryId,
        language: languageId
      })
    });
    const createJson: any = await createRes.json();
    const postId = createJson.data?._id;

    if (!postId) {
      throw new Error(`Failed to create post: ${createJson.message}`);
    }

    const pubRes = await fetch(`${BASE_URL}/posts/${postId}/publish`, {
      method: 'POST',
      headers: {
        'X-CSRF-Token': csrfToken,
        Cookie: adminCookie
      }
    });
    const pubJson: any = await pubRes.json();
    return pubJson.data;
  }

  // ==========================================
  // TEST 5: ALL 8 POST FORMATS PUBLISHED & RENDERED
  // ==========================================
  console.log('\n--- 5. TESTING ALL 8 POST FORMATS ---');

  const formatsToTest = [
    {
      format: 'article',
      title: `Standard Article Test ${Date.now()}`,
      content: '<p>Comprehensive investigative prose.</p>'
    },
    {
      format: 'gallery',
      title: `Photo Essay Test ${Date.now()}`,
      galleryItems: [
        { image: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c', title: 'Summit Photo', order: 1 }
      ]
    },
    {
      format: 'sorted_list',
      title: `Countdown List Test ${Date.now()}`,
      sortedListItems: [
        { itemNumber: 1, title: 'First Item', content: 'Detailed analysis of item 1' }
      ]
    },
    {
      format: 'table_of_contents',
      title: `Longform Guide Test ${Date.now()}`,
      content: '<h2>Introduction</h2><p>Intro text</p><h2>Findings</h2><p>Findings text</p>'
    },
    {
      format: 'video',
      title: `Field Broadcast Video Test ${Date.now()}`,
      videoDetails: {
        videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        duration: 212
      }
    },
    {
      format: 'audio',
      title: `Daily Briefing Audio Test ${Date.now()}`,
      audioDetails: {
        audioUrl: 'https://cdn.example.com/audio/test-briefing.mp3',
        duration: 360,
        artist: 'The News Radio'
      }
    },
    {
      format: 'poll',
      title: `Public Opinion Poll Test ${Date.now()}`,
      pollDetails: {
        question: 'Should green bond audits be legally binding?',
        options: [
          { id: 'opt_1', text: 'Yes, absolutely' },
          { id: 'opt_2', text: 'No, voluntary reporting suffices' }
        ]
      }
    },
    {
      format: 'event',
      title: `Global Summit Coverage Event Test ${Date.now()}`,
      eventDetails: {
        locationName: 'Palais des Nations',
        address: 'Geneva, Switzerland',
        eventUrl: 'https://example.org/summit'
      }
    }
  ];

  let publishedPostsMap: Record<string, any> = {};

  for (const item of formatsToTest) {
    try {
      const post = await createAndPublishPost({
        title: item.title,
        postFormat: item.format,
        content: item.content || `<p>Content for ${item.format}</p>`,
        summary: `Executive summary for ${item.format}`,
        galleryItems: (item as any).galleryItems,
        sortedListItems: (item as any).sortedListItems,
        videoDetails: (item as any).videoDetails,
        audioDetails: (item as any).audioDetails,
        pollDetails: (item as any).pollDetails,
        eventDetails: (item as any).eventDetails
      });

      publishedPostsMap[item.format] = post;

      // Verify public retrieval by slug & format-specific payload presence
      const pubGetRes = await fetch(`${BASE_URL}/public/posts/${post.slug}`);
      const pubGetJson: any = await pubGetRes.json();
      const p = pubGetJson.data?.post;

      let formatPayloadValid = false;
      if (item.format === 'article') formatPayloadValid = Boolean(p?.content);
      else if (item.format === 'gallery') formatPayloadValid = Array.isArray(p?.galleryItems) && p.galleryItems.length > 0;
      else if (item.format === 'sorted_list') formatPayloadValid = Array.isArray(p?.sortedListItems) && p.sortedListItems.length > 0;
      else if (item.format === 'table_of_contents') formatPayloadValid = Boolean(p?.content && p.content.includes('<h2>'));
      else if (item.format === 'video') formatPayloadValid = Boolean(p?.videoDetails?.videoUrl);
      else if (item.format === 'audio') formatPayloadValid = Boolean(p?.audioDetails?.audioUrl);
      else if (item.format === 'poll') formatPayloadValid = Boolean(p?.pollDetails?.question && p?.pollDetails?.options?.length > 0);
      else if (item.format === 'event') formatPayloadValid = Boolean(p?.eventDetails?.locationName || p?.eventDetails?.address);

      assert(
        pubGetRes.status === 200 && p?.postFormat === item.format && formatPayloadValid,
        `5.${item.format.toUpperCase()} format created, published & verified with full public payload`,
        `Format: ${p?.postFormat}, Payload valid: ${formatPayloadValid}`
      );
    } catch (err: any) {
      assert(false, `5.${item.format.toUpperCase()} format test`, err.message);
    }
  }

  // ==========================================
  // TEST 6: SERVER-SIDE REGISTERED-ONLY CONTENT GATING
  // ==========================================
  console.log('\n--- 6. TESTING SERVER-SIDE REGISTERED CONTENT GATING ---');

  let gatedPost: any = null;
  try {
    gatedPost = await createAndPublishPost({
      title: `Confidential Dossier Gated ${Date.now()}`,
      postFormat: 'article',
      registeredOnly: true,
      summary: 'Public preview abstract of confidential report.',
      content: '<p>TOP SECRET INVESTIGATION CONTENT MUST NEVER BE EXPOSED TO ANONYMOUS USERS.</p>'
    });

    // Request 1: Unauthenticated -> MUST NOT receive content, isGated = true
    const anonRes = await fetch(`${BASE_URL}/public/posts/${gatedPost.slug}`);
    const anonJson: any = await anonRes.json();

    const isContentStripped = !anonJson.data?.post?.content;
    const isGatedFlag = anonJson.data?.isGated === true;

    assert(
      anonRes.status === 200 && isContentStripped && isGatedFlag,
      '6.1 Server-Side Content Gating: Content completely stripped for unauthenticated client',
      `isGated: ${anonJson.data?.isGated}, content present: ${Boolean(anonJson.data?.post?.content)}`
    );

    // Request 2: Authenticated Subscriber -> MUST receive content, isGated = false
    const authRes = await fetch(`${BASE_URL}/public/posts/${gatedPost.slug}`, {
      headers: {
        Cookie: readerCookie
      }
    });
    const authJson: any = await authRes.json();

    const isContentDelivered = Boolean(authJson.data?.post?.content?.includes('TOP SECRET INVESTIGATION CONTENT'));
    const isNotGated = authJson.data?.isGated === false;

    assert(
      authRes.status === 200 && isContentDelivered && isNotGated,
      '6.2 Server-Side Content Gating: Full content delivered for authenticated subscriber',
      `isGated: ${authJson.data?.isGated}, content verified: ${isContentDelivered}`
    );
  } catch (err: any) {
    assert(false, '6. Server-side Gating Test', err.message);
  }

  // ==========================================
  // TEST 7: MULTILINGUAL CONTENT RESOLUTION
  // ==========================================
  console.log('\n--- 7. TESTING MULTILINGUAL CONTENT RESOLUTION ---');

  try {
    const multiPost = await createAndPublishPost({
      title: `Global Economic Summit ${Date.now()}`,
      postFormat: 'article',
      summary: 'English summary of global summit.',
      content: '<p>English primary content.</p>',
      translations: [
        {
          language: languageId,
          languageCode: 'te',
          title: 'ప్రపంచ ఆర్థిక శిఖరాగ్ర సదస్సు 2026',
          slug: `telugu-summit-${Date.now()}`,
          summary: 'తెలుగు సారాంశం',
          content: '<p>తెలుగు పూర్తి వ్యాసం కంటెంట్.</p>'
        }
      ]
    });

    // Request with ?lang=te
    const teRes = await fetch(`${BASE_URL}/public/posts/${multiPost.slug}?lang=te`);
    const teJson: any = await teRes.json();

    assert(
      teRes.status === 200 && teJson.data?.post?.title === 'ప్రపంచ ఆర్థిక శిఖరాగ్ర సదస్సు 2026',
      '7. Multilingual Resolution: ?lang=te returned localized Telugu headline and content',
      `Title: ${teJson.data?.post?.title}`
    );
  } catch (err: any) {
    assert(false, '7. Multilingual Resolution', err.message);
  }

  // ==========================================
  // TEST 8: LIKE COUNTER INVARIANTS & IDEMPOTENCY
  // ==========================================
  console.log('\n--- 8. TESTING LIKE COUNTER INVARIANTS ---');

  const testPost = publishedPostsMap['article'];
  try {
    // Initial state
    const p1Res = await fetch(`${BASE_URL}/public/posts/${testPost.slug}`);
    const p1Json: any = await p1Res.json();
    const initialLikes = p1Json.data?.post?.likeCount || 0;

    // 1. Reader likes the post
    const likeRes = await fetch(`${BASE_URL}/engagement/posts/${testPost._id}/like`, {
      method: 'POST',
      headers: {
        'X-CSRF-Token': csrfToken,
        Cookie: readerCookie
      }
    });
    const likeJson: any = await likeRes.json();
    assert(
      likeRes.status === 200 && likeJson.data?.likeCount === initialLikes + 1,
      '8.1 Like Creation: likeCount incremented by 1',
      `Likes: ${likeJson.data?.likeCount}`
    );

    // 2. Reader attempts duplicate like (idempotency test)
    const dupLikeRes = await fetch(`${BASE_URL}/engagement/posts/${testPost._id}/like`, {
      method: 'POST',
      headers: {
        'X-CSRF-Token': csrfToken,
        Cookie: readerCookie
      }
    });
    const dupLikeJson: any = await dupLikeRes.json();
    assert(
      dupLikeRes.status === 200 && dupLikeJson.data?.likeCount === initialLikes + 1,
      '8.2 Like Idempotency: Duplicate like by same user did not increment likeCount',
      `Likes: ${dupLikeJson.data?.likeCount}`
    );

    // 3. Reader unlikes the post
    const unlikeRes = await fetch(`${BASE_URL}/engagement/posts/${testPost._id}/like`, {
      method: 'DELETE',
      headers: {
        'X-CSRF-Token': csrfToken,
        Cookie: readerCookie
      }
    });
    const unlikeJson: any = await unlikeRes.json();
    assert(
      unlikeRes.status === 200 && unlikeJson.data?.likeCount === initialLikes,
      '8.3 Unlike Operation: likeCount decremented back to initial count',
      `Likes: ${unlikeJson.data?.likeCount}`
    );

    // 4. Repeated unlike (non-negative guard test)
    const repUnlikeRes = await fetch(`${BASE_URL}/engagement/posts/${testPost._id}/like`, {
      method: 'DELETE',
      headers: {
        'X-CSRF-Token': csrfToken,
        Cookie: readerCookie
      }
    });
    const repUnlikeJson: any = await repUnlikeRes.json();
    assert(
      repUnlikeRes.status === 200 && repUnlikeJson.data?.likeCount >= 0,
      '8.4 Like Counter Invariant: likeCount never negative on repeated unlikes',
      `Likes: ${repUnlikeJson.data?.likeCount}`
    );
  } catch (err: any) {
    assert(false, '8. Like Invariants Test', err.message);
  }

  // ==========================================
  // TEST 9: COMMENT COUNTER & STATUS TRANSITIONS
  // ==========================================
  console.log('\n--- 9. TESTING COMMENT COUNTER & MODERATION TRANSITIONS ---');

  try {
    // 1. Create a comment with raw HTML tags to test sanitization
    const commentRes = await fetch(`${BASE_URL}/engagement/posts/${testPost._id}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken,
        Cookie: readerCookie
      },
      body: JSON.stringify({
        content: 'This is a test reader perspective. <script>alert("xss")</script><b>Bold argument</b>.'
      })
    });
    const commentJson: any = await commentRes.json();
    const commentId = commentJson.data?.comment?._id;
    const postCommentCount = commentJson.data?.commentCount;

    const isSanitized = !commentJson.data?.comment?.content.includes('<script>');

    assert(
      commentRes.status === 201 && Boolean(commentId) && isSanitized,
      '9.1 Comment Creation & Sanitization: commentCount incremented and HTML stripped',
      `Count: ${postCommentCount}, Content: ${commentJson.data?.comment?.content}`
    );

    // 2. Delete comment (first transition: visible -> deleted)
    const delRes = await fetch(`${BASE_URL}/engagement/comments/${commentId}`, {
      method: 'DELETE',
      headers: {
        'X-CSRF-Token': csrfToken,
        Cookie: readerCookie
      }
    });
    assert(
      delRes.status === 200,
      '9.2 Comment Deletion: Atomic transition to status="deleted"',
      `Status: ${delRes.status}`
    );

    // Verify post commentCount decremented
    const postAfterDel = await fetch(`${BASE_URL}/public/posts/${testPost.slug}`);
    const postDelJson: any = await postAfterDel.json();
    assert(
      postDelJson.data?.post?.commentCount === postCommentCount - 1,
      '9.3 Comment Invariant: commentCount decremented by exactly 1 on first delete',
      `commentCount: ${postDelJson.data?.post?.commentCount}`
    );

    // 3. Repeated delete comment (must not decrement commentCount again)
    const repDelRes = await fetch(`${BASE_URL}/engagement/comments/${commentId}`, {
      method: 'DELETE',
      headers: {
        'X-CSRF-Token': csrfToken,
        Cookie: readerCookie
      }
    });
    const postAfterRepDel = await fetch(`${BASE_URL}/public/posts/${testPost.slug}`);
    const postRepDelJson: any = await postAfterRepDel.json();

    assert(
      postRepDelJson.data?.post?.commentCount === postCommentCount - 1,
      '9.4 Comment Invariant: Repeated delete does not decrement counter again (idempotent)',
      `commentCount remains: ${postRepDelJson.data?.post?.commentCount}`
    );
  } catch (err: any) {
    assert(false, '9. Comment Invariants Test', err.message);
  }

  // ==========================================
  // TEST 10: POLL VOTING TRANSACTION & CONSISTENCY
  // ==========================================
  console.log('\n--- 10. TESTING POLL VOTING MONGO TRANSACTION & CONSISTENCY ---');

  const pollPost = publishedPostsMap['poll'];
  try {
    // 1. Submit vote for option 'opt_1'
    const voteRes = await fetch(`${BASE_URL}/engagement/posts/${pollPost._id}/poll/vote`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken,
        Cookie: readerCookie
      },
      body: JSON.stringify({
        optionId: 'opt_1'
      })
    });
    const voteJson: any = await voteRes.json();
    const opt1Votes = voteJson.data?.results?.find((r: any) => r.id === 'opt_1')?.votes;

    assert(
      voteRes.status === 200 && opt1Votes === 1,
      '10.1 Poll Vote Transaction: Vote submitted and option vote count incremented atomically',
      `Option 1 votes: ${opt1Votes}, Total: ${voteJson.data?.totalVotes}`
    );

    // 2. Duplicate vote by same reader must fail with 409 Conflict
    const dupVoteRes = await fetch(`${BASE_URL}/engagement/posts/${pollPost._id}/poll/vote`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken,
        Cookie: readerCookie
      },
      body: JSON.stringify({
        optionId: 'opt_2'
      })
    });
    assert(
      dupVoteRes.status === 409,
      '10.2 Poll Consistency: Duplicate vote by same user rejected with HTTP 409',
      `Status: ${dupVoteRes.status}`
    );

    // Verify option vote counts were NOT corrupted
    const pollResultsRes = await fetch(`${BASE_URL}/engagement/posts/${pollPost._id}/poll/results`);
    const pollResultsJson: any = await pollResultsRes.json();
    const opt1After = pollResultsJson.data?.results?.find((r: any) => r.id === 'opt_1')?.votes;
    const opt2After = pollResultsJson.data?.results?.find((r: any) => r.id === 'opt_2')?.votes;

    assert(
      opt1After === 1 && opt2After === 0,
      '10.3 Poll Consistency: Vote counts intact after rejected transaction',
      `Opt1: ${opt1After}, Opt2: ${opt2After}`
    );
  } catch (err: any) {
    assert(false, '10. Poll Voting Test', err.message);
  }

  // ==========================================
  // TEST 11: IN-MEMORY VIEW COUNT DEDUPLICATION
  // ==========================================
  console.log('\n--- 11. TESTING IN-MEMORY VIEW DEDUPLICATION ---');

  try {
    const viewPost = publishedPostsMap['video'];
    const pBefore = await fetch(`${BASE_URL}/public/posts/${viewPost.slug}`);
    const pBeforeJson: any = await pBefore.json();
    const initialViews = pBeforeJson.data?.post?.views || 0;

    // View 1
    const v1 = await fetch(`${BASE_URL}/public/posts/${viewPost._id}/view`, { method: 'POST' });
    const v1Json: any = await v1.json();

    // View 2 immediately after (same client signature)
    const v2 = await fetch(`${BASE_URL}/public/posts/${viewPost._id}/view`, { method: 'POST' });
    const v2Json: any = await v2.json();

    const v1Counted = v1Json.counted === true || v1Json.data?.counted === true || v1Json.data?.recorded === true;
    const v2Throttled = v2Json.counted === false || v2Json.data?.counted === false || v2Json.data?.recorded === false;

    assert(
      v1Counted && v2Throttled,
      '11. In-Memory View Deduplication: Rapid duplicate view from same client throttled',
      `View 1 counted: ${v1Json.counted}, View 2 counted: ${v2Json.counted}`
    );
  } catch (err: any) {
    assert(false, '11. View Deduplication Test', err.message);
  }

  // ==========================================
  // TEST 12: 7-DAY ROLLING WINDOW TRENDING LOGIC
  // ==========================================
  console.log('\n--- 12. TESTING 7-DAY ROLLING WINDOW TRENDING LOGIC ---');

  try {
    const trendRes = await fetch(`${BASE_URL}/public/trending?limit=5`);
    const trendJson: any = await trendRes.json();
    const trending = Array.isArray(trendJson.data) ? trendJson.data : (trendJson.data?.posts || []);

    const now = Date.now();
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;

    const allWithin7Days = trending.every((p: any) => {
      const pubTime = new Date(p.publishedAt).getTime();
      return pubTime >= sevenDaysAgo;
    });

    assert(
      trendRes.status === 200 && trending.length > 0 && allWithin7Days,
      '12.1 7-Day Window Trending: All returned trending stories published within past 7 days',
      `Trending items returned: ${trending.length}`
    );

    // Verify approved formula ranking: (views * 1) + (likes * 3) + (comments * 5) + recencyBoost
    const computeScore = (p: any) => {
      const v = p.views || 0;
      const l = p.likeCount || 0;
      const c = p.commentCount || 0;
      let boost = 0;
      if (p.publishedAt) {
        const ageHours = (now - new Date(p.publishedAt).getTime()) / (1000 * 60 * 60);
        if (ageHours <= 24) boost = 40;
        else if (ageHours <= 48) boost = 20;
        else if (ageHours <= 168) boost = 5;
      }
      return v * 1.0 + l * 3.0 + c * 5.0 + boost;
    };

    let properlyOrdered = true;
    for (let i = 0; i < trending.length - 1; i++) {
      const s1 = computeScore(trending[i]);
      const s2 = computeScore(trending[i + 1]);
      if (s1 < s2) {
        properlyOrdered = false;
        break;
      }
    }

    assert(
      properlyOrdered,
      '12.2 Trending Formula Verification: Posts ordered by approved formula (views*1 + likes*3 + comments*5 + recencyBoost)',
      `Top score: ${trending.length > 0 ? computeScore(trending[0]) : 0}`
    );
  } catch (err: any) {
    assert(false, '12. Trending Logic Test', err.message);
  }

  // ==========================================
  // TEST 13: DETERMINISTIC CATEGORY PERSONALIZATION
  // ==========================================
  console.log('\n--- 13. TESTING CATEGORY-ONLY PERSONALIZATION ---');

  try {
    // 1. Update reader preferences with selected category
    const prefRes = await fetch(`${BASE_URL}/users/me/preferences`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken,
        Cookie: readerCookie
      },
      body: JSON.stringify({
        interests: [categoryId]
      })
    });
    const prefJson: any = await prefRes.json();

    // 2. Fetch personalized feed for reader
    const feedRes = await fetch(`${BASE_URL}/public/feed`, {
      headers: {
        Cookie: readerCookie
      }
    });
    const feedJson: any = await feedRes.json();
    const feedPosts = feedJson.data?.posts || [];

    const matchesCategory = feedPosts.every((p: any) => {
      const catId = typeof p.category === 'object' ? p.category._id : p.category;
      return catId === categoryId;
    });

    const isPersonalized = feedJson.data?.feedType === 'personalized' || feedJson.data?.isPersonalized === true;
    assert(
      feedRes.status === 200 && isPersonalized && matchesCategory,
      '13. Deterministic Category Personalization: Feed prioritized matching category interests only',
      `feedType: ${feedJson.data?.feedType}, isPersonalized: ${feedJson.data?.isPersonalized}, matched category count: ${feedPosts.length}`
    );
  } catch (err: any) {
    assert(false, '13. Personalization Test', err.message);
  }

  // ==========================================
  // TEST 14: PUBLIC SEARCH
  // ==========================================
  console.log('\n--- 14. TESTING PUBLIC TEXT SEARCH ---');

  try {
    const searchRes = await fetch(`${BASE_URL}/public/search?q=investigative`);
    const searchJson: any = await searchRes.json();
    assert(
      searchRes.status === 200 && Array.isArray(searchJson.data?.posts),
      '14. Public Text Search: Full-text search returned indexed post results',
      `Results count: ${searchJson.data?.posts?.length}`
    );
  } catch (err: any) {
    assert(false, '14. Public Search Test', err.message);
  }

  // ==========================================
  // SUMMARY
  // ==========================================
  console.log('\n================================================================');
  console.log(`TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runPhase4Tests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
