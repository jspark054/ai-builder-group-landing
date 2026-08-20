// P-01 랜딩 · 섹션 6 교육 · 조직
//
// 근거 — 화면설계 §5.1 · 기능명세 §4.1 · 디자인규칙 「P-01 랜딩 배경 리듬」
//   FN-P01-08  수치 카운터를 사용하지 않는다 (인수 기준 「값 0인 수치 0건」 · POL-01).
//              "N명 수료" 같은 값을 만들지 않는다 — 실적 수치가 없는 상태다
//   FN-P01-13  아이브로우 라벨 없음. 제목 위에 보조 라벨을 두지 않는다
//   배경 리듬  6 교육·조직 = bg-canvas · text-ink-inverse (「어둠 ②」 구간의 시작).
//              5→6 이 페이지의 세 번째이자 마지막 전환이다
//   인터랙션   **없음.** POL-11①-2 가 요구하는 의도적 공백 구간이다 (1 · 6 · 8).
//              등장 애니메이션을 넣으면 절제 조항 위반으로 반려된다.
//              그래서 이 파일에는 'use client' 도 IntersectionObserver 도 없다
//
// 교육 과정 목록을 렌더하지 않는다. 라인업이 미수령이고(안건 8), 기능명세 §4.1
// 예외처리표가 그 상태의 처리를 "교육 과정 목록만 숨기고 **본문 카피는 유지**"로 정한다.
// 목록 자리에 「준비 중」 같은 빈 상태 문구를 두지 않는다 — 없는 것을 알릴 이유가 없다.
//
// 본문은 Section 의 description 슬롯에 넣지 않는다. 그 슬롯은 한 문자열이라
// 줄바꿈 위치를 고정할 수 없는데, 이 문장은 <br> 위치까지 확정 문안이다.
// 대신 children 으로 받아 여기서 직접 끊는다 (Section 은 고치지 않는다 — 하드 룰).
//
// 색 — 어두운 배경 위의 보조 글자는 `text-subtle` 이 맡는다. `text-muted`(#5e5a50)는
// bg-canvas(#15140f) 위에서 대비가 3:1 에 못 미친다 (ProblemSection.tsx 와 같은 판단).

import { Fragment } from 'react';

import { Section } from '@/components/landing/Section';
import { p01Copy } from '@/content/p01-copy';

/**
 * 본문을 children 으로 옮기면서 생긴 간격 차이를 되돌린다.
 * Section 은 children 앞에 `--space-10`(2.5rem)을 두고, description 슬롯은
 * h2 바로 아래 `--space-4`(1rem)에 놓인다. 그 차이만큼만 당긴다.
 *
 * 제목 아래 첫 문단의 간격은 `--space-4` 가 기준이다 — 섹션 4 · 5 · 8 은
 * description 슬롯을 써서 그 값을 그대로 받고, 섹션 7 은 같은 이유로 같은 보정을
 * 하고 있다 (ProcessSection.tsx 의 SUBTITLE_PULL). **이 섹션만 2.5rem 이라
 * 혼자 벌어져 있었다** (8/20 수정 — 실화면에서 확인됨).
 *
 * 섹션 3(CriteriaSection)에는 이 보정을 넣지 않는다. 그쪽 children 은 문단이 아니라
 * 3행 목록이고, 제목-본문 블록 간격은 `--space-10` 이 맞다.
 *
 * Section 은 P-09 와 공유하는 부품이라 고치지 않는다 (하드 룰).
 * 새 토큰을 만들지 않고 기존 두 값의 차로 계산한다.
 */
const BODY_PULL = '-mt-[calc(var(--space-10)-var(--space-4))]';

export function EducationSection() {
  return (
    <Section
      id="education"
      heading={p01Copy.education.heading}
      className="bg-canvas text-ink-inverse"
    >
      <p
        className={`${BODY_PULL} max-w-[var(--layout-content)] text-subtle text-[length:var(--font-size-md)] leading-[var(--leading-relaxed)]`}
      >
        {p01Copy.education.bodyLines.map((line, index) => (
          <Fragment key={line}>
            {index > 0 && <br />}
            {line}
          </Fragment>
        ))}
      </p>
    </Section>
  );
}
