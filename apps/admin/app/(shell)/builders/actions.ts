'use server';

// A-02 빌더 저장 · 삭제.
//
// 근거 — 기능명세 §5.2
//   FN-A02-02·03·04  등록 · 수정 · 삭제
//   FN-A02-05        표기명 · 표기 유형 · 이미지 · 소개 · 이력
//   FN-A02-06        **이미지 업로드 시 alt 입력을 필수화한다 — 미입력 시 저장 불가**
//   FN-A02-08        공개 여부 토글
//   FN-A02-09        상단 고정
//   FN-A02-10        슬러그 중복 검사
//   FN-A02-11        메타 길이 초과는 **경고만** (차단 아님)
//
// 🔴 A-03 과 갈리는 지점이 하나 있다. **alt 는 경고가 아니라 차단이다.**
//    `FN-A02-06` 의 인수 기준이 「alt 미입력 시 저장 불가」다. POL-08 체크리스트에도
//    같은 항목이 있지만 그쪽은 경고이고, 여기는 명세가 따로 차단을 요구한다.
//
// ⚠ 빌더 삭제는 인사이트 글이 있으면 실패한다. `insight.builder_id` 가
//   `on delete restrict` 다 — 글을 먼저 정리하게 만드는 것이 의도다 (데이터모델 §3.6a).

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { cleanCareer, type CareerEntry } from '@/lib/builders';
import { requireAdmin } from '@/lib/authz';
import { createSupabaseServerClient } from '@/lib/supabase-server';

export type SaveState = { ok: true; message: string } | { ok: false; message: string } | null;

function str(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === 'string' ? value.trim() : '';
}

const SAVE_FAILED = '작성한 내용은 그대로 남아 있습니다. 다시 시도해 주세요.';

const NAME_TYPES = ['real', 'nickname'] as const;
type NameType = (typeof NAME_TYPES)[number];

/**
 * ⚠ `if (v !== 'real' && v !== 'nickname') return;` 으로는 좁혀지지 않는다.
 *   TS 는 `string` 을 부등호 비교로 리터럴 유니온으로 좁히지 않는다 — 긍정 비교나
 *   타입 가드가 필요하다. 좁히지 않으면 `name_type` 이 `string` 인 채로 DB 타입에 걸린다.
 */
function isNameType(value: string): value is NameType {
  return (NAME_TYPES as readonly string[]).includes(value);
}

/** 폼이 JSON 문자열로 실어 보낸 이력을 되돌린다. 깨져 있으면 빈 배열로 간다 */
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

export async function saveBuilder(_prev: SaveState, formData: FormData): Promise<SaveState> {
  await requireAdmin();

  const id = str(formData, 'id');
  const slug = str(formData, 'slug');
  const displayName = str(formData, 'displayName');
  const nameType = str(formData, 'nameType');
  const imageUrl = str(formData, 'imageUrl');
  const imageAlt = str(formData, 'imageAlt');
  const cohortRaw = str(formData, 'cohort');
  const isPinned = formData.get('isPinned') === 'on';
  const pinOrderRaw = str(formData, 'pinOrder');

  if (displayName === '') return { ok: false, message: '표기명을 입력하세요.' };
  if (slug === '') return { ok: false, message: '주소를 입력하세요.' };
  if (!isNameType(nameType)) {
    return { ok: false, message: '표기 유형을 선택하세요.' };
  }

  // FN-A02-06 — 이미지가 있으면 alt 는 필수다. **경고가 아니라 차단이다**
  if (imageUrl !== '' && imageAlt === '') {
    return { ok: false, message: '이미지를 등록하면 대체 텍스트가 필요합니다.' };
  }

  // 기수는 int 다. text 로 두면 '10기' < '2기' 로 정렬돼 목록이 깨진다 (데이터모델 §3.1)
  const cohort = Number(cohortRaw);
  if (!Number.isInteger(cohort) || cohort < 1) {
    return { ok: false, message: '기수를 숫자로 입력하세요.' };
  }

  // FN-A02-09 — 고정 순서는 고정일 때만 유효하다 (데이터모델 §3.1 주석)
  const pinOrder = isPinned ? Number(pinOrderRaw) : null;
  if (isPinned && (pinOrder === null || !Number.isInteger(pinOrder))) {
    return { ok: false, message: '상단 고정 순서를 숫자로 입력하세요.' };
  }

  const patch = {
    slug,
    display_name: displayName,
    name_type: nameType,
    image_url: imageUrl || null,
    image_alt: imageAlt || null,
    cohort,
    bio: str(formData, 'bio') || null,
    career: parseCareerField(str(formData, 'career')),
    course_id: str(formData, 'courseId') || null,
    is_public: formData.get('isPublic') === 'on',
    is_pinned: isPinned,
    pin_order: pinOrder,
    meta_title: str(formData, 'metaTitle') || null,
    meta_description: str(formData, 'metaDescription') || null,
    // 미입력이면 공개 화면이 image_url 을 OG 로 쓴다 (P-06). 값을 복사해 넣지 않는다
    og_image_url: str(formData, 'ogImageUrl') || null,
  };

  const supabase = await createSupabaseServerClient();

  if (id === '') {
    // 🔴 `auth_user_id` 는 **insert 에서만** 다룬다. 신규 빌더는 계정 미발급 상태(null)로
    //    만들고, 계정 연결은 A-06 착수 때 별도 경로로 붙인다.
    //    ⚠ 이 값을 위 `patch` 에 넣으면 **수정할 때마다 계정 연결이 끊긴다.**
    const { data, error } = await supabase
      .from('builder')
      .insert({ ...patch, auth_user_id: null })
      .select('id')
      .single();
    if (error || !data) return { ok: false, message: dbMessage(error?.message) };
    revalidatePath('/builders');
    redirect(`/builders/${data.id}`);
  }

  const { error } = await supabase.from('builder').update(patch).eq('id', id);
  if (error) return { ok: false, message: dbMessage(error.message) };

  revalidatePath('/builders');
  revalidatePath(`/builders/${id}`);
  return { ok: true, message: '저장했습니다.' };
}

export async function deleteBuilder(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = str(formData, 'id');
  if (id === '') redirect('/builders');

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from('builder').delete().eq('id', id);

  // 인사이트 글이 남아 있으면 FK 가 막는다. 그때는 편집 화면으로 돌려보낸다 —
  // 삭제만 실패하고 아무 말 없이 목록으로 가면 지워진 줄 안다
  if (error) redirect(`/builders/${id}?error=delete`);

  revalidatePath('/builders');
  redirect('/builders');
}

function dbMessage(raw: string | undefined): string {
  if (!raw) return SAVE_FAILED;
  // FN-A02-10 — unique(slug) 위반. 앱에서 미리 세지 않고 DB 를 진실로 삼는다
  if (raw.includes('duplicate key') && raw.includes('slug')) {
    return '같은 주소의 빌더가 이미 있습니다. 다른 주소를 입력해 주세요.';
  }
  if (raw.includes('builder_name_type_check')) return '표기 유형이 올바르지 않습니다.';
  if (raw.includes('row-level security')) return '권한이 없습니다.';
  console.error('[a-02 save]', raw);
  return SAVE_FAILED;
}
