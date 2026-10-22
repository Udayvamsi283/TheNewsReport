import { Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import { User } from '../models/user.model.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { uploadToCloudinary, deleteFromCloudinary } from '../config/cloudinary.js';
import { logger } from '../utils/logger.js';
import {
  updateProfileSchema,
  changePasswordSchema,
  adminUpdateUserSchema
} from '../validators/user.validator.js';

export const getProfile = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = await User.findById(req.user!._id).populate('interests', 'name slug');
    res.status(200).json({
      success: true,
      data: { user }
    });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const validatedData = updateProfileSchema.parse(req.body);

    const currentUser = await User.findById(req.user!._id);
    if (!currentUser) {
      res.status(404).json({ success: false, message: 'User not found.' });
      return;
    }

    // If avatar is explicitly cleared or changed and user had an owned Cloudinary avatar, clean it up safely
    if (
      validatedData.avatar !== undefined &&
      validatedData.avatar !== currentUser.avatar &&
      currentUser.avatarPublicId &&
      currentUser.avatarPublicId.startsWith('the-news/avatars/')
    ) {
      try {
        await deleteFromCloudinary(currentUser.avatarPublicId, 'image');
      } catch (delErr) {
        logger.error(`Failed to delete previous avatar asset [${currentUser.avatarPublicId}]:`, delErr);
      }
      currentUser.avatarPublicId = '';
    }

    if (validatedData.name) currentUser.name = validatedData.name;
    if (validatedData.avatar !== undefined) currentUser.avatar = validatedData.avatar;
    if (validatedData.preferredLanguage) currentUser.preferredLanguage = validatedData.preferredLanguage;
    if (validatedData.interests) (currentUser as any).interests = validatedData.interests;

    await currentUser.save();
    await currentUser.populate('interests', 'name slug');

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      data: { user: currentUser }
    });
  } catch (error) {
    next(error);
  }
};

export const uploadAvatar = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({
        success: false,
        message: 'No image file was provided for avatar upload.'
      });
      return;
    }

    const file = req.file;

    // Validate MIME type strictly (JPEG, PNG, WebP only)
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedMimes.includes(file.mimetype)) {
      res.status(400).json({
        success: false,
        message: `Unsupported image format: ${file.mimetype}. Only JPEG, PNG, and WebP are allowed.`
      });
      return;
    }

    // Validate file size (max 5MB)
    const maxSizeBytes = 5 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      res.status(400).json({
        success: false,
        message: 'Profile image size exceeds 5 MB limit.'
      });
      return;
    }

    const user = await User.findById(req.user!._id);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found.' });
      return;
    }

    // Sanitize filename
    const cleanOriginalName = file.originalname
      .replace(/\.[^/.]+$/, '')
      .replace(/[^a-zA-Z0-9_-]/g, '_');
    const folder = 'the-news/avatars';
    const publicId = `avatar_${user._id}_${Date.now()}`;

    // Upload to Cloudinary using existing server-side configuration
    const uploadResult = await uploadToCloudinary(file.buffer, {
      folder,
      publicId,
      resourceType: 'image'
    });

    // Clean up previous owned Cloudinary avatar if present
    const oldPublicId = user.avatarPublicId;
    if (oldPublicId && oldPublicId.startsWith('the-news/avatars/')) {
      try {
        await deleteFromCloudinary(oldPublicId, 'image');
      } catch (delErr) {
        logger.error(`Failed to clean up old avatar asset [${oldPublicId}]:`, delErr);
      }
    }

    user.avatar = uploadResult.secureUrl;
    user.avatarPublicId = uploadResult.publicId;
    await user.save();
    await user.populate('interests', 'name slug');

    logger.info(`Profile picture updated for user ${user._id} (${uploadResult.publicId})`);

    res.status(200).json({
      success: true,
      message: 'Profile picture uploaded successfully.',
      data: { user }
    });
  } catch (error) {
    next(error);
  }
};

export const removeAvatar = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = await User.findById(req.user!._id);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found.' });
      return;
    }

    // Clean up Cloudinary asset if it is an owned profile image
    const oldPublicId = user.avatarPublicId;
    if (oldPublicId && oldPublicId.startsWith('the-news/avatars/')) {
      try {
        await deleteFromCloudinary(oldPublicId, 'image');
      } catch (delErr) {
        logger.error(`Failed to clean up avatar asset on removal [${oldPublicId}]:`, delErr);
      }
    }

    user.avatar = '';
    user.avatarPublicId = '';
    await user.save();
    await user.populate('interests', 'name slug');

    logger.info(`Profile picture removed for user ${user._id}`);

    res.status(200).json({
      success: true,
      message: 'Profile picture removed successfully.',
      data: { user }
    });
  } catch (error) {
    next(error);
  }
};

export const updatePreferences = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { preferredLanguage, interests } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user!._id,
      {
        $set: {
          ...(preferredLanguage !== undefined && { preferredLanguage }),
          ...(interests !== undefined && { interests })
        }
      },
      { new: true }
    ).populate('interests', 'name slug');

    res.status(200).json({
      success: true,
      message: 'Preferences updated successfully.',
      data: { user }
    });
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);

    const user = await User.findById(req.user!._id).select('+passwordHash');
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found.' });
      return;
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      res.status(400).json({ success: false, message: 'Current password is incorrect.' });
      return;
    }

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully.'
    });
  } catch (error) {
    next(error);
  }
};

// Admin user management controllers
export const listUsers = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10) || 10));
    const search = (req.query.search as string)?.trim();
    const role = req.query.role as string;
    const status = req.query.status as string;

    const query: Record<string, any> = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    if (role && ['user', 'admin'].includes(role)) {
      query.role = role;
    }

    if (status && ['active', 'disabled'].includes(status)) {
      query.status = status;
    }

    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.status(200).json({
      success: true,
      data: {
        users,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getUserById = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = await User.findById(req.params.id).populate('interests', 'name slug');
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found.' });
      return;
    }

    res.status(200).json({
      success: true,
      data: { user }
    });
  } catch (error) {
    next(error);
  }
};

export const updateUser = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const validatedData = adminUpdateUserSchema.parse(req.body);

    const targetUser = await User.findById(req.params.id);
    if (!targetUser) {
      res.status(404).json({ success: false, message: 'User not found.' });
      return;
    }

    // Prevent admin from disabling or demoting their own account
    if (targetUser._id.equals(req.user!._id)) {
      if (validatedData.status === 'disabled' || validatedData.role === 'user') {
        res.status(400).json({
          success: false,
          message: 'Security protection: You cannot disable or demote your own admin account.'
        });
        return;
      }
    }

    if (validatedData.role) targetUser.role = validatedData.role;
    if (validatedData.status) targetUser.status = validatedData.status;

    await targetUser.save();

    res.status(200).json({
      success: true,
      message: 'User updated successfully.',
      data: { user: targetUser }
    });
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const targetUser = await User.findById(req.params.id);
    if (!targetUser) {
      res.status(404).json({ success: false, message: 'User not found.' });
      return;
    }

    // Prevent admin from deleting themselves
    if (targetUser._id.equals(req.user!._id)) {
      res.status(400).json({
        success: false,
        message: 'Security protection: You cannot delete your own admin account.'
      });
      return;
    }

    await User.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'User deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
};
