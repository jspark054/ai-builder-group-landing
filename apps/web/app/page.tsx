// P-01 랜딩. 섹션 1~8 을 순서대로 렌더한다 (FN-P01-01).
// 지금은 섹션 1 히어로만 구현돼 있고, 2~8 은 순차적으로 붙인다.
//
// 이전 템플릿 홈(블로그 목록)은 components/legacy/TemplateBlogHome.tsx 로 옮겨 보관했다.

import { Hero } from '@/components/landing/Hero';

export default function LandingPage() {
  return <Hero />;
}
