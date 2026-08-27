'use server';

// A-03 프로젝트 저장 · 삭제 · 공개 전환.
//
// 근거 — 기능명세 §5.3
//   FN-A03-02  등록·수정·삭제
//   FN-A03-08  라이브 링크 형식 검증
//   FN-A03-09  담당 빌더 지정 (N:M)
//   FN-A03-10  분류 다중 선택
//   FN-A03-11  **대표 빌더 정확히 1인**
//   FN-A03-13  OG 미입력 시 대표 이미지를 쓴다
//   FN-A03-14  공개 여부 토글 — 운영 권한자만
//   FN-A03-15  정렬 순서 수동 조정
//
// 🔴 실패 경로에서 redirect 하지 않는다. 결정시트 확정 원칙 —
//    「실패해도 입력값을 잃지 않는다. **본문이 최소 500자라 다시 쓰게 하면 안 됩니다**」.
//    A-07 과 같은 이유이고, 그 원칙의 원문이 가리키는 화면이 바로 여기다.
//
// 🔴 POL-08 체크리스트 미충족은 **막지 않는다.** 정책이 「경고하되 차단하지 않는다」다.
//    막는 것은 저장 자체가 불가능한 것들뿐이다 — 필수 컬럼, 링크 형식, 대표 빌더 1인.
//
// ⚠ 공개 화면(apps/web)은 별도 배포라 revalidatePath 가 닿지 않는다. 포트폴리오는
//   `revalidate = 3600` 이므로 최대 1시간 뒤에 반영된다 (D-17 과 같은 구조).

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import type { LinkGrade } from '@orca/supabase';

import { requireAdmin } from '@/lib/authz';
import { isValidLiveUrl } from '@/lib/projects';
import { createSupabaseServerClient } from '@/lib/supabase-server';

export type SaveState = { ok: true; message: string } | { ok: false; message: string } | null;

const GRADES: LinkGrade[] = ['live', 'deploy', 'repo', 'video', 'none'];

function str(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === 'string' ? value.trim() : '';
}

const SAVE_FAILED = '작성한 내용은 그대로 남아 있습니다. 다시 시도해 주세요.';

export async function saveProject(_prev: SaveState, formData: FormData): Promise<SaveState> {
  await requireAdmin();

  const id = str(formData, 'id');
  const title = str(formData, 'title');
  const slug = str(formData, 'slug');
  const summary = str(formData, 'summary');
  const liveUrl = str(formData, 'liveUrl');
  const linkGrade = str(formData, 'linkGrade');
  const thumbnailUrl = str(formData, 'thumbnailUrl');
  const thumbnailAlt = str(formData, 'thumbnailAlt');
  const builderIds = formData.getAll('builderIds').map(String);
  const ownerId = str(formData, 'ownerId');
  const categoryIds = formData.getAll('categoryIds').map(String);

  if (title === '') return { ok: false, message: '제목을 입력하세요.' };
  if (slug === '') return { ok: false, message: '주소를 입력하세요.' };
  if (summary === '') return { ok: false, message: '요약을 입력하세요.' };
  if (!GRADES.includes(linkGrade as LinkGrade)) {
    return { ok: false, message: '링크 등급을 선택하세요.' };
  }
  // FN-A03-08 — 형식 오류는 저장 전에 잡는다. 죽은 링크가 공개 카드에 걸리면
  // POL-03 의 「검증력」 자체가 무너진다
  if (!isValidLiveUrl(liveUrl)) {
    return { ok: false, message: '라이브 링크 형식이 올바르지 않습니다. http 또는 https 로 시작해야 합니다.' };
  }
  // 썸네일은 NOT NULL 이고 alt 도 함께 요구된다 (REQ-F-064)
  if (thumbnailUrl === '') return { ok: false, message: '대표 이미지 주소를 입력하세요.' };
  if (thumbnailAlt === '') {
    return { ok: false, message: '대표 이미지의 대체 텍스트를 입력하세요.' };
  }
  // FN-A03-11 — 대표는 정확히 1명이다. 빌더를 고르면 대표도 그 안에서 골라야 한다
  if (builderIds.length > 0 && !builderIds.includes(ownerId)) {
    return { ok: false, message: '대표 빌더를 담당 빌더 중에서 지정하세요.' };
  }

  const supabase = await createSupabaseServerClient();

  const patch = {
    slug,
    title,
    summary,
    body_what: str(formData, 'bodyWhat'),
    body_why: str(formData, 'bodyWhy'),
    body_how: str(formData, 'bodyHow'),
    body_result: str(formData, 'bodyResult'),
    thumbnail_url: thumbnailUrl,
    thumbnail_alt: thumbnailAlt,
    live_url: liveUrl || null,
    link_grade: linkGrade as LinkGrade,
    is_public: formData.get('isPublic') === 'on',
    sort_order: Number(str(formData, 'sortOrder')) || 0,
    meta_title: str(formData, 'metaTitle') || null,
    meta_description: str(formData, 'metaDescription') || null,
    // FN-A03-13 — 미입력이면 null 로 두고 공개 화면이 대표 이미지를 쓴다.
    // 여기서 thumbnail_url 을 복사해 넣지 않는다 — 파생 값을 저장하지 않는다는
    // 데이터모델 §6 원칙이고, 대표 이미지를 바꾸면 OG 만 옛 값으로 남는다
    og_image_url: str(formData, 'ogImageUrl') || null,
  };

  let projectId = id;

  if (id === '') {
    const { data, error } = await supabase.from('project').insert(patch).select('id').single();
    if (error || !data) return { ok: false, message: dbMessage(error?.message) };
    projectId = data.id;
  } else {
    const { error } = await supabase.from('project').update(patch).eq('id', id);
    if (error) return { ok: false, message: dbMessage(error.message) };
  }

  // ── 연결 다시 쓰기 ────────────────────────────────────────────────────
  // 차집합을 계산하지 않고 지우고 다시 넣는다. 연결 테이블에 부가 정보가
  // `is_owner` · `sort_order` 뿐이라 보존할 상태가 없다.
  const links = await supabase.from('project_builder').delete().eq('project_id', projectId);
  if (links.error) return { ok: false, message: dbMessage(links.error.message) };

  if (builderIds.length > 0) {
    const rows = builderIds.map((builderId, index) => ({
      project_id: projectId,
      builder_id: builderId,
      is_owner: builderId === ownerId,
      sort_order: index,
    }));
    const { error } = await supabase.from('project_builder').insert(rows);
    if (error) return { ok: false, message: dbMessage(error.message) };
  }

  const cats = await supabase.from('project_category').delete().eq('project_id', projectId);
  if (cats.error) return { ok: false, message: dbMessage(cats.error.message) };

  if (categoryIds.length > 0) {
    const rows = categoryIds.map((categoryId) => ({
      project_id: projectId,
      category_id: categoryId,
    }));
    const { error } = await supabase.from('project_category').insert(rows);
    if (error) return { ok: false, message: dbMessage(error.message) };
  }

  revalidatePath('/projects');
  revalidatePath(`/projects/${projectId}`);

  // 새 프로젝트는 편집 화면으로 옮겨 간다. 성공 경로라 잃을 입력이 없다
  if (id === '') redirect(`/projects/${projectId}`);

  return { ok: true, message: '저장했습니다.' };
}

export async function deleteProject(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = str(formData, 'id');
  if (id === '') redirect('/projects');

  const supabase = await createSupabaseServerClient();
  // 연결은 FK 가 cascade 로 정리한다 (데이터모델 §3.4 · §3.5)
  await supabase.from('project').delete().eq('id', id);
  revalidatePath('/projects');
  redirect('/projects');
}

function dbMessage(raw: string | undefined): string {
  if (!raw) return SAVE_FAILED;
  if (raw.includes('duplicate key') && raw.includes('slug')) {
    return '같은 주소의 프로젝트가 이미 있습니다. 다른 주소를 입력해 주세요.';
  }
  if (raw.includes('row-level security')) return '권한이 없습니다.';
  // 데이터모델이 프로젝트당 대표 1인을 부분 유니크 인덱스로 강제한다
  if (raw.includes('is_owner')) return '대표 빌더는 프로젝트당 한 명입니다.';
  console.error('[a-03 save]', raw);
  return SAVE_FAILED;
}
