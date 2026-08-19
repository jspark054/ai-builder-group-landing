import type { MetadataRoute } from 'next';

import { projectUrl } from '@/lib/jsonld';
import { getPublicBuilderSlugs } from '@/lib/queries/builder-detail';
import { getPublicProjectSlugs } from '@/lib/queries/project-detail';
import { absoluteUrl, siteUrl } from '@/lib/site';

/**
 * 공개 화면 사이트맵.
 *
 * 정적 경로 + **P-04 `/portfolio/{slug}` · P-06 `/builders/{slug}` 공개분**을 싣는다.
 * 남은 상세 화면(P-13 `/insights/{slug}`)은 그 화면을 만들 때 같은 방식으로 추가한다.
 *
 * 비공개 프로젝트·빌더는 쿼리가 이미 걸러 준다 — 화면설계 §5.3 「비공개·없는
 * 슬러그는 404 반환. **sitemap 제외**」가 여기 걸리는 조항이고, P-06 은 담당
 * 프로젝트 0건도 같이 빠진다 (POL-02).
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

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const lastModified = new Date();

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((route) => ({
    url: route.path === '/' ? siteUrl : `${siteUrl}${route.path}`,
    lastModified,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  // 색인 우선순위 1위 화면이라 목록(0.9)보다 낮추지 않는다.
  // 한글 슬러그는 projectUrl 이 인코딩한다 — 사이트맵에 원문 한글을 그대로 실으면
  // 색인기가 주소를 못 읽는 경우가 있다
  const projectEntries: MetadataRoute.Sitemap = (await getPublicProjectSlugs()).map((slug) => ({
    url: projectUrl(slug),
    lastModified,
    changeFrequency: 'monthly',
    priority: 0.8,
  }));

  // 영업이 단독 전달하는 자료라 프로젝트 상세와 같은 무게로 둔다 (화면설계 §5.5)
  const builderEntries: MetadataRoute.Sitemap = (await getPublicBuilderSlugs()).map((slug) => ({
    url: absoluteUrl(`/builders/${encodeURIComponent(slug)}`),
    lastModified,
    changeFrequency: 'monthly',
    priority: 0.8,
  }));

  return [...staticEntries, ...projectEntries, ...builderEntries];
}
