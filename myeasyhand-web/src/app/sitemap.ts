import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/constants';

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages = [
    '',
    '/services',
    '/categories',
    '/businesses',
    '/about',
    '/contact',
    '/faq',
    '/terms',
    '/privacy',
    '/refund-policy',
    '/careers',
    '/blog',
    '/partner',
  ];

  return staticPages.map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: new Date(),
    changeFrequency: path === '' ? 'daily' : 'weekly',
    priority: path === '' ? 1 : 0.8,
  }));
}
