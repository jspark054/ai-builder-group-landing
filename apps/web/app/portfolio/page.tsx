// P-03 포트폴리오 목록 `/portfolio`
//
// 근거 — 화면설계 §5.2 · 기능명세 §4.2 · 화면목록(IA) §3.1 · 요구사항 REQ-F-017·018
//   FN-P03-01  공개 상태 프로젝트 **전체**를 C-01 카드 그리드로 표시한다
//   FN-P03-02  상단에 키워드 대응 소개 문단을 표시한다 → PageHeader 서브카피
//   FN-P03-03  정렬은 수동 지정값(project.sort_order) → getProjectCards 가 이미 그 순서로 준다
//   FN-P03-04  카드에서 P-04 로 이동한다 → C-01 이 갖는다
//   POL-02     공개 0건이면 빈 상태 안내
//
// 서버 컴포넌트다. getProjectCards() 는 service role 로 읽으므로 클라이언트에서 부르면
// 안 된다 (lib/queries/project-cards.ts 머리말 참조). 이 화면에 클라이언트 경계가 없어
// 공개 화면 조건(REQ-N-001 서버 렌더 HTML)이 그대로 성립한다.
//
// 판단 네 가지를 여기에 남긴다.
//
// 1) 필터 UI 를 두지 않는다
//    단일 목록이 안건 5 확정이다. 실전/제작물 축은 폐기됐고 산업·서비스 특성 분류로
//    대체됐는데, 그 분류는 **카드 배지로만** 나타난다 (FN-C01-05).
//    필터는 2차이며 `/portfolio/{slug}` 가 하위 경로를 점유하므로 도입 시
//    `/portfolio/category/{분류}` 네임스페이스를 쓴다 (기능명세 §4.2 하단).
//    `(P-03a) /portfolio/type/{type}` 은 IA v2.0 에서 소멸했다.
//
// 2) 0건 처리가 P-01 섹션 4 와 반대다
//    P-01 은 섹션을 통째로 숨긴다(POL-02, 랜딩에 빈 칸을 남기지 않으려고).
//    여기는 **주소가 색인 대상**이라 페이지가 사라지면 안 된다. 헤더를 남기고
//    목록 자리에만 빈 상태 문구를 둔다. 링크·버튼을 곁들이지 않는다 —
//    이 화면에 경쟁 CTA 를 만들지 않는다 (REQ-F-007).
//
// 3) Section 을 쓰지 않는다
//    Section 은 h2 를 필수로 갖는 P-01 부품이다. 이 화면의 제목은 h1 하나뿐이고
//    목록 위에 h2 를 새로 만들면 도면(화면설계 §5.2)에 없는 단계가 생긴다.
//    그래서 Section 의 컨테이너 클래스만 같은 값으로 맞춰 쓴다 (하드 룰: Section 미수정).
//
// 4) 문의 CTA 없음
//    C-03 은 P-01 · P-04 · P-06 3종 전용이다 (REQ-F-007 · 기능명세 §3.3).
//    목록에서는 카드가 상세로 보내는 것이 전부다.

import type { Metadata } from 'next';

import { ProjectCard } from '@/components/cards/project-card';
import { PageHeader } from '@/components/layout/PageHeader';
import { PlaceholderNotice } from '@/components/PlaceholderNotice';
import { placeholderNoticeCopy } from '@/content/component-copy';
import { getProjectCards } from '@/lib/queries/project-cards';

import { p03Copy } from './p03-copy';

/**
 * IA §3.1 — 렌더링 `SSG+ISR`.
 *
 * getProjectCards() 는 supabase-js 로 읽어 Next 의 fetch 캐시를 타지 않는다.
 * 이 값이 없으면 빌드 시점에 굳어 관리자가 순서를 바꿔도 반영되지 않는다.
 * 재생성 주기를 정한 문서는 없다. 운영이 수정하는 화면이므로 1시간으로 둔다 —
 * sitemap 의 changeFrequency('weekly')보다 촘촘하고, 재배포 없이 당일 반영된다.
 */
export const revalidate = 3600;

export const metadata: Metadata = {
  // POL-06 — 40자 이내 · 핵심 키워드가 앞 15자 이내
  title: p03Copy.metaTitle,
  // 화면 카피가 아니라 전용 문장을 쓴다 (8/20). 헤더가 3단이 되면서 세 줄 어느 것도
  // POL-06 의 80자에 닿지 않는다. metaDescription 은 그 세 줄을 재구성한 값이다
  description: p03Copy.metaDescription,
  alternates: { canonical: '/portfolio' },
};

export default async function PortfolioListPage() {
  // FN-P03-01·03 — 공개 전수를 sort_order 순으로 받는다. 여기서 자르거나 거르지 않는다
  const projects = await getProjectCards();

  return (
    <>
      <PageHeader
        headingLines={p03Copy.header.headingLines}
        tagline={p03Copy.header.tagline}
        subtitle={p03Copy.header.subtitle}
      />

      {/* 디자인규칙 「다른 공개 화면」 — 본문은 한 덩어리로 밝게 간다 */}
      <div className="bg-surface-raised text-ink">
        <div className="mx-auto w-full max-w-[var(--layout-container)] px-[var(--layout-gutter)] py-[var(--section-block)]">
          {projects.length === 0 ? (
            // POL-02 — 페이지는 남기고 목록 자리만 문구로 대체한다
            <p className="text-muted text-[length:var(--font-size-md)] leading-[var(--leading-relaxed)]">
              {p03Copy.emptyState}
            </p>
          ) : (
            <>
              {/* 실데이터 반영 시 이 블록을 지운다 (components/PlaceholderNotice.tsx 참조).
                  0건일 때는 렌더하지 않는다 — "표시된 프로젝트 중 일부는" 이 가리킬 대상이 없다.
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
            </>
          )}
        </div>
      </div>
    </>
  );
}
