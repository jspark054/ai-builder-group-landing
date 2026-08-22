// P-01 랜딩 · 섹션 3 선택 기준
//
// 근거 — 화면설계 §5.1 · 기능명세 §4.1 · 디자인규칙 「P-01 랜딩 배경 리듬」
//   FN-P01-12  순서는 소구점 1·2·3 고정 — 결과물 → 사람 → 일하는 방식. 재정렬 금지
//   FN-P01-13  아이브로우 라벨 없음. 항목의 번호는 섹션 라벨이 아니라 나열 순서다
//   FN-P01-25  좌 텍스트 · 우 2단 고정. **8/21 에 이 골격을 채웠다** (아래 참조)
//   REQ-F-005  경쟁사를 지시하지 않는다
//   배경 리듬  3 선택 기준 = bg-surface-raised · text-ink (「밝음 ①」 구간의 시작)
//              2→3 이 페이지에서 가장 큰 전환점이다 — 어둠에서 문제를 꺼내고
//              여기서 밝게 열리며 태도가 바뀐다 (디자인규칙 「설계 의도」)
//   인터랙션   3쌍 문답만 순차 등장 → components/landing/CriteriaList.tsx.
//              제목은 움직이지 않는다
//
// **좌 제목 · 우 3쌍 문답 2단이 됐다 (8/21 · 사용자 지시).** 종전에는 제목 아래에
// 목록을 쌓았다. 배치만 바뀌었고 목록의 구조·인터랙션·카피는 그대로다 —
// Section 의 layout='split' 이 lg 이상에서 5:7 로 나누고 lg 미만에서는 접는다.
// FN-P01-25 는 우측을 미디어로 적지만 동영상 소스가 없어 그 자리를 목록이 갖는다
// (FN-P01-32 「동영상 예정」 라벨 · FN-P01-34 디졸브 교체는 여전히 범위 밖이다).
//
// 부제(Section 의 description)를 넘기지 않는다 — 기능명세 §4.1 카피표에 섹션 3 부제
// 행이 없고 화면설계 §5.1 도면도 제목 바로 아래에 3쌍 문답을 붙인다 (8/20).
// 그래서 좌측 열은 제목 하나로 끝난다. 자리를 채우려고 문장을 새로 짓지 않는다.
//
// 제목은 한 줄로 쓰고 줄바꿈을 문안에 넣지 않는다. 좌측 열(1200px 기준 446px)에서
// 두 줄로 흐르지만 전역 `word-break: keep-all` 이 어절 중간을 끊지 않는다.

import { CriteriaList } from '@/components/landing/CriteriaList';
import { Section } from '@/components/landing/Section';
import { p01Copy } from '@/content/p01-copy';

/**
 * 섹션 4(포트폴리오)와의 이음매를 좁힌다.
 * Section 의 --section-block 이 아래·위로 두 겹 겹쳐 12rem 이 된다.
 * Section 은 P-09 와 공유하는 부품이라 값을 고치지 않고 아래쪽에서 당겨 상쇄한다.
 *
 * 한 겹을 다 당기면 3쌍 문답 아래 여백이 0 이 되어 다음 섹션 배경에 문장이 붙는다.
 * **절반만 상쇄한다** — 12rem 이 9rem 이 된다. 새 토큰을 만들지 않고 calc 로 나눈다.
 *
 * 2단이 된 뒤에도 자리는 그대로 우측 열 안이다. 좌측 열은 제목뿐이라 항상 더 짧고
 * 행 높이는 우측 열이 정한다 — 당기는 대상이 곧 그 열이다.
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
      layout="split"
      className="bg-surface-raised text-ink"
    >
      <div className={TRAILING_PULL}>
        <CriteriaList items={p01Copy.criteria.items} />
      </div>
    </Section>
  );
}
