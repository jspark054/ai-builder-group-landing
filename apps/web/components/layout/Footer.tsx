// C-05 푸터
//
// 근거 — 화면설계 §4.4 · 기능명세 §3.5
//   FN-C05-01  전 공개 화면에 표시
//   FN-C05-02  개인정보처리방침 링크 상시 노출 (REQ-F-081)
//   REQ-C-005  사업자정보표시는 구현 대상이 아니다 → 회사명과 저작권만 둔다
//
// 경로가 아직 없어 typedRoutes 가 <Link> 를 거부하므로 <a> 를 쓴다.

export function Footer() {
  return (
    <footer className="bg-canvas text-ink-inverse">
      <div className="mx-auto max-w-[var(--layout-container)] px-[var(--layout-gutter)] py-[var(--space-12)]">
        <p className="font-semibold">AI 빌더 그룹</p>

        <nav aria-label="푸터 메뉴" className="mt-[var(--space-4)] flex gap-[var(--space-5)] text-[length:var(--font-size-sm)]">
          <a href="/privacy" className="text-subtle hover:text-ink-inverse">
            개인정보처리방침
          </a>
          <a href="/contact?utm_source=footer" className="text-subtle hover:text-ink-inverse">
            문의
          </a>
        </nav>

        <p className="mt-[var(--space-6)] text-subtle text-[length:var(--font-size-xs)]">
          © 2026 AI 빌더 그룹
        </p>
      </div>
    </footer>
  );
}
