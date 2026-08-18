// P-01 랜딩 · 섹션 1 히어로
//
// 근거 — 화면설계 §5.1 · 기능명세 §4.1 · 디자인규칙 「P-01 랜딩 배경 리듬」
//   FN-P01-13  아이브로우 라벨 없음
//   FN-P01-14  높이 66dvh · 그 안에서 수직 중앙 정렬
//   FN-P01-15  H1 은 발주사 실측 스펙 — 700 clamp(30px,3.9vw,52px)/1.24 · -0.03em
//   FN-P01-19  스크롤 이벤트를 가로채지 않는다
//   FN-P01-37  스크롤 유도는 문구가 아닌 기호. 텍스트 0자 · 모션 0건
//   FN-C03-01~03  CTA 는 C-03 컴포넌트가 그린다 (components/cta/contact-cta.tsx).
//                 문구 "프로젝트 상담하기" · P-10 이동 · utm_source=home 은 그쪽이 정한다
//   FN-C03-05  마이크로카피는 v3.2 부터 P-01 미적용
//   POL-11①-2  등장 애니메이션 없음 — 이 섹션에는 어떤 모션도 두지 않는다
//
// 카피는 content/p01-copy.ts 의 B안(신뢰 중심). 이 파일에 문장을 직접 쓰지 않는다.
//   FR-1.7(본사 관계 표기)이 미확정이라 본사를 주어로 세우지 않고,
//   "조직이 책임진다" 취지의 문장을 두지 않는다. 확정 시 카피 파일만 교체한다.
//   근거는 결정시트 I-7 · 구현결정 260816.

import { Fragment } from 'react';

import { ContactCta } from '@/components/cta/contact-cta';
import { heroCopy } from '@/content/p01-copy';

export function Hero() {
  return (
    <section className="relative flex min-h-[66dvh] items-center bg-canvas text-ink-inverse">
      <div className="mx-auto w-full max-w-[var(--layout-container)] px-[var(--layout-gutter)] py-[var(--section-block)]">
        <h1 className="max-w-[var(--layout-copy)] font-bold text-[length:clamp(30px,3.9vw,52px)] leading-[1.24] tracking-[-0.03em]">
          {heroCopy.heading}
        </h1>

        {/* 줄바꿈은 자동 흘림에 맡기지 않고 직접 끊는다.
            첫 줄은 SEO 키워드(FR-6.1), 둘째 줄이 주장이다. */}
        <p className="mt-[var(--space-6)] max-w-[var(--layout-copy)] text-subtle text-[length:var(--font-size-lg)] leading-[var(--leading-relaxed)]">
          {heroCopy.subLines.map((line, index) => (
            <Fragment key={line}>
              {index > 0 && <br />}
              {line}
            </Fragment>
          ))}
        </p>

        {/* C-03 문의 CTA. 문구·목적지·파라미터는 컴포넌트가 정한다 (FN-C03-01~03).
            히어로가 자체 <a> 를 갖고 있었으나 같은 CTA 가 두 곳에 정의된 상태라 걷어냈다.
            FN-C03-05 마이크로카피는 P-01 에서 v3.2 로 삭제됐다. 보조 링크·버튼도 두지 않는다
            (REQ-F-007 경쟁 CTA 금지, P0). */}
        <div className="mt-[var(--space-10)]">
          <ContactCta source="p01" />
        </div>
      </div>

      {/* FN-P01-37 — 기호만 둔다. 읽을 문장을 늘리지 않고, 움직이지도 않는다. */}
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="absolute bottom-[var(--space-8)] left-1/2 size-6 -translate-x-1/2 text-subtle"
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
    </section>
  );
}
