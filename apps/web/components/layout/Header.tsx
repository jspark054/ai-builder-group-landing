// C-04 헤더 · GNB
//
// 근거 — 화면설계 §4.4 · 기능명세 §3.4 · IA §3.1
//   FN-C04-01  전 공개 화면에 표시
//   FN-C04-02  주요 화면으로 이동하는 내비게이션
//   FN-C04-03  상단 CTA 는 문의로만 수렴. 경쟁 CTA 를 두지 않는다
//   REQ-N-008  360px 에서 핵심 흐름 손실 없음 → 좁은 화면은 드로어로 전개
//
// 도면과 다르게 간 두 가지는 구현 결정 기록에 남겼다.
//   교육  — 콘텐츠 미수령이라 미노출 (기능명세 §4.6 · 결정시트 안건 8)
//   인사이트 — 도면이 v1.3 이전 판이라 누락. IA §3.1 을 따른다
//
// 경로가 아직 없어 typedRoutes 가 <Link> 를 거부하므로 <a> 를 쓴다.
// 각 화면을 구현하면서 next/link 로 교체한다.

'use client';

import { useState } from 'react';

const NAV = [
  { label: '포트폴리오', href: '/portfolio' },
  { label: '빌더', href: '/builders' },
  { label: '일하는 방식', href: '/process' },
  { label: '인사이트', href: '/insights' },
] as const;

const CTA = { label: '문의', href: '/contact?utm_source=gnb' } as const;

export function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="bg-canvas text-ink-inverse">
      <div className="mx-auto flex max-w-[var(--layout-container)] items-center justify-between px-[var(--layout-gutter)] py-[var(--space-5)]">
        <a href="/" className="font-bold tracking-[var(--tracking-heading)] text-[length:var(--font-size-lg)]">
          AI 빌더 그룹
        </a>

        {/* 넓은 화면 — 항목을 그대로 편다 */}
        <nav aria-label="주 메뉴" className="hidden items-center gap-[var(--space-7)] md:flex">
          {NAV.map((item) => (
            <a key={item.href} href={item.href} className="text-subtle text-[length:var(--font-size-sm)] hover:text-ink-inverse">
              {item.label}
            </a>
          ))}
          <a
            href={CTA.href}
            className="rounded-pill bg-brand px-[var(--space-5)] py-[var(--space-2)] font-semibold text-ink-inverse text-[length:var(--font-size-sm)] hover:bg-brand-soft hover:text-ink"
          >
            {CTA.label}
          </a>
        </nav>

        {/* 좁은 화면 — 전부 드로어로 접는다 */}
        <button
          type="button"
          aria-expanded={open}
          aria-controls="gnb-drawer"
          aria-label={open ? '메뉴 닫기' : '메뉴 열기'}
          onClick={() => setOpen((v) => !v)}
          className="md:hidden"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            className="size-6"
          >
            {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
        </button>
      </div>

      {open && (
        <nav
          id="gnb-drawer"
          aria-label="주 메뉴"
          className="border-t border-surface px-[var(--layout-gutter)] pb-[var(--space-6)] md:hidden"
        >
          {NAV.map((item) => (
            <a key={item.href} href={item.href} className="block py-[var(--space-3)] text-subtle hover:text-ink-inverse">
              {item.label}
            </a>
          ))}
          <a
            href={CTA.href}
            className="mt-[var(--space-3)] inline-flex rounded-pill bg-brand px-[var(--space-5)] py-[var(--space-2)] font-semibold text-ink-inverse hover:bg-brand-soft hover:text-ink"
          >
            {CTA.label}
          </a>
        </nav>
      )}
    </header>
  );
}
