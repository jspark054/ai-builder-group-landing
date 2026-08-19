/**
 * JSON-LD 생성기.
 *
 * 답변엔진은 본문보다 이 구조화 데이터를 먼저 읽는다 (REQ-N-001 · GEO).
 * 템플릿의 `packages/content/src/jsonld.ts` 에서 옮겨 왔고, 삭제된 파일 기반
 * `Post` 스키마 대신 **이 파일이 필요로 하는 필드만** 로컬 타입으로 받는다.
 * insight 테이블 스키마가 확정되면 아래 입력 타입을 그쪽에 맞춰 좁힌다.
 */

import { siteName, siteUrl } from '@/lib/site';

export interface ArticleJsonLdInput {
  slug: string;
  title: string;
  description: string;
  author: string;
  publishedAt: string;
  updatedAt: string;
  /** 표지 이미지 경로. 사이트 루트 기준(`/images/...`) 또는 절대 URL. */
  coverImageUrl?: string | undefined;
  category?: string | undefined;
  keywords?: readonly string[] | undefined;
  locale?: string | undefined;
  /** 답변엔진이 인용하기 좋은 2~3문장 요약. */
  answerSummary?: string | undefined;
  entities?: readonly string[] | undefined;
  citations?: readonly { title: string; url: string }[] | undefined;
}

export interface FaqItem {
  question: string;
  answer: string;
}

/** 인사이트 상세 URL (P-13). */
export function insightUrl(slug: string): string {
  return `${siteUrl}/insights/${encodeURIComponent(slug)}`;
}

function absolute(pathOrUrl: string): string {
  if (/^https?:\/\//.test(pathOrUrl)) return pathOrUrl;
  return `${siteUrl}${pathOrUrl.startsWith('/') ? '' : '/'}${pathOrUrl}`;
}

/** BlogPosting JSON-LD. 편집자가 채운 GEO 필드는 빠짐없이 여기 드러나야 한다. */
export function articleJsonLd(article: ArticleJsonLdInput): Record<string, unknown> {
  const keywords = article.keywords ?? [];
  const entities = article.entities ?? [];
  const citations = article.citations ?? [];

  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: article.title,
    description: article.description,
    datePublished: article.publishedAt,
    dateModified: article.updatedAt,
    inLanguage: article.locale ?? 'ko-KR',
    author: { '@type': 'Person', name: article.author },
    mainEntityOfPage: { '@type': 'WebPage', '@id': insightUrl(article.slug) },
    ...(keywords.length ? { keywords: keywords.join(', ') } : {}),
    ...(article.category ? { articleSection: article.category } : {}),
    ...(article.coverImageUrl ? { image: [absolute(article.coverImageUrl)] } : {}),
    ...(article.answerSummary ? { abstract: article.answerSummary } : {}),
    ...(entities.length ? { about: entities.map((name) => ({ '@type': 'Thing', name })) } : {}),
    ...(citations.length
      ? { citation: citations.map((c) => ({ '@type': 'CreativeWork', name: c.title, url: c.url })) }
      : {}),
  };
}

/** P-04 프로젝트 상세 URL. 슬러그가 자연어 한글이라 인코딩이 필수다 (REQ-N-013). */
export function projectUrl(slug: string): string {
  return `${siteUrl}/portfolio/${encodeURIComponent(slug)}`;
}

export interface ProjectArticleJsonLdInput {
  slug: string;
  title: string;
  description: string;
  /** 대표 이미지. 사이트 루트 기준(`/images/...`) 또는 절대 URL (FN-P04-02) */
  imageUrl: string;
  publishedAt: string;
  updatedAt: string;
  /** 담당 빌더 표기명. 비면 author 를 조직 명의로 낸다 (FN-P04-07) */
  authorNames?: readonly string[] | undefined;
  /** 분류명. 배지에 뜨는 값 그대로다 (화면설계 §5.3) */
  categories?: readonly string[] | undefined;
  locale?: string | undefined;
}

/**
 * FN-P04-10 — P-04 구조화 데이터 `Article`.
 *
 * `articleJsonLd()` 를 쓰지 않는 이유가 둘이다.
 *   1) 그쪽은 `@type: 'BlogPosting'` 이고 FN-P04-10 이 요구하는 것은 `Article` 이다
 *   2) `mainEntityOfPage` 를 `insightUrl()`(`/insights/{slug}`)로 굳혀 둬서
 *      포트폴리오 주소를 낼 수 없다
 * 그래서 같은 파일 안에 별도 함수를 둔다. 새 라이브러리는 도입하지 않는다.
 *
 * `author` — 담당 빌더가 있으면 Person 배열, 없으면 조직 명의다. 실명·닉네임 구분 없이
 * 표기명을 그대로 싣는다 (POL-12). 이력·소개는 넣지 않는다 (POL-05).
 */
export function projectArticleJsonLd(project: ProjectArticleJsonLdInput): Record<string, unknown> {
  const authorNames = project.authorNames ?? [];
  const categories = project.categories ?? [];
  const url = projectUrl(project.slug);

  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: project.title,
    description: project.description,
    datePublished: project.publishedAt,
    dateModified: project.updatedAt,
    inLanguage: project.locale ?? 'ko-KR',
    url,
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    image: [absolute(project.imageUrl)],
    author:
      authorNames.length > 0
        ? authorNames.map((name) => ({ '@type': 'Person', name }))
        : { '@type': 'Organization', name: siteName },
    publisher: { '@type': 'Organization', name: siteName },
    ...(categories.length ? { articleSection: categories.join(', ') } : {}),
  };
}

/** FAQPage JSON-LD — Q&A 가 실제로 있을 때만 내보낸다. */
export function faqJsonLd(items: readonly FaqItem[]): Record<string, unknown> | null {
  if (items.length === 0) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  };
}
