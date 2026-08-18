// P-01 랜딩 · 섹션 8 문의
//
// 근거 — 화면설계 §5.1 · 기능명세 §4.1 · 디자인규칙 「P-01 랜딩 배경 리듬」
//   FN-P01-28  문의 섹션에 **코너 마크를 두지 않는다** (인수 기준 장식 요소 0건 · POL-11)
//   FN-P01-36  하단 상담 섹션의 **높이를 줄인다** (인수 기준 상하 여백 ≤ 56px)
//              → Section 의 blockSpacing="tight" (--space-12 = 48px)
//   FN-C03-05  CTA 하단 마이크로카피는 v3.2 에서 P-01 2종이 삭제됐다.
//              **보조 링크·버튼으로 대체하지 않는다** — REQ-F-007(경쟁 CTA 금지, P0) 위반이다
//   v4.7 정정  "지금 섹션 8은 **제목 + 설명 + 버튼**만 있다"
//   배경 리듬  8 문의 = bg-surface-raised · text-ink (리듬표 8행 · 「밝음 ②」 구간)
//
// 모션을 두지 않는다. P-01 에서 인터랙션을 비워둘 구간은 1(히어로) · 6(교육·조직) ·
// 8(문의)로 확정돼 있다 (POL-11①-2 — 적용하지 않는 영역을 의도적으로 남긴다).
//
// POL-02 로 숨지 않는다. 이 섹션은 DB 콘텐츠가 아니라 고정 카피와 CTA 로만 구성된다.

import { ContactCta } from '@/components/cta/contact-cta';
import { Section } from '@/components/landing/Section';
import { p01Copy } from '@/content/p01-copy';

export function ContactSection() {
  return (
    <Section
      id="contact"
      heading={p01Copy.contact.heading}
      description={p01Copy.contact.description}
      className="bg-surface-raised text-ink"
      blockSpacing="tight"
    >
      <ContactCta source="p01" />
    </Section>
  );
}
