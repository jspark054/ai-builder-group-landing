import type { MetadataRoute } from 'next';

/**
 * 관리 화면 크롤러 차단.
 *
 * 근거 — 화면목록(IA) §3.2 「관리 화면 A-01~A-07 전부 비색인」 · FN-SEO-03
 *
 * 🔴 **`robots` 메타 태그만으로는 부족하다.** 루트 레이아웃이
 *    `robots: { index: false, follow: false }` 를 내지만, 그건 **HTML 을 읽어야**
 *    적용된다. 관리 화면은 미인증 요청이 전부 로그인으로 튕기므로 크롤러가 읽는 것은
 *    로그인 화면 하나뿐이고, 나머지 주소는 읽지 못한 채 **수집 대상 목록에는 남는다.**
 *    `robots.txt` 는 요청 자체를 막는 층이라 둘이 하는 일이 다르다.
 *
 * ⚠ 이 앱은 `basePath: '/admin'` 을 쓴다. Next 가 이 파일을 `/admin/robots.txt` 로
 *   내보내는데, **크롤러는 도메인 루트의 `/robots.txt` 를 읽는다.**
 *   그래서 별도 도메인(`admin.…`)으로 배포하면 루트에 robots.txt 가 없어
 *   이 파일이 닿지 않는다 — 그 경우 Vercel 쪽에서 도메인 루트로 rewrite 하거나,
 *   배포 도메인 자체를 비공개로 두는 편이 확실하다.
 *   **그래도 이 파일을 두는 이유** — 나중에 `도메인/admin` 형태로 합치면 그때는
 *   루트 robots.txt 가 공개 앱 것이므로, 이 파일이 관리 앱의 의도를 코드에 남긴다.
 *
 * 사이트맵을 내보내지 않는다. 색인 대상이 아니다.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        disallow: '/',
      },
    ],
  };
}
