/**
 * Centralized Social Media Configuration for The News Report
 * 
 * PLACEHOLDER DESTINATIONS:
 * The following URLs are clearly marked placeholder destinations.
 * When the client provides verified official social media handles,
 * update the `url` properties below.
 */

export interface SocialLinkConfig {
  id: 'x' | 'facebook' | 'youtube' | 'linkedin';
  name: string;
  label: string;
  url: string;
  isConfigured: boolean;
}

export const OFFICIAL_SOCIAL_LINKS: SocialLinkConfig[] = [
  {
    id: 'x',
    name: 'X',
    label: 'Visit The News Report on X (Placeholder)',
    url: 'https://x.com/the_news_report_official_placeholder',
    isConfigured: false
  },
  {
    id: 'facebook',
    name: 'Facebook',
    label: 'Visit The News Report on Facebook (Placeholder)',
    url: 'https://facebook.com/the_news_report_official_placeholder',
    isConfigured: false
  },
  {
    id: 'youtube',
    name: 'YouTube',
    label: 'Visit The News Report on YouTube (Placeholder)',
    url: 'https://youtube.com/@the_news_report_official_placeholder',
    isConfigured: false
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    label: 'Visit The News Report on LinkedIn (Placeholder)',
    url: 'https://linkedin.com/company/the-news-report-official-placeholder',
    isConfigured: false
  }
];
