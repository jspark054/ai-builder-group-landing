import type { MetadataRoute } from 'next';

import { siteUrl } from '@/lib/site';

/**
 * 공개 화면 사이트맵.
 *
 * 지금은 확정 IA(`4_02_화면목록`)의 **정적 경로만** 싣는다.
 * 상세 화면(P-04 `/portfolio/{slug}` · P-06 `/builders/{slug}` ·
 * P-13 `/insights/{slug}`)은 Supabase 스키마가 붙은 뒤 여기에 추가한다.
 *
 * 범위 밖: P-07 `/courses`(화면 19종에서 제외). P-02 `/about` 은 미구현이라 뺐다.
 */
const STATIC_ROUTES: { path: string; changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency']; priority: number }[] = [
  { path: '/', changeFrequency: 'daily', priority: 1 },
  { path: '/portfolio', changeFrequency: 'weekly', priority: 0.9 },
  { path: '/builders', changeFrequency: 'weekly', priority: 0.9 },
  { path: '/process', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/insights', changeFrequency: 'weekly', priority: 0.7 },
  { path: '/contact', changeFrequency: 'monthly', priority: 0.6 },
  { path: '/privacy', changeFrequency: 'yearly', priority: 0.3 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return STATIC_ROUTES.map((route) => ({
    url: route.path === '/' ? siteUrl : `${siteUrl}${route.path}`,
    lastModified,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
