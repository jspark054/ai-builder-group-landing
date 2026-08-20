// C-05 푸터
//
// 근거 — 화면설계 §4.4 · 기능명세 §3.5
//   FN-C05-01  전 공개 화면에 표시
//   FN-C05-02  개인정보처리방침 링크 상시 노출 (REQ-F-081)
//
// 사업자 정보 — REQ-C-005 는 사업자정보표시를 **필수 구현 대상에서 뺀** 조항이지
// 표기를 금지한 조항이 아니다 (회원가입·결제·마케팅 발송·위치정보가 없어서 관련
// 약관·신고 의무가 없다는 취지다). 발주사 지시로 주소·대표자·사업자등록번호를
// 표기한다 (8/20). 같은 조항이 함께 제외한 **이용약관·통신판매업신고는 두지 않는다** —
// 화면 19종 범위에 없어 링크를 만들면 다시 404 가 생긴다.
//
// 넣지 않은 항목 — 이메일 · 전화번호 · 통신판매업 번호. 확정값을 받지 못했다.
// 다른 문서에서 본 값을 옮겨오지 않는다. 닿지 않는 창구를 만드는 것이기 때문이다.
//
// 상호명은 3행에만 둔다. 상단 브랜드명 자리는 서비스명(「AI 빌더 그룹」)이라
// 성격이 다르고, 두 곳에 상호를 적으면 중복 표기가 된다.
//
// 색 — bg-canvas 위다. 판독 가능한 연한 글자는 `text-subtle` 까지이고,
// 그다음 단계인 `text-muted`(#5e5a50)는 대비가 3:1 에 못 미쳐 쓰지 않는다
// (ProblemSection.tsx · ProcessSection.tsx 와 같은 판단).
// 그래서 위계는 링크 행을 글자색 그대로 두고 정보 행을 `text-subtle` 로 내려 만든다.
//
// 경로가 열린 뒤에도 <a> 를 유지한다. <Link> 로 바꾸면 클라이언트 내비게이션이
// 되지만 그것은 이번 변경의 범위가 아니다.

export function Footer() {
  return (
    <footer className="bg-canvas text-ink-inverse">
      <div className="mx-auto max-w-[var(--layout-container)] px-[var(--layout-gutter)] py-[var(--space-12)]">
        <p className="font-semibold">AI 빌더 그룹</p>

        {/* 1행 — 링크. 항목을 늘리지 않는다 (REQ-C-005 · 범위 19종) */}
        <nav
          aria-label="푸터 메뉴"
          className="mt-[var(--space-4)] flex gap-[var(--space-5)] text-[length:var(--font-size-sm)]"
        >
          <a href="/privacy" className="hover:text-subtle">
            개인정보처리방침
          </a>
          <a href="/contact?utm_source=footer" className="hover:text-subtle">
            문의
          </a>
        </nav>

        {/* 2행 — 주소 */}
        <p className="mt-[var(--space-6)] text-subtle text-[length:var(--font-size-xs)] leading-[var(--leading-relaxed)]">
          04039 서울시 마포구 홍익로5안길 28, 5층
        </p>

        {/* 3행 — 사업자 정보와 저작권. 2행과 같은 크기·같은 색이다.
            항목을 공백으로 나열하고, 폭이 모자라면 줄로 접힌다 —
            구분 기호(· 나 |)를 두지 않아 접힐 때 기호가 줄 끝에 남지 않는다 */}
        <p className="mt-[var(--space-2)] flex flex-wrap gap-x-[var(--space-4)] gap-y-[var(--space-1)] text-subtle text-[length:var(--font-size-xs)] leading-[var(--leading-relaxed)]">
          <span>주식회사 똑똑한개발자</span>
          <span>대표자 서장원</span>
          <span>사업자등록번호 476-81-01694</span>
          <span>© 2026 AI 빌더 그룹</span>
        </p>
      </div>
    </footer>
  );
}
