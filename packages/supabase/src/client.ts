// 🔴 이 모듈은 **서버에서만** 동작합니다.
//
// `createAdminSupabase()` 가 `SUPABASE_SERVICE_ROLE_KEY` 를 읽습니다. 그 키는 RLS 를
// 통째로 우회하므로 브라우저 번들에 한 번이라도 들어가면 **DB 전체가 열립니다.**
//
// `import 'server-only'` 는 클라이언트 컴포넌트가 이 모듈을 (타입이 아니라 값으로)
// import 하는 순간 **빌드를 깨뜨립니다.** 런타임 사고가 되기 전에 빌드에서 잡힙니다.
//
// ⚠ 타입만 가져가는 것은 그대로 됩니다 — `import type { BuilderRow } from '@orca/supabase'`
//   는 컴파일 시점에 지워져 런타임 import 가 남지 않습니다. 관리 화면의 폼 컴포넌트
//   넷이 그 방식이고 영향을 받지 않습니다.
//
// ⚠ 그래서 **브라우저용 클라이언트를 여기 두지 않습니다.** 예전에 있던
//   `createBrowserSupabase()` 를 걷어냈습니다 — 호출하는 곳이 한 군데도 없었고,
//   이 저장소는 브라우저에서 Supabase 를 직접 부르지 않는 구조입니다(공개 화면은
//   서버 컴포넌트, 관리 화면은 서버 액션). 필요해지면 별도 모듈로 되살립니다.
import 'server-only';

import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';

import { requireConfig } from './config.ts';
import type { Database } from './types.ts';

export interface CookieAdapter {
  getAll(): { name: string; value: string }[];
  setAll(cookies: { name: string; value: string; options?: Record<string, unknown> }[]): void;
}

/**
 * 서버 컴포넌트 · 서버 액션용 클라이언트.
 * Next.js 의 `cookies()` 를 어댑터로 넘겨 세션을 유지합니다.
 */
export function createServerSupabase(cookies: CookieAdapter) {
  const { url, anonKey } = requireConfig();
  return createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll: () => cookies.getAll(),
      setAll: (list) => {
        try {
          cookies.setAll(list);
        } catch {
          // 서버 컴포넌트에서는 쿠키를 쓸 수 없습니다. 미들웨어가 갱신을 담당하므로 무시해도 됩니다.
        }
      },
    },
  });
}

/**
 * service role 클라이언트 — RLS 를 우회합니다.
 *
 * **서버에서만** 사용하세요. 이 키가 브라우저 번들에 들어가면 데이터베이스 전체가 노출됩니다.
 * 어드민의 쓰기 작업(서버 액션)에서만 씁니다.
 */
export function createAdminSupabase() {
  const { url, serviceRoleKey } = requireConfig();
  if (!serviceRoleKey) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY 가 없습니다. 어드민 쓰기 작업에는 service role 키가 필요합니다.',
    );
  }
  return createClient<Database>(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
