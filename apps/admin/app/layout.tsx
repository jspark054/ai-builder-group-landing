import type { Metadata } from 'next';

import './globals.css';

export const metadata: Metadata = {
  title: '관리자',
  description: 'AI 빌더그룹 랜딩페이지 관리 화면',
  // 관리 화면은 전부 noindex (4_02 화면목록 §3.2).
  robots: { index: false, follow: false },
};

/**
 * 루트 레이아웃에는 조판을 두지 않는다.
 *
 * 로그인(A-01)은 사이드바 없는 카드 한 장이고, 나머지 화면은 사이드바 셸을 쓴다.
 * 여기에 헤더나 폭 제한을 두면 두 조판이 서로를 밀어낸다 — 셸은 `app/(shell)/layout.tsx`.
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
