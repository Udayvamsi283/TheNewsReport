import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware.js';
import { Media } from '../models/media.model.js';
import { uploadToCloudinary, deleteFromCloudinary } from '../config/cloudinary.js';
import { logger } from '../utils/logger.js';

export const uploadMediaAsset = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file was provided for upload.'
      });
    }

    const file = req.file;
    const folder = (req.body.folder as string) || 'the-news/images';
    const alt = (req.body.alt as string) || '';
    const caption = (req.body.caption as string) || '';

    // Determine resource type
    let resourceType: 'image' | 'video' | 'raw' = 'image';
    if (file.mimetype.startsWith('video/')) {
      resourceType = 'video';
    } else if (file.mimetype.startsWith('audio/') || file.mimetype === 'application/pdf' || file.mimetype === 'text/csv') {
      resourceType = 'raw';
    }

    // Sanitize filename for Cloudinary public ID
    const cleanOriginalName = file.originalname.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_');
    const publicId = `${folder}/${cleanOriginalName}_${Date.now()}`;

    // Upload to Cloudinary via stream
    const uploadResult = await uploadToCloudinary(file.buffer, {
      folder,
      publicId,
      resourceType: resourceType === 'raw' ? 'auto' : resourceType
    });

    // Map internal resource type
    let mappedResourceType: 'image' | 'video' | 'audio' | 'document' = 'image';
    if (file.mimetype.startsWith('video/')) mappedResourceType = 'video';
    else if (file.mimetype.startsWith('audio/')) mappedResourceType = 'audio';
    else if (file.mimetype === 'application/pdf' || file.mimetype === 'text/csv') mappedResourceType = 'document';

    // Save to database
    const mediaDoc = await Media.create({
      publicId: uploadResult.publicId,
      resourceType: mappedResourceType,
      url: uploadResult.url,
      secureUrl: uploadResult.secureUrl,
      filename: `${cleanOriginalName}.${uploadResult.format || 'jpg'}`,
      originalFilename: file.originalname,
      mimeType: file.mimetype,
      bytes: uploadResult.bytes || file.size,
      width: uploadResult.width,
      height: uploadResult.height,
      alt,
      caption,
      folder,
      uploadedBy: req.user?._id
    });

    logger.info(`Media uploaded successfully: ${mediaDoc.publicId} by user ${req.user?._id}`);

    return res.status(201).json({
      success: true,
      message: 'Media asset uploaded successfully',
      data: mediaDoc
    });
  } catch (error: any) {
    logger.error('Failed to upload media asset:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Media upload failed'
    });
  }
};

export const getMediaAssets = async (req: AuthRequest, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string, 10) || 24));
    const skip = (page - 1) * limit;

    const query: any = {};

    if (req.query.resourceType && req.query.resourceType !== 'all') {
      query.resourceType = req.query.resourceType;
    }

    if (req.query.search) {
      const searchRegex = new RegExp(String(req.query.search).trim(), 'i');
      query.$or = [
        { originalFilename: searchRegex },
        { filename: searchRegex },
        { alt: searchRegex },
        { caption: searchRegex }
      ];
    }

    const [mediaItems, total] = await Promise.all([
      Media.find(query)
        .populate('uploadedBy', 'name email avatar')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Media.countDocuments(query)
    ]);

    return res.status(200).json({
      success: true,
      data: mediaItems,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error: any) {
    logger.error('Failed to list media assets:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve media library assets'
    });
  }
};

export const updateMediaMetadata = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { alt, caption } = req.body;

    const media = await Media.findById(id);
    if (!media) {
      return res.status(404).json({
        success: false,
        message: 'Media asset not found'
      });
    }

    if (alt !== undefined) media.alt = alt;
    if (caption !== undefined) media.caption = caption;

    await media.save();

    return res.status(200).json({
      success: true,
      message: 'Media metadata updated successfully',
      data: media
    });
  } catch (error: any) {
    logger.error('Failed to update media metadata:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update media metadata'
    });
  }
};

export const deleteMediaAsset = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const media = await Media.findById(id);
    if (!media) {
      return res.status(404).json({
        success: false,
        message: 'Media asset not found'
      });
    }

    // Delete from Cloudinary
    await deleteFromCloudinary(
      media.publicId,
      media.resourceType === 'video' ? 'video' : 'image'
    );

    // Delete from MongoDB
    await Media.findByIdAndDelete(id);

    logger.info(`Media asset deleted: ${media.publicId}`);

    return res.status(200).json({
      success: true,
      message: 'Media asset removed successfully'
    });
  } catch (error: any) {
    logger.error('Failed to delete media asset:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete media asset'
    });
  }
};
