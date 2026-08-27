// 로그인 후 돌아갈 곳.
//
// 근거 — 결정시트 「세션 만료 → A-01 로 이동. **복귀 후 원래 화면으로**」
//
// proxy.ts 가 `?next=` 를 붙여 보내고, 받는 쪽에서 다시 검사하는 것이 이 앱의 규약이다.
// 한쪽만 검사하면 열린 리다이렉트가 된다 — 우리 로그인 화면을 거쳐 남의 사이트로
// 사람을 보내는 경로가 만들어진다.
//
// ⚠ `//evil.com` 은 브라우저가 **절대 주소로** 읽는다. 앞이 슬래시인지만 봐서는 뚫린다.
//   `/\evil.com` 도 일부 브라우저가 `//` 로 정규화한다.
//
// ⚠ 이 앱은 `basePath: '/admin'` 을 쓴다. 여기서 다루는 경로는 basePath 를 **뗀** 내부
//   경로다(`/` · `/builders`). 프레임워크가 붙였다 뗐다 하는 접두어를 검증식에 섞지 않는다.
//
// ⚠ 'use server' 파일이 아니라 여기 둔다. 서버 액션 모듈의 export 는 전부 원격 호출
//   지점이 되므로, 순수 함수를 거기 두면 쓰지도 않는 엔드포인트가 하나 생긴다.

import { BASE_PATH } from './routes';

const FALLBACK = '/';

export function safeNext(raw: string | null | undefined): string {
  if (!raw) return FALLBACK;
  if (!raw.startsWith('/')) return FALLBACK;
  if (raw.startsWith('//') || raw.startsWith('/\\')) return FALLBACK;

  /* 🔴 basePath 로 시작하는 값은 버린다.
     내부 경로에는 basePath 가 **들어 있지 않다.** 그런 값이 들어왔다는 건 어딘가에서
     이미 한 번 붙은 주소이고, 복귀할 때 또 붙어 `/admin/admin` 이 된다.

     실측(2026-08-27) — 브라우저가 `/admin/admin` 을 요청 → 프록시가 `next=/admin` 으로
     로그인에 보냄 → 로그인 성공 후 `/admin/admin` 으로 복귀 → 404.
     로그인은 됐는데 중간에 「찾을 수 없음」이 한 장 끼는 증상이었다. */
  if (raw === BASE_PATH || raw.startsWith(`${BASE_PATH}/`)) return FALLBACK;

  // 로그인 화면으로 되돌려 보내면 로그인 직후 다시 로그인 화면이 뜬다.
  if (raw === '/login' || raw.startsWith('/login?')) return FALLBACK;
  return raw;
}
