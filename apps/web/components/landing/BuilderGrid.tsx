'use client';

// P-01 섹션 5 의 빌더 목록. 이 섹션에서 클라이언트가 되는 유일한 조각이다.
//
// 근거 — 디자인규칙 「P-01 섹션별 인터랙션」 5행 · FN-P01-02 · POL-11①-2
//
// 표의 5행은 「좌우 가로 스크롤」이지만 그 연출을 적용하지 않았다. 가로 스크롤은
// 목록이 화면 폭을 넘칠 때 성립하는데, FN-P01-35 가 정한 한 줄 6명이 lg 에서
// `grid-cols-6` 한 줄에 그대로 들어와 넘치지 않는다. 넘치지 않는 목록에 가로 스크롤을
// 붙이면 스크롤 막대만 남고 움직일 것이 없다.
//
// 대신 원형이 좌→우 순서로 나타나는 stagger 를 둔다. 섹션 6(의도적 공백)이 뒤에 있던
// 8/20 에는 섹션 5 가 인터랙션 0건이면 두 섹션이 같아져 FN-P01-02 위반이었다.
// 6 이 빠진 지금은 뒤가 7(연결선)이라 그 조건은 풀렸지만, stagger 를 되돌리지는 않는다 —
// 5 를 비우면 비워둔 구간이 1·5·8 로 늘어 페이지가 도로 밋밋해진다.
// 섹션 3 도 stagger 지만 사이에 4(카드 상승)가 있어 인접하지 않는다.
//
// 관측 대상은 카드 여섯이 아니라 목록 하나다. 한 줄에 놓인 카드는 같은 순간에
// 화면에 들어오므로 카드마다 관측하면 순차가 되지 않는다 (CriteriaList 와 같은 이유).
//
// 모션 값은 토큰만 쓴다 — 지속 `--duration-base`, 가속 `--ease-out`,
// 이동 `--move-sm`, 지연은 `--duration-fast` 의 정수배다.
//
// 마크업은 SSR 로 그대로 나가므로 REQ-N-001(콘텐츠를 담은 HTML)은 유지된다.

import type { BuilderCardData } from '@/components/cards/builder-card';
import { BuilderCard } from '@/components/cards/builder-card';
import { useRevealOnView } from '@/components/landing/use-reveal-on-view';

const TRANSITION =
  'transition-[opacity,transform] duration-[var(--duration-base)] ease-[var(--ease-out)]';

/** 이동 거리는 --move-sm 또는 --move-md 만 쓴다. 임의 수치 금지 */
const HIDDEN = 'opacity-0 translate-y-[var(--move-sm)]';
const SHOWN = 'opacity-100 translate-y-0';

/** 모션을 끈 사용자에게는 감지를 기다리지 않고 처음부터 보여준다 */
const REDUCED = 'motion-reduce:opacity-100 motion-reduce:translate-y-0';

/**
 * 지연 배수의 상한.
 * FN-P01-26 이 전원 노출이라 인원이 늘면 목록도 함께 길어지는데, 지연을 인원 수만큼
 * 늘리면 마지막 칸이 몇 초 뒤에 나타난다. 여섯 번째부터는 같은 지연을 공유한다 —
 * 좌→우로 훑는 인상은 앞쪽 몇 칸에서 이미 만들어진다.
 */
const MAX_DELAY_STEPS = 5;

export function BuilderGrid({ builders }: { builders: readonly BuilderCardData[] }) {
  const { ref, isRevealed } = useRevealOnView<HTMLUListElement>();

  return (
    // FN-P01-35 — 한 줄 6명. 12명이면 자연히 2줄이 된다.
    // FN-P01-26 이 전원 노출이므로 slice 로 상한을 두지 않는다.
    // ("인원 증가 시 페이지 길이 불변"을 요구하던 FN-P01-06 은 v4.0 이 뒤집었다)
    <ul
      ref={ref}
      className="grid grid-cols-3 gap-[var(--space-6)] md:grid-cols-4 lg:grid-cols-6"
    >
      {builders.map((builder, index) => (
        <li
          key={builder.slug}
          style={{
            transitionDelay: `calc(var(--duration-fast) * ${Math.min(index, MAX_DELAY_STEPS)})`,
          }}
          className={`flex ${TRANSITION} ${REDUCED} ${isRevealed ? SHOWN : HIDDEN}`}
        >
          <BuilderCard data={builder} variant="p01" />
        </li>
      ))}
    </ul>
  );
}
