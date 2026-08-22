// 문의 폼 주소에 출처 파라미터를 싣는다 — P-10 이 플러그로 넘길 때 쓴다.
//
// 근거 — 기능명세 §3.3 위치별 파라미터 표 · FN-P10-03 · REQ-F-054
//   C-03 은 `/contact?utm_source=home` 처럼 출처를 붙여 P-10 으로 보낸다.
//   P-10 은 그 값을 그대로 플러그 폼 주소에 옮겨 싣는다. 값을 만들지도, 바꾸지도
//   않는다 — 만드는 쪽은 C-03 · 헤더 · 푸터이고 여기는 옮기기만 한다.
//
// 왜 화이트리스트인가
//   들어온 쿼리를 통째로 흘리면 방문자가 임의로 넣은 키가 외부 도메인으로 나간다.
//   집계에 쓰는 키만 통과시킨다. 값도 길이를 잘라 GA4 파라미터 상한(100자)을
//   넘지 않게 한다 — 넘는 값은 어차피 집계에서 잘린다.
//
// 개인정보는 애초에 이 경로에 오지 않는다. C-03 이 싣는 것은 슬러그와 위치뿐이다
// (기능명세 §4.8 「이벤트에 이름·연락처·이메일·자유서술 원문을 전달하지 않는다」).

/** 옮겨 실을 키. 늘어나면 여기에 추가한다 */
const FORWARDED_KEYS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  /** §3.3 — P-04 가 싣는 프로젝트 슬러그 */
  'ref',
  /** §3.3 — P-06 이 싣는 빌더 슬러그 */
  'builder',
] as const;

/** GA4 이벤트 파라미터 값 상한과 같다. 넘는 값은 싣지 않는다 */
const MAX_VALUE_LENGTH = 100;

/** Next 의 searchParams 형태. 같은 키가 두 번 오면 배열이 된다 */
type IncomingParams = Record<string, string | string[] | undefined>;

/**
 * 스킴을 포함한 절대 주소.
 *
 * typedRoutes 를 켜 두면 `redirect()` 가 `RouteImpl` 만 받는데, 그 유니온에서
 * 외부 주소에 해당하는 갈래가 `` `${string}:${string}` `` (WithProtocol) 이다.
 * 그냥 `string` 을 돌려주면 호출부마다 캐스팅이 생기므로 여기서 한 번만 좁힌다.
 */
export type AbsoluteUrl = `${string}:${string}`;

/**
 * `baseUrl` 에 화이트리스트 파라미터를 얹은 주소를 만든다.
 *
 * `baseUrl` 은 site_setting 에서 온 값이며 `getContactFormUrl()` 이 이미
 * http/https 로 검증한 뒤다. 여기서 다시 검증하지 않는다.
 *
 * 같은 키가 base 에도 있으면 들어온 값이 이긴다 — 방문자의 실제 진입 경로가
 * 저장해 둔 기본값보다 정확하다.
 */
export function buildContactFormUrl(baseUrl: string, incoming: IncomingParams): AbsoluteUrl {
  const url = new URL(baseUrl);

  for (const key of FORWARDED_KEYS) {
    const raw = incoming[key];
    // 같은 키가 두 번 오면 첫 값만 쓴다. 둘을 이어 붙이면 없는 출처가 만들어진다
    const value = Array.isArray(raw) ? raw[0] : raw;
    if (typeof value !== 'string') continue;

    const trimmed = value.trim();
    if (trimmed === '' || trimmed.length > MAX_VALUE_LENGTH) continue;

    url.searchParams.set(key, trimmed);
  }

  // `URL` 은 스킴 없이는 만들어지지 않으므로 toString() 에 항상 `:` 이 들어 있다.
  // 타입만 좁히는 단언이다 — 값을 바꾸지 않는다
  return url.toString() as AbsoluteUrl;
}
