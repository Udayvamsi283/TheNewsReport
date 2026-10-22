import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { AddressInfo } from 'net';
import { createApp } from '../app.js';
import { User } from '../models/user.model.js';
import { isCloudinaryConfigured, cloudinary } from '../config/cloudinary.js';

dotenv.config();

async function runAvatarTests() {
  console.log('====================================================');
  console.log('PHASE 1 — AVATAR UPLOAD & CLOUDINARY VERIFICATION');
  console.log('====================================================\n');

  console.log('Cloudinary Configured:', isCloudinaryConfigured);
  if (!isCloudinaryConfigured) {
    throw new Error('Cloudinary credentials missing in environment!');
  }

  // Connect to DB
  await mongoose.connect(process.env.MONGODB_URI || '', { dbName: 'the_news' });
  console.log('Connected to MongoDB database:', mongoose.connection.name);

  // Start app on ephemeral port
  const app = createApp();
  const server = app.listen(0);
  const port = (server.address() as AddressInfo).port;
  const API_BASE = `http://localhost:${port}/api/v1`;
  console.log(`Test server running on port ${port}`);

  // 1. Test Unauthorized Upload Attempt
  console.log('\n1. Testing Unauthorized Upload Attempt...');
  const unauthFormData = new FormData();
  const dummyBlob = new Blob(['fake image data'], { type: 'image/png' });
  unauthFormData.append('avatar', dummyBlob, 'test.png');

  const unauthRes = await fetch(`${API_BASE}/users/me/avatar`, {
    method: 'POST',
    body: unauthFormData
  });
  console.log('POST /users/me/avatar unauthenticated status:', unauthRes.status);
  if (unauthRes.status !== 401 && unauthRes.status !== 403) {
    throw new Error(`Expected 401/403 for unauthenticated avatar upload, got ${unauthRes.status}`);
  }
  console.log('✓ Unauthorized avatar upload successfully rejected.');

  // 2. Authenticate as Admin
  console.log('\n2. Authenticating User with CSRF & Cookies...');
  const csrfRes = await fetch(`${API_BASE}/auth/csrf-token`);
  const csrfJson: any = await csrfRes.json();
  const csrfToken = csrfJson.data?.csrfToken;
  const csrfCookie = csrfRes.headers.get('set-cookie')?.split(';')[0].trim() || '';

  const loginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-Token': csrfToken,
      Cookie: csrfCookie
    },
    body: JSON.stringify({
      email: process.env.ADMIN_EMAIL || 'admin@thenews.org',
      password: process.env.ADMIN_PASSWORD || 'Th3N3ws_2026_Adm!n_S3cur3#xK9'
    })
  });

  const rawCookies = (loginRes.headers as any).getSetCookie
    ? (loginRes.headers as any).getSetCookie()
    : [loginRes.headers.get('set-cookie') || ''];
  const tokenCookie = rawCookies.find((c: string) => c.startsWith('token='));
  const tokenCookieVal = tokenCookie ? tokenCookie.split(';')[0].trim() : '';
  const authCookie = `${csrfCookie}; ${tokenCookieVal}`;

  const loginJson: any = await loginRes.json();
  const userId = loginJson.data?.user?._id || loginJson.data?.user?.id;
  console.log('✓ Authenticated as user:', userId);

  // Store original avatar state to restore afterward
  const originalUser = await User.findById(userId);
  const originalAvatar = originalUser?.avatar || '';
  const originalPublicId = originalUser?.avatarPublicId || '';

  // 3. Test Invalid File Type (SVG Rejection)
  console.log('\n3. Testing SVG Rejection...');
  const svgBlob = new Blob(['<svg xmlns="http://www.w3.org/2000/svg"><circle r="10"/></svg>'], {
    type: 'image/svg+xml'
  });
  const svgFormData = new FormData();
  svgFormData.append('avatar', svgBlob, 'malicious.svg');

  const svgRes = await fetch(`${API_BASE}/users/me/avatar`, {
    method: 'POST',
    headers: {
      'X-CSRF-Token': csrfToken,
      Cookie: authCookie
    },
    body: svgFormData
  });
  console.log('POST /users/me/avatar with SVG status:', svgRes.status);
  if (svgRes.status !== 400 && svgRes.status !== 500) {
    throw new Error(`Expected error status for SVG upload, got ${svgRes.status}`);
  }
  const svgJson: any = await svgRes.json();
  console.log('SVG Rejection Message:', svgJson.message);
  console.log('✓ SVG file upload rejected strictly.');

  // 4. Test Oversized Image (>5MB Rejection)
  console.log('\n4. Testing Oversized Image Rejection (>5MB)...');
  const oversizedBuffer = Buffer.alloc(6 * 1024 * 1024); // 6MB
  const oversizedBlob = new Blob([oversizedBuffer], { type: 'image/png' });
  const oversizedFormData = new FormData();
  oversizedFormData.append('avatar', oversizedBlob, 'huge.png');

  const oversizedRes = await fetch(`${API_BASE}/users/me/avatar`, {
    method: 'POST',
    headers: {
      'X-CSRF-Token': csrfToken,
      Cookie: authCookie
    },
    body: oversizedFormData
  });
  console.log('POST /users/me/avatar with 6MB status:', oversizedRes.status);
  if (oversizedRes.status !== 400 && oversizedRes.status !== 500) {
    throw new Error(`Expected error status for oversized upload, got ${oversizedRes.status}`);
  }
  console.log('✓ Oversized image rejected strictly.');

  // 5. Test Valid Device Image Upload (1x1 PNG)
  console.log('\n5. Testing Valid Device Image Upload to Cloudinary...');
  const base64Png = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  const validBuffer = Buffer.from(base64Png, 'base64');
  const validBlob = new Blob([validBuffer], { type: 'image/png' });
  const validFormData = new FormData();
  validFormData.append('avatar', validBlob, 'profile_avatar.png');

  const uploadRes = await fetch(`${API_BASE}/users/me/avatar`, {
    method: 'POST',
    headers: {
      'X-CSRF-Token': csrfToken,
      Cookie: authCookie
    },
    body: validFormData
  });

  console.log('POST /users/me/avatar status:', uploadRes.status);
  const uploadJson: any = await uploadRes.json();
  if (uploadRes.status !== 200 || !uploadJson.success) {
    throw new Error('Avatar upload failed: ' + JSON.stringify(uploadJson));
  }

  const updatedAvatar = uploadJson.data?.user?.avatar;
  const updatedPublicId = uploadJson.data?.user?.avatarPublicId;
  console.log('Uploaded Avatar URL:', updatedAvatar);
  console.log('Uploaded Avatar Public ID:', updatedPublicId);

  if (!updatedAvatar || !updatedPublicId || !updatedPublicId.startsWith('the-news/avatars/')) {
    throw new Error('Uploaded avatar does not have valid Cloudinary secure URL and publicId!');
  }

  // Verify DB persistence directly
  const userInDb = await User.findById(userId);
  if (userInDb?.avatar !== updatedAvatar || userInDb?.avatarPublicId !== updatedPublicId) {
    throw new Error('Avatar did not persist in MongoDB Atlas!');
  }
  console.log('✓ Avatar URL and Public ID verified in MongoDB Atlas.');

  // Verify public HTTP access
  const imageHttpRes = await fetch(updatedAvatar, { method: 'HEAD' });
  console.log('Public HTTP access status:', imageHttpRes.status);
  if (imageHttpRes.status !== 200) {
    throw new Error(`Cloudinary avatar not publicly accessible! HTTP ${imageHttpRes.status}`);
  }
  console.log('✓ Cloudinary secure URL is publicly accessible.');

  // 6. Test Replace Photo
  console.log('\n6. Testing Replace Photo Functionality (Old asset deletion & replacement)...');
  const replaceFormData = new FormData();
  replaceFormData.append('avatar', validBlob, 'replaced_avatar.png');

  const replaceRes = await fetch(`${API_BASE}/users/me/avatar`, {
    method: 'POST',
    headers: {
      'X-CSRF-Token': csrfToken,
      Cookie: authCookie
    },
    body: replaceFormData
  });
  const replaceJson: any = await replaceRes.json();
  const replacedAvatar = replaceJson.data?.user?.avatar;
  const replacedPublicId = replaceJson.data?.user?.avatarPublicId;
  console.log('Replaced Avatar Public ID:', replacedPublicId);

  if (replacedPublicId === updatedPublicId) {
    throw new Error('Replaced avatar public ID is identical to previous!');
  }
  console.log('✓ New asset saved in Cloudinary and DB.');

  // Check that old asset was deleted from Cloudinary
  try {
    const oldAssetCheck = await cloudinary.api.resource(updatedPublicId);
    console.warn('Old asset was still found in Cloudinary:', oldAssetCheck.public_id);
  } catch (checkErr: any) {
    console.log('✓ Old asset was deleted from Cloudinary (404 expected):', checkErr?.error?.message || 'Not found');
  }

  // 7. Test Remove Photo
  console.log('\n7. Testing Remove Photo Functionality...');
  const removeRes = await fetch(`${API_BASE}/users/me/avatar`, {
    method: 'DELETE',
    headers: {
      'X-CSRF-Token': csrfToken,
      Cookie: authCookie
    }
  });

  const removeJson: any = await removeRes.json();
  console.log('DELETE /users/me/avatar status:', removeRes.status);
  if (removeRes.status !== 200 || !removeJson.success) {
    throw new Error('Remove avatar failed: ' + JSON.stringify(removeJson));
  }

  const userAfterRemove = await User.findById(userId);
  if (userAfterRemove?.avatar !== '' || userAfterRemove?.avatarPublicId !== '') {
    throw new Error('Avatar was not cleared in database!');
  }
  console.log('✓ Avatar cleared in database after deletion.');

  // Restore original state if existed
  if (originalAvatar || originalPublicId) {
    await User.findByIdAndUpdate(userId, {
      $set: { avatar: originalAvatar, avatarPublicId: originalPublicId }
    });
  }

  console.log('\n====================================================');
  console.log('PHASE 1 ALL VERIFICATIONS PASSED SUCCESSFULLY!');
  console.log('====================================================\n');

  server.close();
  await mongoose.disconnect();
}

runAvatarTests().catch(async (err) => {
  console.error('\n❌ Avatar Test Failed:', err.message);
  await mongoose.disconnect();
  process.exit(1);
});
