'use server';

// A-07 인사이트 저장 · 발행.
//
// 근거 — 기능명세 §5.7
//   FN-A07-03  슬러그 미입력 시 제목에서 생성
//   FN-A07-04  예약어(before · process · people) 저장 거부
//   FN-A07-05  슬러그 중복 저장 거부
//   FN-A07-07  본문 첫 이미지를 커버로 자동 지정
//   FN-A07-08  임시저장 · 발행 전환
//   FN-A07-09  **저장 실패 시 입력값을 유지한다**
//   FN-A07-10  관리자만
//
// 🔴 FN-A07-09 때문에 실패 경로에서 redirect 하지 않는다. 결과 객체를 돌려주고 화면이
//    `useActionState` 로 받는다. redirect 하면 폼이 새로 그려져 본문이 통째로 날아간다 —
//    「본문이 최소 500자라 다시 쓰게 하면 안 됩니다」(결정시트 확정 원칙).
//
// ⚠ 공개 화면(apps/web)은 **별도 배포**라 여기서 revalidatePath 를 불러도 닿지 않는다.
//   웹 쪽 반영 방식은 P-13 을 세울 때 정한다 (dynamic 렌더 또는 짧은 revalidate).
//   여기서 부르면 「했다」고 착각하게 만드는 코드만 남는다.

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import type { InsightCategory } from '@orca/supabase';

import { requireAdmin } from '@/lib/authz';
import { coverImageFromBody, isReservedSlug, toSlug } from '@/lib/insights';
import { createSupabaseServerClient } from '@/lib/supabase-server';

export type SaveState = { ok: true; message: string } | { ok: false; message: string } | null;

const CATEGORIES: InsightCategory[] = ['before', 'process', 'people'];

function str(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === 'string' ? value.trim() : '';
}

/** 저장 실패 문구는 화면설계 §6.5a 마이크로카피 그대로다 */
const SAVE_FAILED = '작성한 내용은 그대로 남아 있습니다. 다시 시도해 주세요.';
const RESERVED = '이 주소는 카테고리에 사용 중입니다. 다른 주소를 입력해 주세요.';

export async function saveInsight(_prev: SaveState, formData: FormData): Promise<SaveState> {
  await requireAdmin();

  const id = str(formData, 'id');
  const intent = str(formData, 'intent'); // 'draft' | 'publish'
  const title = str(formData, 'title');
  const body = formData.get('body');
  const category = str(formData, 'category');
  const builderId = str(formData, 'builderId');
  const metaTitle = str(formData, 'metaTitle');
  const metaDescription = str(formData, 'metaDescription');

  if (title === '') return { ok: false, message: '제목을 입력하세요.' };
  if (typeof body !== 'string' || body.trim() === '') {
    return { ok: false, message: '본문을 입력하세요.' };
  }
  if (!CATEGORIES.includes(category as InsightCategory)) {
    return { ok: false, message: '카테고리를 선택하세요.' };
  }
  // NOT NULL 이다 — REQ-F-095 가 익명·조직 명의 글을 금지한다.
  if (builderId === '') return { ok: false, message: '작성 빌더를 선택하세요.' };

  // FN-A07-03 — 미입력이면 제목에서 만든다.
  const slug = toSlug(str(formData, 'slug') || title);
  if (slug === '') return { ok: false, message: '주소를 입력하세요.' };
  // FN-A07-04 — DB CHECK 가 한 번 더 막지만, 사용자에게 이유를 말해 주는 것은 여기다.
  if (isReservedSlug(slug)) return { ok: false, message: RESERVED };

  const supabase = await createSupabaseServerClient();

  // 발행 후 슬러그는 바꾸지 않는다 (REQ-N-013). 화면도 잠그지만 폼 값은 믿지 않는다.
  let current: { slug: string; status: string; published_at: string | null } | null = null;
  if (id !== '') {
    const { data } = await supabase
      .from('insight')
      .select('slug, status, published_at')
      .eq('id', id)
      .maybeSingle();
    if (!data) return { ok: false, message: '대상을 찾을 수 없습니다.' };
    current = data;
  }

  const publishing = intent === 'publish';
  const wasPublished = current?.status === 'published';
  const finalSlug = wasPublished && current ? current.slug : slug;

  const patch = {
    slug: finalSlug,
    title,
    body,
    category: category as InsightCategory,
    builder_id: builderId,
    // FN-A07-07 — 본문 저장 시 함께 갱신한다. 없으면 null 로 되돌린다
    cover_image_url: coverImageFromBody(body),
    status: publishing ? ('published' as const) : ('draft' as const),
    // 한 번 발행한 글의 최초 발행 시각은 유지한다. 내렸다 다시 올려도 그대로다.
    published_at: publishing
      ? (current?.published_at ?? new Date().toISOString())
      : (current?.published_at ?? null),
    meta_title: metaTitle || null,
    meta_description: metaDescription || null,
    og_image_url: null,
  };

  if (id === '') {
    const { data, error } = await supabase.from('insight').insert(patch).select('id').single();
    if (error || !data) return { ok: false, message: dbMessage(error?.message) };
    revalidatePath('/insights');
    // 새 글은 편집 화면으로 옮겨 간다. 여기서만 redirect 한다 — 성공 경로라 잃을 입력이 없다.
    redirect(`/insights/${data.id}`);
  }

  const { error } = await supabase.from('insight').update(patch).eq('id', id);
  if (error) return { ok: false, message: dbMessage(error.message) };

  revalidatePath('/insights');
  revalidatePath(`/insights/${id}`);
  return { ok: true, message: publishing ? '발행했습니다.' : '임시저장했습니다.' };
}

export async function deleteInsight(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = str(formData, 'id');
  if (id === '') redirect('/insights');

  const supabase = await createSupabaseServerClient();
  await supabase.from('insight').delete().eq('id', id);
  revalidatePath('/insights');
  redirect('/insights');
}

/**
 * Postgres 오류를 사람이 읽을 문장으로.
 *
 * 원문을 그대로 노출하면 테이블·컬럼 이름이 새어나가고 사용자에게는 아무 의미도 없다.
 * 다만 **무엇을 고쳐야 하는지 아는 두 경우**는 구분해서 말해 준다.
 */
function dbMessage(raw: string | undefined): string {
  if (!raw) return SAVE_FAILED;
  // FN-A07-05 — unique(slug) 위반. 앱에서 미리 세지 않고 DB 를 진실로 삼는다
  if (raw.includes('duplicate key') && raw.includes('slug')) {
    return '같은 주소의 글이 이미 있습니다. 다른 주소를 입력해 주세요.';
  }
  if (raw.includes('insight_slug_not_reserved')) return RESERVED;
  if (raw.includes('row-level security')) return '권한이 없습니다.';
  console.error('[a-07 save]', raw);
  return SAVE_FAILED;
}
