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
// 갖는 것은 **h1 · 중간 줄 · 인트로 · 컨테이너 폭 · 상하 여백** 뿐이다.
// 본문은 각 페이지가 자기 구조로 만든다 — 목록·상세의 공통 구조가 없다.
//
// 3단 위계 (8/20 신설 — P-03 · P-09)
//   h1     `--font-size-display-md` · bold      · text-ink-inverse
//   중간   `--font-size-xl`          · semibold  · text-ink-inverse
//   인트로 `--font-size-lg`          · regular   · text-subtle
//
//   중간 줄 크기로 `xl`(1.5rem)을 고른 이유 — 사다리에서 h1 과 인트로 사이에 있는
//   토큰은 `xl`(1.5rem) · `2xl`(1.875rem) · `display-sm`(clamp 2.24~2.5rem) 셋이다.
//     display-sm  h1 의 하한(2.4rem)과 겹친다. 모바일에서 두 줄이 같은 크기가 된다
//     2xl         h1 하한 대비 0.78 배다. h1 이 하한에 붙는 좁은 폭에서 붙어 보인다
//     xl          h1 하한 대비 0.625 배 · 인트로 대비 1.33 배. 양쪽과 모두 벌어진다
//   크기만으로 세우지 않는다 — 굵기(bold → semibold → regular)와 색(흰 → 흰 → subtle)이
//   함께 내려간다. 색이 꺾이는 지점은 인트로다. 중간 줄까지가 제목 덩어리다.
//
//   아이브로우 라벨을 만들지 않는다. h1 위에는 아무것도 두지 않는다.
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
  /**
   * h1 과 인트로 사이 한 줄. h1 이 화면 이름(「포트폴리오」 · 「일하는 방식」)으로
   * 짧아지면서 주장을 담을 자리가 없어져 생긴 칸이다.
   *
   * **선택이다.** 넘기지 않으면 `<p>` 를 그리지 않는다 — 2단인 화면(P-05 ·
   * /contact · /insights · /privacy)이 빈 줄을 갖지 않는다 (POL-02).
   */
  tagline?: string;
  /**
   * 제목 아래 한 문단. 화면별 카피 파일에서 넘어온다.
   *
   * 선택이다. 확정 문구가 없는 화면이 빈 문자열을 넘겨 빈 `<p>` 를 만드는
   * 것보다, 문단 자체를 두지 않는 편이 낫다 — POL-02 「빈 요소를 렌더하지 않는다」.
   * 문구가 확정되면 넘기기만 하면 된다.
   *
   * **검색 결과에 나가는 문장이 아니다.** `metadata.description` 은 화면별 카피
   * 파일의 `metaDescription` 이 따로 갖는다 — POL-06 이 80~110자를 요구하는데
   * 화면에 그 길이의 문단을 두면 헤더가 본문처럼 읽힌다 (8/20 분리).
   */
  subtitle?: string;
};

export function PageHeader({ headingLines, tagline, subtitle }: PageHeaderProps) {
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

        {/* 중간 줄. h1 과 같은 흰 글자이고 폭도 h1 과 같은 --layout-content 다 —
            여기까지가 제목 덩어리다. 위 간격(`--space-4`)을 아래(`--space-6`)보다
            좁게 두어 h1 쪽에 붙인다 */}
        {tagline && (
          <p className="mt-[var(--space-4)] max-w-[var(--layout-content)] font-semibold text-[length:var(--font-size-xl)] leading-[var(--leading-heading)]">
            {tagline}
          </p>
        )}

        {subtitle && (
          <p className="mt-[var(--space-6)] max-w-[var(--layout-copy)] text-subtle text-[length:var(--font-size-lg)] leading-[var(--leading-relaxed)]">
            {subtitle}
          </p>
        )}
      </div>
    </section>
  );
}
