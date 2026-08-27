'use server';

// A-01 로그인 처리.
//
// 근거 — 기능명세 §5.1
//   FN-A01-01  이메일·비밀번호를 입력받는다
//   FN-A01-02  인증을 수행한다 (Supabase Auth)
//   FN-A01-05  권한 판정을 서버에서 수행한다
//
// 폼 제출은 서버 액션으로만 받는다. 브라우저는 Supabase 를 직접 부르지 않는다.
//
// ⚠ 실패 사유를 나누어 알리지 않는다. 「없는 계정」과 「틀린 비밀번호」를 구분해 주면
//   그 화면이 계정 존재 여부를 확인해 주는 도구가 된다.

import { redirect } from 'next/navigation';

import { isSupabaseConfigured } from '@orca/supabase';

import { safeNext } from '@/lib/safe-next';
import { createSupabaseServerClient } from '@/lib/supabase-server';

type Credentials = { email: string; password: string };

/**
 * 폼 입력을 좁힌다.
 *
 * 이 저장소에는 스키마 라이브러리를 두지 않았다(웹앱도 손으로 좁힌다 —
 * `apps/web/lib/queries/builder-detail.ts` 의 career 파서와 같은 방식이다).
 * 필드가 둘뿐이라 여기서는 그 편이 읽기 쉽다.
 *
 * 형식 검증은 최소한만 한다. 최종 판정은 Supabase Auth 가 하고, 여기서 정밀한 이메일
 * 정규식을 흉내 내면 유효한 주소를 우리가 먼저 막는 쪽이 된다.
 */
function parseCredentials(formData: FormData): Credentials | null {
  const email = formData.get('email');
  const password = formData.get('password');
  if (typeof email !== 'string' || typeof password !== 'string') return null;

  const trimmed = email.trim();
  if (trimmed.length === 0 || trimmed.length > 254) return null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return null;
  if (password.length === 0 || password.length > 200) return null;

  return { email: trimmed, password };
}

/** basePath 를 붙이지 않는다 — `redirect()` 가 붙인다 (lib/routes.ts 의 표 참조) */
function loginUrl(reason: string, next: string): string {
  return `/login?error=${reason}&next=${encodeURIComponent(next)}`;
}

export async function signIn(formData: FormData): Promise<void> {
  const next = safeNext(formData.get('next')?.toString());

  if (!isSupabaseConfigured()) redirect(loginUrl('config', next));

  const credentials = parseCredentials(formData);
  if (!credentials) redirect(loginUrl('credentials', next));

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword(credentials);
  if (error) redirect(loginUrl('credentials', next));

  // 인증에 성공했다는 것과 이 화면을 쓸 자격이 있다는 것은 다른 이야기다.
  // auth.users 에만 있고 admin_user · builder 어디에도 연결되지 않은 계정은
  // 세션을 즉시 없앤다 — 로그인된 채로 빈 화면을 보여 주지 않는다 (FN-A01-05).
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect(loginUrl('credentials', next));

  const [adminResult, builderResult] = await Promise.all([
    supabase.rpc('is_admin'),
    supabase.from('builder').select('id').eq('auth_user_id', auth.user.id).maybeSingle(),
  ]);

  const isAdmin = adminResult.data === true;
  const isBuilder = builderResult.data !== null;

  if (!isAdmin && !isBuilder) {
    await supabase.auth.signOut();
    redirect(loginUrl('no-account', next));
  }

  // 빌더가 쓸 수 있는 화면은 A-06 하나다 (기능명세 §5.1 권한 표).
  // 관리자 화면 주소로 복귀 요청이 와도 자기 화면으로 보낸다.
  if (!isAdmin && !next.startsWith('/my')) redirect('/my');

  redirect(next);
}

export async function signOut(): Promise<void> {
  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
  }
  redirect('/login');
}
