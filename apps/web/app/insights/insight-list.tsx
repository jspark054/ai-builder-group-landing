// P-12 목록 본체 — `/insights` 와 `/insights/{category}` 가 함께 쓴다.
//
// 근거 — 화면설계 §5.11 · 기능명세 §4.11
//   FN-P12-02  카테고리 3종 필터를 표시한다
//   FN-P12-03  **카테고리 선택 시 고유 경로로 이동한다. JS 상태로만 처리하지 않는다**
//   FN-P12-04  글이 없을 때 빈 상태 문구
//   FN-P12-07  **문의 CTA 를 두지 않는다** (REQ-F-007 경쟁 CTA 금지)
//
// 탭이 링크인 것이 요구사항이다. 클라이언트 상태로 거르면 주소가 그대로라 GA4 페이지뷰가
// 갈리지 않고 카테고리 페이지가 색인되지도 않는다.
//
// 서버 컴포넌트다. 'use client' 를 붙일 이유가 없다 — 상호작용이 링크뿐이다.

import Link from 'next/link';

import type { InsightCategory } from '@orca/supabase';

import { InsightCard } from '@/components/cards/insight-card';
import type { InsightCardData } from '@/lib/queries/insights';

import { CATEGORY_LABEL, CATEGORY_ORDER, p12Copy } from './p12-copy';

const TAB_BASE =
  'rounded-pill border px-[var(--space-4)] py-[var(--space-2)] text-[length:var(--font-size-sm)] font-medium transition-colors';

export function InsightList({
  cards,
  active,
}: {
  cards: InsightCardData[];
  /** 전체 목록이면 undefined */
  active?: InsightCategory;
}) {
  return (
    <div className="bg-surface-raised text-ink">
      <div className="mx-auto w-full max-w-[var(--layout-container)] px-[var(--layout-gutter)] py-[var(--section-block)]">
        {/* FN-P12-02 · 03 — 탭은 고유 경로다 */}
        <nav aria-label="카테고리" className="flex flex-wrap gap-[var(--space-2)]">
          <Link
            href="/insights"
            aria-current={active === undefined ? 'page' : undefined}
            className={
              TAB_BASE +
              (active === undefined
                ? ' border-ink bg-ink text-ink-inverse'
                : ' border-border bg-surface-raised text-muted hover:text-ink')
            }
          >
            {p12Copy.allTab}
          </Link>

          {CATEGORY_ORDER.map((category) => (
            <Link
              key={category}
              href={`/insights/${category}`}
              aria-current={active === category ? 'page' : undefined}
              className={
                TAB_BASE +
                (active === category
                  ? ' border-ink bg-ink text-ink-inverse'
                  : ' border-border bg-surface-raised text-muted hover:text-ink')
              }
            >
              {CATEGORY_LABEL[category]}
            </Link>
          ))}
        </nav>

        {cards.length === 0 ? (
          // POL 정책정의 §290 · §291 — 화면을 숨기지 않고 문구를 표시한다
          <p className="mt-[var(--space-8)] text-muted text-[length:var(--font-size-md)] leading-[var(--leading-relaxed)]">
            {active === undefined ? p12Copy.emptyAll : p12Copy.emptyCategory}
          </p>
        ) : (
          <ul className="mt-[var(--space-8)] grid gap-[var(--space-5)] md:grid-cols-2 lg:grid-cols-3">
            {cards.map((card) => (
              <li key={card.slug} className="h-full">
                <InsightCard data={card} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
