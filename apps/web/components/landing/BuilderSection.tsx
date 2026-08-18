// P-01 랜딩 · 섹션 5 빌더
//
// 근거 — 화면설계 §5.1 · 기능명세 §4.1 · 디자인규칙 「P-01 랜딩 배경 리듬」
//   FN-P01-06  빌더 섹션에 C-02 카드를 표시한다
//   FN-P01-07  P-05 로 이동하는 "전체 보기" 링크
//   FN-P01-26  전원을 노출하고 기수 배지를 두지 않는다 (v4.0)
//   FN-P01-29  외부 박스를 두지 않는다. 구분은 배경색 차이 (v4.2 · POL-11)
//   FN-P01-35  원형은 배경 없이 테두리만, 한 줄에 6명씩 2줄 (v4.4)
//   POL-02     공개 빌더 0건이면 섹션을 통째로 숨긴다 (정책정의 POL-02 표)
//
// 표기 축소는 카드가 variant='p01' 로 처리한다 (cards/builder-card.tsx).
// 이 섹션이 카드를 대신 그리지 않는다 — 화면별 별도 카드 금지 규칙 때문이다.
//
// 배경 — 5 빌더 = bg-surface-raised · text-ink (배경 리듬표 5행)
//   FN-P01-29 가 "구분은 배경색 차이"를 요구하는데, 리듬표 값이 이미 그 조건을 만족한다.
//   4 포트폴리오 bg-surface-soft → 5 빌더 bg-surface-raised → 6 교육·조직 bg-canvas 로
//   양옆과 모두 다르다. 여기서 값을 바꾸면 리듬표(4구간 · 전환 3회) 쪽이 깨지므로
//   바꾸지 않는다.
//
// 서버 컴포넌트다. getBuilderCards() 는 service role 로 읽으므로
// 클라이언트에서 부르면 안 된다 (lib/queries/builder-cards.ts 머리말 참조).
//
// 인터랙션은 넣지 않는다. 섹션 2·3·7 을 붙일 때 한 번에 배치한다
// (FN-P01-02 인접 섹션 상이 조건 때문).

import Link from 'next/link';

import { BuilderCard } from '@/components/cards/builder-card';
import { Section } from '@/components/landing/Section';
import { p01Copy } from '@/content/p01-copy';
import { getBuilderCards } from '@/lib/queries/builder-cards';

export async function BuilderSection() {
  const builders = await getBuilderCards();

  // POL-02 — 0건이면 빈 상태 문구를 두지 않고 섹션 자체를 렌더하지 않는다.
  // (빈 상태 안내는 목록 화면인 P-05 의 몫이다)
  if (builders.length === 0) return null;

  return (
    <Section
      id="builders"
      heading={p01Copy.builders.heading}
      description={p01Copy.builders.description}
      className="bg-surface-raised text-ink"
    >
      {/* FN-P01-35 — 한 줄 6명. 12명이면 자연히 2줄이 된다.
          FN-P01-26 이 전원 노출이므로 slice 로 상한을 두지 않는다.
          ("인원 증가 시 페이지 길이 불변"을 요구하던 FN-P01-06 은 v4.0 이 뒤집었다) */}
      <ul className="grid grid-cols-3 gap-[var(--space-6)] md:grid-cols-4 lg:grid-cols-6">
        {builders.map((builder) => (
          <li key={builder.slug} className="flex">
            <BuilderCard data={builder} variant="p01" />
          </li>
        ))}
      </ul>

      <div className="mt-[var(--space-10)]">
        {/* P-05(/builders)가 아직 없어 typedRoutes 가 문자열 href 를 거부한다.
            UrlObject 는 경로 검증 대상이 아니라 통과한다. P-05 완성 후 되돌린다.
            (같은 우회를 PortfolioSection.tsx · cards/builder-card.tsx 도 쓴다) */}
        <Link
          href={{ pathname: '/builders' }}
          className="inline-flex min-h-11 items-center gap-[var(--space-2)] font-semibold text-brand text-[length:var(--font-size-md)] hover:text-brand-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          {p01Copy.builders.moreLabel}
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="size-4"
          >
            <path d="m9 18 6-6-6-6" />
          </svg>
        </Link>
      </div>
    </Section>
  );
}
