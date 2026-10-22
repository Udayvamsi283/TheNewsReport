import { v2 as cloudinary } from 'cloudinary';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

export const isCloudinaryConfigured = Boolean(
  env.CLOUDINARY_CLOUD_NAME &&
  env.CLOUDINARY_API_KEY &&
  env.CLOUDINARY_API_SECRET
);

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true
  });
  logger.info(`Cloudinary configured for cloud: ${env.CLOUDINARY_CLOUD_NAME}`);
} else {
  logger.warn('Cloudinary credentials not provided in environment. Media upload will operate in fallback mode.');
}

export interface CloudinaryUploadResult {
  publicId: string;
  url: string;
  secureUrl: string;
  resourceType: string;
  format: string;
  width?: number;
  height?: number;
  bytes: number;
}

/**
 * Upload a file buffer directly to Cloudinary using a stream.
 */
export const uploadToCloudinary = (
  buffer: Buffer,
  options: {
    folder?: string;
    resourceType?: 'image' | 'video' | 'raw' | 'auto';
    publicId?: string;
  } = {}
): Promise<CloudinaryUploadResult> => {
  return new Promise((resolve, reject) => {
    if (!isCloudinaryConfigured) {
      return reject(new Error('Cloudinary service is not configured. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in the environment.'));
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: options.folder || 'the-news/images',
        resource_type: options.resourceType || 'auto',
        public_id: options.publicId,
        overwrite: true
      },
      (error, result) => {
        if (error || !result) {
          logger.error('Cloudinary upload error:', error);
          return reject(error || new Error('Upload failed with no result'));
        }

        resolve({
          publicId: result.public_id,
          url: result.url,
          secureUrl: result.secure_url,
          resourceType: result.resource_type,
          format: result.format,
          width: result.width,
          height: result.height,
          bytes: result.bytes
        });
      }
    );

    // Stream the buffer into Cloudinary
    uploadStream.end(buffer);
  });
};

/**
 * Delete an asset from Cloudinary by its public ID.
 */
export const deleteFromCloudinary = async (
  publicId: string,
  resourceType: 'image' | 'video' | 'raw' = 'image'
): Promise<boolean> => {
  if (!isCloudinaryConfigured) {
    throw new Error('Cloudinary service is not configured.');
  }

  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType
    });
    return result.result === 'ok';
  } catch (error) {
    logger.error(`Failed to delete Cloudinary asset [${publicId}]:`, error);
    return false;
  }
};

export { cloudinary };
