// A-03 조회 계층 — **서버 전용**
//
// 근거 — FN-A03-01 · FN-A03-09~11 · 데이터모델 §3.3~§3.5 · 마이그레이션 0002 §4(RLS)
//
// ⚠ 사용자 세션 클라이언트로 읽는다 (service role 이 아니다). 관리 화면에는 세션이
//   있으므로 RLS 를 지나게 두는 것이 맞다 — 공개 화면(apps/web)이 service role 을
//   쓰는 것과 다른 이유다.

import 'server-only';

import type { CategoryAxis, LinkGrade, ProjectRow } from '@orca/supabase';

import { createSupabaseServerClient } from '@/lib/supabase-server';

export type ProjectListItem = {
  id: string;
  slug: string;
  title: string;
  isPublic: boolean;
  sortOrder: number;
  linkGrade: LinkGrade;
  /** FN-C01-04 표기가 아니라 관리 목록용이다. 이름만 이어 붙인다 */
  builderNames: string[];
  updatedAt: string;
};

export type CategoryOption = { id: string; axis: CategoryAxis; name: string; sortOrder: number };
export type BuilderOption = { id: string; displayName: string };

/** 편집 화면 한 건 — 프로젝트 + 연결(빌더 · 분류) */
export type ProjectEditData = {
  project: ProjectRow;
  /** `is_owner` 가 대표 빌더 1인이다 (FN-A03-11) */
  builders: { builderId: string; isOwner: boolean; sortOrder: number }[];
  categoryIds: string[];
};

export async function listBuilderOptions(): Promise<BuilderOption[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from('builder').select('id, display_name').order('display_name');
  return (data ?? []).map((row) => ({ id: row.id, displayName: row.display_name }));
}

export async function listCategoryOptions(): Promise<CategoryOption[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from('category')
    .select('id, axis, name, sort_order')
    .order('sort_order');
  return (data ?? []).map((row) => ({
    id: row.id,
    axis: row.axis,
    name: row.name,
    sortOrder: row.sort_order,
  }));
}

export async function listProjects(): Promise<ProjectListItem[]> {
  const supabase = await createSupabaseServerClient();

  // 연결과 빌더 이름을 한 번씩만 읽어 메모리에서 붙인다. 행마다 조회하면 N+1 이다
  const [projects, links, builders] = await Promise.all([
    supabase
      .from('project')
      .select('id, slug, title, is_public, sort_order, link_grade, updated_at')
      .order('sort_order'),
    supabase.from('project_builder').select('project_id, builder_id, sort_order'),
    listBuilderOptions(),
  ]);

  if (projects.error || !projects.data) return [];

  const builderName = new Map(builders.map((b) => [b.id, b.displayName]));
  const namesByProject = new Map<string, string[]>();
  for (const link of (links.data ?? []).sort((a, b) => a.sort_order - b.sort_order)) {
    const name = builderName.get(link.builder_id);
    if (!name) continue;
    const list = namesByProject.get(link.project_id) ?? [];
    list.push(name);
    namesByProject.set(link.project_id, list);
  }

  return projects.data.map((row) => ({
    id: row.id,
    slug: row.slug,
    title: row.title,
    isPublic: row.is_public,
    sortOrder: row.sort_order,
    linkGrade: row.link_grade,
    builderNames: namesByProject.get(row.id) ?? [],
    updatedAt: row.updated_at,
  }));
}

export async function getProjectForEdit(id: string): Promise<ProjectEditData | null> {
  const supabase = await createSupabaseServerClient();

  const { data: project, error } = await supabase
    .from('project')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error || !project) return null;

  const [builders, categories] = await Promise.all([
    supabase
      .from('project_builder')
      .select('builder_id, is_owner, sort_order')
      .eq('project_id', id)
      .order('sort_order'),
    supabase.from('project_category').select('category_id').eq('project_id', id),
  ]);

  return {
    project,
    builders: (builders.data ?? []).map((row) => ({
      builderId: row.builder_id,
      isOwner: row.is_owner,
      sortOrder: row.sort_order,
    })),
    categoryIds: (categories.data ?? []).map((row) => row.category_id),
  };
}

/** 새 프로젝트의 기본 정렬 순서. 맨 뒤에 붙인다 (FN-A03-15) */
export async function nextSortOrder(): Promise<number> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from('project')
    .select('sort_order')
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data?.sort_order ?? 0) + 1;
}
