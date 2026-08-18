// site_setting 조회 — **서버 전용**
//
// 근거 — 회의록(8/12) 「문의 폼 및 유입 경로」 · devlog 8/18 · 데이터모델
//   회의록  "Plug(유니폼) 무료 계정으로 문의 폼을 우선 연동한다.
//            관리자 화면에서 폼 URL을 변경할 수 있도록 구현한다."
//   → 주소를 코드에 박지 않고 site_setting 에서 읽는다. 관리 화면이 붙으면
//     같은 행을 UPDATE 하는 것으로 교체가 끝난다.
//
// site_setting 은 익명 SELECT 가 열려 있어(`for select using (true)`) 공개 클라이언트로도
// 읽히지만, 다른 쿼리와 경로를 맞추기 위해 서버에서만 부른다. 값이 화면 캐시에 실리므로
// 브라우저에서 다시 읽을 이유도 없다.

import { createAdminSupabase, isSupabaseConfigured } from '@orca/supabase';

/** site_setting 키. 늘어나면 여기에 추가한다 */
const CONTACT_FORM_URL_KEY = 'contact_form_url';

/**
 * 외부로 내보낼 주소인지 확인한다.
 *
 * DB 값이라 형태를 보장할 수 없다 — 관리 화면이 붙으면 사람이 직접 입력하는 값이 된다.
 * 잘못된 값이 그대로 넘어가면 컴포넌트의 `new URL()` 이 throw 해서 **화면 전체가 500** 이
 * 되므로, 여기서 걸러 null 로 낮춘다. 호출부는 null 을 미등록과 같게 다룬다.
 *
 * http/https 만 통과시킨다. `javascript:` 같은 스킴이 버튼 href 에 실리면 안 된다.
 */
function toSafeUrl(value: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(value.trim());
  } catch {
    console.warn(`[site-setting] ${CONTACT_FORM_URL_KEY} 값이 URL 형식이 아닙니다.`);
    return null;
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    console.warn(`[site-setting] ${CONTACT_FORM_URL_KEY} 의 스킴이 http/https 가 아닙니다.`);
    return null;
  }

  return parsed.toString();
}

/**
 * 문의 폼 주소를 읽는다. 미등록·빈 값·형식 오류는 모두 `null`.
 *
 * null 이면 호출부가 CTA 를 렌더하지 않는다 (POL-02 — 빈 값 요소를 그리지 않는다).
 */
export async function getContactFormUrl(): Promise<string | null> {
  // 로컬 `pnpm build` 는 루트 .env 를 읽지 않는다 (build 스크립트가 with-env.sh 를 거치지 않는다).
  // 그 상태에서 throw 하면 프리렌더가 깨지므로 null 로 넘긴다 — CTA 는 스스로 숨는다.
  // Vercel 은 환경변수가 주입되므로 실제 값으로 렌더된다.
  if (!isSupabaseConfigured()) {
    console.warn('[site-setting] Supabase 미설정 — 문의 CTA 를 숨긴 채로 렌더합니다.');
    return null;
  }

  const supabase = createAdminSupabase();

  // maybeSingle() — 행이 없을 때 single() 은 에러를 만들지만 여기서는 정상 상태다
  const { data, error } = await supabase
    .from('site_setting')
    .select('value')
    .eq('key', CONTACT_FORM_URL_KEY)
    .maybeSingle();

  if (error) throw new Error(`문의 폼 주소를 읽지 못했습니다: ${error.message}`);
  if (!data || data.value.trim() === '') return null;

  return toSafeUrl(data.value);
}
