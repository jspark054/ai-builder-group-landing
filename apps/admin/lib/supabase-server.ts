// 서버 컴포넌트 · 서버 액션용 Supabase 클라이언트.
//
// 근거 — REQ-N-011(권한 판정은 서버에서) · 하드룰 4(진실 공급원은 Supabase)
//
// 브라우저에서 Supabase 를 직접 부르지 않는다. 그래서 이 앱에는 브라우저 클라이언트를
// 만드는 곳이 없고, 이 파일이 유일한 생성기다.
//
// ⚠ 서버 컴포넌트 렌더 중에는 쿠키를 쓸 수 없다(응답 헤더가 이미 떠났다).
//   `createServerSupabase` 의 어댑터가 그 실패를 삼키므로, **토큰 갱신은 proxy.ts 가**
//   맡는다. 둘은 세트다 — proxy 가 없으면 액세스 토큰이 만료되는 순간 로그아웃된다.
//
// ⚠ 인증 여부는 `auth.getUser()` 로 본다. `getSession()` 은 쿠키를 검증 없이 믿는다.

import { cookies } from 'next/headers';

import { createServerSupabase } from '@orca/supabase';

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  type CookieOptions = Parameters<typeof cookieStore.set>[2];

  return createServerSupabase({
    getAll: () => cookieStore.getAll(),
    setAll: (list) => {
      for (const { name, value, options } of list) {
        cookieStore.set(name, value, options as CookieOptions);
      }
    },
  });
}
