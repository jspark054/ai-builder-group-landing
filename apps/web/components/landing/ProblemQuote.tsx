'use client';

// P-01 섹션 2 의 인용 한 줄. 이 섹션에서 클라이언트가 되는 유일한 조각이다.
//
// 근거 — 디자인규칙 「P-01 섹션별 인터랙션」 2행: "인용문 한 줄만 페이드 인"
//   본문 두 줄에는 걸지 않는다. 섹션 안의 모든 문장이 나타나면 이 섹션의 인터랙션이
//   "텍스트 등장"이 되어 버리고, 그러면 섹션 3(3쌍 문답 순차 등장)과 구분되지 않는다
//   (FN-P01-02 · POL-11①-2).
//
// 이 조각이 갖는 것은 **등장 여부**뿐이다. 크기·굵기·색은 className 으로 받는다 —
// FN-P01-20 의 위계(인용과 본문이 같은 크기·굵기, 색만 다름)는 두 문단을 나란히 놓고
// 봐야 지켜지므로 판단을 서버 컴포넌트 한 곳에 남긴다.
//
// 모션 값은 토큰만 쓴다 — 디자인규칙 「모션 값」의 선언을 그대로 옮긴 것이다.
//   transition: opacity var(--duration-base) var(--ease-out),
//               transform var(--duration-base) var(--ease-out);

import { useRevealOnView } from '@/components/landing/use-reveal-on-view';

const TRANSITION =
  'transition-[opacity,transform] duration-[var(--duration-base)] ease-[var(--ease-out)]';

/** 이동 거리는 --move-sm 또는 --move-md 만 쓴다. 임의 수치 금지 */
const HIDDEN = 'opacity-0 translate-y-[var(--move-md)]';
const SHOWN = 'opacity-100 translate-y-0';

/** 모션을 끈 사용자에게는 감지를 기다리지 않고 처음부터 보여준다 */
const REDUCED = 'motion-reduce:opacity-100 motion-reduce:translate-y-0';

export function ProblemQuote({ children, className }: { children: string; className?: string }) {
  const { ref, isRevealed } = useRevealOnView<HTMLParagraphElement>();

  return (
    <p
      ref={ref}
      className={`${className ?? ''} ${TRANSITION} ${REDUCED} ${isRevealed ? SHOWN : HIDDEN}`}
    >
      {children}
    </p>
  );
}
