// 화면 진입 감지 훅 — 디자인규칙 「P-01 섹션별 인터랙션 · 모션 값」
//   "구현은 IntersectionObserver 로 화면 진입을 감지해 클래스를 붙이는 방식"
//
// 훅은 **감지만** 한다. 무엇이 어떻게 나타나는지는 부르는 쪽이 정한다 —
// 섹션 2 는 인용 한 줄, 섹션 3 은 3쌍 문답의 순차 등장이라 연출이 서로 다르고,
// 인접한 두 섹션이 같은 인터랙션을 쓰면 반려된다 (FN-P01-02 · POL-11①-2).
// 여기서 트랜지션까지 정해 버리면 그 차이가 훅 안으로 숨는다.
//
// 한 번 나타나면 되돌리지 않는다. 스크롤을 되감을 때마다 다시 사라지면
// 등장이 장식으로 읽히고, 읽던 문장이 사라지는 사고가 난다.

import { useEffect, useRef, useState } from 'react';

type RevealOptions = {
  /** 요소가 이만큼 보이면 등장으로 친다 */
  readonly threshold?: number;
};

export function useRevealOnView<T extends HTMLElement>({ threshold = 0.2 }: RevealOptions = {}) {
  const ref = useRef<T>(null);
  const [isRevealed, setIsRevealed] = useState(false);

  useEffect(() => {
    const target = ref.current;
    if (target === null) return;

    // IntersectionObserver 가 없는 환경에서는 감지를 포기하고 그냥 보여준다.
    // 등장 연출은 없어도 되지만, 문장이 안 보이는 상태로 남으면 안 된다.
    if (typeof IntersectionObserver === 'undefined') {
      setIsRevealed(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          setIsRevealed(true);
          observer.disconnect();
        }
      },
      { threshold },
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, isRevealed };
}
