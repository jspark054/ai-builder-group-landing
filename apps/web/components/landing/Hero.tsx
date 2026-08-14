// P-01 랜딩 · 섹션 1 히어로
//
// 근거 — 화면설계 §5.1 · 기능명세 §4.1 · 디자인규칙 「P-01 랜딩 배경 리듬」
//   FN-P01-13  아이브로우 라벨 없음
//   FN-P01-14  높이 66dvh · 그 안에서 수직 중앙 정렬
//   FN-P01-15  H1 은 발주사 실측 스펙 — 700 clamp(30px,3.9vw,52px)/1.24 · -0.03em
//   FN-P01-19  스크롤 이벤트를 가로채지 않는다
//   FN-P01-37  스크롤 유도는 문구가 아닌 기호. 텍스트 0자 · 모션 0건
//   FN-C03-01~03  P-01 CTA 문구 "프로젝트 상담하기" · P-10 이동 · utm_source=home
//   FN-C03-05  마이크로카피는 v3.2 부터 P-01 미적용
//   POL-11①-2  등장 애니메이션 없음 — 이 섹션에는 어떤 모션도 두지 않는다
//
// 카피는 카피후보 문서 「P-01 랜딩 · 1. 히어로」 기획-2안. 새로 쓰지 않는다.

export function Hero() {
  return (
    <section className="relative flex min-h-[66dvh] items-center bg-canvas text-ink-inverse">
      <div className="mx-auto w-full max-w-[var(--layout-container)] px-[var(--layout-gutter)] py-[var(--section-block)]">
        {/* 줄바꿈은 자동 흘림에 맡기지 않고 직접 끊는다. */}
        <h1 className="max-w-[var(--layout-copy)] font-bold text-[length:clamp(30px,3.9vw,52px)] leading-[1.24] tracking-[-0.03em]">
          AI 홈페이지 제작·앱 개발
          <br />
          누가 만드는지 알고 맡기세요
        </h1>

        <p className="mt-[var(--space-6)] max-w-[var(--layout-copy)] text-subtle text-[length:var(--font-size-lg)] leading-[var(--leading-relaxed)]">
          AI 빌더 그룹의 체계적인 교육을 받은 빌더가 만들고, 결과물은 조직이 책임집니다.
        </p>

        {/* P-10(/contact)이 아직 없어 typedRoutes 가 <Link> 를 거부한다.
            P-10 을 만든 뒤 next/link 로 바꾼다. */}
        <a
          href="/contact?utm_source=home"
          className="mt-[var(--space-10)] inline-flex items-center rounded-pill bg-brand px-[var(--space-7)] py-[var(--space-4)] font-semibold text-ink-inverse hover:bg-brand-soft hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-strong"
        >
          프로젝트 상담하기
        </a>
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
