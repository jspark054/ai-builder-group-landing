// P-01 랜딩. 섹션 1~8 중 6(교육·조직)을 뺀 일곱을 순서대로 렌더한다 (FN-P01-01).
// 섹션 4·5 는 콘텐츠가 0건이면 스스로 null 을 반환한다 (POL-02).
// 섹션 7·8 은 고정 카피뿐이라 숨지 않는다.
//
// ⚠ **섹션 6 교육·조직을 삭제했다 (8/22 · 사용자 승인).** 확정문서와 다르게 가는 지점이다 —
//   기능명세 §4.1 437행이 「섹션 6 본문을 삭제·축약하지 않는다」를 명시하고,
//   결정시트 541행이 그것을 안건 8(교육 라인업 미수령) 대응의 조건으로 걸어 뒀다.
//   그래서 히어로 서브 둘째 줄 「교육받은 빌더가 만들고…」의 전반부는 이제 페이지 안에
//   근거가 없고 P-09(/process)의 조직 블록(FN-P09-04)이 페이지 밖에서 받는다 (POL-13 착지).
//   발주사 컨펌 대상이다. 되돌릴 때는 이 커밋 하나를 revert 하면 된다.
//
// 남은 순서에 배경 리듬과 인터랙션 배치가 걸려 있다. 재정렬하지 않는다.
//   배경    canvas · canvas / raised · soft · raised / canvas / raised
//           전환은 2→3 · 5→7 · 7→8 세 번뿐이다 (디자인규칙).
//           「어둠 ②」 구간이 6·7 두 섹션에서 7 하나로 줄었다
//   인터랙션 1 없음 / 2 페이드 인 / 3 순차 등장 / 4 카드 상승 / 5 좌→우 stagger /
//           7 연결선 / 8 없음. 인접한 두 섹션이 겹치지 않고,
//           비워둔 구간(1 · 8)을 남긴다 (FN-P01-02 · POL-11①-2)
//
// 이전 템플릿 홈(블로그 목록)은 components/legacy/TemplateBlogHome.tsx 로 옮겨 보관했다.

import { BuilderSection } from '@/components/landing/BuilderSection';
import { ContactSection } from '@/components/landing/ContactSection';
import { CriteriaSection } from '@/components/landing/CriteriaSection';
import { Hero } from '@/components/landing/Hero';
import { PortfolioSection } from '@/components/landing/PortfolioSection';
import { ProblemSection } from '@/components/landing/ProblemSection';
import { ProcessSection } from '@/components/landing/ProcessSection';
import { organizationJsonLd } from '@/lib/jsonld';

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
      {/* FN-SEO-04 — Organization. 답변엔진이 본문보다 먼저 읽는다 (REQ-N-001 · GEO).
          사이트 전체에서 이 한 곳만 낸다 (lib/jsonld.ts 머리말 참조) */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd()) }}
      />

      <Hero />
      <ProblemSection />
      <CriteriaSection />
      <PortfolioSection />
      <BuilderSection />
      <ProcessSection />
      <ContactSection />
    </>
  );
}
