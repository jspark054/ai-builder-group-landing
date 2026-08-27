// A-02 조회 계층 — **서버 전용**
//
// 근거 — FN-A02-01 · 데이터모델 §3.1 · 마이그레이션 0002 §4(RLS)
//
// ⚠ 사용자 세션 클라이언트로 읽는다. `builder_select_authenticated` 가 관리자에게
//   전체(비공개 포함)를 준다 — 공개 화면과 달리 여기서는 비공개도 보여야 한다.

import 'server-only';

import type { BuilderRow } from '@orca/supabase';

import { createSupabaseServerClient } from '@/lib/supabase-server';

export type BuilderListItem = {
  id: string;
  slug: string;
  displayName: string;
  nameType: 'real' | 'nickname';
  cohort: number;
  isPublic: boolean;
  isPinned: boolean;
  pinOrder: number | null;
  hasImage: boolean;
  /** 담당 프로젝트 수. 0건이면 공개 목록에 노출되지 않는다 (POL-02) */
  projectCount: number;
  updatedAt: string;
};

export type CourseOption = { id: string; title: string };

export async function listCourseOptions(): Promise<CourseOption[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from('course').select('id, title').order('sort_order');
  return (data ?? []).map((row) => ({ id: row.id, title: row.title }));
}

export async function listBuilders(): Promise<BuilderListItem[]> {
  const supabase = await createSupabaseServerClient();

  const [builders, links] = await Promise.all([
    supabase
      .from('builder')
      .select(
        'id, slug, display_name, name_type, cohort, is_public, is_pinned, pin_order, image_url, updated_at',
      )
      // POL-07 정렬과 무관한 관리 목록이다. 고정 → 기수 → 이름 순으로 둔다
      .order('is_pinned', { ascending: false })
      .order('cohort')
      .order('display_name'),
    supabase.from('project_builder').select('builder_id'),
  ]);

  if (builders.error || !builders.data) return [];

  const projectCount = new Map<string, number>();
  for (const link of links.data ?? []) {
    projectCount.set(link.builder_id, (projectCount.get(link.builder_id) ?? 0) + 1);
  }

  return builders.data.map((row) => ({
    id: row.id,
    slug: row.slug,
    displayName: row.display_name,
    nameType: row.name_type,
    cohort: row.cohort,
    isPublic: row.is_public,
    isPinned: row.is_pinned,
    pinOrder: row.pin_order,
    hasImage: (row.image_url ?? '') !== '',
    projectCount: projectCount.get(row.id) ?? 0,
    updatedAt: row.updated_at,
  }));
}

export async function getBuilderForEdit(id: string): Promise<BuilderRow | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from('builder').select('*').eq('id', id).maybeSingle();
  if (error || !data) return null;
  return data;
}

/** 새 빌더의 기본 기수. 가장 큰 값을 따라간다 — 대개 같은 기수로 여러 명이 들어온다 */
export async function latestCohort(): Promise<number> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from('builder')
    .select('cohort')
    .order('cohort', { ascending: false })
    .limit(1)
    .maybeSingle();
  return data?.cohort ?? 1;
}
