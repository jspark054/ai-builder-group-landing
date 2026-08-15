/**
 * JSON-LD 생성기.
 *
 * 답변엔진은 본문보다 이 구조화 데이터를 먼저 읽는다 (REQ-N-001 · GEO).
 * 템플릿의 `packages/content/src/jsonld.ts` 에서 옮겨 왔고, 삭제된 파일 기반
 * `Post` 스키마 대신 **이 파일이 필요로 하는 필드만** 로컬 타입으로 받는다.
 * insight 테이블 스키마가 확정되면 아래 입력 타입을 그쪽에 맞춰 좁힌다.
 */

import { siteUrl } from '@/lib/site';

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
