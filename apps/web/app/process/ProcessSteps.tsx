'use client';

// P-09 블록 2 — 8단계 프로세스 목록
//
// 이 화면에서 클라이언트가 되는 유일한 조각이다. 스크롤 위치에 따라 현재 단계만
// 강조하려면 IntersectionObserver 가 필요하고, 그 범위를 이 목록으로 가둔다.
// 나머지 블록(헤더 · 조직 · 다이어그램)은 서버 컴포넌트로 남는다.
// 마크업은 SSR 로 그대로 나가므로 REQ-N-001(콘텐츠를 담은 HTML) 은 유지된다.
//
// POL-11①-2 — 강조를 거는 곳은 단계 카드뿐이다. 묶음 머리글 · 관문 · 조직 블록 ·
// 다이어그램 블록은 비워 둔다. 묶음이 순차로 반응하면 8단계가 아니라
// 4단계 프로세스처럼 읽힌다.
//
// 강조는 색 · 배경 · 테두리와 왼쪽 바까지다. 위치와 크기를 건드리지 않으므로
// 등장 애니메이션이 아니라 현재 위치 표시다.

import { useEffect, useRef, useState } from 'react';

type Step = {
  readonly label: string;
  readonly description: string;
};

type Group = {
  /** 「STEP 01–02」. 붙임표는 en dash 다 */
  readonly eyebrow: string;
  readonly name: string;
  readonly summary: string;
  /** 앞 묶음과의 경계에 놓이는 관문 문구. 첫 묶음에는 없다 */
  readonly entryNote?: string;
  readonly steps: readonly Step[];
};

type ProcessStepsProps = {
  readonly lead: string;
  readonly groups: readonly Group[];
  readonly gate: {
    /** 관문 마커의 접근성 이름 (FN-P09-03) */
    readonly label: string;
    /** 마지막 단계 아래에 오는 관문 문구 */
    readonly closing: string;
  };
  className?: string;
};

/** 토큰 값만 쓴다. 임의 수치 금지 (하드 룰 2) */
const TRANSITION =
  'transition-[color,background-color,border-color] duration-[var(--duration-base)] ease-[var(--ease-out)]';

/**
 * 단계 사이 관문 (FN-P09-03). 여덟 곳 — 단계 사이 일곱 곳과 8단계 카드 아래 한 곳.
 * 문구는 묶음이 바뀌는 경계와 마지막 한 곳에만 붙는다. 여덟 곳 전부에 문장을 달면
 * 읽을 것이 두 배가 되고 단계 카드가 묻힌다.
 *
 * 3열 격자를 쓰는 이유 — 문구를 마커와 같은 flex 행에 두면 행 전체가 가운데로
 * 정렬되면서 마커가 세로선 축에서 왼쪽으로 밀린다. 가운데 열에 마커를 고정하고
 * 문구는 오른쪽 열에 둔다.
 */
function Gate({ label, note }: { label: string; note?: string }) {
  return (
    <div className="flex flex-col items-center">
      <span aria-hidden="true" className="h-[var(--space-3)] w-px bg-border" />

      <div className="grid w-full grid-cols-[1fr_auto_1fr] items-center">
        <span aria-hidden="true" />
        <svg
          role="img"
          aria-label={label}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="size-3 text-brand-soft"
        >
          <path d="m5 13 4 4L19 7" />
        </svg>
        {note === undefined ? (
          <span aria-hidden="true" />
        ) : (
          <span className="justify-self-start pl-[var(--space-2)] text-muted text-[length:var(--font-size-xs)]">
            {note}
          </span>
        )}
      </div>

      <span aria-hidden="true" className="h-[var(--space-3)] w-px bg-border" />
    </div>
  );
}

export function ProcessSteps({ lead, groups, gate, className }: ProcessStepsProps) {
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
    <div className={className}>
      {/* 관문이 여덟 곳에 흩어져 있으므로 규칙을 목록 머리에 한 번 밝힌다.
          잠깐 개요 블록으로 옮겼다가 되돌렸다 (8/20) — 그 블록이 P-01 섹션 7 과
          중복이 되어 사라졌고, 이 문장은 목록의 전제라 목록과 함께 있어야 한다 */}
      <p className="text-base text-muted leading-[var(--leading-relaxed)]">{lead}</p>

      <ol ref={listRef} className="mt-[var(--space-8)]">
        {groups.map((group, groupIndex) => {
          // 번호는 묶음이 아니라 전체 나열 순서에서 파생된다. 묶음마다 1 로 돌아가지 않는다
          const offset = groups
            .slice(0, groupIndex)
            .reduce((count, previous) => count + previous.steps.length, 0);

          return (
            <li key={group.name}>
              {/* 묶음 경계의 관문 — 02↔03 · 04↔05 · 06↔07. 문구가 붙는 자리다 */}
              {groupIndex > 0 && <Gate label={gate.label} note={group.entryNote} />}

              {/* 묶음 머리글. 단계 라벨보다 작고, 스크롤 강조 대상이 아니다.
                  STEP 라벨 · 이름 · summary 세 줄이다. 잠깐 summary 를 뺐다가
                  되돌렸다 (8/20) — 뺀 이유가 개요 블록과의 중복이었는데 그 블록이
                  사라졌다. 이제 이 화면에서 묶음을 설명하는 곳은 여기뿐이다.
                  P-01 섹션 7 이 같은 4묶음을 갖지만 그건 다른 화면이라 중복이 아니다 */}
              <div className={groupIndex > 0 ? 'mt-[var(--space-4)]' : undefined}>
                <p className="font-semibold text-subtle text-[length:var(--font-size-xs)] tracking-[var(--tracking-label)]">
                  {group.eyebrow}
                </p>
                <p className="mt-[var(--space-1)] font-medium text-ink text-sm">{group.name}</p>
                <p className="mt-[var(--space-1)] text-muted text-sm">{group.summary}</p>
              </div>

              <ol className="mt-[var(--space-4)]">
                {group.steps.map((step, stepIndex) => {
                  const index = offset + stepIndex;
                  const ordinal = String(index + 1).padStart(2, '0');
                  const isActive = index === activeIndex;

                  return (
                    <li key={step.label}>
                      {/* 묶음 안의 관문 — 01↔02 · 03↔04 · 05↔06 · 07↔08. 마커만 둔다 */}
                      {stepIndex > 0 && <Gate label={gate.label} />}
                      <div
                        data-step-index={index}
                        className={`relative flex items-center gap-[var(--space-5)] overflow-hidden rounded-card border p-[var(--space-6)] ${TRANSITION} ${
                          isActive ? 'border-border-strong bg-surface-soft' : 'border-border'
                        }`}
                      >
                        {/* 왼쪽 바. border-left 로 넣으면 모서리 곡률이 한쪽만 펴진다.
                            absolute 로 얹고 카드의 overflow-hidden 이 곡률을 따라 자른다 */}
                        {isActive && (
                          <span
                            aria-hidden="true"
                            className="absolute inset-y-0 left-0 w-[2px] bg-brand"
                          />
                        )}
                        <span
                          aria-hidden="true"
                          className={`shrink-0 font-mono font-semibold text-4xl leading-none tabular-nums ${TRANSITION} ${
                            isActive ? 'text-brand' : 'text-subtle'
                          }`}
                        >
                          {ordinal}
                        </span>
                        <div>
                          <p className="font-semibold text-ink text-[length:var(--font-size-lg)] leading-[var(--leading-heading)]">
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

      {/* 마지막 관문. 8단계 카드 아래에 온다 — 종료도 검수를 거친다 */}
      <Gate label={gate.label} note={gate.closing} />
    </div>
  );
}
