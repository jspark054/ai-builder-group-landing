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

/**
 * 섹션 4(포트폴리오)와의 이음매를 좁힌다.
 * Section 의 --section-block 이 아래·위로 두 겹 겹쳐 12rem 이 된다.
 * Section 은 P-09 와 공유하는 부품이라 고치지 않고(하드 룰), 아래쪽에서 당겨 상쇄한다.
 *
 * 한 겹을 다 당기면 3쌍 문답 아래 여백이 0 이 되어 다음 섹션 배경에 문장이 붙는다.
 * **절반만 상쇄한다** — 12rem 이 9rem 이 된다. 새 토큰을 만들지 않고 calc 로 나눈다.
 *
 * /process 의 같은 이름 상수와 공용으로 묶지 않는다 — 어느 이음매를 얼마나 좁힐지는
 * 화면마다 판단이 다르다(그쪽은 한 겹 전부다). 여기서는 섹션 3↔4 한 곳뿐이고,
 * 섹션 2↔3 은 그대로 둔다. 어둠에서 밝음으로 넘어가는 전환점이라 여백이 필요하다.
 */
const TRAILING_PULL = '-mb-[calc(var(--section-block)/2)]';

export function CriteriaSection() {
  return (
    <Section
      id="criteria"
      heading={p01Copy.criteria.heading}
      description={p01Copy.criteria.description}
      className="bg-surface-raised text-ink"
    >
      <div className={TRAILING_PULL}>
        <CriteriaList items={p01Copy.criteria.items} />
      </div>
    </Section>
  );
}
