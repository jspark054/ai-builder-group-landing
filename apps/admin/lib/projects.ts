// A-03 프로젝트 도메인 — 라벨 · 분량 규칙 · 공개 전 체크리스트.
//
// 근거 — 기능명세 §5.3(FN-A03-01~16) · 화면설계 §6.3 · POL-03 · POL-04 · POL-06 · POL-08
//
// 순수 함수만 둔다. 화면과 서버 액션이 같은 규칙을 봐야 한다 — 카운터는 화면이 세고
// 경고는 서버가 판정하면 두 숫자가 갈라진다.

import type { CategoryAxis, LinkGrade } from '@orca/supabase';

/** POL-03 — 링크 검증력 5등급. 표기는 정책표 그대로다 */
export const LINK_GRADE_LABEL: Record<LinkGrade, string> = {
  live: '운영 중인 서비스',
  deploy: '배포된 결과물',
  repo: '코드 저장소',
  video: '동작 영상',
  none: '없음',
};

export const LINK_GRADE_ORDER: LinkGrade[] = ['live', 'deploy', 'repo', 'video', 'none'];

/** FN-A03-10 — 분류를 축으로 묶어 표시한다 */
export const AXIS_LABEL: Record<CategoryAxis, string> = {
  industry: '산업',
  service: '서비스 특성',
};

export const AXIS_ORDER: CategoryAxis[] = ['industry', 'service'];

/**
 * 본문 4문항 (FN-A03-04 · POL-04).
 *
 * **입력 문항이 곧 P-04 의 h2 소제목이 된다.** 관리자 입력 구조와 공개 화면 구조가
 * 일치하는 것이 이 설계의 요지다 — 문구를 여기서 바꾸면 공개 화면 소제목이 바뀐다.
 *
 * 편집기에 템플릿 텍스트를 밀어 넣지 않는다. `project` 가 본문을 네 컬럼
 * (`body_what` · `body_why` · `body_how` · `body_result`)으로 갖고 있어, 문항마다
 * 칸을 나누면 「기본값 제공」이 더 정확히 성립한다 — 작성자가 템플릿 문구를 지우고
 * 쓰다가 소제목까지 지우는 사고가 없다.
 */
export const BODY_FIELDS = [
  { name: 'bodyWhat', column: 'body_what', label: '무엇을 만들었나', hint: '2~3문장' },
  { name: 'bodyWhy', column: 'body_why', label: '왜 필요했나', hint: '2~3문장' },
  { name: 'bodyHow', column: 'body_how', label: '어떻게 풀었나', hint: '3~4문장' },
  { name: 'bodyResult', column: 'body_result', label: '결과', hint: '1~2문장' },
] as const;

/** POL-04 — 본문 최소 500자 · 권장 800자. 요약 최소 40자 */
export const BODY_MIN = 500;
export const BODY_RECOMMENDED = 800;
export const SUMMARY_MIN = 40;

/** POL-06 */
export const META_TITLE_MAX = 40;
export const META_DESC_MIN = 80;
export const META_DESC_MAX = 110;

/**
 * 본문 글자 수 (FN-A03-05).
 *
 * 네 문항을 합쳐 센다. **공백을 빼지 않는다** — POL-04 의 500자가 「달성 가능한 기준」이라
 * 명시돼 있고, 공백을 빼면 같은 글이 더 짧게 세어져 기준이 조용히 올라간다.
 */
export function bodyLength(parts: readonly string[]): number {
  return parts.join('').trim().length;
}

/**
 * 라이브 링크 형식 검증 (FN-A03-08).
 *
 * http · https 만 받는다. 빈 값은 통과다 — 링크가 없는 프로젝트가 있고
 * 등급 `none` 이 그 경우다 (POL-03).
 */
export function isValidLiveUrl(raw: string): boolean {
  if (raw.trim() === '') return true;
  try {
    const url = new URL(raw);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export type ChecklistItem = {
  /** POL-08 표의 번호 */
  no: number;
  label: string;
  /** null 이면 화면이 스스로 판정할 수 없는 항목이다 — 사람이 눈으로 본다 */
  ok: boolean | null;
  policy: string;
};

export type ChecklistInput = {
  liveUrl: string;
  linkGrade: LinkGrade;
  thumbnailUrl: string;
  thumbnailAlt: string;
  metaTitle: string;
  metaDescription: string;
  ogImageUrl: string;
  bodyChars: number;
  builderCount: number;
};

/**
 * POL-08 공개 전 체크리스트 9항목 (FN-A03-16).
 *
 * 🔴 **미충족이 있어도 저장을 막지 않는다.** 정책이 「경고하되 차단하지 않는다」이고
 *    최종 판단은 운영 권한자가 한다. 막으면 운영자가 체크리스트를 우회할 방법을 찾는다.
 *
 * ⚠ 2번(수치가 실제 값인가) · 9번(공개 금지 대상)은 **기계가 볼 수 없다.** `null` 로 두고
 *   화면이 「직접 확인」으로 표시한다. 자동으로 통과시키면 체크리스트가 거짓말을 한다.
 */
export function publishChecklist(input: ChecklistInput): ChecklistItem[] {
  return [
    {
      no: 1,
      label: '라이브 링크가 실제로 열리는가',
      // 등급이 none 이면 링크가 없는 것이 정상이다 (POL-03)
      ok: input.linkGrade === 'none' ? true : input.liveUrl.trim() !== '',
      policy: 'POL-03',
    },
    { no: 2, label: '노출된 수치가 실제 값인가', ok: null, policy: 'POL-01' },
    {
      no: 3,
      label: '모든 이미지에 대체 텍스트가 있는가',
      ok: input.thumbnailUrl.trim() === '' || input.thumbnailAlt.trim() !== '',
      policy: 'REQ-F-064',
    },
    {
      no: 4,
      label: `meta_title 이 ${META_TITLE_MAX}자 이내인가`,
      ok: input.metaTitle.trim() !== '' && input.metaTitle.length <= META_TITLE_MAX,
      policy: 'POL-06',
    },
    {
      no: 5,
      label: `meta_description 이 ${META_DESC_MIN}~${META_DESC_MAX}자인가`,
      ok:
        input.metaDescription.length >= META_DESC_MIN &&
        input.metaDescription.length <= META_DESC_MAX,
      policy: 'POL-06',
    },
    {
      no: 6,
      // OG 미입력이면 대표 이미지를 쓴다 (FN-A03-13 · P-04 가 그렇게 렌더한다)
      label: 'OG 이미지가 지정됐는가',
      ok: input.ogImageUrl.trim() !== '' || input.thumbnailUrl.trim() !== '',
      policy: 'POL-06',
    },
    {
      no: 7,
      label: `본문이 4문항 구조이며 ${BODY_MIN}자 이상인가`,
      ok: input.bodyChars >= BODY_MIN,
      policy: 'POL-04',
    },
    {
      no: 8,
      label: '담당 빌더가 연결됐는가',
      ok: input.builderCount > 0,
      policy: 'REQ-F-015',
    },
    { no: 9, label: '공개 금지 대상이 포함되지 않았는가', ok: null, policy: 'POL-09' },
  ];
}

/** 목록 표기용. 로케일 포맷터를 쓰지 않는다 — 서버·브라우저 결과가 갈리면 하이드레이션이 깨진다 */
export function ymd(iso: string | null): string {
  return iso ? iso.slice(0, 10).replace(/-/g, '.') : '—';
}
