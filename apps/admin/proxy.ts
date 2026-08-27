// 관리 화면 인증 게이트.
//
// 근거 — FN-A01-04(미인증 `/admin/**` 접근은 A-01 로) · FN-A01-05 · REQ-N-011
//
// 파일 이름이 proxy.ts 인 이유: Next 16 이 middleware 규약을 deprecate 했다.
// 같은 기능이고 이름만 바뀌었다 — middleware.ts 로 두면 빌드마다 경고가 뜬다.
//
// 인수 기준이 「프론트 우회 접근 차단」이다. 화면에서 메뉴를 감추는 것은 차단이 아니다 —
// 주소를 아는 사람은 그대로 들어온다.
//
// ── 여기서 하지 않는 것 ────────────────────────────────────────────────────
// **역할을 보지 않는다.** 역할은 `admin_user` 에 있어 매 요청 조회해야 하고, 미들웨어가
// 든 세션은 갱신 타이밍에 따라 낡을 수 있다. 역할 판정은 lib/authz.ts 가, 마지막 방어는
// RLS 가 한다.
//
// ⚠ 이 앱은 basePath 가 '/admin' 이다. matcher 와 `nextUrl.pathname` 은 basePath 를 **뺀**
//   경로이고(`/` · `/login`), `nextUrl` 을 복제해 리다이렉트하면 basePath 가 다시 붙는다.

import { NextResponse, type NextRequest } from 'next/server';

import { isSupabaseConfigured } from '@orca/supabase';

import { safeNext } from '@/lib/safe-next';
import { redirectKeepingSession, updateSession } from '@/lib/session';

const LOGIN_PATH = '/login';

export async function proxy(request: NextRequest) {
  // 키가 없으면 로그인 자체가 성립하지 않는다. 게이트를 열어 두면 관리 화면이 무인 상태로
  // 노출되므로, 통과시키지 않고 로그인 화면에서 사유를 알린다 (하드룰 4 — 폴백 없음).
  const { pathname, search } = request.nextUrl;
  const isLoginPage = pathname === LOGIN_PATH;

  if (!isSupabaseConfigured()) {
    if (isLoginPage) return NextResponse.next();
    const to = request.nextUrl.clone();
    to.pathname = LOGIN_PATH;
    to.search = '?error=config';
    return NextResponse.redirect(to);
  }

  const { response, user } = await updateSession(request);

  if (!user && !isLoginPage) {
    // 로그인 후 원래 가려던 곳으로 돌려보낸다 (결정시트 「복귀 후 원래 화면으로」).
    // 열린 리다이렉트가 되지 않게 경로만 넘기고, 받는 쪽에서 **다시** 검사한다 (lib/safe-next).
    //
    // 내보낼 때도 같은 함수로 거른다. 검사는 받는 쪽이 하지만, 버려질 값을 주소창에
    // 남기면 사용자가 그 주소를 복사해 다니게 된다. 기본값이면 아예 붙이지 않는다.
    const to = request.nextUrl.clone();
    to.pathname = LOGIN_PATH;
    to.search = '';
    const next = safeNext(pathname + search);
    if (next !== '/') to.searchParams.set('next', next);
    return redirectKeepingSession(to, response);
  }

  if (user && isLoginPage) {
    // 이미 로그인한 사람에게 로그인 화면을 보여줄 이유가 없다.
    const to = request.nextUrl.clone();
    to.pathname = '/';
    to.search = '';
    return redirectKeepingSession(to, response);
  }

  return response;
}

export const config = {
  // 정적 자산까지 태우면 매 요청이 느려진다. 이 앱은 전부 관리 화면이므로 자산만 뺀다.
  //
  // 🔴 `'/'` 를 따로 적는다. 아래 정규식은 basePath 를 뗀 경로에 걸리는데, 앱 루트
  //    (`/admin`)는 그 경로가 비어 있어 정규식에 **걸리지 않는다.**
  //    실측(2026-08-27) — 이 항목이 없을 때 `GET /admin` 에서 프록시가 아예 실행되지 않았고,
  //    화면이 `requireAdmin()` 을 부른 덕에 우연히 막혔다. 페이지가 판정을 빠뜨리면
  //    그대로 열리는 구멍이다. 게이트는 페이지의 성실함에 기대면 안 된다.
  matcher: ['/', '/((?!_next/static|_next/image|favicon.ico).*)'],
};
