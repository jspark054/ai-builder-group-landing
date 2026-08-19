'use client';

// P-09 블록 2 — 8단계 프로세스 목록
//
// 이 화면에서 클라이언트가 되는 유일한 조각이다. 스크롤 위치에 따라 현재 단계만
// 강조하려면 IntersectionObserver 가 필요하고, 그 범위를 이 목록으로 가둔다.
// 나머지 블록(헤더 · 조직 · 다이어그램)은 서버 컴포넌트로 남는다.
// 마크업은 SSR 로 그대로 나가므로 REQ-N-001(콘텐츠를 담은 HTML) 은 유지된다.
//
// POL-11①-2 — 강조를 거는 곳은 여기뿐이다. 조직 블록과 다이어그램 블록은 비워 둔다.
// 묶음 이름에도 걸지 않는다. 네 묶음이 순차로 반응하면 8단계가 아니라
// 4단계 프로세스처럼 읽힌다.
//
// 강조는 색과 테두리만 바꾼다. 위치·크기·투명도를 건드리지 않으므로
// 등장 애니메이션이 아니라 현재 위치 표시다.

import { useEffect, useRef, useState } from 'react';

type Step = {
  readonly label: string;
  readonly description: string;
};

type Group = {
  readonly name: string;
  readonly steps: readonly Step[];
};

type ProcessStepsProps = {
  readonly groups: readonly Group[];
  /** 단계 사이 관문 문구 (FN-P09-03) */
  readonly gate: string;
  className?: string;
};

/** 토큰 값만 쓴다. 임의 수치 금지 (하드 룰 2) */
const TRANSITION =
  'transition-[color,border-color] duration-[var(--duration-base)] ease-[var(--ease-out)]';

/** 단계 사이 관문. 묶음 안이든 묶음 경계든 같은 모양으로 일곱 곳 전부에 들어간다. */
function Gate({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center py-[var(--space-3)]">
      <span aria-hidden="true" className="h-[var(--space-4)] w-px bg-border" />
      <span className="rounded-pill border border-border-strong bg-surface-soft px-[var(--space-4)] py-[var(--space-1-5)] font-semibold text-brand text-[length:var(--font-size-xs)] tracking-[var(--tracking-label)]">
        {label}
      </span>
      <span aria-hidden="true" className="h-[var(--space-4)] w-px bg-border" />
    </div>
  );
}

export function ProcessSteps({ groups, gate, className }: ProcessStepsProps) {
  // 첫 진입에서 아무 것도 강조되지 않으면 꺼진 화면으로 보인다. 1단계에서 시작한다
  const [activeIndex, setActiveIndex] = useState(0);
  const listRef = useRef<HTMLOListElement>(null);

  useEffect(() => {
    const root = listRef.current;
    if (root === null) return;

    const cards = root.querySelectorAll<HTMLElement>('[data-step-index]');
    if (cards.length === 0) return;

    // 뷰포트 가운데의 얇은 띠만 관측 구간으로 남긴다. 띠에 들어온 카드가 현재 단계다.
    // 띠가 카드 사이 여백(관문)에 걸려 있는 동안에는 직전 값을 유지한다 —
    // 매번 비우면 스크롤 중에 강조가 깜빡인다.
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const index = Number(entry.target.getAttribute('data-step-index'));
          if (Number.isNaN(index)) continue;
          setActiveIndex(index);
        }
      },
      { rootMargin: '-45% 0px -45% 0px' },
    );

    for (const card of cards) observer.observe(card);
    return () => observer.disconnect();
  }, []);

  return (
    <ol ref={listRef} className={className}>
      {groups.map((group, groupIndex) => {
        // 번호는 묶음이 아니라 전체 나열 순서에서 파생된다. 묶음마다 1 로 돌아가지 않는다
        const offset = groups
          .slice(0, groupIndex)
          .reduce((count, previous) => count + previous.steps.length, 0);

        return (
          <li key={group.name}>
            {/* 묶음 경계에도 관문이 온다 — 2↔3 · 4↔5 · 6↔7 */}
            {groupIndex > 0 && <Gate label={gate} />}

            {/* 묶음 이름. 단계 라벨보다 작고, 강조 대상이 아니다 */}
            <p className="font-semibold text-muted text-[length:var(--font-size-xs)] tracking-[var(--tracking-label)]">
              {group.name}
            </p>

            <ol className="mt-[var(--space-4)]">
              {group.steps.map((step, stepIndex) => {
                const index = offset + stepIndex;
                const ordinal = String(index + 1).padStart(2, '0');
                const isActive = index === activeIndex;

                return (
                  <li key={step.label}>
                    {/* 묶음 안의 관문 — 1↔2 · 3↔4 · 5↔6 · 7↔8 */}
                    {stepIndex > 0 && <Gate label={gate} />}
                    <div
                      data-step-index={index}
                      className={`flex items-center gap-[var(--space-5)] rounded-card border p-[var(--space-6)] ${TRANSITION} ${
                        isActive ? 'border-border-strong' : 'border-border'
                      }`}
                    >
                      <span
                        aria-hidden="true"
                        className={`shrink-0 font-mono font-semibold text-4xl leading-none tabular-nums ${TRANSITION} ${
                          isActive ? 'text-brand' : 'text-subtle'
                        }`}
                      >
                        {ordinal}
                      </span>
                      <div>
                        <p
                          className={`font-semibold text-[length:var(--font-size-lg)] leading-[var(--leading-heading)] ${TRANSITION} ${
                            isActive ? 'text-brand' : 'text-ink'
                          }`}
                        >
                          {step.label}
                        </p>
                        <p className="mt-[var(--space-2)] text-muted text-[length:var(--font-size-base)] leading-[var(--leading-relaxed)]">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
          </li>
        );
      })}
    </ol>
  );
}
