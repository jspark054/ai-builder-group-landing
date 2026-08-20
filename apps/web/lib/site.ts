/**
 * Site-wide configuration read from the environment.
 *
 * 이 프로젝트는 SITE_NAME/DESCRIPTION 을 필수로 본다. 미설정 시 화면에서 바로
 * 드러나도록 폴백을 의도적으로 눈에 띄는 값으로 둔다.
 *
 * 나머지 값은 선택이다: 미설정된 소유 확인 코드나 GA4 id 는 해당 연동만 꺼질 뿐
 * 크래시가 되지 않는다.
 */

/**
 * 절대경로의 단일 기준. sitemap · robots · canonical · OG · JSON-LD 가 모두 이 값을 쓴다.
 *
 * 폴백을 **배포 도메인**으로 둔다. `http://localhost:3000` 을 폴백으로 두면
 * 환경변수가 주입되지 않은 빌드에서 sitemap·canonical 이 조용히 localhost 로 나가고,
 * 그 상태로 배포되면 색인기가 도달할 수 없는 주소를 받는다 — 실제로 그렇게 나가고
 * 있었다 (8/20). 로컬에서 절대경로가 배포 도메인으로 찍히는 쪽이,
 * 배포본이 localhost 를 가리키는 쪽보다 안전하다.
 */
const FALLBACK_SITE_URL = 'https://abg-landing-jspark.vercel.app';

export const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || FALLBACK_SITE_URL).replace(/\/$/, '');

export const siteName = process.env.NEXT_PUBLIC_SITE_NAME ?? 'SITE_NAME_NOT_SET';

export const siteDescription = process.env.NEXT_PUBLIC_SITE_DESCRIPTION ?? 'SITE_DESCRIPTION_NOT_SET';

export const siteLocale = process.env.NEXT_PUBLIC_SITE_LOCALE ?? 'ko-KR';

/** Google Analytics 4 measurement id, e.g. `G-XXXXXXXXXX`. */
export const ga4Id = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID?.trim() || undefined;

/** Google Search Console `google-site-verification` content value. */
export const googleVerification = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION?.trim() || undefined;

/** Naver Search Advisor `naver-site-verification` content value. */
export const naverVerification = process.env.NEXT_PUBLIC_NAVER_SITE_VERIFICATION?.trim() || undefined;

/** Bing Webmaster Tools `msvalidate.01` content value. */
export const bingVerification = process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION?.trim() || undefined;

export const twitterSite = process.env.NEXT_PUBLIC_TWITTER_SITE?.trim() || undefined;

export function absoluteUrl(pathOrUrl: string): string {
  if (/^https?:\/\//.test(pathOrUrl)) return pathOrUrl;
  return `${siteUrl}${pathOrUrl.startsWith('/') ? '' : '/'}${pathOrUrl}`;
}
