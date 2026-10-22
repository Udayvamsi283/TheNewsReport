import { uploadToCloudinary, deleteFromCloudinary, isCloudinaryConfigured } from '../config/cloudinary.js';
import { connectDatabase } from '../config/database.js';
import { Media } from '../models/media.model.js';
import { User } from '../models/user.model.js';
import mongoose from 'mongoose';

async function verifyCloudinaryIntegration() {
  console.log('--- CLOUDINARY PRE-FLIGHT VERIFICATION ---');
  console.log(`Cloudinary Configured in Environment: ${isCloudinaryConfigured}`);

  if (!isCloudinaryConfigured) {
    throw new Error('Cloudinary credentials missing from environment!');
  }

  await connectDatabase();

  // Clean up any dangling previous test asset
  try {
    await deleteFromCloudinary('the-news/test-assets/cmwfc8o46vedqtkg9ysy', 'image');
  } catch {}

  const admin = await User.findOne({ role: 'admin' });
  if (!admin) {
    throw new Error('Admin user not found in database to assign uploadedBy!');
  }

  // 1. Generate a small 1x1 PNG image buffer
  const base64Png = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  const buffer = Buffer.from(base64Png, 'base64');

  // 2. Upload to Cloudinary
  console.log('Uploading test image buffer to Cloudinary...');
  const uploadResult = await uploadToCloudinary(buffer, {
    folder: 'the-news/test-assets',
    resourceType: 'image'
  });

  console.log(`[PASS] Uploaded successfully:`);
  console.log(`- Public ID: ${uploadResult.publicId}`);
  console.log(`- Secure URL exists: ${Boolean(uploadResult.secureUrl)}`);
  console.log(`- Format: ${uploadResult.format}`);
  console.log(`- Dimensions: ${uploadResult.width}x${uploadResult.height}`);

  if (!uploadResult.publicId.startsWith('the-news/test-assets/')) {
    throw new Error(`Unexpected publicId: ${uploadResult.publicId}`);
  }

  let mediaDocId: any = null;
  try {
    // 3. Persist Media record to MongoDB Atlas
    const mediaDoc = await Media.create({
      publicId: uploadResult.publicId,
      resourceType: 'image',
      url: uploadResult.url,
      secureUrl: uploadResult.secureUrl,
      filename: 'preflight-test.png',
      originalFilename: 'preflight-test.png',
      mimeType: 'image/png',
      width: uploadResult.width,
      height: uploadResult.height,
      bytes: uploadResult.bytes,
      folder: 'the-news/test-assets',
      alt: 'Cloudinary Preflight Test Image',
      uploadedBy: admin._id
    });
    mediaDocId = mediaDoc._id;

    console.log(`[PASS] Media document persisted in MongoDB Atlas with ID: ${mediaDoc._id}`);

    // 4. Test public HTTP access to the secureUrl
    console.log('Verifying public accessibility of Cloudinary secure URL...');
    const httpRes = await fetch(uploadResult.secureUrl, { method: 'HEAD' });
    console.log(`[PASS] HTTP HEAD check status: ${httpRes.status} (Content-Type: ${httpRes.headers.get('content-type')})`);
    if (httpRes.status !== 200) {
      throw new Error(`Failed to fetch image from Cloudinary secureUrl: ${httpRes.status}`);
    }

    // 5. Test deletion from Cloudinary
    console.log(`Deleting asset from Cloudinary [${uploadResult.publicId}]...`);
    const deleteResult = await deleteFromCloudinary(uploadResult.publicId, 'image');
    console.log(`[PASS] Cloudinary asset deletion result: ${deleteResult}`);

    // 6. Clean up MongoDB Atlas test record
    await Media.findByIdAndDelete(mediaDoc._id);
    console.log(`[PASS] MongoDB Atlas test Media document removed. Database remains clean.`);

    console.log('--- ALL CLOUDINARY PRE-FLIGHT CHECKS PASSED ---');
  } catch (err: any) {
    // Teardown
    await deleteFromCloudinary(uploadResult.publicId, 'image');
    if (mediaDocId) await Media.findByIdAndDelete(mediaDocId);
    throw err;
  }
}

verifyCloudinaryIntegration()
  .then(async () => {
    await mongoose.connection.close();
    process.exit(0);
  })
  .catch(async (err) => {
    console.error('[FAIL] Cloudinary verification error:', err.message);
    try {
      await mongoose.connection.close();
    } catch {}
    process.exit(1);
  });
