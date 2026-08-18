// P-01 섹션 껍데기
//
// 이 컴포넌트가 갖는 것은 **제목 슬롯 · 상하 여백 · 컨테이너 폭** 뿐이다.
// 여백만 blockSpacing 으로 두 단계를 둔다 — 섹션 8 이 FN-P01-36 으로 다른 값을 요구한다.
// 섹션마다 안의 구조가 다르므로 내용은 children 으로 받고 여기서 통일하지 않는다.
// (2 인용 3문장 · 3 좌우 2단 · 4 카드 그리드 · 7 2행 4열 — 공통 구조가 없다)
//
// 근거 — 디자인규칙 「반복 부품」 Section(배경색 + 상하 여백 + 최대 폭 래퍼)
//   배경·글자색은 여기서 정하지 않는다. P-01 은 4구간 덩어리라 섹션마다 값이 다르고
//   (디자인규칙 「P-01 랜딩 배경 리듬」), 껍데기가 그 표를 알고 있으면
//   섹션이 늘 때마다 이 파일을 고치게 된다. 호출부가 className 으로 넘긴다.
//
// 모션은 넣지 않는다. 섹션별 인터랙션은 1·6·8 을 비워두는 배치라
// (POL-11①-2 · 디자인규칙 「P-01 섹션별 인터랙션」) 껍데기가 일괄로 걸면 전 섹션에 깔린다.

import type { ReactNode } from 'react';

type SectionProps = {
  /** 앵커이자 제목 id 의 뿌리. 섹션마다 고유해야 한다 */
  id: string;
  /** h2 제목. 문구는 content/p01-copy.ts 에서 넘어온다 */
  heading: string;
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
  children: ReactNode;
};

const BLOCK_PADDING = {
  default: 'py-[var(--section-block)]',
  tight: 'py-[var(--space-12)]',
} as const;

export function Section({
  id,
  heading,
  description,
  className,
  blockSpacing = 'default',
  children,
}: SectionProps) {
  const headingId = `${id}-heading`;

  return (
    <section id={id} aria-labelledby={headingId} className={className}>
      <div
        className={`mx-auto w-full max-w-[var(--layout-container)] px-[var(--layout-gutter)] ${BLOCK_PADDING[blockSpacing]}`}
      >
        <h2
          id={headingId}
          className="max-w-[var(--layout-content)] font-bold text-[length:var(--font-size-2xl)] leading-[var(--leading-heading)] tracking-[var(--tracking-heading)]"
        >
          {heading}
        </h2>

        {description && (
          <p className="mt-[var(--space-4)] max-w-[var(--layout-copy)] text-muted text-[length:var(--font-size-md)] leading-[var(--leading-relaxed)]">
            {description}
          </p>
        )}

        <div className="mt-[var(--space-10)]">{children}</div>
      </div>
    </section>
  );
}
