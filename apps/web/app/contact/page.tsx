// P-10 문의 `/contact`
//
// **플러그(pluuug) 폼으로 넘기는 화면이다.** 폼을 이 화면에 임베드하지 않고
// 플러그가 호스팅하는 폼 페이지로 보낸다 (사용자 지시 8/22 — 레퍼런스 플로우).
//
//   [프로젝트 상담하기] → /contact?utm_source=home → pluuug.com/form/{id}?utm_source=home
//
// 이 구조를 고른 이유
//   헤더 · 푸터 · C-03 4곳이 이미 `/contact?utm_source=…` 를 가리키고 있다.
//   여기서 한 번 넘기면 그 네 곳을 고치지 않아도 되고, 폼 주소가 바뀔 때
//   **site_setting 한 행만 갱신**하면 전 화면이 따라온다 (회의록 8/12 —
//   "관리자 화면에서 폼 URL을 변경할 수 있도록 구현한다").
//   각 CTA 가 외부 주소를 직접 들고 있으면 주소가 네 곳에 복제된다.
//
// 확정 문서와 달라진 점 — **화면설계 §5.8 은 이 화면에 폼을 임베드하는 도면이다.**
// 임베드 대신 이동으로 간 것은 사용자 지시다. 영향 범위는 아래 셋이다.
//   FN-C03-02  「클릭 시 P-10 으로 이동한다」 — 그대로다. CTA 는 여전히 여기로 온다
//   FN-P10-02  폼 진입 전 안내 문구 — 머무는 화면이 아니게 되어 둘 자리가 없다
//   FN-P10-04  `contact_form_view` — 폼이 우리 화면에 없으므로 여기서 발생시키지 않는다
//              (FN-C03-04 `portfolio_cta_click` 은 C-03 에서 그대로 발생한다)
//
// 사이트맵에서 뺐다 (app/sitemap.ts) — 외부로 넘기는 주소를 색인 요청 목록에
// 실으면 서치콘솔이 리다이렉트 오류로 잡는다.
//
// 폴백 — 주소를 읽지 못하면(Supabase 미설정 · 값 미등록 · 형식 오류) 넘기지 않고
// 안내 문구를 렌더한다. 여기서 500 을 내면 CTA 4곳이 전부 에러 화면으로 간다.
//
// 근거 — 디자인규칙 「다른 공개 화면 (P-03 ~ P-13)」
//   페이지 헤더 = bg-canvas + text-ink-inverse (components/layout/PageHeader.tsx)
//   본문 전체   = bg-surface-raised

import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Fragment } from 'react';

import { PageHeader } from '@/components/layout/PageHeader';
import { contactPendingCopy } from '@/content/pending-screens-copy';
import { buildContactFormUrl } from '@/lib/contact-form-url';
import { getContactFormUrl } from '@/lib/queries/site-setting';

export const metadata: Metadata = {
  title: '프로젝트 상담',
  // 본문과 별개 문장이다 — POL-06 메타 길이(80~110자)를 본문이 채우지 못한다.
  // 두 문장이 같은 사실을 말하도록 유지한다 (content/pending-screens-copy.ts 참조)
  description: contactPendingCopy.metaDescription,
  alternates: { canonical: '/contact' },
};

type ContactPageProps = {
  /** params · searchParams 는 Promise 다 (Next 16) */
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ContactPage({ searchParams }: ContactPageProps) {
  const [params, formUrl] = await Promise.all([searchParams, getContactFormUrl()]);

  // redirect() 는 예외를 던져 렌더를 끝낸다. try/catch 로 감싸지 않는다
  if (formUrl) redirect(buildContactFormUrl(formUrl, params));

  return (
    <>
      <PageHeader headingLines={contactPendingCopy.headingLines} />

      <div className="bg-surface-raised text-ink">
        <div className="mx-auto w-full max-w-[var(--layout-container)] px-[var(--layout-gutter)] py-[var(--section-block)]">
          {/* 줄바꿈은 자동 흘림에 맡기지 않고 직접 끊는다 */}
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
