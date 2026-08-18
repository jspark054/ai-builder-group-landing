// P-01 랜딩. 섹션 1~8 을 순서대로 렌더한다 (FN-P01-01).
// 지금은 1 히어로 · 4 포트폴리오 · 5 빌더 · 8 문의가 붙어 있고, 나머지는 순차적으로 채운다.
// 섹션 4·5 는 콘텐츠가 0건이면 스스로 null 을 반환한다 (POL-02).
// 섹션 8 은 고정 카피와 CTA 뿐이라 숨지 않는다.
//
// 이전 템플릿 홈(블로그 목록)은 components/legacy/TemplateBlogHome.tsx 로 옮겨 보관했다.

import { BuilderSection } from '@/components/landing/BuilderSection';
import { ContactSection } from '@/components/landing/ContactSection';
import { Hero } from '@/components/landing/Hero';
import { PortfolioSection } from '@/components/landing/PortfolioSection';

export default function LandingPage() {
  return (
    <>
      <Hero />
      <PortfolioSection />
      <BuilderSection />
      <ContactSection />
    </>
  );
}
