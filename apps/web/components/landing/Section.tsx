// P-01 섹션 껍데기
//
// 이 컴포넌트가 갖는 것은 **제목 슬롯 · 상하 여백 · 컨테이너 폭 · 제목과 내용의 배치** 뿐이다.
// 여백만 blockSpacing 으로 두 단계를 둔다 — 섹션 8 이 FN-P01-36 으로 다른 값을 요구한다.
// 배치는 layout 으로 두 가지다 — 제목 아래에 내용을 쌓는 `stacked`(기본)와
// 왼쪽에 제목 · 오른쪽에 내용을 두는 `split`(섹션 3 · 7, 8/21 · 사용자 지시).
// 기본값이 종전 동작이라 P-09 를 포함한 나머지 호출부는 그대로다.
// 섹션마다 안의 구조가 다르므로 내용은 children 으로 받고 여기서 통일하지 않는다.
// (2 인용 3문장 · 3 좌우 2단 · 4 카드 그리드 · 7 4묶음 나열 — 공통 구조가 없다)
//
// 근거 — 디자인규칙 「반복 부품」 Section(배경색 + 상하 여백 + 최대 폭 래퍼)
//   배경·글자색은 여기서 정하지 않는다. P-01 은 4구간 덩어리라 섹션마다 값이 다르고
//   (디자인규칙 「P-01 랜딩 배경 리듬」), 껍데기가 그 표를 알고 있으면
//   섹션이 늘 때마다 이 파일을 고치게 된다. 호출부가 className 으로 넘긴다.
//
// 모션은 넣지 않는다. 섹션별 인터랙션은 1·8 을 비워두는 배치라
// (POL-11①-2 · 디자인규칙 「P-01 섹션별 인터랙션」) 껍데기가 일괄로 걸면 전 섹션에 깔린다.

import { Fragment, type ReactNode } from 'react';

type SectionProps = {
  /** 앵커이자 제목 id 의 뿌리. 섹션마다 고유해야 한다 */
  id: string;
  /**
   * h2 제목. 문구는 화면별 카피 파일에서 넘어온다.
   *
   * **배열을 넘기면 그 자리에서 줄을 끊는다** (8/22 · 사용자 지시 — P-01 섹션 7).
   * Hero · PageHeader 의 `headingLines` 와 같은 방식이다. 문자열을 넘기면 종전대로
   * 자동 흘림에 맡기므로 나머지 호출부는 그대로다.
   *
   * 디자인규칙 「한글 조판」은 직접 끊는 제목을 히어로로 한정하지만, 섹션 7 은
   * 좌우 2단의 좁은 열(446px)에 놓여 자동 흘림이 3줄 문안을 2줄로 접는다
   */
  heading: string | readonly string[];
  /** 제목 아래 설명. 없는 섹션도 있다 */
  description?: string;
  /** 배경·글자색 — P-01 배경 리듬표의 해당 행 값을 호출부가 넘긴다 */
  className?: string;
  /**
   * 상하 여백.
   * - `default` — `--section-block`(96px)
   * - `tight` — `--space-12`(48px). 섹션 8 이 FN-P01-36 "하단 상담 섹션의 높이를 줄인다"
   *   (인수 기준 상하 여백 ≤ 56px)을 만족해야 해서 둔 값이다. 임의 축소가 아니다
   */
  blockSpacing?: 'default' | 'tight';
  /**
   * 제목과 내용의 배치.
   * - `stacked` — 제목 아래에 내용을 쌓는다 (종전 동작이자 기본값)
   * - `split` — lg 이상에서 **좌 제목 · 우 내용** 2단이 된다 (8/21 · 사용자 지시).
   *   기능명세 FN-P01-25 「좌 텍스트 · 우 2단 고정」이 요구하던 골격과 같다.
   *   lg 미만에서는 세로로 접히므로 좁은 화면의 읽는 순서는 stacked 와 다르지 않다
   */
  layout?: 'stacked' | 'split';
  /**
   * `split` 좌측 열에서 제목(과 description) 아래에 붙는 것. 부제·링크가 여기로 온다.
   * 어두운 배경이라 description 슬롯(`text-muted` 고정)을 쓰지 못하는 섹션이
   * 부제를 직접 그려 넘긴다. `stacked` 에서는 넘기지 않는다
   */
  aside?: ReactNode;
  children: ReactNode;
};

const BLOCK_PADDING = {
  default: 'py-[var(--section-block)]',
  tight: 'py-[var(--space-12)]',
} as const;

/**
 * split 의 2단 골격.
 *
 * 12칸을 5:7 로 나눈다 — 왼쪽은 제목 한 덩어리, 오른쪽은 나열이고 나열이 본문이다.
 * 히어로(7:5)와 좌우 비가 반대인 이유가 그것이다. 1200px 컨테이너에서
 * 좌 446px · 우 626px 이 된다.
 *
 * lg 미만에서는 한 칸으로 접힌다. 접혔을 때 두 덩어리 사이 간격은 `--space-10` 이고
 * 이는 stacked 가 제목과 children 사이에 두는 값과 같다 — 좁은 화면에서
 * 배치 모드에 따라 간격이 달라지지 않는다.
 *
 * `items-start` 를 두지 않는다. 두 열의 시작선이 이미 그리드 행 위쪽에서 맞고,
 * 왼쪽 열을 붙잡아 두면 오른쪽 나열이 늘 때 제목이 따라 늘어지지 않는다는 것만 다르다
 * (둘 다 높이를 늘리는 배경을 갖지 않으므로 화면에서 차이가 없다).
 */
const SPLIT_GRID =
  'grid grid-cols-1 gap-[var(--space-10)] lg:grid-cols-12 lg:gap-[var(--space-12)]';

export function Section({
  id,
  heading,
  description,
  className,
  blockSpacing = 'default',
  layout = 'stacked',
  aside,
  children,
}: SectionProps) {
  const headingId = `${id}-heading`;

  const container = `mx-auto w-full max-w-[var(--layout-container)] px-[var(--layout-gutter)] ${BLOCK_PADDING[blockSpacing]}`;

  const headingBlock = (
    <>
      <h2
        id={headingId}
        className="max-w-[var(--layout-content)] font-bold text-[length:var(--font-size-2xl)] leading-[var(--leading-heading)] tracking-[var(--tracking-heading)]"
      >
        {typeof heading === 'string'
          ? heading
          : heading.map((line, index) => (
              <Fragment key={line}>
                {index > 0 && <br />}
                {line}
              </Fragment>
            ))}
      </h2>

      {description && (
        <p className="mt-[var(--space-4)] max-w-[var(--layout-copy)] text-muted text-[length:var(--font-size-md)] leading-[var(--leading-relaxed)]">
          {description}
        </p>
      )}
    </>
  );

  if (layout === 'split') {
    return (
      <section id={id} aria-labelledby={headingId} className={className}>
        <div className={container}>
          <div className={SPLIT_GRID}>
            <div className="lg:col-span-5">
              {headingBlock}
              {aside}
            </div>

            <div className="lg:col-span-7">{children}</div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id={id} aria-labelledby={headingId} className={className}>
      <div className={container}>
        {headingBlock}

        <div className="mt-[var(--space-10)]">{children}</div>
      </div>
    </section>
  );
}
