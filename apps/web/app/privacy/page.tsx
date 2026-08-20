// P-11 개인정보처리방침 `/privacy`
//
// 콘텐츠 대기 화면이다. 본문은 발주사가 작성한다.
//
// 이 화면을 지금 세우는 이유 — 푸터(Footer.tsx)가 이 경로를 가리키는데 없어서
// 404 였다. app/sitemap.ts 도 `/privacy` 를 색인 대상으로 싣고 있다.
//
// **조항을 대신 쓰지 않는다.** 개인정보처리방침은 실제 수집 항목 · 보관 기간 ·
// 위탁 현황을 진술하는 법적 문서다. 그럴듯한 표준 문안을 채워 두면 사실과 다른
// 내용을 게시하는 것이 되고, 문서 자체가 위험이 된다. 한 문단만 둔다.
//
// 근거 — 디자인규칙 「다른 공개 화면 (P-03 ~ P-13)」
//   페이지 헤더 = bg-canvas + text-ink-inverse (components/layout/PageHeader.tsx)
//   본문 전체   = bg-surface-raised
//
// 서버 컴포넌트다. 정적 문구뿐이라 콘텐츠를 담은 HTML 이 그대로 나간다 (REQ-N-001).
// noindex 를 걸지 않는다 — 공개 경로이고 확정본이 들어오면 색인되어야 한다.

import type { Metadata } from 'next';

import { PageHeader } from '@/components/layout/PageHeader';
import { privacyPendingCopy } from '@/content/pending-screens-copy';

export const metadata: Metadata = {
  title: '개인정보처리방침',
  // 본문과 별개 문장이다 — POL-06 메타 길이(80~110자)를 본문이 채우지 못한다.
  // 두 문장이 같은 사실을 말하도록 유지한다 (content/pending-screens-copy.ts 참조)
  description: privacyPendingCopy.metaDescription,
  alternates: { canonical: '/privacy' },
};

export default function PrivacyPage() {
  return (
    <>
      <PageHeader headingLines={privacyPendingCopy.headingLines} />

      <div className="bg-surface-raised text-ink">
        <div className="mx-auto w-full max-w-[var(--layout-container)] px-[var(--layout-gutter)] py-[var(--section-block)]">
          {/* 확정본이 들어올 자리다. 지금은 한 문단뿐이다 */}
          <p className="max-w-[var(--layout-copy)] text-muted text-[length:var(--font-size-md)] leading-[var(--leading-relaxed)]">
            {privacyPendingCopy.bodyLines[0]}
          </p>
        </div>
      </div>
    </>
  );
}
