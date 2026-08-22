'use client';

// P-01 섹션 7 의 4묶음 나열. 이 섹션에서 클라이언트가 되는 유일한 조각이다.
//
// **8단계 나열에서 4묶음 축약으로 바뀌었다 (8/20 · 사용자 지시).**
// P-01 은 요약, P-09 는 상세로 층을 가른다. 8단계 전체와 관문은 P-09 가 갖고,
// 이 목록은 큰 흐름 넷만 보여준다. 값은 content/p01-copy.ts 의 groups 다.
// 되돌릴 때는 그 파일의 groups 주석(FN-P01-27 관련 경고)을 함께 본다.
//
// **4열 그리드 → 세로 나열 (8/21) → 섹션 3 과 같은 행 문법 (8/22).** 둘 다 사용자 지시다.
//   섹션이 좌 제목 · 우 내용 2단이 되면서 오른쪽 열이 1200px 기준 626px 이다.
//   그 폭에 넷을 나란히 놓으면 칸이 140px 대가 되어 묶음 이름이 두 줄로 접힌다.
//   세로로 쌓은 뒤, 한 행의 짜임을 섹션 3(components/landing/CriteriaList.tsx)에서
//   그대로 가져왔다 — **좌 1 : 우 2 · md 미만에서 세로로 접힘 · 행 아래 구분선**.
//   좌측이 「그것이 무엇인지」(STEP · 이름), 우측이 「무엇을 하는지」(설명)를 맡는다.
//
//   같은 화면의 두 나열이 같은 문법을 쓴다. 섹션 3 과 7 은 인접하지 않고
//   (사이에 4·5·6 이 있다) 인터랙션도 서로 다르므로 FN-P01-02 에 걸리지 않는다.
//   글자 크기도 섹션 3 을 따른다 — 라벨 `xs` · 이름 `lg` · 설명 `base`.
//   **이름이 `xl` 에서 `lg` 로 내려왔다.** 4열이던 때는 부제(`md`)보다 커야 위계가
//   섰지만, 지금은 좌우 분할과 구분선이 위계를 나눠 갖는다 (섹션 3 과 같은 판단).
//
// 근거 — 디자인규칙 「P-01 섹션별 인터랙션」 7행: "8단계 연결선이 스크롤에 따라 그려짐"
//   행 자체는 움직이지 않는다. 움직이는 것은 **선** 하나뿐이다 —
//   행까지 떠오르면 섹션 4(카드 상승) · 섹션 3(순차 등장)과 구분되지 않고,
//   인접한 두 섹션이 같은 인터랙션을 쓰면 반려된다 (FN-P01-02 · POL-11①-2).
//   섹션 6 과 8 은 인터랙션이 없는 구간이라 앞뒤로도 겹치지 않는다.
//
// **선이 행 위에서 행 아래로 내려왔다 (8/22).**
//   섹션 3 의 구분선이 `border-b` 라 첫 행 위에는 선이 없고 행마다 아래에 하나씩 있다.
//   같은 자리에 두어야 두 나열이 같은 리듬으로 읽힌다. 제목과 목록 사이를 선이 가르면
//   제목이 목록의 머리행처럼 읽히는 것도 섹션 3 과 같은 이유다.
//   섹션 3 과 달리 `border-b` 를 쓰지 못한다 — 테두리는 `scaleX` 로 자라게 할 수 없다.
//   그려지는 것이 선이라는 성격은 그대로이므로 디자인규칙 7행을 계속 만족한다.
//
// 관측 대상은 네 행이 아니라 목록 하나다. 행마다 관측하면 위에서부터 하나씩
// 뒤늦게 그려져 「이어 그리는 한 줄」로 읽히지 않는다.
// 목록이 들어온 시점을 기준으로 지연만 다르게 준다.
//
// SVG path 를 그리지 않는다. 선은 행 아래를 채우는 1px 요소이고
// `scaleX(0) → scaleX(1)` 로 왼쪽에서 오른쪽으로 자란다. path 라면 stroke-dasharray
// 길이를 임의 수치로 잡아야 하는데 그 값은 토큰이 아니다.
//
// 모션 값은 토큰만 쓴다 — 지속 `--duration-base`, 가속 `--ease-out`,
// 지연은 `--duration-fast` 의 배수다. 마지막 선이 600ms 에 시작해 300ms 동안 자란다.
// 전체가 900ms 안에 끝난다.
//
// 마크업은 SSR 로 그대로 나가므로 REQ-N-001(콘텐츠를 담은 HTML)은 유지된다.

import { useRevealOnView } from '@/components/landing/use-reveal-on-view';

type ProcessGroup = {
  /** 「STEP 01–02」. 붙임표는 en dash(–) 다 */
  readonly eyebrow: string;
  readonly name: string;
  readonly summary: string;
};

const TRANSITION = 'transition-transform duration-[var(--duration-base)] ease-[var(--ease-out)]';

/** 모션을 끈 사용자에게는 감지를 기다리지 않고 처음부터 그려진 상태로 둔다 */
const REDUCED = 'motion-reduce:scale-x-100 motion-reduce:transition-none';

/**
 * 한 행의 뼈대. 폭 배분(좌 1 : 우 2)과 상하 여백은 섹션 3 의 ROW 와 같다
 * (CriteriaList.tsx). 구분선만 border 가 아니라 절대 배치한 1px 요소라 빠져 있다.
 *
 * 섹션 3 과 다른 점이 하나 있다 — **격자가 2행이다** (8/22 · 사용자 지시).
 *   섹션 3 은 우측 첫 줄(인용)이 좌측 첫 줄(번호)과 같은 높이에서 시작하지만,
 *   여기서는 설명이 STEP 표기가 아니라 **묶음 이름과 같은 높이**에서 시작해야 한다.
 *   STEP 표기는 라벨이고 이름이 그 행의 제목이므로, 설명이 라벨과 나란히 서면
 *   라벨과 설명이 한 단으로 읽혀 위계가 흐려진다.
 *
 *   자리를 mt 값으로 밀어 맞추지 않는다 — 「STEP 한 줄 높이」는 글꼴 지표에서
 *   나오는 값이라 토큰으로 적을 수 없고, 글자 크기를 고치는 순간 어긋난다.
 *   대신 격자에 행을 하나 더 두고 이름과 설명을 **같은 행(row 2)** 에 놓는다.
 *   맞추는 일을 격자가 하므로 값을 적을 필요가 없다.
 *
 *   세로 간격은 gap 이 아니라 각 요소의 mt 가 갖는다 — 행 사이 gap 을 주면
 *   STEP 과 이름 사이가 `--space-6` 으로 벌어져 두 덩어리로 갈린다.
 *   md 미만에서는 격자가 1열이라 DOM 순서(STEP → 이름 → 설명)대로 쌓인다.
 */
const ROW =
  'relative grid grid-cols-1 gap-x-[var(--space-6)] py-[var(--space-6)] md:grid-cols-3';

export function ProcessGrid({ groups }: { groups: readonly ProcessGroup[] }) {
  const { ref, isRevealed } = useRevealOnView<HTMLOListElement>();

  return (
    // 순서가 곧 프로세스다. ol 로 순서를 마크업에 남긴다 —
    // 순서를 시각 정보로만 두면 보조기술에 전달되지 않는다
    <ol ref={ref}>
      {groups.map((group, index) => (
        <li key={group.eyebrow} className={ROW}>
          {/* 1행 좌 — STEP 표기. 단계 번호를 그대로 담고 있으므로 묶음에 별도 번호(1~4)를
              붙이지 않는다 — 붙이는 순간 8단계가 아니라 4단계로 읽힌다.
              STEP 번호는 확정된 프로세스 구조이지 실적 수치가 아니다 (POL-01 대상 밖).
              aria-hidden 을 두지 않는다 — 「STEP 01–02」는 이 묶음이 8단계 중 어디인지
              알려 주는 유일한 표기라 읽혀야 한다.
              (섹션 3 의 같은 자리는 01~03 번호이고 그쪽은 ol 이 순서를 이미
               전달하므로 aria-hidden 이다. 자리는 같고 성격이 다르다) */}
          <span className="block font-semibold text-subtle text-[length:var(--font-size-xs)] tracking-[var(--tracking-label)] md:col-start-1 md:row-start-1">
            {group.eyebrow}
          </span>

          {/* 2행 좌 — 묶음 이름. 4종은 P-09 와 같은 값이다. 여기서 줄이거나 바꾸지 않는다.
              행에서 가장 굵다 — 섹션 3 의 키워드와 같은 크기(`lg`)다 */}
          <p className="mt-[var(--space-2)] font-bold text-ink-inverse text-[length:var(--font-size-lg)] leading-[var(--leading-heading)] md:col-start-1 md:row-start-2">
            {group.name}
          </p>

          {/* 2행 우 — 설명. 묶음마다 설명을 함께 표기한다. 이름만 두지 않는다.
              **이름과 같은 행이라 두 글의 윗줄이 나란히 선다** (8/22 · 사용자 지시).
              md 미만에서는 이름 아래로 내려오고, 그때 간격은 `--space-4` 다 —
              STEP↔이름(`--space-2`)보다 넓어야 이름과 설명이 붙어 보이지 않는다.
              어두운 배경 위의 연한 글자는 `text-subtle` 이 맡는다 —
              섹션 3 이 쓰는 `text-muted`(#5e5a50)는 bg-canvas 위에서 대비가
              3:1 에 못 미쳐 읽히지 않는다 (ProcessSection.tsx 부제와 같은 판단).
              크기는 섹션 3 의 답과 같은 `base` 다 */}
          <p className="mt-[var(--space-4)] text-subtle text-[length:var(--font-size-base)] leading-[var(--leading-relaxed)] md:col-span-2 md:col-start-2 md:row-start-2 md:mt-[var(--space-2)]">
            {group.summary}
          </p>

          {/* 행 아래 구분선. 섹션 3 의 `border-b` 와 같은 자리이고,
              왼쪽에서 오른쪽으로 자란다. 마지막 행 아래에도 선이 남는다 —
              섹션 3 이 그렇고, 목록이 어디서 끝나는지를 그 선이 알린다 */}
          <span
            aria-hidden="true"
            style={{ transitionDelay: `calc(var(--duration-fast) * ${index})` }}
            className={`absolute inset-x-0 bottom-0 h-px origin-left bg-border-strong ${TRANSITION} ${REDUCED} ${
              isRevealed ? 'scale-x-100' : 'scale-x-0'
            }`}
          />
        </li>
      ))}
    </ol>
  );
}
