// A-02 빌더 도메인 — 표기 수위 · 이력 · 공개 전 체크리스트.
//
// 근거 — 기능명세 §5.2(FN-A02-01~12) · 화면설계 §6.2 · POL-02 · POL-04 · POL-05 ·
//        POL-06 · POL-08 · POL-12
//
// 순수 함수만 둔다. 화면과 서버 액션이 같은 규칙을 봐야 한다.

/** POL-12 — 표기명은 **개인 선택**이다. 실명이어야 성립하는 것이 아니다 */
export const NAME_TYPE_LABEL: Record<'real' | 'nickname', string> = {
  real: '실명',
  nickname: '닉네임',
};

export const NAME_TYPE_ORDER: ('real' | 'nickname')[] = ['real', 'nickname'];

/** POL-04 — 빌더 소개 최소 30자 */
export const BIO_MIN = 30;

/** POL-05 — **상세 표기 상한**이지 저장 제한이 아니다. 초과분은 공개 화면에서 접힌다 */
export const CAREER_DISPLAY_LIMIT = 5;

/** POL-06 */
export const META_TITLE_MAX = 40;
export const META_DESC_MIN = 80;
export const META_DESC_MAX = 110;

/**
 * 이력 한 줄. 구조는 데이터모델 §3.1 이 정한다 —
 * `[{ "title": "...", "org": "...", "period": "2024-2025" }]`
 *
 * 공개 화면(P-06)이 세 필드가 모두 문자열인 항목만 통과시키므로
 * (`apps/web/lib/queries/builder-detail.ts`), 저장하는 쪽도 같은 모양을 지킨다.
 */
export type CareerEntry = { title: string; org: string; period: string };

/** `career` jsonb 를 편집 화면이 쓸 형태로 좁힌다. 깨진 항목은 조용히 버린다 */
export function parseCareer(raw: unknown): CareerEntry[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((item) => {
    if (typeof item !== 'object' || item === null) return [];
    const entry = item as Record<string, unknown>;
    const { title, org, period } = entry;
    if (typeof title !== 'string' || typeof org !== 'string' || typeof period !== 'string') {
      return [];
    }
    return [{ title, org, period }];
  });
}

/** 저장 직전. 세 칸이 모두 빈 줄은 버린다 — 빈 이력 항목이 공개 화면에 남지 않게 */
export function cleanCareer(entries: CareerEntry[]): CareerEntry[] {
  return entries
    .map((entry) => ({
      title: entry.title.trim(),
      org: entry.org.trim(),
      period: entry.period.trim(),
    }))
    .filter((entry) => entry.title !== '' || entry.org !== '' || entry.period !== '');
}

export type ChecklistItem = {
  no: number;
  label: string;
  /** null 이면 화면이 스스로 판정할 수 없는 항목이다 — 사람이 눈으로 본다 */
  ok: boolean | null;
  policy: string;
};

export type ChecklistInput = {
  imageUrl: string;
  imageAlt: string;
  metaTitle: string;
  metaDescription: string;
  ogImageUrl: string;
};

/**
 * 공개 전 체크리스트 (FN-A02-12 · POL-08).
 *
 * ⚠ **POL-08 표는 「프로젝트를 공개 상태로 전환하기 전」을 규정한다.** 9항목 중
 *   빌더에 해당하지 않는 셋은 뺐다 — 1(라이브 링크) · 7(본문 4문항 500자) ·
 *   8(담당 빌더 연결)은 프로젝트에만 있는 것이다. **없는 항목을 「해당 없음」으로
 *   띄우면 체크리스트가 길어지기만 하고 판단을 돕지 않는다.**
 *   번호는 POL-08 표의 원래 번호를 유지한다 — 정책과 대조할 때 헷갈리지 않게.
 *
 * 🔴 미충족이 있어도 저장을 막지 않는다. 정책이 「경고하되 차단하지 않는다」다.
 *    다만 **alt 는 예외다** — `FN-A02-06` 이 「alt 미입력 시 **저장 불가**」로 못 박았다.
 *    그래서 alt 는 여기(경고)와 서버 액션(차단) 양쪽에 있다.
 */
export function publishChecklist(input: ChecklistInput): ChecklistItem[] {
  return [
    { no: 2, label: '노출된 수치가 실제 값인가', ok: null, policy: 'POL-01' },
    {
      no: 3,
      label: '모든 이미지에 대체 텍스트가 있는가',
      // POL-02 — 이미지는 미등록이어도 된다(이니셜 폴백). 등록했을 때만 alt 를 본다
      ok: input.imageUrl.trim() === '' || input.imageAlt.trim() !== '',
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
      // 미입력이면 공개 화면이 image_url 을 OG 로 쓴다 (P-06)
      label: 'OG 이미지가 지정됐는가',
      ok: input.ogImageUrl.trim() !== '' || input.imageUrl.trim() !== '',
      policy: 'POL-06',
    },
    { no: 9, label: '공개 금지 대상이 포함되지 않았는가', ok: null, policy: 'POL-09' },
  ];
}

/** 목록 표기용. 로케일 포맷터를 쓰지 않는다 — 서버·브라우저 결과가 갈리면 하이드레이션이 깨진다 */
export function ymd(iso: string | null): string {
  return iso ? iso.slice(0, 10).replace(/-/g, '.') : '—';
}
