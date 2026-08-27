// 로그인 뒤 화면들의 셸 — 좌측 고정 사이드바 + 본문.
//
// 근거 — 화면설계 §6 · 발주사 Admin CMS 캡처 (2026-08-27)
//
// 로그인(A-01)은 이 셸 밖에 있다. 그룹 이름 `(shell)` 은 주소에 나타나지 않으므로
// A-05 대시보드는 그대로 `/admin` 이다 (IA §3.2).
//
// 조판은 발주사 CMS 를 따랐다 — 사이드바 약 230px 고정, 본문은 폭을 꽉 채운다.
// 공개 화면과 반대로 밀도를 올린다. 목록을 한 화면에 많이 담아야 하는 화면들이다.
//
// ⚠ 승인·역할 판정을 여기 두지 않는다. 서버 레이아웃은 현재 경로를 알 수 없어서
//   "이 화면만 예외"(A-06 은 빌더도 쓴다)를 표현하지 못한다. 판정은 페이지마다
//   `requireAdmin()` · `requireViewer()` 가 한다 (lib/authz.ts).
//
// 세션을 읽으므로 정적 생성 대상이 아니다.

import Link from 'next/link';

import { getViewer } from '@/lib/authz';
import { signOut } from '@/app/login/actions';

export const dynamic = 'force-dynamic';

/**
 * 사이드바 메뉴.
 *
 * ⚠ **구현된 화면만 올린다.** 앞으로 붙을 A-02(`/builders`) · A-03(`/projects`) ·
 *   A-07(`/insights`) · A-06(`/my`) 은 그 화면을 만들 때 한 줄씩 추가한다.
 *   없는 주소를 미리 걸어 두면 메뉴가 404 로 가는 목록이 된다.
 */
const ADMIN_NAV = [
  { href: '/', label: '대시보드' },
  { href: '/builders', label: '빌더' },
  { href: '/projects', label: '프로젝트' },
  { href: '/insights', label: '인사이트' },
];

/**
 * 빌더가 쓸 수 있는 화면은 A-06 하나다 (기능명세 §5.1 권한 표).
 *
 * 🔴 메뉴에서 감추는 것은 **차단이 아니다.** 주소를 직접 치면 `requireAdmin()` 이
 *    `/my` 로 돌려보낸다. 그럼에도 감추는 이유는 다르다 — 누를 수 없는 메뉴가 보이면
 *    화면이 「권한이 없다」가 아니라 「고장났다」로 읽힌다.
 */
const BUILDER_NAV = [{ href: '/my', label: '내 프로필' }];

export default async function ShellLayout({ children }: { children: React.ReactNode }) {
  const viewer = await getViewer();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? '/';

  const isBuilder = viewer?.role === 'builder';
  const nav = isBuilder ? BUILDER_NAV : ADMIN_NAV;

  return (
    <div className="flex min-h-dvh">
      <nav
        aria-label={isBuilder ? '빌더 메뉴' : '관리 메뉴'}
        className="flex w-[230px] shrink-0 flex-col border-r border-neutral-200 bg-white px-4 py-6"
      >
        <div className="px-3">
          <p className="text-base font-bold tracking-wide">AI 빌더그룹</p>
          {/* 배지가 늘 'Admin' 이면 빌더로 들어와도 관리자 화면처럼 읽힌다 */}
          <p className="mt-0.5 text-xs text-neutral-400">{isBuilder ? 'Builder' : 'Admin'}</p>
        </div>

        <ul className="mt-8 space-y-1">
          {nav.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="block rounded-lg px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-100"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="mt-auto space-y-1 px-3 pt-6 text-xs text-neutral-400">
          {viewer && <p className="pb-2 text-neutral-500">{viewer.name}</p>}
          <a
            href={siteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block py-1 hover:text-neutral-900"
          >
            ← 사이트로
          </a>
          {/* 로그아웃은 별도 화면을 만들지 않고 여기서 처리한다 */}
          <form action={signOut}>
            <button type="submit" className="py-1 hover:text-neutral-900">
              로그아웃
            </button>
          </form>
        </div>
      </nav>

      <main className="min-w-0 flex-1 px-10 py-8">{children}</main>
    </div>
  );
}
