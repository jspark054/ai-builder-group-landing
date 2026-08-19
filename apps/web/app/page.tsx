// P-01 랜딩. 섹션 1~8 을 순서대로 렌더한다 (FN-P01-01).
// 지금은 1 히어로 · 2 문제 제기 · 3 선택 기준 · 4 포트폴리오 · 5 빌더 · 8 문의가 붙어 있고,
// 나머지(6 교육·조직 · 7 일하는 방식)는 순차적으로 채운다.
// 섹션 4·5 는 콘텐츠가 0건이면 스스로 null 을 반환한다 (POL-02).
// 섹션 8 은 고정 카피와 CTA 뿐이라 숨지 않는다.
//
// 이전 템플릿 홈(블로그 목록)은 components/legacy/TemplateBlogHome.tsx 로 옮겨 보관했다.

import { BuilderSection } from '@/components/landing/BuilderSection';
import { ContactSection } from '@/components/landing/ContactSection';
import { CriteriaSection } from '@/components/landing/CriteriaSection';
import { Hero } from '@/components/landing/Hero';
import { PortfolioSection } from '@/components/landing/PortfolioSection';
import { ProblemSection } from '@/components/landing/ProblemSection';

/**
 * IA §3.1 — 렌더링 `SSG+ISR`.
 *
 * 섹션 4·5·8 이 supabase-js 로 읽는데 그 호출은 Next 의 fetch 캐시를 타지 않는다.
 * 이 값이 없으면 빌드 시점에 굳어 관리자가 프로젝트·빌더를 바꿔도 반영되지 않는다.
 * P-03 `/portfolio` 와 같은 주기로 맞춘다 — 같은 데이터를 같은 쿼리로 보여주는
 * 두 화면의 신선도가 갈라지면 랜딩과 목록의 내용이 어긋난다.
 */
export const revalidate = 3600;

export default function LandingPage() {
  return (
    <>
      <Hero />
      <ProblemSection />
      <CriteriaSection />
      <PortfolioSection />
      <BuilderSection />
      <ContactSection />
    </>
  );
}
