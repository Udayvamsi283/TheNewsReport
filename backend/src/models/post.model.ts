import mongoose, { Document, Schema } from 'mongoose';

export type PostFormat =
  | 'article'
  | 'gallery'
  | 'sorted_list'
  | 'table_of_contents'
  | 'video'
  | 'audio'
  | 'poll'
  | 'event';

export type PostStatus = 'draft' | 'published' | 'scheduled' | 'trashed';

export interface IFeaturedImage {
  url: string;
  publicId?: string;
  alt?: string;
  caption?: string;
  width?: number;
  height?: number;
}

export interface ISeoMetadata {
  metaTitle?: string;
  metaDescription?: string;
  canonicalUrl?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  keywords?: string[];
}

export interface IFaqItem {
  question: string;
  answer: string;
}

export interface IGalleryItem {
  image: string;
  publicId?: string;
  title?: string;
  description?: string;
  order: number;
}

export interface ISortedListItem {
  itemNumber: number;
  title: string;
  content?: string;
  image?: string;
  publicId?: string;
}

export interface IVideoDetails {
  videoUrl: string;
  embedUrl?: string;
  provider?: 'youtube' | 'vimeo' | 'direct' | 'other';
  duration?: number;
}

export interface IAudioDetails {
  audioUrl: string;
  coverImage?: string;
  duration?: number;
  artist?: string;
}

export interface IPollOption {
  id: string;
  text: string;
  votes?: number;
}

export interface IPollDetails {
  question: string;
  options: IPollOption[];
  startTime?: Date;
  endTime?: Date;
}

export interface IEventDetails {
  startDate?: Date;
  endDate?: Date;
  locationName?: string;
  address?: string;
  mapUrl?: string;
  eventUrl?: string;
}

export interface ITranslation {
  language: mongoose.Types.ObjectId;
  languageCode: string;
  title: string;
  slug: string;
  summary?: string;
  content?: string;
  seo?: ISeoMetadata;
}

export interface IPost extends Document {
  title: string;
  slug: string;
  summary?: string;
  content?: string;
  author: mongoose.Types.ObjectId;
  category: mongoose.Types.ObjectId;
  tags: mongoose.Types.ObjectId[];
  language: mongoose.Types.ObjectId;
  postFormat: PostFormat;
  featuredImage?: IFeaturedImage;
  images?: IFeaturedImage[];
  status: PostStatus;
  publishedAt?: Date;
  scheduledAt?: Date;
  isFullWidth: boolean;
  registeredOnly: boolean;
  isFeatured: boolean;
  isBreaking: boolean;
  externalUrl?: string;
  seo: ISeoMetadata;
  faq: IFaqItem[];
  translations: ITranslation[];
  galleryItems?: IGalleryItem[];
  sortedListItems?: ISortedListItem[];
  videoDetails?: IVideoDetails;
  audioDetails?: IAudioDetails;
  pollDetails?: IPollDetails;
  eventDetails?: IEventDetails;
  previewToken?: string;
  views: number;
  likeCount: number;
  commentCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const postSchema = new Schema<IPost>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true
    },
    summary: {
      type: String,
      default: '',
      trim: true
    },
    content: {
      type: String,
      default: ''
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
      index: true
    },
    tags: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Tag',
        index: true
      }
    ],
    language: {
      type: Schema.Types.ObjectId,
      ref: 'Language',
      required: true,
      index: true
    },
    postFormat: {
      type: String,
      required: true,
      enum: [
        'article',
        'gallery',
        'sorted_list',
        'table_of_contents',
        'video',
        'audio',
        'poll',
        'event'
      ],
      default: 'article',
      index: true
    },
    featuredImage: {
      url: { type: String, default: '' },
      publicId: { type: String, default: '' },
      alt: { type: String, default: '' },
      caption: { type: String, default: '' },
      width: { type: Number },
      height: { type: Number }
    },
    images: [
      {
        url: { type: String, required: true },
        publicId: { type: String, default: '' },
        alt: { type: String, default: '' },
        caption: { type: String, default: '' }
      }
    ],
    status: {
      type: String,
      required: true,
      enum: ['draft', 'published', 'scheduled', 'trashed'],
      default: 'draft',
      index: true
    },
    publishedAt: {
      type: Date,
      index: true
    },
    scheduledAt: {
      type: Date,
      index: true
    },
    isFullWidth: {
      type: Boolean,
      default: false
    },
    registeredOnly: {
      type: Boolean,
      default: false
    },
    isFeatured: {
      type: Boolean,
      default: false,
      index: true
    },
    isBreaking: {
      type: Boolean,
      default: false,
      index: true
    },
    externalUrl: {
      type: String,
      default: '',
      trim: true
    },
    seo: {
      metaTitle: { type: String, default: '' },
      metaDescription: { type: String, default: '' },
      canonicalUrl: { type: String, default: '' },
      ogTitle: { type: String, default: '' },
      ogDescription: { type: String, default: '' },
      ogImage: { type: String, default: '' },
      keywords: [{ type: String }]
    },
    faq: [
      {
        question: { type: String, required: true, trim: true },
        answer: { type: String, required: true, trim: true }
      }
    ],
    // Multilingual translations array
    translations: [
      {
        language: { type: Schema.Types.ObjectId, ref: 'Language', required: true },
        languageCode: { type: String, required: true, lowercase: true, trim: true },
        title: { type: String, required: true, trim: true },
        slug: { type: String, required: true, trim: true, lowercase: true },
        summary: { type: String, default: '', trim: true },
        content: { type: String, default: '' },
        seo: {
          metaTitle: { type: String, default: '' },
          metaDescription: { type: String, default: '' }
        }
      }
    ],
    // Format-specific details
    galleryItems: [
      {
        image: { type: String, required: true },
        publicId: { type: String, default: '' },
        title: { type: String, default: '' },
        description: { type: String, default: '' },
        order: { type: Number, default: 0 }
      }
    ],
    sortedListItems: [
      {
        itemNumber: { type: Number, required: true },
        title: { type: String, required: true },
        content: { type: String, default: '' },
        image: { type: String, default: '' },
        publicId: { type: String, default: '' }
      }
    ],
    videoDetails: {
      videoUrl: { type: String, default: '' },
      embedUrl: { type: String, default: '' },
      provider: {
        type: String,
        enum: ['youtube', 'vimeo', 'direct', 'other'],
        default: 'youtube'
      },
      duration: { type: Number }
    },
    audioDetails: {
      audioUrl: { type: String, default: '' },
      coverImage: { type: String, default: '' },
      duration: { type: Number },
      artist: { type: String, default: '' }
    },
    pollDetails: {
      question: { type: String, default: '' },
      options: [
        {
          id: { type: String, required: true },
          text: { type: String, required: true },
          votes: { type: Number, default: 0 }
        }
      ],
      startTime: { type: Date },
      endTime: { type: Date }
    },
    eventDetails: {
      startDate: { type: Date },
      endDate: { type: Date },
      locationName: { type: String, default: '' },
      address: { type: String, default: '' },
      mapUrl: { type: String, default: '' },
      eventUrl: { type: String, default: '' }
    },
    previewToken: {
      type: String,
      index: true
    },
    views: {
      type: Number,
      default: 0,
      min: 0,
      index: true
    },
    likeCount: {
      type: Number,
      default: 0,
      min: 0,
      index: true
    },
    commentCount: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  {
    timestamps: true
  }
);

// Compound indexes for high-speed queries
postSchema.index({ status: 1, publishedAt: -1 });
postSchema.index({ status: 1, category: 1, publishedAt: -1 });
postSchema.index({ status: 1, language: 1, publishedAt: -1 });
postSchema.index({ status: 1, postFormat: 1, publishedAt: -1 });
postSchema.index({ status: 1, publishedAt: -1, views: -1 });
postSchema.index({ createdAt: -1 });
postSchema.index(
  {
    title: 'text',
    summary: 'text',
    'translations.title': 'text',
    'translations.summary': 'text'
  },
  {
    language_override: 'none'
  }
);

export const Post = mongoose.model<IPost>('Post', postSchema);
