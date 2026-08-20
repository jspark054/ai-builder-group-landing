'use client';

// P-01 섹션 3 의 3쌍 문답. 이 섹션에서 클라이언트가 되는 유일한 조각이다.
//
// 근거 — 디자인규칙 「P-01 섹션별 인터랙션」 3행: "3쌍 문답이 순차 등장 (stagger)"
//   제목에는 걸지 않는다. 섹션 전체가 떠오르면 섹션 2(인용 한 줄 페이드 인)와
//   같은 연출이 되고, 인접한 두 섹션이 같은 인터랙션을 쓰면 반려된다
//   (FN-P01-02 · POL-11①-2).
//
// 관측 대상은 세 항목이 아니라 목록 하나다. 목록이 들어온 시점을 기준으로
// 지연만 다르게 준다. 3열 카드였을 때는 세 칸이 같은 순간에 화면에 들어오기 때문이었고,
// 행 나열이 된 지금도 세 행이 한 화면에 함께 들어오므로 이유는 그대로다.
//
// 지연 값도 토큰이다 — `--duration-fast`(200ms) 의 배수. 새 토큰을 만들지 않는다.
// 마지막 행이 400ms 에 시작해 300ms 동안 나타나므로 전체가 700ms 안에 끝난다.
//
// 레이아웃 — 3열 카드 나열에서 **3행 나열**로 바꿨다 (8/20).
//   한 행이 좌우 2단이다. 좌 1 : 우 2 이고 md 미만에서는 세로로 접힌다.
//   좌 = 번호 + 라벨 / 우 = 인용 + 답.
//   위계를 크기로만 만들지 않는다 — 좌우 분할과 행 구분선이 그 일을 나눠 갖는다.
//   그래서 글자 크기 네 값(xs · lg · sm · base)은 3열이던 때 그대로다.
//
// 마크업은 SSR 로 그대로 나가므로 REQ-N-001(콘텐츠를 담은 HTML)은 유지된다.

import { useRevealOnView } from '@/components/landing/use-reveal-on-view';

type Criterion = {
  readonly question: string;
  readonly keyword: string;
  readonly description: string;
};

const TRANSITION =
  'transition-[opacity,transform] duration-[var(--duration-base)] ease-[var(--ease-out)]';

/** 이동 거리는 --move-sm 또는 --move-md 만 쓴다. 임의 수치 금지 */
const HIDDEN = 'opacity-0 translate-y-[var(--move-md)]';
const SHOWN = 'opacity-100 translate-y-0';

/** 모션을 끈 사용자에게는 감지를 기다리지 않고 처음부터 보여준다 */
const REDUCED = 'motion-reduce:opacity-100 motion-reduce:translate-y-0';

/**
 * 한 행의 뼈대.
 * 구분선은 `border-b` 로 행마다 아래에 둔다 — 행 사이 두 곳과 마지막 행 아래까지
 * 한 선언으로 덮인다. 첫 행 위에는 선이 없다. 제목과 목록 사이를 선이 가르면
 * 제목이 목록의 머리행처럼 읽힌다.
 *
 * 상하 패딩은 `--space-6`(1.5rem)이다. 행 안에서 좌우 두 단이 벌어지는 간격과 같은
 * 값이라 행의 안쪽 여백이 한 종류로 읽힌다. 새 값을 만들지 않았다.
 */
const ROW =
  'grid grid-cols-1 gap-[var(--space-4)] border-border border-b py-[var(--space-6)] md:grid-cols-3 md:gap-[var(--space-6)]';

export function CriteriaList({ items }: { items: readonly Criterion[] }) {
  const { ref, isRevealed } = useRevealOnView<HTMLOListElement>();

  return (
    // 순서가 고정된 목록이다 — 소구점 1·2·3 순서를 재정렬하지 않는다 (FN-P01-12).
    // 번호를 눈으로만 읽히는 라벨로 두는 대신 ol 로 순서를 마크업에 남긴다
    <ol ref={ref}>
      {items.map((item, index) => (
        <li
          key={item.keyword}
          className={`${ROW} ${TRANSITION} ${REDUCED} ${isRevealed ? SHOWN : HIDDEN}`}
          style={{ transitionDelay: `calc(var(--duration-fast) * ${index})` }}
        >
          {/* 좌측 단 — 번호와 라벨. 무엇에 대한 답인지를 먼저 세운다 */}
          <div>
            {/* 번호 — 소형 라벨. ol 이 순서를 이미 전달하므로 읽어 줄 필요가 없다 */}
            <span
              aria-hidden="true"
              className="block font-semibold text-subtle text-[length:var(--font-size-xs)] tracking-[var(--tracking-label)]"
            >
              {String(index + 1).padStart(2, '0')}
            </span>

            {/* 라벨이 행에서 가장 굵다. 크기는 3열이던 때와 같은 `lg` 다 */}
            <p className="mt-[var(--space-2)] font-bold text-ink text-[length:var(--font-size-lg)] leading-[var(--leading-heading)]">
              {item.keyword}
            </p>
          </div>

          {/* 우측 단 — 인용과 답. 인용이 위에 온다 (FN-P01-11) */}
          <div className="md:col-span-2">
            {/* 화면설계 §5.1 — 인용은 답보다 작고 연하다. 그 반대가 되면 불안을 파는
                인상이 되어 POL-13 공포 마케팅 금지에 저촉된다.
                크기(`sm`)는 그대로 두고, 색은 `text-muted` 를 유지한다 —
                이 섹션 배경은 `bg-surface-raised`(#ffffff)이고 그 위에서
                `text-subtle`(#b5afa2)은 대비가 2.2:1 이라 읽히지 않는다.
                `text-subtle` 은 어두운 배경이 맡는다 (ProblemSection.tsx 와 같은 판단).
                아래 답이 `text-ink` 로 올라갔으므로 "인용이 더 연하다"는 조건은 지켜진다 */}
            <p className="text-muted text-[length:var(--font-size-sm)] leading-[var(--leading-body)]">
              {item.question}
            </p>

            {/* 답 — 행에서 가장 진하다. 크기는 3열이던 때와 같은 `base` 다 */}
            <p className="mt-[var(--space-3)] text-ink text-[length:var(--font-size-base)] leading-[var(--leading-relaxed)]">
              {item.description}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}
