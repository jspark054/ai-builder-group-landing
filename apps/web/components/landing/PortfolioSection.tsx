// P-01 랜딩 · 섹션 4 포트폴리오 ★
//
// 근거 — 화면설계 §5.1 · 기능명세 §4.1 · 디자인규칙 「P-01 랜딩 배경 리듬」
//   FN-P01-04  C-01 카드를 표시한다
//   FN-P01-05  P-03 으로 이동하는 "전체 보기" 링크
//   FN-P01-03  강조 효과는 섹션 내부에서만 (섹션 경계를 넘지 않는다)
//   POL-02     공개 프로젝트 0건이면 섹션을 통째로 숨긴다 (화면설계 §5.1 표)
//   배경 리듬  4 포트폴리오 = bg-surface-soft · text-ink (밝음 ① 구간)
//
// 서버 컴포넌트다. getProjectCards() 는 service role 로 읽으므로
// 클라이언트에서 부르면 안 된다 (lib/queries/project-cards.ts 머리말 참조).
//
// 미구현 — 디자인규칙은 이 섹션의 인터랙션을 "제목 고정, 카드만 상승"으로 정한다.
// IntersectionObserver 가 필요해 클라이언트 경계가 생기므로 카드 조립 단계에서는 넣지 않았다.
// 섹션 2·3·5·7 을 붙일 때 인터랙션을 한 번에 배치한다 (FN-P01-02 인접 섹션 상이 조건 때문).

import Link from 'next/link';

import { ProjectCard } from '@/components/cards/project-card';
import { Section } from '@/components/landing/Section';
import { PlaceholderNotice } from '@/components/PlaceholderNotice';
import { placeholderNoticeCopy } from '@/content/component-copy';
import { p01Copy } from '@/content/p01-copy';
import { getProjectCards } from '@/lib/queries/project-cards';

export async function PortfolioSection() {
  const projects = await getProjectCards();

  // POL-02 — 0건이면 빈 상태 문구를 두지 않고 섹션 자체를 렌더하지 않는다
  if (projects.length === 0) return null;

  return (
    <Section
      id="portfolio"
      heading={p01Copy.portfolio.heading}
      description={p01Copy.portfolio.description}
      className="bg-surface-soft text-ink"
    >
      {/* 실데이터 반영 시 이 블록을 지운다 (components/PlaceholderNotice.tsx 참조).
          Section 이 제목 슬롯을 갖고 있어 h2 위에는 넣을 수 없다 — 목록 바로 위가 섹션 상단이다.
          간격은 목록 쪽 className 을 건드리지 않도록 이 래퍼가 갖는다 */}
      <div className="mb-[var(--space-6)]">
        <PlaceholderNotice text={placeholderNoticeCopy.portfolio} />
      </div>

      <ul className="grid grid-cols-1 gap-[var(--space-6)] md:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <li key={project.slug} className="flex">
            {/* showBuilder 는 기본값(true). 빌더 표기를 생략하는 곳은 P-06 뿐이다 */}
            <ProjectCard data={project} />
          </li>
        ))}
      </ul>

      <div className="mt-[var(--space-10)]">
        <Link
          href="/portfolio"
          className="inline-flex min-h-11 items-center gap-[var(--space-2)] font-semibold text-brand text-[length:var(--font-size-md)] hover:text-brand-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          {p01Copy.portfolio.moreLabel}
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
