'use client';

// P-01 섹션 7 의 4묶음 그리드. 이 섹션에서 클라이언트가 되는 유일한 조각이다.
//
// **8단계 나열에서 4묶음 축약으로 바뀌었다 (8/20 · 사용자 지시).**
// P-01 은 요약, P-09 는 상세로 층을 가른다. 8단계 전체와 관문은 P-09 가 갖고,
// 이 그리드는 큰 흐름 넷만 보여준다. 값은 content/p01-copy.ts 의 groups 다.
// 되돌릴 때는 그 파일의 groups 주석(FN-P01-27 관련 경고)을 함께 본다.
//
// 근거 — 디자인규칙 「P-01 섹션별 인터랙션」 7행: "8단계 연결선이 스크롤에 따라 그려짐"
//   카드 자체는 움직이지 않는다. 움직이는 것은 카드 **사이의 선** 하나뿐이다 —
//   카드까지 떠오르면 섹션 4(카드 상승) · 섹션 3(순차 등장)과 구분되지 않고,
//   인접한 두 섹션이 같은 인터랙션을 쓰면 반려된다 (FN-P01-02 · POL-11①-2).
//   섹션 6 과 8 은 인터랙션이 없는 구간이라 앞뒤로도 겹치지 않는다.
//   칸이 여덟에서 넷으로 줄어도 인터랙션의 성격은 그대로다 — 그려지는 것은 선이다.
//
// 관측 대상은 네 칸이 아니라 목록 하나다. 칸마다 관측하면 4열에서 한 행이
// 동시에 들어와 순차가 되지 않는다. 목록이 들어온 시점을 기준으로 지연만 다르게 준다.
//
// SVG path 를 그리지 않는다. 연결선은 칸의 오른쪽 여백을 채우는 1px 요소이고,
// `scaleX(0) → scaleX(1)` 로 왼쪽에서 오른쪽으로 자란다. path 라면 stroke-dasharray
// 길이를 임의 수치로 잡아야 하는데 그 값은 토큰이 아니다.
//
// 모션 값은 토큰만 쓴다 — 지속 `--duration-base`, 가속 `--ease-out`,
// 지연은 `--duration-fast` 의 배수다. 선 세 개가 좌→우로 이어 그려지므로
// 마지막 선이 400ms 에 시작해 300ms 동안 자란다. 전체가 700ms 안에 끝난다.
//
// 마크업은 SSR 로 그대로 나가므로 REQ-N-001(콘텐츠를 담은 HTML)은 유지된다.

import { useRevealOnView } from '@/components/landing/use-reveal-on-view';

type ProcessGroup = {
  /** 「STEP 01–02」. 붙임표는 en dash(–) 다 */
  readonly eyebrow: string;
  readonly name: string;
  readonly summary: string;
};

/**
 * 한 행에 놓이는 칸 수. 연결선을 어디서 끊을지가 이 값에서 나온다.
 * 묶음이 넷이라 md 이상에서는 이 값이 곧 전체 개수이고 한 행으로 끝난다.
 */
const COLUMNS = 4;

const TRANSITION = 'transition-transform duration-[var(--duration-base)] ease-[var(--ease-out)]';

/** 모션을 끈 사용자에게는 감지를 기다리지 않고 처음부터 그려진 상태로 둔다 */
const REDUCED = 'motion-reduce:scale-x-100 motion-reduce:transition-none';

export function ProcessGrid({ groups }: { groups: readonly ProcessGroup[] }) {
  const { ref, isRevealed } = useRevealOnView<HTMLOListElement>();

  return (
    // 순서가 곧 프로세스다. ol 로 순서를 마크업에 남긴다 —
    // 순서를 시각 정보로만 두면 보조기술에 전달되지 않는다.
    //
    // md 이상 4열(한 줄) · sm 이상 2열 · sm 미만 1열.
    // 넷이 한 줄에 놓여야 「큰 흐름 넷」이 한눈에 잡힌다. 2열로 접혀도 좌→우 ·
    // 위→아래로 읽는 순서는 그대로다
    <ol
      ref={ref}
      className="grid grid-cols-1 items-stretch gap-[var(--space-6)] sm:grid-cols-2 md:grid-cols-4"
    >
      {groups.map((group, index) => {
        // 이을 상대가 없는 칸에는 선을 두지 않는다 — 행의 마지막 칸이거나
        // 목록의 마지막 칸이다. 묶음이 넷이라 md 에서는 두 조건이 같은 칸(04)을
        // 가리키지만, 개수가 바뀌어도 선이 허공으로 뻗지 않도록 둘 다 본다.
        // 2열·1열로 접히는 폭에서는 4열 행 자체가 성립하지 않으므로
        // 선을 md 부터만 보여준다 (아래 `hidden … md:block`)
        const hasConnector = (index + 1) % COLUMNS !== 0 && index !== groups.length - 1;

        return (
          <li key={group.eyebrow} className="relative flex h-full flex-col">
            {/* STEP 표기. 단계 번호를 그대로 담고 있으므로 묶음에 별도 번호(1~4)를
                붙이지 않는다 — 붙이는 순간 8단계가 아니라 4단계로 읽힌다.
                STEP 번호는 확정된 프로세스 구조이지 실적 수치가 아니다 (POL-01 대상 밖).
                aria-hidden 을 두지 않는다. 앞서 번호였을 때는 ol 이 순서를 이미
                전달해 중복 낭독이었지만, 「STEP 01–02」는 이 묶음이 8단계 중 어디인지
                알려 주는 유일한 표기라 읽혀야 한다 */}
            <span className="block font-semibold text-subtle text-[length:var(--font-size-xs)] tracking-[var(--tracking-label)]">
              {group.eyebrow}
            </span>

            {/* 묶음 이름 4종은 P-09 와 같은 값이다. 여기서 줄이거나 바꾸지 않는다 */}
            <p className="mt-[var(--space-3)] font-medium text-ink-inverse text-[length:var(--font-size-base)] leading-[var(--leading-heading)]">
              {group.name}
            </p>

            {/* 묶음마다 설명을 함께 표기한다. 이름만 두지 않는다 */}
            <p className="mt-[var(--space-2)] text-subtle text-[length:var(--font-size-sm)] leading-[var(--leading-relaxed)]">
              {group.summary}
            </p>

            {hasConnector && (
              // 칸의 오른쪽 끝에서 다음 칸까지, 즉 그리드 간격만큼만 채운다.
              // 세로 위치는 칸 높이의 절반이다 — 한 행의 칸들이 items-stretch 로
              // 높이를 공유하므로 선 세 개가 같은 높이에 놓인다
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
