// P-01 랜딩. 섹션 1~8 을 순서대로 렌더한다 (FN-P01-01).
// 여덟 섹션이 전부 붙었다 (8/20 — 6 교육·조직 · 7 일하는 방식 신설).
// 섹션 4·5 는 콘텐츠가 0건이면 스스로 null 을 반환한다 (POL-02).
// 섹션 6·7·8 은 고정 카피뿐이라 숨지 않는다.
//
// 이 순서는 배경 리듬과 인터랙션 배치 양쪽이 동시에 걸려 있다. 재정렬하지 않는다.
//   배경    canvas · canvas / raised · soft · raised / canvas · canvas / raised
//           네 구간 덩어리이고 전환은 2→3 · 5→6 · 7→8 세 번뿐이다 (디자인규칙)
//   인터랙션 1 없음 / 2 페이드 인 / 3 순차 등장 / 4 카드 상승 / 5 — /
//           6 없음 / 7 연결선 / 8 없음. 인접한 두 섹션이 겹치지 않고,
//           비워둔 구간(1 · 6 · 8)을 남긴다 (FN-P01-02 · POL-11①-2)
//
// 이전 템플릿 홈(블로그 목록)은 components/legacy/TemplateBlogHome.tsx 로 옮겨 보관했다.

import { BuilderSection } from '@/components/landing/BuilderSection';
import { ContactSection } from '@/components/landing/ContactSection';
import { CriteriaSection } from '@/components/landing/CriteriaSection';
import { EducationSection } from '@/components/landing/EducationSection';
import { Hero } from '@/components/landing/Hero';
import { PortfolioSection } from '@/components/landing/PortfolioSection';
import { ProblemSection } from '@/components/landing/ProblemSection';
import { ProcessSection } from '@/components/landing/ProcessSection';

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
      <EducationSection />
      <ProcessSection />
      <ContactSection />
    </>
  );
}
