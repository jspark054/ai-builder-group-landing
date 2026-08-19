// P-01 랜딩 · 섹션 3 선택 기준
//
// 근거 — 화면설계 §5.1 · 기능명세 §4.1 · 디자인규칙 「P-01 랜딩 배경 리듬」
//   FN-P01-12  순서는 소구점 1·2·3 고정 — 결과물 → 사람 → 일하는 방식. 재정렬 금지
//   FN-P01-13  아이브로우 라벨 없음. 항목의 번호는 섹션 라벨이 아니라 나열 순서다
//   REQ-F-005  경쟁사를 지시하지 않는다
//   배경 리듬  3 선택 기준 = bg-surface-raised · text-ink (「밝음 ①」 구간의 시작)
//              2→3 이 페이지에서 가장 큰 전환점이다 — 어둠에서 문제를 꺼내고
//              여기서 밝게 열리며 태도가 바뀐다 (디자인규칙 「설계 의도」)
//   인터랙션   3쌍 문답만 순차 등장 → components/landing/CriteriaList.tsx.
//              제목·서브는 움직이지 않는다
//
// 미구현 — 기능명세 v4.x 의 FN-P01-25(좌 텍스트·우 미디어 2단 고정) ·
// FN-P01-32(「동영상 예정」 라벨) · FN-P01-34(디졸브 교체)는 이번 범위에 넣지 않았다.
// 셋 다 우측 미디어를 전제하는데 동영상 소스가 없다. 인터랙션 배치는 디자인규칙
// 「P-01 섹션별 인터랙션」 표(3쌍 문답 stagger)를 기준으로 삼았다.

import { CriteriaList } from '@/components/landing/CriteriaList';
import { Section } from '@/components/landing/Section';
import { p01Copy } from '@/content/p01-copy';

export function CriteriaSection() {
  return (
    <Section
      id="criteria"
      heading={p01Copy.criteria.heading}
      description={p01Copy.criteria.description}
      className="bg-surface-raised text-ink"
    >
      <CriteriaList items={p01Copy.criteria.items} />
    </Section>
  );
}
