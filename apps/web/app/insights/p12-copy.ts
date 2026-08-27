// P-12 인사이트 목록 카피
//
// ⚠ **출처를 섞지 않았다.**
//
//   헤더(h1 · 중간 줄 · 인트로 · metaDescription)
//     `content/pending-screens-copy.ts` 의 `insightsPendingCopy` 를 그대로 쓴다.
//     8/20 부터 이 화면에 나가 있던 문안이고, 목록이 붙는다고 바꿀 이유가 없다.
//     화면설계 §5.11 의 H1(「외주를 맡기기 전에 알아두면 좋은 것들」)은 **기획-2안**이고
//     결정시트 `I-7` 이 「팀장 작업본이며 확정 사항이 아니다 · 교체 대상」으로 정리했다.
//
//   빈 상태 · 필터 결과 없음
//     **정책정의 §290 · §291 확정 문구**다. 기획-2안이 아니라 POL 조항이라 그대로 쓴다.
//
//   카테고리 라벨
//     기능명세 §4.11 카피표(770행). 확정 소구점 3개와 1:1 대응한다.
//
//   ❌ 화면설계 §5.11 의 목록 하단 「여기까지가 지금까지 정리한 글입니다.」는 **쓰지 않는다.**
//      기획-2안 출처이고 다른 확정 조항에 대응 문장이 없다. 없어도 화면이 성립한다.

import type { InsightCategory } from '@orca/supabase';

export const p12Copy = {
  /** POL 정책정의 §290 — 발행 0건이어도 P-12 를 숨기지 않는다 */
  emptyAll: '첫 글을 준비하고 있습니다.',
  /** POL 정책정의 §291 — 카테고리 필터는 유지하고 이 문구를 표시한다 */
  emptyCategory: '이 주제로 정리한 글이 아직 없습니다.',
  /** FN-P12-02 — 3종 + 전체. 탭은 JS 상태가 아니라 고유 경로다 (FN-P12-03) */
  allTab: '전체',
} as const;

/** 기능명세 §4.11 카피표 — 지어내거나 바꾸지 않는다 */
export const CATEGORY_LABEL: Record<InsightCategory, string> = {
  before: '맡기기 전에',
  process: '만드는 과정',
  people: '만든 사람들',
};

export const CATEGORY_ORDER: InsightCategory[] = ['before', 'process', 'people'];
