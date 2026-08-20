// P-12 인사이트 목록 `/insights`
//
// 콘텐츠 대기 화면이다. 글 본문과 커버 이미지는 발주사가 작성한다.
//
// 이 화면을 지금 세우는 이유 — 헤더 GNB(Header.tsx)가 이 경로를 가리키는데 없어서
// 404 였다. app/sitemap.ts 도 `/insights` 를 색인 대상으로 싣고 있다.
//
// 목록을 만들지 않는다. 발행된 글이 0건이라 빈 목록이 되고, 빈 요소를 렌더하지
// 않는 것이 POL-02 다. 목록 컴포넌트는 첫 글이 들어올 때 만든다.
//
// 카테고리 예약어(`before` · `process` · `people`) 라우팅은 이번 범위가 아니다.
// `/insights` 한 경로만 연다 — 예약어를 카테고리로 먼저 해석하는 규칙은 상세
// 라우트(`/insights/[...slug]`)를 세울 때 DB CHECK · A-07 입력 검증과 함께 넣는다.
//
// 근거 — 디자인규칙 「다른 공개 화면 (P-03 ~ P-13)」
//   페이지 헤더 = bg-canvas + text-ink-inverse (components/layout/PageHeader.tsx)
//   본문 전체   = bg-surface-raised
//
// 서버 컴포넌트다. 정적 문구뿐이라 콘텐츠를 담은 HTML 이 그대로 나간다 (REQ-N-001).
// 로딩 스켈레톤을 두지 않는다 — 불러올 것이 없다.

import type { Metadata } from 'next';

import { PageHeader } from '@/components/layout/PageHeader';
import { insightsPendingCopy } from '@/content/pending-screens-copy';

export const metadata: Metadata = {
  title: '인사이트',
  // 본문과 별개 문장이다 — POL-06 메타 길이(80~110자)를 본문이 채우지 못한다.
  // 두 문장이 같은 사실을 말하도록 유지한다 (content/pending-screens-copy.ts 참조)
  description: insightsPendingCopy.metaDescription,
  alternates: { canonical: '/insights' },
};

export default function InsightsPage() {
  return (
    <>
      <PageHeader
        headingLines={insightsPendingCopy.headingLines}
        tagline={insightsPendingCopy.tagline}
        subtitle={insightsPendingCopy.subtitle}
      />

      <div className="bg-surface-raised text-ink">
        <div className="mx-auto w-full max-w-[var(--layout-container)] px-[var(--layout-gutter)] py-[var(--section-block)]">
          {/* 목록이 들어올 자리다. 지금은 안내 한 문단뿐이다 */}
          <p className="max-w-[var(--layout-copy)] text-muted text-[length:var(--font-size-md)] leading-[var(--leading-relaxed)]">
            {insightsPendingCopy.bodyLines[0]}
          </p>
        </div>
      </div>
    </>
  );
}
