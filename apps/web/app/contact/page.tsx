// P-10 문의 `/contact`
//
// 콘텐츠 대기 화면이다. 문의 폼은 발주사가 제공하는 임베드로 붙는다.
//
// 이 화면을 지금 세우는 이유 — 헤더 CTA(`utm_source=gnb`) · 푸터(`utm_source=footer`) ·
// C-03 문의 CTA 4곳(히어로 · P-01 섹션 8 · P-04 · P-06)이 전부 여기를 가리키는데
// 경로가 없어 404 였다. app/sitemap.ts 도 `/contact` 를 색인 대상으로 싣고 있다.
//
// 폼을 임시로 만들지 않는다. 임베드가 오면 통째로 버리게 되고, 그 사이에 접수된
// 문의를 받을 곳도 없다. 연락처(이메일 · 전화번호)도 두지 않는다 — 실제 값을
// 수령하지 않았고, 지어낸 연락처는 닿지 않는 창구가 된다.
//
// 보조 링크·버튼을 두지 않는다 (REQ-F-007 경쟁 CTA 금지, P0). 이 화면은 전환의
// 종착지라 여기서 다른 곳으로 내보낼 이유가 없다.
//
// 근거 — 디자인규칙 「다른 공개 화면 (P-03 ~ P-13)」
//   페이지 헤더 = bg-canvas + text-ink-inverse (components/layout/PageHeader.tsx)
//   본문 전체   = bg-surface-raised
//
// 서버 컴포넌트다. 정적 문구뿐이라 클라이언트 경계가 없고, 콘텐츠를 담은 HTML 이
// 그대로 나간다 (REQ-N-001). 로딩 스켈레톤을 두지 않는다 — 기다릴 것이 없다.
//
// **임베드 수령 시 아래 본문 블록만 교체한다.** 헤더는 그대로 둔다.

import type { Metadata } from 'next';
import { Fragment } from 'react';

import { PageHeader } from '@/components/layout/PageHeader';
import { contactPendingCopy } from '@/content/pending-screens-copy';

export const metadata: Metadata = {
  title: '프로젝트 상담',
  // 본문과 별개 문장이다 — POL-06 메타 길이(80~110자)를 본문이 채우지 못한다.
  // 두 문장이 같은 사실을 말하도록 유지한다 (content/pending-screens-copy.ts 참조)
  description: contactPendingCopy.metaDescription,
  alternates: { canonical: '/contact' },
};

export default function ContactPage() {
  return (
    <>
      <PageHeader headingLines={contactPendingCopy.headingLines} />

      <div className="bg-surface-raised text-ink">
        <div className="mx-auto w-full max-w-[var(--layout-container)] px-[var(--layout-gutter)] py-[var(--section-block)]">
          {/* 임베드가 들어올 자리다. 줄바꿈은 자동 흘림에 맡기지 않고 직접 끊는다 */}
          <p className="max-w-[var(--layout-copy)] text-muted text-[length:var(--font-size-md)] leading-[var(--leading-relaxed)]">
            {contactPendingCopy.bodyLines.map((line, index) => (
              <Fragment key={line}>
                {index > 0 && <br />}
                {line}
              </Fragment>
            ))}
          </p>
        </div>
      </div>
    </>
  );
}
