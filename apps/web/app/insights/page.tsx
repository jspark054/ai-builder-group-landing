// P-12 인사이트 목록 `/insights`
//
// 근거 — 화면설계 §5.11 · 기능명세 §4.11 · 정책정의 §290
//
// 8/20 에는 콘텐츠 대기 화면이었다. A-07(인사이트 관리)이 붙어 글이 들어올 수 있게 되면서
// 실목록으로 바꿨다. **헤더 카피는 그대로 둔다** — 목록이 붙었다고 바꿀 이유가 없고,
// 화면설계 §5.11 의 H1 은 기획-2안이라 확정이 아니다 (결정시트 `I-7`).
//
// **글이 0건이어도 화면을 숨기지 않는다** (POL-02 의 v3.1 예외 · 정책정의 §290).
//
// 근거 — 디자인규칙 「다른 공개 화면 (P-03 ~ P-13)」
//   페이지 헤더 = bg-canvas + text-ink-inverse (components/layout/PageHeader.tsx)
//   본문 전체   = bg-surface-raised
//
// 서버 컴포넌트다. 콘텐츠를 담은 HTML 이 그대로 나간다 (REQ-N-001).

import type { Metadata } from 'next';

import { PageHeader } from '@/components/layout/PageHeader';
import { insightsPendingCopy } from '@/content/pending-screens-copy';
import { getInsightCards } from '@/lib/queries/insights';

import { InsightList } from './insight-list';

/**
 * IA §3.1 — 렌더링 `SSG+ISR`.
 *
 * 다른 공개 화면은 3600 인데 여기만 60 이다. **발주사가 직접 쓰는 지면**이라서다 —
 * 글을 올리고 한 시간을 기다리면 안 올라간 줄 알고 다시 저장하게 된다.
 * 빌더·포트폴리오는 우리가 넣는 데이터라 사정이 다르다.
 *
 * ⚠ 관리 앱(:3001)은 별도 배포라 `revalidatePath` 가 이 앱에 닿지 않는다.
 *   즉시 반영이 필요해지면 web 에 on-demand revalidate 엔드포인트를 두고 A-07 저장
 *   액션에서 부르면 된다 — 이 구조를 바꾸지 않고 얹힌다.
 */
export const revalidate = 60;

export const metadata: Metadata = {
  title: '인사이트',
  description: insightsPendingCopy.metaDescription,
  alternates: { canonical: '/insights' },
};

export default async function InsightsPage() {
  const cards = await getInsightCards();

  return (
    <>
      <PageHeader
        headingLines={insightsPendingCopy.headingLines}
        tagline={insightsPendingCopy.tagline}
        subtitle={insightsPendingCopy.subtitle}
      />
      <InsightList cards={cards} />
    </>
  );
}
