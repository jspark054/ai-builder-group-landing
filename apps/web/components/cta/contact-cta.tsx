// C-03 문의 CTA — P-01 · P-04 · P-06 공용
//
// 근거 — 기능명세 §3.3 · §4.8 · 화면설계 §4.3
//   FN-C03-01  노출 위치별로 문구를 달리 표시한다 (3종 · contactCtaCopy.label)
//   FN-C03-02  클릭 시 **P-10 으로 이동한다**. 외부 폼 주소를 직접 열지 않는다
//   FN-C03-03  URL 에 출처 파라미터를 부착한다 (§3.3 위치별 표)
//   FN-C03-04  P-04 · P-06 에서 GA4 `portfolio_cta_click` 을 발생시킨다
//   FN-C03-05  마이크로카피는 v3.2 부터 P-13 전용. 여기에 두지 않는다
//   REQ-F-007  경쟁 CTA 금지 — 보조 링크·버튼을 곁들이지 않는다
//
// 외부 폼(Plug) 주소는 **P-10 이 읽는다** (lib/queries/site-setting.ts).
// 이 컴포넌트는 주소를 알지 못한다 — CTA 가 폼으로 직행하면 P-10 이 진입 경로를 잃고
// 고아 화면이 된다 (C-01 의 FN-C01-06 이 막는 것과 같은 구조).
//
// 클라이언트 컴포넌트인 이유
//   FN-C03-04 의 클릭 이벤트에 onClick 이 필요하다. 서버에서 받을 데이터가 없어
//   경계를 내리는 비용이 거의 없다 (props 두 개가 전부다).
//
// 미해결
//   Hero.tsx 는 아직 자체 <a> 로 CTA 를 그린다. 같은 목적지·같은 문구지만 이 컴포넌트를
//   쓰지 않는다. P-01 조립을 마무리할 때 정리한다.

'use client';

import Link from 'next/link';

import { contactCtaCopy } from '@/content/component-copy';

declare global {
  interface Window {
    /** Analytics.tsx 의 인라인 스크립트가 전역에 정의한다. GA4 ID 가 없으면 undefined 다 */
    gtag?: (command: 'event', eventName: string, params?: Record<string, string>) => void;
  }
}

/** 노출 위치. §3.3 의 3종과 1:1 이다 */
export type ContactCtaSource = 'p01' | 'p04' | 'p06';

type ContactCtaProps = {
  source: ContactCtaSource;
  /** p04 는 project.slug, p06 는 builder.slug. p01 은 쓰지 않는다 */
  slug?: string;
};

/** FN-C03-01 — 위치별 문구. 문안은 content/component-copy.ts 에만 둔다 */
const LABEL: Record<ContactCtaSource, string> = {
  p01: contactCtaCopy.label.home,
  p04: contactCtaCopy.label.portfolio,
  p06: contactCtaCopy.label.builder,
};

/** §3.3 위치별 파라미터 표. utm_source 값이 위치 구분자다 */
const UTM_SOURCE: Record<ContactCtaSource, string> = {
  p01: 'home',
  p04: 'portfolio',
  p06: 'builder',
};

/**
 * FN-C03-03 — 출처 파라미터.
 *
 * p04 는 `ref={project-slug}`, p06 은 `builder={builder-slug}` 를 더한다.
 * 슬러그가 없으면 해당 키를 빼고 utm_source 만 싣는다 — 빈 값을 붙이면 GA4 에
 * 빈 문자열 세그먼트가 생겨 집계가 나뉜다.
 */
function queryFor(source: ContactCtaSource, slug?: string): Record<string, string> {
  const query: Record<string, string> = { utm_source: UTM_SOURCE[source] };

  if (!slug) return query;
  if (source === 'p04') query.ref = slug;
  if (source === 'p06') query.builder = slug;

  return query;
}

/**
 * FN-C03-04 — GA4 `portfolio_cta_click`.
 *
 * 명세상 발생 지점은 **P-04 · P-06** 이다. P-01 은 대상이 아니라 보내지 않는다.
 * gtag 은 GA4 ID 가 설정된 배포에서만 존재하므로 optional call 로 둔다 —
 * 로컬·데모에서 CTA 가 죽으면 안 된다.
 *
 * 이름·연락처 등 개인정보는 싣지 않는다 (§4.8 "이벤트에 이름·연락처·이메일·
 * 자유서술 원문을 전달하지 않는다").
 */
function trackClick(source: ContactCtaSource, slug?: string): void {
  if (source === 'p01') return;

  const params: Record<string, string> = { source_page: source };
  if (slug && source === 'p04') params.project_slug = slug;
  if (slug && source === 'p06') params.builder_slug = slug;

  window.gtag?.('event', 'portfolio_cta_click', params);
}

export function ContactCta({ source, slug }: ContactCtaProps) {
  const label = LABEL[source];

  return (
    // P-10(/contact)이 아직 없어 typedRoutes 가 문자열 href 를 거부한다.
    // UrlObject 는 경로 검증 대상이 아니라 통과하고 런타임 동작도 같다.
    // P-10 을 만든 뒤 문자열로 되돌린다. (같은 우회를 cards/ 의 카드들도 쓴다)
    <Link
      href={{ pathname: '/contact', query: queryFor(source, slug) }}
      onClick={() => trackClick(source, slug)}
      className="inline-flex min-h-11 items-center rounded-pill bg-brand px-[var(--space-7)] py-[var(--space-4)] font-semibold text-ink-inverse text-[length:var(--font-size-md)] hover:bg-brand-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
    >
      {label}
    </Link>
  );
}
