// 권한 판정 — 관리 화면의 **역할** 층.
//
// 근거 — 기능명세 §5.1(FN-A01-05) · REQ-F-068 · REQ-N-011 · 데이터모델 §4.1
//
// 층을 셋으로 나누고, 층마다 **다른 일**을 한다:
//
//   proxy.ts   인증 — 로그인했는가 + 세션 갱신
//   여기       권한 — 관리자인가 / 본인 행인가
//   RLS        마지막 방어선 (마이그레이션 0002 §4). 앱에 구멍이 나도 DB 가 막는다
//
// proxy 에서 역할을 보지 않는 것은 의도다. 역할은 DB(`admin_user`)에 있어 매 요청 조회해야
// 하고, 미들웨어가 든 세션은 갱신 타이밍에 따라 낡을 수 있다.
//
// 🔴 역할 판정은 **rpc 로만** 한다. `admin_user` 는 0004 에서 authenticated 롤에 GRANT 를
//    주지 않았고(`admin_user 는 롤에 직접 열지 않습니다`), `is_admin()` 이 security definer
//    라 함수 안에서만 읽힌다. 테이블을 직접 조회하면 42501 로 끊긴다.
//    2026-08-27 실측 — anon 키로 `POST /rest/v1/rpc/is_admin` → 200 `false`.
//    마이그레이션 전체에 함수 대상 GRANT/REVOKE 가 없으므로 기본 PUBLIC EXECUTE 가
//    적용되고, authenticated 는 그것을 상속한다.
//
// ⚠ 이 모듈은 next/headers 를 타므로 서버에서만 동작한다. 클라이언트 컴포넌트에서
//   import 하면 빌드가 깨진다 — 그게 의도된 안전장치다.

import { cache } from 'react';
import { redirect } from 'next/navigation';

import { createSupabaseServerClient } from '@/lib/supabase-server';

export type Role = 'admin' | 'builder';

export type Viewer = {
  /** auth.users.id */
  userId: string;
  role: Role;
  /**
   * builder.id — 관리자는 빌더 행이 없을 수 있으므로 null 이 정상이다.
   * 빌더 본인 판정(A-06)과 콘텐츠 소유 판정이 이 값에 걸린다.
   */
  builderId: string | null;
  /** 사이드바에 쓰는 표기명. 관리자는 `admin_user.name` 이 없으면 이메일로 떨어진다 */
  name: string;
};

/**
 * 한 요청 안에서 여러 번 불러도 조회는 한 번만 나간다.
 * 레이아웃과 페이지가 각각 부르면 그대로 왕복 두 번이 된다.
 */
export const getViewer = cache(async (): Promise<Viewer | null> => {
  const supabase = await createSupabaseServerClient();

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return null;

  // 관리자 판정과 빌더 행 조회는 서로를 기다릴 이유가 없다.
  const [adminResult, builderResult] = await Promise.all([
    supabase.rpc('is_admin'),
    supabase
      .from('builder')
      .select('id, display_name')
      .eq('auth_user_id', auth.user.id)
      .maybeSingle(),
  ]);

  const isAdmin = adminResult.data === true;
  const builder = builderResult.data;

  // 로그인은 됐는데 어느 쪽도 아닌 계정. 관리 화면에 들여보내지 않는다.
  // (auth.users 에만 있고 admin_user · builder 어디에도 연결되지 않은 상태)
  if (!isAdmin && !builder) return null;

  return {
    userId: auth.user.id,
    role: isAdmin ? 'admin' : 'builder',
    builderId: builder?.id ?? null,
    name: builder?.display_name ?? auth.user.email ?? '관리자',
  };
});

/** 로그인만 확인한다. 미인증이면 A-01 로 보낸다 (FN-A01-04). */
export async function requireViewer(): Promise<Viewer> {
  const viewer = await getViewer();
  if (!viewer) redirect('/login');
  return viewer;
}

/**
 * 관리자 전용 화면(A-02 · A-03 · A-05 · A-07)의 **페이지**가 부른다.
 *
 * ⚠ 레이아웃이 아니라 페이지에서 부른다. 서버 레이아웃은 현재 경로를 알 수 없어서
 *   "이 화면만 예외" 를 표현하지 못한다 — 빌더 전용 화면(A-06)까지 함께 막혀
 *   무한 리다이렉트가 만들어진다.
 *
 * 빌더를 막는 게 아니라 자기 영역으로 돌려보낸다. 빌더가 쓸 수 있는 화면은 A-06 뿐이다
 * (기능명세 §5.1 권한 표).
 */
export async function requireAdmin(): Promise<Viewer> {
  const viewer = await requireViewer();
  if (viewer.role !== 'admin') redirect('/my');
  return viewer;
}

/**
 * 빌더 전용 화면(A-06)의 **페이지**가 부른다.
 *
 * 근거 — FN-A06-01(본인 레코드만) · FN-A06-09(타인 레코드 접근 불가) · REQ-N-011
 *
 * 관리자를 막는 게 아니라 자기 영역으로 돌려보낸다. 관리자에게는 `builder` 행이
 * 없을 수 있고(운영팀은 빌더가 아니다), 있어도 전체를 보는 화면이 따로 있다.
 *
 * ⚠ `builderId` 가 null 인 빌더는 존재할 수 없다 — `getViewer()` 가 `builder` 행을
 *   찾지 못하면 애초에 role 이 'builder' 가 되지 않는다. 그래도 타입을 좁혀 돌려준다.
 */
export async function requireBuilder(): Promise<Viewer & { builderId: string }> {
  const viewer = await requireViewer();
  if (viewer.role !== 'builder') redirect('/');
  if (!viewer.builderId) redirect('/');
  return { ...viewer, builderId: viewer.builderId };
}
