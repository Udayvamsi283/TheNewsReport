const defaultApiUrl = import.meta.env.DEV ? 'http://localhost:5000/api/v1' : '/api/v1';

export const env = {
  API_BASE_URL: (import.meta.env.VITE_API_BASE_URL || defaultApiUrl).replace(/\/+$/, ''),
  SITE_URL: (import.meta.env.VITE_SITE_URL || '').replace(/\/+$/, ''),
  IS_DEV: import.meta.env.DEV,
  IS_PROD: import.meta.env.PROD
};
