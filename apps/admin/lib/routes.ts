// 관리 화면 주소의 단일 출처.
//
// 근거 — IA §3.2 (A-01 `/admin/login` · A-05 `/admin` · A-06 `/admin/my` …)
//
// 🔴 **내부 경로에 basePath 를 손으로 붙이지 않는다.** 전부 프레임워크가 붙인다.
//
//    | 부르는 곳                    | basePath |
//    |------------------------------|----------|
//    | 서버 컴포넌트의 `redirect()` | 붙는다   |
//    | 서버 액션의 `redirect()`     | 붙는다   |
//    | `Link` · `router.push`       | 붙는다   |
//    | `proxy.ts` (`nextUrl` 복제)  | 붙는다   |
//
//    ⚠ 예외가 하나 있다. **JS 를 끈 폼 제출**(Next 의 서버 액션 progressive enhancement)
//      경로에서는 붙지 않는다. 실측(2026-08-27) — `Next-Action` 헤더 없이 POST 하면
//      `Location: /login?...` 이 그대로 나온다. 이 앱은 Tiptap 을 쓰는 JS 화면이라
//      그 경로를 지원 대상으로 잡지 않는다. **그 측정값을 일반화해 손으로 붙였다가
//      `/admin/admin` 이 나왔다.**
//
//    ⚠ 진단이 어려웠던 이유 — 프록시가 낸 리다이렉트는 Next 요청 로그에 남지 않는다.
//      그래서 `signOut` 은 `/admin/admin/login` 으로 튄 뒤 프록시가 조용히 교정해 정상처럼
//      보였고, `signIn` 만 깨진 것처럼 보였다. 실제로는 둘 다 같은 원인이었다.
//
// next.config.ts 가 이 상수를 읽는다. 값은 여기 한 곳에만 둔다.
// (lib/safe-next.ts 도 읽는다 — 복귀 경로에 basePath 가 섞여 들어오는 것을 막으려고.)

export const BASE_PATH = '/admin';
