/**
 * Site-wide configuration read from the environment.
 *
 * 이 프로젝트는 SITE_NAME/DESCRIPTION 을 필수로 본다. 미설정 시 화면에서 바로
 * 드러나도록 폴백을 의도적으로 눈에 띄는 값으로 둔다.
 *
 * 나머지 값은 선택이다: 미설정된 소유 확인 코드나 GA4 id 는 해당 연동만 꺼질 뿐
 * 크래시가 되지 않는다.
 */

export const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(/\/$/, '');

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
