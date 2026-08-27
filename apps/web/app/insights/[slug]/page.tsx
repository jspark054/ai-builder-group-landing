// P-13 인사이트 상세 `/insights/{slug}` + 카테고리 목록 `/insights/{category}`
//
// 근거 — 화면설계 §5.12 · 기능명세 §4.12 · IA §4 예약어 규칙 · 하드룰 6
//   FN-P13-01  본문을 표시한다
//   FN-P13-02  작성 빌더의 실명 바이라인
//   FN-P13-03  바이라인에서 P-06 으로 이동한다
//   FN-P13-04  경로는 `/insights/{slug}` · **한글 슬러그 허용**
//   FN-P13-05  본문 첫 이미지를 OG 썸네일로
//   FN-P13-06  같은 카테고리의 다른 글
//   FN-P13-07  하단 마이크로카피는 **일반 텍스트**
//
// 🔴 **한 라우트가 둘을 받는다** (하드룰 6).
//    `before` · `process` · `people` 은 카테고리 전용 예약어다. **예약어를 먼저 카테고리로
//    해석하고, 그 외를 글 슬러그로 해석한다.** 순서를 뒤집으면 그 슬러그를 가진 글이
//    카테고리 목록을 가린다. DB CHECK(`insight_slug_not_reserved`)와 A-07 입력 검증이
//    글 슬러그로는 예약어가 저장되지 않게 막지만, 라우팅 순서도 함께 지켜야 한다.
//
// ⚠ **Next 16 은 `params` 를 디코딩해 주지 않는다.** 슬러그가 자연어 한글이라
//   (REQ-N-013) 들어오는 값은 퍼센트 인코딩 상태다. 그대로 조회하면 전 건 404 다 —
//   P-04 와 같은 방식으로 되돌린다.

import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import type { InsightCategory } from '@orca/supabase';

import { InsightCard } from '@/components/cards/insight-card';
import { articleJsonLd, insightUrl } from '@/lib/jsonld';
import { renderMarkdown } from '@/lib/markdown';
import {
  getInsightCards,
  getInsightDetail,
  getPublicInsightSlugs,
  getRelatedInsights,
} from '@/lib/queries/insights';
import { siteLocale } from '@/lib/site';

import { CATEGORY_LABEL, CATEGORY_ORDER } from '../p12-copy';
import { InsightList } from '../insight-list';
import { p13Copy } from './p13-copy';

/** P-12 와 같은 주기다. 목록과 상세의 신선도가 갈리면 내용이 어긋난다 */
export const revalidate = 60;

const CONTAINER = 'mx-auto w-full max-w-[var(--layout-container)] px-[var(--layout-gutter)]';

function isCategory(value: string): value is InsightCategory {
  return (CATEGORY_ORDER as string[]).includes(value);
}

/** 라우트 파라미터를 DB 의 슬러그 값으로 되돌린다 (P-04 의 decodeSlug 와 같은 이유) */
function decodeSlug(raw: string): string {
  try {
    return decodeURIComponent(raw);
  } catch {
    // 반쪽짜리 `%` 가 든 주소는 URIError 를 던진다. 원문 그대로 조회해 404 로 수렴시킨다
    return raw;
  }
}

/**
 * 카테고리 3종 + 발행된 글을 빌드 시점에 굳힌다.
 *
 * 목록이 비어도(로컬 빌드처럼 Supabase 미설정) 카테고리 셋은 남는다 —
 * 글이 0건이어도 카테고리 화면은 빈 상태 문구를 렌더해야 한다 (정책정의 §291).
 */
export async function generateStaticParams(): Promise<{ slug: string }[]> {
  const slugs = await getPublicInsightSlugs();
  return [...CATEGORY_ORDER, ...slugs].map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const raw = decodeSlug((await params).slug);

  if (isCategory(raw)) {
    return {
      title: CATEGORY_LABEL[raw],
      alternates: { canonical: `/insights/${raw}` },
    };
  }

  const insight = await getInsightDetail(raw);
  // 404 로 갈 경로에는 메타를 만들지 않는다. 레이아웃 기본값이 남는다
  if (!insight) return {};

  // A-07 에서 입력한 값이 있으면 그것이 우선이다 (FN-A07-06).
  // 없으면 제목을 쓰고, 설명은 만들지 않는다 — 본문에서 잘라 오면 문장 중간이 끊긴다
  const title = insight.metaTitle ?? insight.title;
  const description = insight.metaDescription ?? undefined;

  return {
    title: { absolute: title },
    ...(description ? { description } : {}),
    alternates: { canonical: insightUrl(insight.slug) },
    openGraph: {
      type: 'article',
      title,
      ...(description ? { description } : {}),
      url: insightUrl(insight.slug),
      // FN-P13-05 — 본문 첫 이미지가 OG 썸네일이다. 저장 시점에 굳혀 둔 값을 쓴다
      ...(insight.coverImageUrl ? { images: [{ url: insight.coverImageUrl }] } : {}),
    },
  };
}

export default async function InsightDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const raw = decodeSlug((await params).slug);

  // ── 예약어 먼저 (하드룰 6) ──────────────────────────────────────────────
  if (isCategory(raw)) {
    const cards = await getInsightCards(raw);
    return <InsightList cards={cards} active={raw} />;
  }

  // ── 그 외는 글 슬러그 ───────────────────────────────────────────────────
  const insight = await getInsightDetail(raw);
  if (!insight) notFound();

  const related = await getRelatedInsights(insight.category, insight.slug);
  const bodyHtml = renderMarkdown(insight.body);

  const jsonLd = articleJsonLd({
    slug: insight.slug,
    title: insight.title,
    description: insight.metaDescription ?? insight.title,
    author: insight.builderName,
    publishedAt: insight.publishedAt,
    updatedAt: insight.updatedAt,
    category: CATEGORY_LABEL[insight.category],
    ...(insight.coverImageUrl ? { coverImageUrl: insight.coverImageUrl } : {}),
    locale: siteLocale,
  });

  return (
    <>
      <script
        type="application/ld+json"
        // 생성기가 만든 객체만 넣는다. 사용자 입력을 문자열로 이어 붙이지 않는다
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* 디자인규칙 「다른 공개 화면」 — 페이지 헤더 bg-canvas + text-ink-inverse */}
      <header className="bg-canvas text-ink-inverse">
        <div className={`${CONTAINER} py-[var(--section-block)]`}>
          <Link
            href="/insights"
            className="inline-flex min-h-11 items-center text-subtle text-[length:var(--font-size-sm)] hover:text-ink-inverse focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            ← {p13Copy.backToList}
          </Link>

          <p className="mt-[var(--space-4)] text-[length:var(--font-size-sm)] text-subtle">
            {CATEGORY_LABEL[insight.category]}
          </p>

          <h1 className="mt-[var(--space-2)] max-w-[var(--layout-content)] font-bold text-[length:var(--font-size-display-md)] leading-[var(--leading-tight)] tracking-[var(--tracking-tight)]">
            {insight.title}
          </h1>

          {/* FN-P13-02 · 03 — 실명 바이라인이고 P-06 으로 간다.
              콘텐츠 내부 링크라 REQ-F-007(경쟁 CTA 금지)에 걸리지 않는다 */}
          <p className="mt-[var(--space-5)] text-[length:var(--font-size-md)]">
            {/* ⚠ 도면(§5.12)은 `{빌더명} · {담당 역할}` 인데 `builder` 에 역할 컬럼이 없다.
                지어내지 않고 이름만 둔다 — 근거는 lib/queries/insights.ts 주석 */}
            <Link
              href={`/builders/${insight.builderSlug}`}
              className="font-semibold underline underline-offset-4 hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              {insight.builderName}
            </Link>
          </p>
          <p className="mt-[var(--space-2)] text-subtle text-[length:var(--font-size-sm)]">
            {p13Copy.builderNote}
          </p>
        </div>
      </header>

      <div className="bg-surface-raised text-ink">
        <div className={`${CONTAINER} py-[var(--section-block)]`}>
          {/* FN-P13-01 — 본문.
              🔴 렌더 직전에 sanitize 한다 (lib/markdown.ts). 작성자가 관리자뿐인 것은
                 방어가 아니라 가정이다 */}
          <article
            className="insight-body max-w-[var(--layout-copy)]"
            dangerouslySetInnerHTML={{ __html: bodyHtml }}
          />

          {/* FN-P13-07 — **일반 텍스트다.** 링크·버튼으로 만들지 않는다 */}
          <p className="mt-[var(--space-8)] max-w-[var(--layout-copy)] border-t border-border pt-[var(--space-6)] text-muted text-[length:var(--font-size-md)] leading-[var(--leading-relaxed)]">
            {p13Copy.bodyFooter}
          </p>

          {/* FN-P13-06 — 없으면 블록 자체를 두지 않는다 (POL-02) */}
          {related.length > 0 && (
            <section className="mt-[var(--section-block)]">
              <h2 className="font-semibold text-[length:var(--font-size-xl)] leading-[var(--leading-heading)]">
                {p13Copy.relatedHeading}
              </h2>
              <ul className="mt-[var(--space-6)] grid gap-[var(--space-5)] md:grid-cols-2 lg:grid-cols-3">
                {related.map((card) => (
                  <li key={card.slug} className="h-full">
                    <InsightCard data={card} />
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </>
  );
}
