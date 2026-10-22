export type UserRole = 'user' | 'admin';
export type UserStatus = 'active' | 'disabled';

export interface User {
  _id?: string;
  id?: string;
  name: string;
  email: string;
  avatar?: string;
  avatarPublicId?: string;
  role: UserRole;
  preferredLanguage: string;
  interests?: Category[] | string[];
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  user: User;
}

export type CategoryStatus = 'active' | 'inactive';

export interface Category {
  _id?: string;
  id?: string;
  name: string;
  slug: string;
  description: string;
  image?: string;
  parent?: Category | string | null;
  status?: CategoryStatus;
  createdAt?: string;
  updatedAt?: string;
  articleCount?: number;
}

export interface Tag {
  _id?: string;
  id?: string;
  name: string;
  slug: string;
  createdAt?: string;
  updatedAt?: string;
}

export type LanguageStatus = 'active' | 'inactive';

export interface Language {
  _id?: string;
  id?: string;
  name: string;
  code: string;
  isDefault: boolean;
  status: LanguageStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  pages?: number;
  totalPages?: number;
}

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

export interface FeaturedImage {
  url: string;
  publicId?: string;
  alt?: string;
  caption?: string;
  width?: number;
  height?: number;
}

export interface SeoMetadata {
  metaTitle?: string;
  metaDescription?: string;
  canonicalUrl?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  keywords?: string[];
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface GalleryItem {
  image: string;
  publicId?: string;
  title?: string;
  description?: string;
  order: number;
}

export interface SortedListItem {
  itemNumber: number;
  title: string;
  content?: string;
  image?: string;
  publicId?: string;
}

export interface VideoDetails {
  videoUrl: string;
  embedUrl?: string;
  provider?: 'youtube' | 'vimeo' | 'direct' | 'other';
  duration?: number;
}

export interface AudioDetails {
  audioUrl: string;
  coverImage?: string;
  duration?: number;
  artist?: string;
}

export interface PollOption {
  id: string;
  text: string;
  votes?: number;
}

export interface PollDetails {
  question: string;
  options: PollOption[];
  startTime?: string | Date;
  endTime?: string | Date;
}

export interface EventDetails {
  startDate?: string | Date;
  endDate?: string | Date;
  locationName?: string;
  address?: string;
  mapUrl?: string;
  eventUrl?: string;
}

export interface Translation {
  language: string | Language;
  languageCode: string;
  title: string;
  slug: string;
  summary?: string;
  content?: string;
  seo?: SeoMetadata;
}

export interface Post {
  _id: string;
  id?: string;
  title: string;
  slug: string;
  summary?: string;
  content?: string;
  author: User;
  category: Category;
  tags: Tag[];
  language: Language;
  postFormat: PostFormat;
  featuredImage?: FeaturedImage;
  images?: FeaturedImage[];
  status: PostStatus;
  publishedAt?: string;
  scheduledAt?: string;
  isFullWidth?: boolean;
  registeredOnly?: boolean;
  isFeatured?: boolean;
  isBreaking?: boolean;
  externalUrl?: string;
  seo?: SeoMetadata;
  faq?: FaqItem[];
  translations?: Translation[];
  galleryItems?: GalleryItem[];
  sortedListItems?: SortedListItem[];
  videoDetails?: VideoDetails;
  audioDetails?: AudioDetails;
  pollDetails?: PollDetails;
  eventDetails?: EventDetails;
  previewToken?: string;
  views?: number;
  likeCount?: number;
  commentCount?: number;
  isLiked?: boolean;
  isBookmarked?: boolean;
  isGated?: boolean;
  activeLanguage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  _id: string;
  post: string | { _id: string; title: string; slug: string };
  user: {
    _id: string;
    name: string;
    email?: string;
    avatar?: string;
    role: string;
  };
  content: string;
  status: 'visible' | 'hidden' | 'deleted';
  createdAt: string;
  updatedAt: string;
}

export interface PollVoteResult {
  totalVotes: number;
  results: {
    id: string;
    text: string;
    votes: number;
    percentage: number;
  }[];
  userVotedOptionId?: string;
}

export interface Bookmark {
  _id: string;
  user: string;
  post: Post;
  createdAt: string;
}

export interface HomepageData {
  heroStory: Post | null;
  breakingNews: Post[];
  featuredArticles: Post[];
  categorySections: {
    category: Category;
    posts: Post[];
  }[];
}

export type MediaResourceType = 'image' | 'video' | 'audio' | 'document';

export interface MediaAsset {
  _id: string;
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
  uploadedBy?: User;
  createdAt: string;
  updatedAt: string;
}

export interface HealthResponse {
  success: boolean;
  message: string;
  environment: string;
  timestamp: string;
  database: {
    status: 'connected' | 'disconnected' | 'connecting' | 'disconnecting' | 'unknown';
    connected: boolean;
    name: string;
    host?: string;
  };
}

export interface Author {
  id: string;
  name: string;
  role: string;
  avatar: string;
  bio?: string;
}

export interface Article {
  id: string;
  slug: string;
  title: string;
  summary: string;
  content: string;
  category: string;
  categorySlug: string;
  tags: string[];
  imageUrl: string;
  imageCaption?: string;
  imageCredit?: string;
  author: Author;
  publishedAt: string;
  readingTimeMinutes: number;
  isBreaking?: boolean;
  isFeatured?: boolean;
  viewCount: number;
}

export interface AdminStat {
  label: string;
  value: string | number;
  change: string;
  isPositive: boolean;
  subtext: string;
}
