'use client';

// P-09 블록 2 — 8단계 프로세스 목록
//
// **8/22 에 배치가 바뀌었다 (목업 `abg_complete_final_v2_home_and_detail.html`).**
//   종전   카드 8장을 세로로 쌓고 카드 사이에 관문 마커를 끼웠다
//   현재   묶음마다 **좌 묶음 칸 · 우 단계 레일** 2단이다. 레일은 세로선 하나이고
//          단계마다 점이 얹힌다. 관문 문구는 묶음 칸으로 옮겨 갔다
//
// 이 화면에서 클라이언트가 되는 유일한 조각이다. 스크롤 위치에 따라 현재 단계만
// 강조하려면 IntersectionObserver 가 필요하고, 그 범위를 이 목록으로 가둔다.
// 나머지 블록(헤더 · 조직)은 서버 컴포넌트로 남는다.
// 마크업은 SSR 로 그대로 나가므로 REQ-N-001(콘텐츠를 담은 HTML) 은 유지된다.
//
// POL-11①-2 — 강조를 거는 곳은 단계 행뿐이다. 묶음 칸 · 관문 · 조직 블록은 비워 둔다.
// 묶음이 순차로 반응하면 8단계가 아니라 4단계 프로세스처럼 읽힌다.
// 강조는 점과 글자색까지다. 위치와 크기를 건드리지 않으므로 등장 애니메이션이 아니라
// 현재 위치 표시다.
//
// 색·치수는 토큰만 쓴다. 목업의 `#F5F4F1` · `10.5px` 류는 토큰에 없는 값이라
// 그대로 옮기지 않았다 (하드 룰 1). 가져온 것은 **배치**다.

import { useEffect, useRef, useState } from 'react';

type Step = {
  readonly label: string;
  readonly description: string;
};

type Group = {
  /** 「STEP 01–02」. 붙임표는 en dash 다 */
  readonly eyebrow: string;
  readonly name: string;
  /** 이 묶음을 나가는 관문 문구. 마지막 묶음에는 없다 */
  readonly exitNote?: string;
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
const TRANSITION = 'transition-colors duration-[var(--duration-base)] ease-[var(--ease-out)]';

/**
 * 레일 세로선 위에 얹히는 표시들의 가로 위치.
 * 레일은 `border-l` + `pl-[--space-6]` 이라 선의 중심은 내용 왼쪽에서 `--space-6` 만큼
 * 바깥이다. 도형의 절반을 더 빼서 선 위에 중심을 맞춘다.
 */
const DOT_X = 'left-[calc(-1*(var(--space-6)+var(--space-1)))]';
const MARK_X = 'left-[calc(-1*(var(--space-6)+var(--space-2)))]';

/** 관문 마커와 마지막 배너가 같은 도형을 쓴다 — 두 곳이 같은 「확인하고 넘어간다」다 */
function CheckPath() {
  return <path d="m5 13 4 4L19 7" />;
}

/**
 * 단계 사이 관문 (FN-P09-03). 일곱 곳 — 묶음 안 네 곳(01↔02 · 03↔04 · 05↔06 · 07↔08)과
 * 묶음이 바뀌는 세 곳이다. 여덟 번째는 목록 아래 배너(`gate.closing`)가 맡는다.
 *
 * 목업에는 이 마커가 없고 점만 있었다. 사용자 승인으로 남긴다 (8/22) —
 * 「각 단계 사이에 관문을 표시한다」가 FN-P09-03 의 인수 기준이라 점만으로는 채워지지 않는다.
 *
 * 배경을 깔아 레일 선을 끊는다. 선이 마커를 관통하면 표시가 아니라 장식으로 읽힌다.
 */
function GateMarker({ label }: { label: string }) {
  return (
    <div className="relative h-[var(--space-6)]">
      <svg
        role="img"
        aria-label={label}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`-translate-y-1/2 absolute top-1/2 ${MARK_X} size-4 rounded-pill bg-surface-raised text-brand-soft`}
      >
        <CheckPath />
      </svg>
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

    const rows = root.querySelectorAll<HTMLElement>('[data-step-index]');
    if (rows.length === 0) return;

    // 뷰포트 가운데의 얇은 띠만 관측 구간으로 남긴다. 띠에 들어온 행이 현재 단계다.
    // 띠가 행 사이 여백(관문)에 걸려 있는 동안에는 직전 값을 유지한다 —
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

    for (const row of rows) observer.observe(row);
    return () => observer.disconnect();
  }, []);

  return (
    <div className={className}>
      {/* 관문이 여덟 곳에 흩어져 있으므로 규칙을 목록 머리에 한 번 밝힌다.
          목업에는 없는 줄이고 사용자 승인으로 남겼다 (8/22) — 마커가 무엇을 뜻하는지
          화면에서 말하는 곳이 여기뿐이다 */}
      <p className="text-base text-muted leading-[var(--leading-relaxed)]">{lead}</p>

      <ol ref={listRef} className="mt-[var(--space-8)]">
        {groups.map((group, groupIndex) => {
          // 번호는 묶음이 아니라 전체 나열 순서에서 파생된다. 묶음마다 1 로 돌아가지 않는다
          const offset = groups
            .slice(0, groupIndex)
            .reduce((count, previous) => count + previous.steps.length, 0);

          return (
            /* 묶음 구분선은 진한 `border-ink` 다. 레일 선(`border-border`)보다 강해야
               묶음의 경계가 단계 사이 간격과 구분된다 — 두 선이 같은 값이면
               8단계가 넷씩 묶여 있다는 것이 보이지 않는다 */
            <li
              key={group.name}
              className="border-ink border-t py-[var(--space-8)] first:border-t-0 first:pt-0"
            >
              <div className="grid gap-[var(--space-6)] md:grid-cols-[minmax(0,11rem)_minmax(0,1fr)] md:gap-[var(--space-8)]">
                {/* 좌 — 묶음 칸. STEP 라벨 · 이름 · 관문 문구 셋이다.
                    묶음 설명(summary)은 두지 않는다 (8/22) — 이 칸이 11rem 이라
                    한 문장이 대여섯 줄로 접힌다. 그 문장은 P-01 섹션 7 이 갖고 있다 */}
                <div>
                  <p className="font-semibold text-brand text-[length:var(--font-size-xs)] tracking-[var(--tracking-label)]">
                    {group.eyebrow}
                  </p>
                  <p className="mt-[var(--space-2)] font-bold text-ink text-[length:var(--font-size-lg)] leading-[var(--leading-heading)]">
                    {group.name}
                  </p>

                  {/* 관문 문구. 왼쪽 브랜드 색 바가 아래 레일의 관문 마커와 짝이다 */}
                  {group.exitNote !== undefined && (
                    <p className="mt-[var(--space-4)] border-brand border-l-2 pl-[var(--space-3)] font-medium text-ink text-[length:var(--font-size-xs)] leading-[var(--leading-relaxed)]">
                      {group.exitNote}
                    </p>
                  )}
                </div>

                {/* 우 — 단계 레일. 세로선 하나에 단계마다 점이 얹힌다 */}
                <div className="border-border border-l pl-[var(--space-6)]">
                  <ol>
                    {group.steps.map((step, stepIndex) => {
                      const index = offset + stepIndex;
                      const ordinal = String(index + 1).padStart(2, '0');
                      const isActive = index === activeIndex;

                      return (
                        <li key={step.label}>
                          {/* 묶음 안의 관문 — 01↔02 · 03↔04 · 05↔06 · 07↔08 */}
                          {stepIndex > 0 && <GateMarker label={gate.label} />}

                          <div data-step-index={index} className="relative py-[var(--space-3)]">
                            <span
                              aria-hidden="true"
                              className={`absolute top-[var(--space-4)] ${DOT_X} size-2 rounded-pill ${TRANSITION} ${
                                isActive ? 'bg-brand' : 'bg-subtle'
                              }`}
                            />
                            <p
                              aria-hidden="true"
                              className={`font-semibold text-[length:var(--font-size-xs)] tabular-nums tracking-[var(--tracking-label)] ${TRANSITION} ${
                                isActive ? 'text-brand' : 'text-subtle'
                              }`}
                            >
                              {ordinal}
                            </p>
                            <p className="mt-[var(--space-1)] font-semibold text-ink text-[length:var(--font-size-base)]">
                              {step.label}
                            </p>
                            <p className="mt-[var(--space-1)] text-muted text-[length:var(--font-size-sm)] leading-[var(--leading-relaxed)]">
                              {step.description}
                            </p>
                          </div>
                        </li>
                      );
                    })}
                  </ol>

                  {/* 묶음이 바뀌는 관문 — 02↔03 · 04↔05 · 06↔07.
                      레일 끝에 놓아 같은 묶음 칸의 관문 문구와 한 덩어리로 읽힌다 */}
                  {group.exitNote !== undefined && <GateMarker label={gate.label} />}
                </div>
              </div>
            </li>
          );
        })}
      </ol>

      {/* 여덟 번째 관문. 8단계 아래에 온다 — 종료도 검수를 거친다 */}
      <div className="flex items-center gap-[var(--space-3)] rounded-card bg-surface-soft px-[var(--space-6)] py-[var(--space-4)]">
        <svg
          role="img"
          aria-label={gate.label}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="size-4 shrink-0 text-brand"
        >
          <CheckPath />
        </svg>
        <p className="font-semibold text-brand-soft text-[length:var(--font-size-base)]">
          {gate.closing}
        </p>
      </div>
    </div>
  );
}
