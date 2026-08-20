'use client';

// P-01 섹션 7 의 8단계 그리드. 이 섹션에서 클라이언트가 되는 유일한 조각이다.
//
// 근거 — 디자인규칙 「P-01 섹션별 인터랙션」 7행: "8단계 연결선이 스크롤에 따라 그려짐"
//   카드 자체는 움직이지 않는다. 움직이는 것은 카드 **사이의 선** 하나뿐이다 —
//   카드까지 떠오르면 섹션 4(카드 상승) · 섹션 3(순차 등장)과 구분되지 않고,
//   인접한 두 섹션이 같은 인터랙션을 쓰면 반려된다 (FN-P01-02 · POL-11①-2).
//   섹션 6 과 8 은 인터랙션이 없는 구간이라 앞뒤로도 겹치지 않는다.
//
// 관측 대상은 여덟 칸이 아니라 목록 하나다. 칸마다 관측하면 4열에서 같은 행이
// 동시에 들어와 순차가 되지 않는다. 목록이 들어온 시점을 기준으로 지연만 다르게 준다.
//
// SVG path 를 그리지 않는다. 연결선은 칸의 오른쪽 여백을 채우는 1px 요소이고,
// `scaleX(0) → scaleX(1)` 로 왼쪽에서 오른쪽으로 자란다. path 라면 stroke-dasharray
// 길이를 임의 수치로 잡아야 하는데 그 값은 토큰이 아니다.
//
// 모션 값은 토큰만 쓴다 — 지속 `--duration-base`, 가속 `--ease-out`,
// 행 안의 지연은 `--duration-fast` 의 배수다. 두 행이 나란히 그려지므로
// 마지막 선이 400ms 에 시작해 300ms 동안 자란다. 전체가 700ms 안에 끝난다.
//
// 마크업은 SSR 로 그대로 나가므로 REQ-N-001(콘텐츠를 담은 HTML)은 유지된다.

import { useRevealOnView } from '@/components/landing/use-reveal-on-view';

type ProcessStep = {
  readonly label: string;
  readonly description: string;
};

/** 한 행에 놓이는 칸 수. 연결선을 어디서 끊을지가 이 값에서 나온다 (FN-P01-27 2행 4열) */
const COLUMNS = 4;

const TRANSITION = 'transition-transform duration-[var(--duration-base)] ease-[var(--ease-out)]';

/** 모션을 끈 사용자에게는 감지를 기다리지 않고 처음부터 그려진 상태로 둔다 */
const REDUCED = 'motion-reduce:scale-x-100 motion-reduce:transition-none';

export function ProcessGrid({ steps }: { steps: readonly ProcessStep[] }) {
  const { ref, isRevealed } = useRevealOnView<HTMLOListElement>();

  return (
    // 순서가 곧 프로세스다. ol 로 순서를 마크업에 남긴다 —
    // 번호를 눈으로만 읽히는 라벨로 두면 순서가 시각 정보로만 남는다
    <ol
      ref={ref}
      className="grid grid-cols-2 items-stretch gap-[var(--space-6)] md:grid-cols-4"
    >
      {steps.map((step, index) => {
        // 행의 마지막 칸에는 이을 상대가 없다. 2열로 접히는 폭에서는 4열 행 자체가
        // 성립하지 않으므로 선을 md 부터만 보여준다
        const hasConnector = (index + 1) % COLUMNS !== 0;

        return (
          <li key={step.label} className="relative flex h-full flex-col">
            {/* 번호 — 소형 라벨. ol 이 순서를 이미 전달하므로 읽어 줄 필요가 없다.
                단계 번호는 확정된 프로세스 구조이지 실적 수치가 아니다 (POL-01 대상 밖) */}
            <span
              aria-hidden="true"
              className="block font-semibold text-subtle text-[length:var(--font-size-xs)] tracking-[var(--tracking-label)]"
            >
              {String(index + 1).padStart(2, '0')}
            </span>

            {/* 라벨 8종은 발주사 지시 확정값이다. 여기서 줄이거나 바꾸지 않는다 */}
            <p className="mt-[var(--space-3)] font-medium text-ink-inverse text-[length:var(--font-size-base)] leading-[var(--leading-heading)]">
              {step.label}
            </p>

            {/* FN-P01-27 — 단계마다 설명을 함께 표기한다. 라벨만 두지 않는다 */}
            <p className="mt-[var(--space-2)] text-subtle text-[length:var(--font-size-sm)] leading-[var(--leading-relaxed)]">
              {step.description}
            </p>

            {hasConnector && (
              // 칸의 오른쪽 끝에서 다음 칸까지, 즉 그리드 간격만큼만 채운다.
              // 세로 위치는 칸 높이의 절반이다 — 같은 행의 칸들이 items-stretch 로
              // 높이를 공유하므로 한 행의 선 세 개가 같은 높이에 놓인다
              <span
                aria-hidden="true"
                style={{ transitionDelay: `calc(var(--duration-fast) * ${index % COLUMNS})` }}
                className={`absolute top-1/2 left-full hidden h-px w-[var(--space-6)] origin-left bg-subtle md:block ${TRANSITION} ${REDUCED} ${
                  isRevealed ? 'scale-x-100' : 'scale-x-0'
                }`}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
