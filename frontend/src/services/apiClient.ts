import { env } from '../config/env';
import {
  HealthResponse,
  User,
  AuthResponse,
  Category,
  Tag,
  Language,
  Pagination,
  Post,
  MediaAsset,
  Comment,
  HomepageData,
  PollVoteResult
} from '../types';

export class ApiError extends Error {
  status?: number;
  data?: unknown;

  constructor(message: string, status?: number, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'));
  return match ? decodeURIComponent(match[3]) : null;
}

class ApiClient {
  private baseUrl: string;
  private cachedCsrfToken: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  }

  public async fetchCsrfToken(): Promise<string> {
    try {
      const res = await fetch(`${this.baseUrl}/auth/csrf-token`, {
        credentials: 'include'
      });
      const data = await res.json();
      const token = data.csrfToken || '';
      this.cachedCsrfToken = token;
      return token;
    } catch {
      return '';
    }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    const method = (options.method || 'GET').toUpperCase();
    const isMutating = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);

    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string>)
    };

    // Only set Content-Type to JSON if body is NOT FormData and not already set
    if (!(options.body instanceof FormData) && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    // Attach CSRF token on mutating requests
    if (isMutating) {
      let csrfToken = getCookie('csrf-token') || this.cachedCsrfToken;
      if (!csrfToken) {
        csrfToken = await this.fetchCsrfToken();
      }
      if (csrfToken) {
        headers['X-CSRF-Token'] = csrfToken;
      }
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        credentials: 'include', // Always send HTTP-only auth cookies
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      const json = await response.json().catch(() => null);

      if (!response.ok) {
        throw new ApiError(
          json?.message || `Request failed with status ${response.status}`,
          response.status,
          json
        );
      }

      return json as T;
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new ApiError('Request timed out', 408);
      }
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(error.message || 'Network communication error', 0);
    }
  }

  // Health
  public async getHealth(): Promise<HealthResponse> {
    return this.request<HealthResponse>('/health');
  }

  // Auth
  public async register(data: { name: string; email: string; password: string }): Promise<AuthResponse> {
    const res = await this.request<{ success: boolean; data: AuthResponse }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return res.data;
  }

  public async login(data: { email: string; password: string }): Promise<AuthResponse> {
    const res = await this.request<{ success: boolean; data: AuthResponse }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return res.data;
  }

  public async logout(): Promise<void> {
    this.cachedCsrfToken = null;
    await this.request<{ success: boolean }>('/auth/logout', { method: 'POST' });
  }

  public async getMe(): Promise<User> {
    const res = await this.request<{ success: boolean; data: { user: User } }>('/auth/me');
    return res.data.user;
  }

  // User Profile
  public async updateProfile(data: {
    name?: string;
    avatar?: string;
    preferredLanguage?: string;
    interests?: string[];
  }): Promise<User> {
    const res = await this.request<{ success: boolean; data: { user: User } }>('/users/me', {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
    return res.data.user;
  }

  public async uploadAvatar(file: File): Promise<User> {
    const formData = new FormData();
    formData.append('avatar', file);
    const res = await this.request<{ success: boolean; data: { user: User } }>('/users/me/avatar', {
      method: 'POST',
      body: formData
    });
    return res.data.user;
  }

  public async removeAvatar(): Promise<User> {
    const res = await this.request<{ success: boolean; data: { user: User } }>('/users/me/avatar', {
      method: 'DELETE'
    });
    return res.data.user;
  }

  public async changePassword(
    param1: string | { currentPassword: string; newPassword: string },
    param2?: string
  ): Promise<void> {
    const payload = typeof param1 === 'string'
      ? { currentPassword: param1, newPassword: param2! }
      : param1;
    await this.request<{ success: boolean }>('/users/me/change-password', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  // Admin User Management
  public async listUsers(params?: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    status?: string;
  }): Promise<{ users: User[]; pagination: Pagination }> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.search) searchParams.append('search', params.search);
    if (params?.role) searchParams.append('role', params.role);
    if (params?.status) searchParams.append('status', params.status);

    const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
    const res = await this.request<{ success: boolean; data: { users: User[]; pagination: Pagination } }>(
      `/users${query}`
    );
    return res.data;
  }

  public async getUsers(params?: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    status?: string;
  }): Promise<{ users: User[]; pagination: Pagination }> {
    return this.listUsers(params);
  }

  public async updateUser(
    id: string,
    data: { role?: 'user' | 'admin'; status?: 'active' | 'disabled' }
  ): Promise<User> {
    const res = await this.request<{ success: boolean; data: { user: User } }>(`/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
    return res.data.user;
  }

  public async deleteUser(id: string): Promise<void> {
    await this.request<{ success: boolean }>(`/users/${id}`, { method: 'DELETE' });
  }

  // Categories
  public async getCategories(status?: string): Promise<Category[]> {
    const query = status ? `?status=${status}` : '';
    const res = await this.request<{ success: boolean; data: { categories: Category[] } }>(
      `/categories${query}`
    );
    return res.data.categories;
  }

  public async createCategory(data: Partial<Category>): Promise<Category> {
    const res = await this.request<{ success: boolean; data: { category: Category } }>('/categories', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return res.data.category;
  }

  public async updateCategory(id: string, data: Partial<Category>): Promise<Category> {
    const res = await this.request<{ success: boolean; data: { category: Category } }>(`/categories/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
    return res.data.category;
  }

  public async deleteCategory(id: string): Promise<void> {
    await this.request<{ success: boolean }>(`/categories/${id}`, { method: 'DELETE' });
  }

  // Tags
  public async getTags(search?: string): Promise<Tag[]> {
    const query = search ? `?search=${encodeURIComponent(search)}` : '';
    const res = await this.request<{ success: boolean; data: { tags: Tag[] } }>(`/tags${query}`);
    return res.data.tags;
  }

  public async createTag(data: { name: string; slug?: string }): Promise<Tag> {
    const res = await this.request<{ success: boolean; data: { tag: Tag } }>('/tags', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return res.data.tag;
  }

  public async updateTag(id: string, data: { name?: string; slug?: string }): Promise<Tag> {
    const res = await this.request<{ success: boolean; data: { tag: Tag } }>(`/tags/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
    return res.data.tag;
  }

  public async deleteTag(id: string): Promise<void> {
    await this.request<{ success: boolean }>(`/tags/${id}`, { method: 'DELETE' });
  }

  // Languages
  public async getLanguages(status?: string): Promise<Language[]> {
    const query = status ? `?status=${status}` : '';
    const res = await this.request<{ success: boolean; data: { languages: Language[] } }>(
      `/languages${query}`
    );
    return res.data.languages;
  }

  public async createLanguage(data: { name: string; code: string; isDefault?: boolean; status?: 'active' | 'inactive' }): Promise<Language> {
    const res = await this.request<{ success: boolean; data: { language: Language } }>('/languages', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return res.data.language;
  }

  public async updateLanguage(
    id: string,
    data: { name?: string; code?: string; isDefault?: boolean; status?: 'active' | 'inactive' }
  ): Promise<Language> {
    const res = await this.request<{ success: boolean; data: { language: Language } }>(`/languages/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
    return res.data.language;
  }

  public async deleteLanguage(id: string): Promise<void> {
    await this.request<{ success: boolean }>(`/languages/${id}`, { method: 'DELETE' });
  }

  // Media Library
  public async getMedia(params: {
    page?: number;
    limit?: number;
    resourceType?: string;
    search?: string;
  } = {}): Promise<{ data: MediaAsset[]; pagination: Pagination }> {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.limit) searchParams.append('limit', params.limit.toString());
    if (params.resourceType) searchParams.append('resourceType', params.resourceType);
    if (params.search) searchParams.append('search', params.search);

    const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
    const res = await this.request<{
      success: boolean;
      data: MediaAsset[];
      pagination: Pagination;
    }>(`/media${query}`);
    return { data: res.data, pagination: res.pagination };
  }

  public async uploadMedia(
    file: File,
    options: { folder?: string; alt?: string; caption?: string } = {}
  ): Promise<MediaAsset> {
    const formData = new FormData();
    formData.append('file', file);
    if (options.folder) formData.append('folder', options.folder);
    if (options.alt) formData.append('alt', options.alt);
    if (options.caption) formData.append('caption', options.caption);

    const res = await this.request<{ success: boolean; data: MediaAsset }>('/media', {
      method: 'POST',
      body: formData
    });
    return res.data;
  }

  public async updateMedia(
    id: string,
    data: { alt?: string; caption?: string }
  ): Promise<MediaAsset> {
    const res = await this.request<{ success: boolean; data: MediaAsset }>(`/media/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
    return res.data;
  }

  public async deleteMedia(id: string): Promise<void> {
    await this.request<{ success: boolean }>(`/media/${id}`, { method: 'DELETE' });
  }

  // Posts CMS
  public async getPosts(params: {
    page?: number;
    limit?: number;
    status?: string;
    format?: string;
    category?: string;
    language?: string;
    search?: string;
  } = {}): Promise<{ data: Post[]; pagination: Pagination }> {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.limit) searchParams.append('limit', params.limit.toString());
    if (params.status) searchParams.append('status', params.status);
    if (params.format) searchParams.append('format', params.format);
    if (params.category) searchParams.append('category', params.category);
    if (params.language) searchParams.append('language', params.language);
    if (params.search) searchParams.append('search', params.search);

    const query = searchParams.toString() ? `?${searchParams.toString()}` : '';
    const res = await this.request<{
      success: boolean;
      data: Post[];
      pagination: Pagination;
    }>(`/posts${query}`);
    return { data: res.data, pagination: res.pagination };
  }

  public async getPost(id: string): Promise<Post> {
    const res = await this.request<{ success: boolean; data: Post }>(`/posts/${id}`);
    return res.data;
  }

  public async getPostPreview(tokenOrId: string): Promise<Post> {
    const res = await this.request<{ success: boolean; data: Post }>(`/posts/preview/${tokenOrId}`);
    return res.data;
  }

  public async createPost(data: any): Promise<Post> {
    const res = await this.request<{ success: boolean; data: Post }>('/posts', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    return res.data;
  }

  public async updatePost(id: string, data: any): Promise<Post> {
    const res = await this.request<{ success: boolean; data: Post }>(`/posts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
    return res.data;
  }

  public async deletePost(id: string, permanent = false): Promise<void> {
    const query = permanent ? '?permanent=true' : '';
    await this.request<{ success: boolean }>(`/posts/${id}${query}`, { method: 'DELETE' });
  }

  public async restorePost(id: string): Promise<Post> {
    const res = await this.request<{ success: boolean; data: Post }>(`/posts/${id}/restore`, {
      method: 'POST'
    });
    return res.data;
  }

  public async duplicatePost(id: string): Promise<Post> {
    const res = await this.request<{ success: boolean; data: Post }>(`/posts/${id}/duplicate`, {
      method: 'POST'
    });
    return res.data;
  }

  public async publishPost(id: string): Promise<Post> {
    const res = await this.request<{ success: boolean; data: Post }>(`/posts/${id}/publish`, {
      method: 'POST'
    });
    return res.data;
  }

  public async unpublishPost(id: string): Promise<Post> {
    const res = await this.request<{ success: boolean; data: Post }>(`/posts/${id}/unpublish`, {
      method: 'POST'
    });
    return res.data;
  }

  public async bulkUploadPosts(
    fileOrRows: File | any[],
    options: { action?: 'preview' | 'import'; targetStatus?: string } = {}
  ): Promise<any> {
    let body: any;
    if (fileOrRows instanceof File) {
      body = new FormData();
      body.append('file', fileOrRows);
      if (options.action) body.append('action', options.action);
      if (options.targetStatus) body.append('targetStatus', options.targetStatus);
    } else {
      body = JSON.stringify({
        rows: fileOrRows,
        action: options.action || 'preview',
        targetStatus: options.targetStatus || 'draft'
      });
    }

    const res = await this.request<{ success: boolean; [key: string]: any }>('/posts/bulk-upload', {
      method: 'POST',
      body
    });
    return res;
  }

  // ==========================================
  // Public Discovery & Engagement API
  // ==========================================

  public async getHomepageData(params?: { lang?: string }): Promise<HomepageData> {
    const query = new URLSearchParams();
    if (params?.lang) query.set('lang', params.lang);
    const res = await this.request<{ success: boolean; data: HomepageData }>(
      `/public/home${query.toString() ? `?${query.toString()}` : ''}`
    );
    return res.data;
  }

  public async getFeed(params?: {
    language?: string;
    category?: string;
    page?: number;
    limit?: number;
  }): Promise<{ posts: Post[]; pagination: Pagination; isPersonalized: boolean }> {
    const query = new URLSearchParams();
    if (params?.language) query.set('language', params.language);
    if (params?.category) query.set('category', params.category);
    if (params?.page) query.set('page', params.page.toString());
    if (params?.limit) query.set('limit', params.limit.toString());
    const res = await this.request<{
      success: boolean;
      data: { posts: Post[]; pagination: Pagination; isPersonalized: boolean };
    }>(`/public/feed${query.toString() ? `?${query.toString()}` : ''}`);
    return res.data;
  }

  public async getPublicPosts(params?: {
    language?: string;
    category?: string;
    page?: number;
    limit?: number;
  }): Promise<{ posts: Post[]; pagination: Pagination }> {
    const query = new URLSearchParams();
    if (params?.language) query.set('language', params.language);
    if (params?.category) query.set('category', params.category);
    if (params?.page) query.set('page', params.page.toString());
    if (params?.limit) query.set('limit', params.limit.toString());
    const res = await this.request<{
      success: boolean;
      data: { posts: Post[]; pagination: Pagination };
    }>(`/public/posts${query.toString() ? `?${query.toString()}` : ''}`);
    return res.data;
  }

  public async getPostBySlug(
    slug: string,
    lang?: string
  ): Promise<{
    post: Post;
    isGated?: boolean;
    relatedPosts?: Post[];
    prevPost?: Post | null;
    nextPost?: Post | null;
  }> {
    const url = `/public/posts/${slug}${lang ? `?lang=${encodeURIComponent(lang)}` : ''}`;
    const res = await this.request<{
      success: boolean;
      data: {
        post: Post;
        isGated?: boolean;
        relatedPosts?: Post[];
        prevPost?: Post | null;
        nextPost?: Post | null;
      };
    }>(url);
    return res.data;
  }

  public async recordView(id: string): Promise<void> {
    try {
      await this.request(`/public/posts/${id}/view`, { method: 'POST' });
    } catch {
      // Best-effort in-memory view count; ignore silent errors
    }
  }

  public async getCategoryPosts(
    slug: string,
    params?: { page?: number; limit?: number; lang?: string }
  ): Promise<{ category: Category; posts: Post[]; pagination: Pagination }> {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', params.page.toString());
    if (params?.limit) query.set('limit', params.limit.toString());
    if (params?.lang) query.set('lang', params.lang);
    const res = await this.request<{
      success: boolean;
      data: { category: Category; posts: Post[]; pagination: Pagination };
    }>(`/public/categories/${slug}/posts${query.toString() ? `?${query.toString()}` : ''}`);
    return res.data;
  }

  public async getLatestPosts(params?: {
    page?: number;
    limit?: number;
    lang?: string;
  }): Promise<{ posts: Post[]; pagination: Pagination }> {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', params.page.toString());
    if (params?.limit) query.set('limit', params.limit.toString());
    if (params?.lang) query.set('lang', params.lang);
    const res = await this.request<{
      success: boolean;
      data: { posts: Post[]; pagination: Pagination };
    }>(`/public/latest${query.toString() ? `?${query.toString()}` : ''}`);
    return res.data;
  }

  public async getTrendingPosts(params?: { limit?: number; lang?: string }): Promise<Post[]> {
    const query = new URLSearchParams();
    if (params?.limit) query.set('limit', params.limit.toString());
    if (params?.lang) query.set('lang', params.lang);
    const res = await this.request<{
      success: boolean;
      data: { posts: Post[]; window?: string } | Post[];
    }>(`/public/trending${query.toString() ? `?${query.toString()}` : ''}`);
    if (Array.isArray(res.data)) {
      return res.data;
    }
    return res.data?.posts || [];
  }

  public async getVideoPosts(params?: {
    page?: number;
    limit?: number;
  }): Promise<{ posts: Post[]; pagination: Pagination }> {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', params.page.toString());
    if (params?.limit) query.set('limit', params.limit.toString());
    const res = await this.request<{
      success: boolean;
      data: { posts: Post[]; pagination: Pagination };
    }>(`/public/videos${query.toString() ? `?${query.toString()}` : ''}`);
    return res.data;
  }

  public async searchPosts(
    searchQuery: string,
    params?: { page?: number; limit?: number }
  ): Promise<{ posts: Post[]; pagination: Pagination; query: string }> {
    const query = new URLSearchParams();
    query.set('q', searchQuery);
    if (params?.page) query.set('page', params.page.toString());
    if (params?.limit) query.set('limit', params.limit.toString());
    const res = await this.request<{
      success: boolean;
      data: { posts: Post[]; pagination: Pagination; query: string };
    }>(`/public/search?${query.toString()}`);
    return res.data;
  }

  public async likePost(id: string): Promise<{ likeCount: number }> {
    const res = await this.request<{ success: boolean; data: { likeCount: number } }>(
      `/engagement/posts/${id}/like`,
      { method: 'POST' }
    );
    return res.data;
  }

  public async unlikePost(id: string): Promise<{ likeCount: number }> {
    const res = await this.request<{ success: boolean; data: { likeCount: number } }>(
      `/engagement/posts/${id}/like`,
      { method: 'DELETE' }
    );
    return res.data;
  }

  public async bookmarkPost(id: string): Promise<void> {
    await this.request(`/engagement/posts/${id}/bookmark`, { method: 'POST' });
  }

  public async removeBookmark(id: string): Promise<void> {
    await this.request(`/engagement/posts/${id}/bookmark`, { method: 'DELETE' });
  }

  public async getUserBookmarks(params?: {
    page?: number;
    limit?: number;
  }): Promise<{ bookmarks: Post[]; pagination: Pagination }> {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', params.page.toString());
    if (params?.limit) query.set('limit', params.limit.toString());
    const res = await this.request<{
      success: boolean;
      data: { bookmarks: Post[]; pagination: Pagination };
    }>(`/users/me/bookmarks${query.toString() ? `?${query.toString()}` : ''}`);
    return res.data;
  }

  public async getUserLikes(params?: {
    page?: number;
    limit?: number;
  }): Promise<{ likes: Post[]; pagination: Pagination }> {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', params.page.toString());
    if (params?.limit) query.set('limit', params.limit.toString());
    const res = await this.request<{
      success: boolean;
      data: { likes: Post[]; pagination: Pagination };
    }>(`/users/me/likes${query.toString() ? `?${query.toString()}` : ''}`);
    return res.data;
  }

  public async getComments(
    postId: string,
    params?: { page?: number; limit?: number }
  ): Promise<{ comments: Comment[]; pagination: Pagination }> {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', params.page.toString());
    if (params?.limit) query.set('limit', params.limit.toString());
    const res = await this.request<{
      success: boolean;
      data: { comments: Comment[]; pagination: Pagination };
    }>(`/engagement/posts/${postId}/comments${query.toString() ? `?${query.toString()}` : ''}`);
    return res.data;
  }

  public async createComment(postId: string, content: string): Promise<{ comment: Comment; commentCount: number }> {
    const res = await this.request<{
      success: boolean;
      data: { comment: Comment; commentCount: number };
    }>(`/engagement/posts/${postId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content })
    });
    return res.data;
  }

  public async deleteComment(id: string): Promise<void> {
    await this.request(`/engagement/comments/${id}`, { method: 'DELETE' });
  }

  public async votePoll(postId: string, optionId: string): Promise<PollVoteResult> {
    const res = await this.request<{
      success: boolean;
      data: PollVoteResult;
    }>(`/engagement/posts/${postId}/poll/vote`, {
      method: 'POST',
      body: JSON.stringify({ optionId })
    });
    return res.data;
  }

  public async getPollResults(postId: string): Promise<PollVoteResult> {
    const res = await this.request<{
      success: boolean;
      data: PollVoteResult;
    }>(`/engagement/posts/${postId}/poll/results`);
    return res.data;
  }

  public async updatePreferences(data: {
    preferredLanguage?: string;
    interests?: string[];
  }): Promise<{ user: User }> {
    const res = await this.request<{
      success: boolean;
      data: { user: User };
    }>('/users/me/preferences', {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
    return res.data;
  }

  public async getAdminDashboardStats(): Promise<any> {
    const res = await this.request<{
      success: boolean;
      data: any;
    }>('/posts/admin/stats');
    return res.data;
  }

  public async getAdminComments(params?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<{ comments: Comment[]; pagination: Pagination }> {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', params.page.toString());
    if (params?.limit) query.set('limit', params.limit.toString());
    if (params?.status) query.set('status', params.status);
    const res = await this.request<{
      success: boolean;
      data: { comments: Comment[]; pagination: Pagination };
    }>(`/engagement/admin/comments${query.toString() ? `?${query.toString()}` : ''}`);
    return res.data;
  }

  public async updateAdminCommentStatus(
    id: string,
    status: 'visible' | 'hidden' | 'deleted'
  ): Promise<Comment> {
    const res = await this.request<{
      success: boolean;
      message: string;
      data: Comment;
    }>(`/engagement/admin/comments/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
    return res.data;
  }
}

export const apiClient = new ApiClient(env.API_BASE_URL);

