// P-01 섹션 2 마퀴 껍데기 — FN-P01-17
//
// 근거 — 기능명세 §4.1 · 화면설계 §5.1
//   FN-P01-17  섹션 2 위·아래 두 줄이 **반대 방향**으로 무한 이동한다. 이음매 없음
//   FN-P01-19  스크롤을 가로채지 않는다 — 여기에 스크롤 리스너가 없다.
//              전부 CSS 애니메이션이라 `wheel` · `touchmove` 리스너가 0건이다
//   POL-11①-2  움직임은 이 띠까지다. 이 컴포넌트는 등장 애니메이션을 갖지 않는다
//
// 서버 컴포넌트다. 'use client' 를 붙이지 않는다 — 상태도 이벤트도 없다.
//
// 이음매를 없애는 방법
//   같은 내용을 **두 벌** 이어 붙이고 트랙을 정확히 -50% 만큼 옮긴다. 한 바퀴가 끝난
//   순간의 화면이 시작 순간과 픽셀 단위로 같아서 되감기가 보이지 않는다.
//   그래서 `children` 을 두 번 렌더한다 — 호출부가 두 번 넘기는 게 아니라 여기서 복제한다.
//
//   ⚠ 조건이 하나 더 있다. **한 벌이 화면 폭보다 넓어야 한다.**
//   한 벌이 좁으면 트랙이 밀리는 동안 끝쪽에 빈 공간이 드러난다. 실제로 처음에
//   그렇게 났다 — 프로젝트 5건이 930px 인데 화면이 1440px 이라, 트랙이 697px 밀린
//   순간 오른쪽 277px 가 비었다 (실측 8/21).
//   그래서 `repeat` 로 한 벌 안에서 내용을 여러 번 되풀이해 폭을 벌린다. 되풀이해도
//   **-50% 는 그대로 한 벌**이므로 이음매 조건은 깨지지 않는다.
//   되풀이 횟수는 `한 벌 폭 ≥ 지원할 최대 화면 폭` 이 되게 호출부가 정한다.
//
// 접근성
//   두 번째 벌은 눈에만 필요하고 읽을 필요가 없다. `aria-hidden` 으로 가려 스크린리더가
//   같은 문장을 두 번 읽지 않게 한다. 첫 벌은 가리지 않는다 — 문구 띠는 읽으라고
//   넣은 카피이므로 접근성 트리에서 통째로 지우면 안 된다.
//   이미지 띠처럼 내용이 장식일 때는 호출부가 `decorative` 를 켜서 두 벌 다 가린다.
//
// 모션 정지는 `.marquee-track` 이 `prefers-reduced-motion` 으로 처리한다
// (app/ai-builder-tailwind-theme.css). 멈춰도 내용은 그대로 보인다.

import type { CSSProperties, ReactNode } from 'react';

type MarqueeProps = {
  /** 한 벌의 내용. 이 컴포넌트가 두 벌로 복제한다 */
  children: ReactNode;
  /**
   * FN-P01-17 — 위 줄은 `right`(→), 아래 줄은 `left`(←). 두 줄이 같은 방향이면
   * 인수 기준("두 줄이 반대 방향")을 충족하지 못한다
   */
  direction: 'left' | 'right';
  /**
   * 한 바퀴 도는 시간. 토큰이 없어 호출부가 정한다 (테마 CSS 머리말 참조).
   * 줄마다 다른 값을 주면 두 줄이 주기적으로 나란히 서지 않아 기계적으로 보이지 않는다
   */
  duration: string;
  /**
   * 한 벌 안에서 내용을 몇 번 되풀이할지. **한 벌 폭이 화면 폭보다 넓어야** 띠 끝에
   * 빈틈이 안 생긴다 (머리말 참조). 호출부가 실측 폭을 보고 정한다
   */
  repeat: number;
  /** 내용이 장식이면 두 벌 다 접근성 트리에서 가린다 */
  decorative?: boolean;
  /** 띠 자체를 설명하는 이름. `decorative` 가 아닐 때만 의미가 있다 */
  label?: string;
};

export function Marquee({
  children,
  direction,
  duration,
  repeat,
  decorative,
  label,
}: MarqueeProps) {
  // 한 벌 = children 을 repeat 번 되풀이한 것. 첫 되풀이만 읽히고 나머지는 눈에만 필요하다
  const half = Array.from({ length: repeat }, (_, index) => (
    <div key={index} className="flex" {...(index > 0 ? { 'aria-hidden': true } : {})}>
      {children}
    </div>
  ));

  return (
    // overflow-hidden 이 없으면 트랙이 좌우로 삐져나가 페이지에 가로 스크롤이 생긴다.
    // 이 요소가 폭을 가두는 창이고, 안쪽 트랙이 그 창보다 넓다.
    <div
      className="overflow-hidden"
      {...(decorative ? { 'aria-hidden': true } : { role: 'group', 'aria-label': label })}
    >
      <div
        className="marquee-track"
        data-direction={direction}
        style={{ '--marquee-duration': duration } as CSSProperties}
      >
        {/* 두 벌은 **완전히 같은 껍데기**여야 한다. 한쪽만 감싸면 두 벌의 폭이
            어긋나 -50% 지점이 시작 지점과 맞지 않고 이음매가 보인다 */}
        <div className="flex">{half}</div>
        {/* 둘째 벌 — 이음매를 메우는 복제본. 눈에만 필요하다 */}
        <div className="flex" aria-hidden="true">
          {half}
        </div>
      </div>
    </div>
  );
}
