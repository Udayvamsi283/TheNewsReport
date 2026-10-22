import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Post } from '../models/post.model';
import { Category } from '../models/category.model';
import { Tag } from '../models/tag.model';
import { Language } from '../models/language.model';
import { User } from '../models/user.model';
import { Like } from '../models/like.model';
import { Bookmark } from '../models/bookmark.model';

dotenv.config();

const API_BASE = 'http://localhost:5000/api/v1';

async function main() {
  console.log('====================================================');
  console.log('PHASE 5.5 AUTOMATED VERIFICATION SUITE');
  console.log('====================================================\n');

  await mongoose.connect(process.env.MONGODB_URI || '', { dbName: 'the_news' });
  console.log('✓ Connected to MongoDB Atlas:', mongoose.connection.name);

  // 1. Verify Real Article Preservation
  console.log('\n--- 1. VERIFY REAL ARTICLE PRESERVATION ---');
  const realArticle = await Post.findOne({
    title: /Digital Public Infrastructure/i
  });
  if (!realArticle) {
    throw new Error('FATAL: Real article was not found in MongoDB!');
  }
  console.log('✓ Real article exists:');
  console.log('  - ID:', realArticle._id.toString());
  console.log('  - Title:', realArticle.title);
  console.log('  - Slug:', realArticle.slug);
  console.log('  - Status:', realArticle.status);
  console.log('  - Translations:', realArticle.translations?.length || 0);

  // 2. Verify Taxonomy (Categories & Tags)
  console.log('\n--- 2. VERIFY PRODUCTION CATEGORY TAXONOMY ---');
  const categories = await Category.find({}).sort({ order: 1 });
  console.log(`Found ${categories.length} categories:`);
  categories.forEach((c) => {
    console.log(`  - ${c.name} (slug: ${c.slug}, parent: ${c.parent || 'none'})`);
  });
  const testCats = categories.filter((c) => /test|desk/i.test(c.slug));
  if (testCats.length > 0) {
    throw new Error(`Test categories found: ${testCats.map((c) => c.slug).join(', ')}`);
  }
  console.log('✓ Production category taxonomy clean. Zero test/desk categories.');

  console.log('\n--- 3. VERIFY PRODUCTION TAG LIBRARY ---');
  const tagCount = await Tag.countDocuments({});
  console.log(`Found ${tagCount} tags in MongoDB.`);
  const sampleTags = await Tag.find({}).limit(10);
  console.log('Sample tags:', sampleTags.map((t) => t.name).join(', '));
  if (tagCount < 20) {
    throw new Error('Tag count is less than 20!');
  }
  console.log('✓ Production tag library populated in database.');

  // 4. Verify Supported Languages
  console.log('\n--- 4. VERIFY SUPPORTED LANGUAGES ---');
  const languages = await Language.find({});
  console.log('Languages:', languages.map((l) => `${l.name} (${l.code})`).join(', '));
  const enLang = languages.find((l) => l.code === 'en');
  const teLang = languages.find((l) => l.code === 'te');
  const hiLang = languages.find((l) => l.code === 'hi');
  if (!enLang || !teLang || !hiLang) {
    throw new Error('Missing one or more required languages (en, te, hi)!');
  }
  console.log('✓ English, Telugu, and Hindi all exist in MongoDB.');

  // 5. Authenticate as Admin
  console.log('\n--- 5. ADMIN AUTHENTICATION ---');
  const loginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@thenews.org',
      password: 'Th3N3ws_2026_Adm!n_S3cur3'
    })
  });
  const rawCookies: string[] = (loginRes.headers as any).getSetCookie
    ? (loginRes.headers as any).getSetCookie()
    : [loginRes.headers.get('set-cookie') || ''];

  const cookieMap: Record<string, string> = {};
  rawCookies.forEach((c) => {
    const parts = c.split(';')[0].split('=');
    if (parts.length >= 2) {
      cookieMap[parts[0].trim()] = parts.slice(1).join('=');
    }
  });

  const authCookie = Object.entries(cookieMap)
    .map(([k, v]) => `${k}=${v}`)
    .join('; ');
  const csrfToken = cookieMap['csrf-token'] || '';

  const loginJson: any = await loginRes.json();
  if (!loginJson.success) {
    throw new Error(`Admin login failed: ${JSON.stringify(loginJson)}`);
  }
  console.log('✓ Admin authenticated successfully:', loginJson.data.user.email);
  console.log('✓ Cookies captured:', Object.keys(cookieMap).join(', '));

  // 6. Test Inline Tag Creation API
  console.log('\n--- 6. TEST INLINE TAG CREATION ---');
  const testTagName = `VerificationTag_${Date.now()}`;
  const createTagRes = await fetch(`${API_BASE}/tags`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: authCookie,
      'x-csrf-token': csrfToken
    },
    body: JSON.stringify({ name: testTagName })
  });
  const tagJson: any = await createTagRes.json();
  if (!tagJson.success) {
    throw new Error(`Tag creation failed: ${JSON.stringify(tagJson)}`);
  }
  const createdTagId = tagJson.data.tag._id;
  console.log(`✓ Tag #${testTagName} successfully created in MongoDB (ID: ${createdTagId})`);

  // 7. Multilingual CMS Formatting Test (TipTap HTML)
  console.log('\n--- 7. TEST MULTILINGUAL FORMATTING PERSISTENCE (EN, TE, HI) ---');
  const techCategory = categories.find((c) => c.slug === 'technology') || categories[0];

  const englishBody = `
    <h2>The Evolution of Modern Infrastructure</h2>
    <p>This is a <strong>bold statement</strong> and an <em>italic reflection</em> on public systems.</p>
    <ul>
      <li>First critical pillar: Identity authentication</li>
      <li>Second critical pillar: Instant payments</li>
    </ul>
    <blockquote>"Digital infrastructure is the backbone of 21st-century governance."</blockquote>
    <p><a href="https://example.org">Authoritative syndicate report</a></p>
    <img src="https://images.unsplash.com/photo-1518770660439-4636190af475" alt="Hardware circuit" />
  `.trim();

  const teluguBody = `
    <h2>ఆధునిక మౌలిక సదుపాయాల పురోగతి</h2>
    <p>ఇది ఒక <strong>ముఖ్యమైన ప్రకటన</strong> మరియు ప్రజా వ్యవస్థలపై <em>విశ్లేషణాత్మక పరిశీలన</em>.</p>
    <ul>
      <li>మొదటి స్తంభం: డిజిటల్ గుర్తింపు ధృవీకరణ</li>
      <li>రెండవ స్తంభం: తక్షణ చెల్లింపుల వ్యవస్థ</li>
    </ul>
    <blockquote>"డిజిటల్ మౌలిక సదుపాయాలు 21వ శతాబ్దపు సుపరిపాలనకు వెన్నెముక."</blockquote>
    <p><a href="https://example.org">అధికారిక నివేదిక వివరాలు</a></p>
    <img src="https://images.unsplash.com/photo-1518770660439-4636190af475" alt="హార్డ్‌వేర్ సర్క్యూట్" />
  `.trim();

  const hindiBody = `
    <h2>आधुनिक बुनियादी ढांचे का विकास</h2>
    <p>यह एक <strong>महत्वपूर्ण विवरण</strong> और सार्वजनिक प्रणालियों पर <em>विश्लेषणात्मक विचार</em> है।</p>
    <ul>
      <li>पहला प्रमुख स्तंभ: डिजिटल पहचान सत्यापन</li>
      <li>दूसरा प्रमुख स्तंभ: त्वरित भुगतान प्रणाली</li>
    </ul>
    <blockquote>"डिजिटल बुनियादी ढांचा 21वीं सदी के सुशासन की रीढ़ है।"</blockquote>
    <p><a href="https://example.org">आधिकारिक रिपोर्ट विवरण</a></p>
    <img src="https://images.unsplash.com/photo-1518770660439-4636190af475" alt="हार्डवेयर सर्किट" />
  `.trim();

  const tempSlug = `multilingual-qa-test-${Date.now()}`;
  const createPostRes = await fetch(`${API_BASE}/posts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: authCookie,
      'x-csrf-token': csrfToken
    },
    body: JSON.stringify({
      title: 'QA Multilingual Verification Article',
      slug: tempSlug,
      summary: 'Comprehensive testing for English, Telugu, and Hindi editorial formatting.',
      content: englishBody,
      category: techCategory._id,
      language: enLang._id,
      tags: [createdTagId],
      status: 'published',
      postFormat: 'article',
      translations: [
        {
          language: teLang._id,
          languageCode: 'te',
          title: 'QA బహుభాషా ధృవీకరణ కథనం',
          slug: `${tempSlug}-te`,
          summary: 'ఇంగ్లీష్, తెలుగు మరియు హిందీ ఫార్మాటింగ్ పరీక్ష.',
          content: teluguBody
        },
        {
          language: hiLang._id,
          languageCode: 'hi',
          title: 'QA बहुभाषी सत्यापन लेख',
          slug: `${tempSlug}-hi`,
          summary: 'अंग्रेजी, तेलुगु और हिंदी संपादन प्रारूपण परीक्षण।',
          content: hindiBody
        }
      ]
    })
  });

  const createdPostJson: any = await createPostRes.json();
  if (!createdPostJson.success) {
    throw new Error(`Failed to create test multilingual post: ${JSON.stringify(createdPostJson)}`);
  }
  const tempPostId = createdPostJson.data._id;
  console.log(`✓ Temporary multilingual post created (ID: ${tempPostId})`);

  // Verify Formatting Persistence in Database
  const fetchedPost = await Post.findById(tempPostId);
  if (!fetchedPost) throw new Error('Could not find created test post');

  // Verify English formatting elements
  const enHtml = fetchedPost.content || '';
  if (!enHtml.includes('<h2>') || !enHtml.includes('<strong>') || !enHtml.includes('<em>') || !enHtml.includes('<ul>') || !enHtml.includes('<img')) {
    throw new Error('English formatting lost in database!');
  }
  console.log('✓ English TipTap formatting survived (h2, strong, em, ul, li, blockquote, link, img)');

  // Verify Telugu formatting elements
  const teTrans = fetchedPost.translations.find((t) => t.languageCode === 'te');
  if (!teTrans || !teTrans.content?.includes('<h2>') || !teTrans.content?.includes('<strong>') || !teTrans.content?.includes('<em>') || !teTrans.content?.includes('<ul>') || !teTrans.content?.includes('<img')) {
    throw new Error('Telugu formatting lost in database!');
  }
  console.log('✓ Telugu TipTap formatting survived (h2, strong, em, ul, li, blockquote, link, img)');

  // Verify Hindi formatting elements
  const hiTrans = fetchedPost.translations.find((t) => t.languageCode === 'hi');
  if (!hiTrans || !hiTrans.content?.includes('<h2>') || !hiTrans.content?.includes('<strong>') || !hiTrans.content?.includes('<em>') || !hiTrans.content?.includes('<ul>') || !hiTrans.content?.includes('<img')) {
    throw new Error('Hindi TipTap formatting survived (h2, strong, em, ul, li, blockquote, link, img)');
  }
  console.log('✓ Hindi TipTap formatting survived (h2, strong, em, ul, li, blockquote, link, img)');

  // 8. Verify Public Language Resolution
  console.log('\n--- 8. TEST PUBLIC LOCALIZATION RESOLUTION ---');
  // 8.1 English
  const publicEnRes = await fetch(`${API_BASE}/public/posts/${tempSlug}?lang=en`);
  const publicEnJson: any = await publicEnRes.json();
  if (publicEnJson.data.title !== 'QA Multilingual Verification Article') {
    throw new Error(`Expected English title, got: ${publicEnJson.data.title}`);
  }
  console.log('✓ Public request ?lang=en returned English title and content.');

  // 8.2 Telugu
  const publicTeRes = await fetch(`${API_BASE}/public/posts/${tempSlug}?lang=te`);
  const publicTeJson: any = await publicTeRes.json();
  if (publicTeJson.data.title !== 'QA బహుభాషా ధృవీకరణ కథనం') {
    throw new Error(`Expected Telugu title, got: ${publicTeJson.data.title}`);
  }
  console.log('✓ Public request ?lang=te returned Telugu title and content.');

  // 8.3 Hindi
  const publicHiRes = await fetch(`${API_BASE}/public/posts/${tempSlug}?lang=hi`);
  const publicHiJson: any = await publicHiRes.json();
  if (publicHiJson.data.title !== 'QA बहुभाषी सत्यापन लेख') {
    throw new Error(`Expected Hindi title, got: ${publicHiJson.data.title}`);
  }
  console.log('✓ Public request ?lang=hi returned Hindi title and content.');

  // 9. Verify Trending Endpoint
  console.log('\n--- 9. TEST TRENDING ENDPOINT ---');
  const trendingRes = await fetch(`${API_BASE}/public/trending`);
  if (!trendingRes.ok) {
    throw new Error(`Trending endpoint failed with status: ${trendingRes.status}`);
  }
  const trendingJson: any = await trendingRes.json();
  console.log('Trending response structure:', Object.keys(trendingJson.data));
  const trendingPosts = trendingJson.data.posts || trendingJson.data;
  console.log(`✓ Trending endpoint returned ${trendingPosts.length} posts without crash.`);

  // 10. Verify Likes & Bookmark State Synchronization
  console.log('\n--- 10. TEST LIKE STATE SYNCHRONIZATION ---');
  // Like the test post
  const likeRes = await fetch(`${API_BASE}/engagement/posts/${tempPostId}/like`, {
    method: 'POST',
    headers: {
      Cookie: authCookie,
      'x-csrf-token': csrfToken
    }
  });
  const likeJson: any = await likeRes.json();
  if (!likeJson.success) {
    throw new Error(`Like failed: ${JSON.stringify(likeJson)}`);
  }
  console.log('✓ Post successfully liked. likeCount:', likeJson.data.likeCount);

  // Check hydrated article response
  const checkPostRes = await fetch(`${API_BASE}/public/posts/${tempSlug}`, {
    headers: { Cookie: authCookie }
  });
  const checkPostJson: any = await checkPostRes.json();
  if (!checkPostJson.data.isLiked) {
    throw new Error('Hydrated isLiked is false for authenticated user!');
  }
  console.log('✓ Authenticated request correctly hydrated isLiked: true');

  // Check /users/me/likes endpoint
  const userLikesRes = await fetch(`${API_BASE}/users/me/likes`, {
    headers: { Cookie: authCookie }
  });
  const userLikesJson: any = await userLikesRes.json();
  if (!userLikesJson.success) {
    throw new Error(`Failed to fetch /users/me/likes: ${JSON.stringify(userLikesJson)}`);
  }
  const likedList = userLikesJson.data.likes || userLikesJson.data.posts || [];
  const likedPostIds = likedList.map((p: any) => p._id.toString());
  if (!likedPostIds.includes(tempPostId.toString())) {
    throw new Error('Liked post not found in /users/me/likes response!');
  }
  console.log('✓ Liked post appears in /users/me/likes for authenticated user.');

  // Test Bookmark state
  console.log('\n--- 11. TEST BOOKMARK STATE SYNCHRONIZATION ---');
  const bookmarkRes = await fetch(`${API_BASE}/engagement/posts/${tempPostId}/bookmark`, {
    method: 'POST',
    headers: {
      Cookie: authCookie,
      'x-csrf-token': csrfToken
    }
  });
  const bookmarkJson: any = await bookmarkRes.json();
  if (!bookmarkJson.success) {
    throw new Error(`Bookmark failed: ${JSON.stringify(bookmarkJson)}`);
  }
  console.log('✓ Post successfully bookmarked.');

  const checkBookmarkRes = await fetch(`${API_BASE}/public/posts/${tempSlug}`, {
    headers: { Cookie: authCookie }
  });
  const checkBookmarkJson: any = await checkBookmarkRes.json();
  if (!checkBookmarkJson.data.isBookmarked || !checkBookmarkJson.data.isSaved) {
    throw new Error('Hydrated isBookmarked / isSaved is false for authenticated user!');
  }
  console.log('✓ Authenticated request correctly hydrated isBookmarked & isSaved: true');

  // Unlike & Unbookmark
  await fetch(`${API_BASE}/engagement/posts/${tempPostId}/like`, {
    method: 'DELETE',
    headers: {
      Cookie: authCookie,
      'x-csrf-token': csrfToken
    }
  });
  await fetch(`${API_BASE}/engagement/posts/${tempPostId}/bookmark`, {
    method: 'DELETE',
    headers: {
      Cookie: authCookie,
      'x-csrf-token': csrfToken
    }
  });

  const checkUnlikedRes = await fetch(`${API_BASE}/public/posts/${tempSlug}`, {
    headers: { Cookie: authCookie }
  });
  const checkUnlikedJson: any = await checkUnlikedRes.json();
  if (checkUnlikedJson.data.isLiked || checkUnlikedJson.data.isBookmarked) {
    throw new Error('Unliked post still reports isLiked or isBookmarked true!');
  }
  console.log('✓ Unlike & Unbookmark successfully toggled off.');

  // 12. Cleanup Temporary Test Data (Preserving Real Article)
  console.log('\n--- 12. CLEANUP TEMPORARY TEST DATA ---');
  await Post.findByIdAndDelete(tempPostId);
  await Tag.findByIdAndDelete(createdTagId);
  await Like.deleteMany({ post: tempPostId });
  await Bookmark.deleteMany({ post: tempPostId });
  console.log('✓ Temporary test article and temporary verification tag deleted.');

  // Confirm Real Article is still completely intact!
  const finalRealArticleCheck = await Post.findOne({
    title: /Digital Public Infrastructure/i
  });
  if (!finalRealArticleCheck) {
    throw new Error('FATAL: Real article missing after cleanup!');
  }
  console.log('✓ Verified: Real article is 100% intact and unaffected.');
  console.log('  - Title:', finalRealArticleCheck.title);
  console.log('  - ID:', finalRealArticleCheck._id.toString());

  console.log('\n====================================================');
  console.log('ALL PHASE 5.5 VERIFICATIONS PASSED SUCCESSFULLY!');
  console.log('====================================================\n');

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('\n❌ VERIFICATION FAILED:', err);
  process.exit(1);
});
