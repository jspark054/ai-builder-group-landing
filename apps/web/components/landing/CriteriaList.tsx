'use client';

// P-01 섹션 3 의 3쌍 문답. 이 섹션에서 클라이언트가 되는 유일한 조각이다.
//
// 근거 — 디자인규칙 「P-01 섹션별 인터랙션」 3행: "3쌍 문답이 순차 등장 (stagger)"
//   제목·서브에는 걸지 않는다. 섹션 전체가 떠오르면 섹션 2(인용 한 줄 페이드 인)와
//   같은 연출이 되고, 인접한 두 섹션이 같은 인터랙션을 쓰면 반려된다
//   (FN-P01-02 · POL-11①-2).
//
// 관측 대상은 세 항목이 아니라 목록 하나다. 가로 3열에서는 세 칸이 같은 순간에
// 화면에 들어오므로 항목마다 관측하면 순차가 되지 않는다. 목록이 들어온 시점을
// 기준으로 지연만 다르게 준다.
//
// 지연 값도 토큰이다 — `--duration-fast`(200ms) 의 배수. 새 토큰을 만들지 않는다.
// 마지막 칸이 400ms 에 시작해 300ms 동안 나타나므로 전체가 700ms 안에 끝난다.
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

export function CriteriaList({ items }: { items: readonly Criterion[] }) {
  const { ref, isRevealed } = useRevealOnView<HTMLOListElement>();

  return (
    // 순서가 고정된 목록이다 — 소구점 1·2·3 순서를 재정렬하지 않는다 (FN-P01-12).
    // 번호를 눈으로만 읽히는 라벨로 두는 대신 ol 로 순서를 마크업에 남긴다
    <ol ref={ref} className="grid grid-cols-1 gap-[var(--space-10)] md:grid-cols-3">
      {items.map((item, index) => (
        <li
          key={item.keyword}
          className={`${TRANSITION} ${REDUCED} ${isRevealed ? SHOWN : HIDDEN}`}
          style={{ transitionDelay: `calc(var(--duration-fast) * ${index})` }}
        >
          {/* 번호 — 소형 라벨. ol 이 순서를 이미 전달하므로 읽어 줄 필요가 없다 */}
          <span
            aria-hidden="true"
            className="block font-semibold text-subtle text-[length:var(--font-size-xs)] tracking-[var(--tracking-label)]"
          >
            {String(index + 1).padStart(2, '0')}
          </span>

          {/* 위계는 키워드 > 질문 > 설명이다. 질문이 먼저 오지만 가장 크지는 않다 */}
          <p className="mt-[var(--space-4)] text-muted text-[length:var(--font-size-base)] leading-[var(--leading-body)]">
            {item.question}
          </p>
          <p className="mt-[var(--space-2)] font-medium text-ink text-[length:var(--font-size-lg)] leading-[var(--leading-heading)]">
            {item.keyword}
          </p>
          <p className="mt-[var(--space-3)] text-muted text-[length:var(--font-size-sm)] leading-[var(--leading-relaxed)]">
            {item.description}
          </p>
        </li>
      ))}
    </ol>
  );
}
