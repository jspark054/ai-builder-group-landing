'use server';

// A-06 빌더 셀프 저장.
//
// 근거 — 기능명세 §5.6
//   FN-A06-02  표기명 · 표기 유형 · 이미지 · 소개 · 이력을 수정한다
//   FN-A06-03  **slug · 기수 · 공개 여부 · 상단 고정 · 정렬은 수정할 수 없다**
//   FN-A06-05  **대표인 프로젝트만 편집한다**
//   FN-A06-07  **프로젝트의 slug · 공개 여부 · 정렬 · 분류는 수정할 수 없다**
//   FN-A06-09  타인 레코드에 접근할 수 없다
//
// 🔴 **잠긴 값은 폼에서 읽지 않는다.** 화면이 비활성으로 보여 주더라도 여기서는 아예
//    받지 않는다 — 브라우저의 disabled 는 요청을 만들 때 우회할 수 있다.
//    패치 객체에 그 컬럼이 없으면 위조된 필드가 와도 지나갈 자리가 없다.
//
// 방어가 셋이다 (REQ-N-011 · 데이터모델 §4.3 「둘 다 적용한다」).
//   1. 여기 — 패치에 금지 컬럼을 넣지 않는다
//   2. RLS — builder_update_own · project_update_own 이 **행**을 자른다
//   3. 트리거 — 0008 column_guard 가 **컬럼**을 자른다 (마지막 방어선)

import { revalidatePath } from 'next/cache';

import { requireBuilder } from '@/lib/authz';
import { cleanCareer, type CareerEntry } from '@/lib/builders';
import { createSupabaseServerClient } from '@/lib/supabase-server';

export type SaveState = { ok: true; message: string } | { ok: false; message: string } | null;

function str(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === 'string' ? value.trim() : '';
}

const SAVE_FAILED = '작성한 내용은 그대로 남아 있습니다. 다시 시도해 주세요.';

const NAME_TYPES = ['real', 'nickname'] as const;
type NameType = (typeof NAME_TYPES)[number];

function isNameType(value: string): value is NameType {
  return (NAME_TYPES as readonly string[]).includes(value);
}

function parseCareerField(raw: string): CareerEntry[] {
  if (raw === '') return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return cleanCareer(
      parsed.flatMap((item) => {
        if (typeof item !== 'object' || item === null) return [];
        const entry = item as Record<string, unknown>;
        return [
          {
            title: typeof entry.title === 'string' ? entry.title : '',
            org: typeof entry.org === 'string' ? entry.org : '',
            period: typeof entry.period === 'string' ? entry.period : '',
          },
        ];
      }),
    );
  } catch {
    return [];
  }
}

/** FN-A06-02 — 프로필. 잠긴 컬럼은 패치에 아예 없다 */
export async function saveMyProfile(_prev: SaveState, formData: FormData): Promise<SaveState> {
  const viewer = await requireBuilder();

  const displayName = str(formData, 'displayName');
  const nameType = str(formData, 'nameType');
  const imageUrl = str(formData, 'imageUrl');
  const imageAlt = str(formData, 'imageAlt');

  if (displayName === '') return { ok: false, message: '표기명을 입력하세요.' };
  if (!isNameType(nameType)) return { ok: false, message: '표기 유형을 선택하세요.' };
  // A-02 와 같은 규칙이다 (FN-A02-06 · REQ-F-064)
  if (imageUrl !== '' && imageAlt === '') {
    return { ok: false, message: '이미지를 등록하면 대체 텍스트가 필요합니다.' };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from('builder')
    .update({
      display_name: displayName,
      name_type: nameType,
      image_url: imageUrl || null,
      image_alt: imageAlt || null,
      bio: str(formData, 'bio') || null,
      career: parseCareerField(str(formData, 'career')),
      meta_title: str(formData, 'metaTitle') || null,
      meta_description: str(formData, 'metaDescription') || null,
      og_image_url: str(formData, 'ogImageUrl') || null,
      // ❌ slug · cohort · is_public · is_pinned · pin_order · auth_user_id · course_id
      //    FN-A06-03. 여기에 적지 않는 것이 1차 방어다
    })
    // 🔴 본인 행만. RLS 가 같은 조건을 갖고 있지만 쿼리에서도 자른다 (FN-A06-09)
    .eq('id', viewer.builderId);

  if (error) return { ok: false, message: dbMessage(error.message) };

  revalidatePath('/my');
  return { ok: true, message: '저장했습니다.' };
}

/** FN-A06-05 — 대표인 프로젝트만. 본문·요약·링크까지이고 공개·정렬·분류는 없다 */
export async function saveMyProject(_prev: SaveState, formData: FormData): Promise<SaveState> {
  const viewer = await requireBuilder();

  const projectId = str(formData, 'id');
  if (projectId === '') return { ok: false, message: '대상을 찾을 수 없습니다.' };

  const supabase = await createSupabaseServerClient();

  // 🔴 대표 여부를 서버가 다시 본다 (FN-A06-05). 화면이 열어 줬다는 것을 믿지 않는다
  const { data: link } = await supabase
    .from('project_builder')
    .select('is_owner')
    .eq('project_id', projectId)
    .eq('builder_id', viewer.builderId)
    .maybeSingle();

  if (!link?.is_owner) {
    return { ok: false, message: '대표로 지정된 프로젝트만 편집할 수 있습니다.' };
  }

  const title = str(formData, 'title');
  const summary = str(formData, 'summary');
  if (title === '') return { ok: false, message: '제목을 입력하세요.' };
  if (summary === '') return { ok: false, message: '요약을 입력하세요.' };

  const thumbnailUrl = str(formData, 'thumbnailUrl');
  const thumbnailAlt = str(formData, 'thumbnailAlt');
  if (thumbnailUrl !== '' && thumbnailAlt === '') {
    return { ok: false, message: '대표 이미지의 대체 텍스트를 입력하세요.' };
  }

  const { error } = await supabase
    .from('project')
    .update({
      title,
      summary,
      body_what: str(formData, 'bodyWhat'),
      body_why: str(formData, 'bodyWhy'),
      body_how: str(formData, 'bodyHow'),
      body_result: str(formData, 'bodyResult'),
      thumbnail_url: thumbnailUrl,
      thumbnail_alt: thumbnailAlt,
      meta_title: str(formData, 'metaTitle') || null,
      meta_description: str(formData, 'metaDescription') || null,
      // ❌ slug · is_public · sort_order — FN-A06-07
      // ❌ 분류(project_category) · 담당 빌더(project_builder) — 데이터모델 §4.2 가
      //    빌더에게 SELECT 만 준다. 애초에 쓰기 경로가 없다
      //
      // ⚠ live_url · link_grade 는 잠기지 않았다. FN-A06-07 의 목록에 없고,
      //   결과물 링크는 만든 사람이 가장 잘 안다
      live_url: str(formData, 'liveUrl') || null,
    })
    .eq('id', projectId);

  if (error) return { ok: false, message: dbMessage(error.message) };

  revalidatePath('/my');
  revalidatePath(`/my/projects/${projectId}`);
  return { ok: true, message: '저장했습니다.' };
}

function dbMessage(raw: string | undefined): string {
  if (!raw) return SAVE_FAILED;
  // 0008 트리거가 던진 문장. 마지막 방어선이 걸렸다는 뜻이라 그대로 보여 준다 —
  // 여기까지 왔다면 앱 코드에 구멍이 있었다는 신호이므로 감추지 않는다
  if (raw.includes('[column-guard]')) {
    return raw.replace(/^.*\[column-guard\]\s*/, '');
  }
  if (raw.includes('row-level security')) {
    return '권한이 없습니다. 본인 것만 수정할 수 있습니다.';
  }
  if (raw.includes('duplicate key') && raw.includes('slug')) {
    return '같은 주소가 이미 있습니다.';
  }
  console.error('[a-06 save]', raw);
  return SAVE_FAILED;
}
