// 플레이스홀더 고지 배너 — **제출 전 삭제 대상**
//
// 실데이터가 아직 없는 목록에 레이아웃 확인용 행을 넣어 둔 상태를 화면에서 밝히는
// 임시 부품이다. 테스트 데이터와 수명이 같다.
// 실데이터가 들어오면 이 파일 · 호출부 · content/component-copy.ts 의 상수를 함께 지운다.
//
// 문구는 prop 으로 받는다 — 대상이 둘이고 문장이 다르기 때문이다.
//   빌더    P-01 섹션 5 · P-05 · P-06
//   포트폴리오 P-01 섹션 4 · P-03 목록 상단 · P-04 본문 하단
// 상수는 content/component-copy.ts 의 placeholderNoticeCopy 에 있다.
// 전역 layout 이나 P-01 히어로 위에 두지 않는다. 페이지 전체가 예시라는 뜻이 되고,
// 히어로는 요소를 더하지 않고 비워 두는 구간이다 (FN-P01-13 · POL-11①-2).
//
// 링크·버튼을 넣지 않는다 — 문구 한 줄뿐이다 (REQ-F-007 경쟁 CTA 금지).
// 여백은 두지 않는다. 어느 간격으로 띄울지는 화면마다 다르므로 호출부가 정한다.

type PlaceholderNoticeProps = {
  /** placeholderNoticeCopy 의 값을 넘긴다. 호출부에서 문자열을 직접 쓰지 않는다 */
  text: string;
};

export function PlaceholderNotice({ text }: PlaceholderNoticeProps) {
  return (
    <p
      role="note"
      className="rounded-card border border-border bg-surface-soft px-[var(--space-4)] py-[var(--space-3)] text-muted text-[length:var(--font-size-sm)] leading-[var(--leading-relaxed)]"
    >
      {text}
    </p>
  );
}
