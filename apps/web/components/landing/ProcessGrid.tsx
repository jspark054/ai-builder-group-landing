'use client';

// P-01 섹션 7 의 4묶음 그리드. 이 섹션에서 클라이언트가 되는 유일한 조각이다.
//
// **8단계 나열에서 4묶음 축약으로 바뀌었다 (8/20 · 사용자 지시).**
// P-01 은 요약, P-09 는 상세로 층을 가른다. 8단계 전체와 관문은 P-09 가 갖고,
// 이 그리드는 큰 흐름 넷만 보여준다. 값은 content/p01-copy.ts 의 groups 다.
// 되돌릴 때는 그 파일의 groups 주석(FN-P01-27 관련 경고)을 함께 본다.
//
// 근거 — 디자인규칙 「P-01 섹션별 인터랙션」 7행: "8단계 연결선이 스크롤에 따라 그려짐"
//   카드 자체는 움직이지 않는다. 움직이는 것은 **선** 하나뿐이다 —
//   카드까지 떠오르면 섹션 4(카드 상승) · 섹션 3(순차 등장)과 구분되지 않고,
//   인접한 두 섹션이 같은 인터랙션을 쓰면 반려된다 (FN-P01-02 · POL-11①-2).
//   섹션 6 과 8 은 인터랙션이 없는 구간이라 앞뒤로도 겹치지 않는다.
//
// **선의 자리가 칸 사이에서 칸 위로 옮겨졌다 (8/20 · 시안 B).**
//   종전에는 칸과 칸을 잇는 1px(그리드 간격 폭)이었다. 그 선은 셀 세로 중앙에 놓여
//   묶음 이름 왼쪽에 붙었고, 화면에서 「──기획 · 설계」처럼 이름의 일부로 읽혔다.
//   지금은 칸 위 경계선이다. 넷이 나란히 놓여 **열 구조 자체를 만들고**,
//   폭이 24px 에서 칸 전체 폭으로 넓어져 훨씬 크게 보인다.
//   외부 박스를 두르지 않는다 — 구분은 선과 글자 위계가 만든다 (POL-11).
//   그려지는 것이 선이라는 성격은 그대로이므로 디자인규칙 7행을 계속 만족한다.
//
// 관측 대상은 네 칸이 아니라 목록 하나다. 칸마다 관측하면 4열에서 한 행이
// 동시에 들어와 순차가 되지 않는다. 목록이 들어온 시점을 기준으로 지연만 다르게 준다.
//
// SVG path 를 그리지 않는다. 선은 칸 위를 채우는 1px 요소이고
// `scaleX(0) → scaleX(1)` 로 왼쪽에서 오른쪽으로 자란다. path 라면 stroke-dasharray
// 길이를 임의 수치로 잡아야 하는데 그 값은 토큰이 아니다.
//
// 모션 값은 토큰만 쓴다 — 지속 `--duration-base`, 가속 `--ease-out`,
// 지연은 `--duration-fast` 의 배수다. 선 넷이 좌→우로 이어 그려지므로
// 마지막 선이 600ms 에 시작해 300ms 동안 자란다. 전체가 900ms 안에 끝난다.
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
 * 한 행에 놓이는 칸 수. 선이 그려지는 순서(지연 배수)가 이 값에서 나온다.
 * 묶음이 넷이라 md 이상에서는 이 값이 곧 전체 개수이고 한 행으로 끝난다.
 * 개수가 늘면 다음 행이 다시 0 부터 시작해 행마다 좌→우로 그려진다.
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
      {groups.map((group, index) => (
        // 칸마다 위에 선이 하나씩 온다. 이을 상대를 따지지 않으므로
        // 마지막 칸을 예외로 두지 않는다 — 종전 연결선과 달라진 점이다.
        //
        // 폭이 좁아져도 숨기지 않는다. 2열·1열로 접히면 이 선이 묶음 사이
        // 구분선이 되어 오히려 필요하다 (종전 연결선은 4열 행을 전제해 md 부터만 보였다).
        <li key={group.eyebrow} className="relative flex h-full flex-col pt-[var(--space-4)]">
          {/* 칸 위 경계선. border-t 가 아니라 절대 배치한 1px 요소다 —
              테두리는 `scaleX` 로 자라게 할 수 없다. 왼쪽에서 오른쪽으로 자란다 */}
          <span
            aria-hidden="true"
            style={{ transitionDelay: `calc(var(--duration-fast) * ${index % COLUMNS})` }}
            className={`absolute inset-x-0 top-0 h-px origin-left bg-border-strong ${TRANSITION} ${REDUCED} ${
              isRevealed ? 'scale-x-100' : 'scale-x-0'
            }`}
          />

          {/* STEP 표기. 단계 번호를 그대로 담고 있으므로 묶음에 별도 번호(1~4)를
                붙이지 않는다 — 붙이는 순간 8단계가 아니라 4단계로 읽힌다.
                STEP 번호는 확정된 프로세스 구조이지 실적 수치가 아니다 (POL-01 대상 밖).
                aria-hidden 을 두지 않는다. 앞서 번호였을 때는 ol 이 순서를 이미
                전달해 중복 낭독이었지만, 「STEP 01–02」는 이 묶음이 8단계 중 어디인지
                알려 주는 유일한 표기라 읽혀야 한다 */}
            <span className="block font-semibold text-subtle text-[length:var(--font-size-xs)] tracking-[var(--tracking-label)]">
              {group.eyebrow}
            </span>

          {/* 묶음 이름 4종은 P-09 와 같은 값이다. 여기서 줄이거나 바꾸지 않는다.

              크기는 `xl`(1.5rem)이다. 종전 `base`(1rem) medium 은 **바로 위 부제
              (`md` 1.0625rem)보다 작아** 위계가 뒤집혀 있었다 — 요약 넷이 부제보다
              작으니 눈이 부제에서 멈추고 아래가 각주처럼 읽혔다 (8/20 실화면 확인).
              `2xl` 은 섹션 제목 값이라 쓰지 않는다. 사다리에서 그 사이는 `xl` 뿐이다.

              STEP 라벨과의 간격을 `--space-2` 로 좁히고 설명과의 간격을 `--space-3` 으로
              벌렸다. 라벨이 이름에 붙고 설명이 떨어져 두 덩어리로 갈린다 */}
          <p className="mt-[var(--space-2)] font-semibold text-ink-inverse text-[length:var(--font-size-xl)] leading-[var(--leading-heading)]">
            {group.name}
          </p>

          {/* 묶음마다 설명을 함께 표기한다. 이름만 두지 않는다 */}
          <p className="mt-[var(--space-3)] text-subtle text-[length:var(--font-size-sm)] leading-[var(--leading-relaxed)]">
            {group.summary}
          </p>
        </li>
      ))}
    </ol>
  );
}
