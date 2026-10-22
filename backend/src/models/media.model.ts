import mongoose, { Document, Schema } from 'mongoose';

export type MediaResourceType = 'image' | 'video' | 'audio' | 'document';

export interface IMedia extends Document {
  publicId: string;
  resourceType: MediaResourceType;
  url: string;
  secureUrl: string;
  filename: string;
  originalFilename: string;
  mimeType: string;
  bytes: number;
  width?: number;
  height?: number;
  duration?: number;
  alt?: string;
  caption?: string;
  folder: string;
  uploadedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const mediaSchema = new Schema<IMedia>(
  {
    publicId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true
    },
    resourceType: {
      type: String,
      required: true,
      enum: ['image', 'video', 'audio', 'document'],
      default: 'image',
      index: true
    },
    url: {
      type: String,
      required: true,
      trim: true
    },
    secureUrl: {
      type: String,
      required: true,
      trim: true
    },
    filename: {
      type: String,
      required: true,
      trim: true
    },
    originalFilename: {
      type: String,
      required: true,
      trim: true
    },
    mimeType: {
      type: String,
      required: true,
      trim: true
    },
    bytes: {
      type: Number,
      required: true
    },
    width: {
      type: Number
    },
    height: {
      type: Number
    },
    duration: {
      type: Number
    },
    alt: {
      type: String,
      default: '',
      trim: true
    },
    caption: {
      type: String,
      default: '',
      trim: true
    },
    folder: {
      type: String,
      default: 'the-news/images',
      trim: true,
      index: true
    },
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    }
  },
  {
    timestamps: true
  }
);

mediaSchema.index({ createdAt: -1 });

export const Media = mongoose.model<IMedia>('Media', mediaSchema);
