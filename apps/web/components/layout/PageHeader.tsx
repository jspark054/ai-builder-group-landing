// 공개 화면 페이지 헤더 (P-03 ~ P-13 공용)
//
// 근거 — 디자인규칙 「다른 공개 화면 (P-03 ~ P-13)」
//   페이지 헤더 = bg-canvas + text-ink-inverse
//   본문 전체   = bg-surface-raised
//   랜딩만 배경 리듬을 갖고 나머지는 조용하다. 그래서 이 껍데기가 배경색을 직접 갖는다 —
//   호출부가 넘기게 두면 화면마다 값이 갈라진다 (Section 과 반대 판단이다. Section 은
//   P-01 배경 리듬표 때문에 호출부가 색을 정한다).
//
// P-09 `/process` 의 헤더 블록을 그대로 옮긴 것이다. 마크업을 바꾸지 않았다.
//
// 갖는 것은 **h1 · 서브카피 · 컨테이너 폭 · 상하 여백** 뿐이다.
// 본문은 각 페이지가 자기 구조로 만든다 — 목록·상세의 공통 구조가 없다.
//
// 모션은 넣지 않는다. 읽으러 온 화면의 첫 블록에 등장 애니메이션을 깔면
// 전 화면에 일괄로 깔린다 (POL-11①-2 절제 — 반려 사유).

import { Fragment } from 'react';

type PageHeaderProps = {
  /**
   * h1 문구. 줄바꿈 위치를 자동 흘림에 맡기지 않고 직접 끊는다
   * (디자인규칙 「한글 조판」). 한 줄이면 원소 1개짜리 배열을 넘긴다.
   */
  headingLines: readonly string[];
  /** 제목 아래 한 문단. 화면별 카피 파일에서 넘어온다 */
  subtitle: string;
};

export function PageHeader({ headingLines, subtitle }: PageHeaderProps) {
  return (
    <section className="bg-canvas text-ink-inverse">
      <div className="mx-auto w-full max-w-[var(--layout-container)] px-[var(--layout-gutter)] py-[var(--section-block)]">
        <h1 className="max-w-[var(--layout-content)] font-bold text-[length:var(--font-size-display-md)] leading-[var(--leading-tight)] tracking-[var(--tracking-tight)]">
          {headingLines.map((line, index) => (
            <Fragment key={line}>
              {index > 0 && <br />}
              {line}
            </Fragment>
          ))}
        </h1>
        <p className="mt-[var(--space-6)] max-w-[var(--layout-copy)] text-subtle text-[length:var(--font-size-lg)] leading-[var(--leading-relaxed)]">
          {subtitle}
        </p>
      </div>
    </section>
  );
}
