// A-06 조회 계층 — **서버 전용**
//
// 근거 — 기능명세 §5.6(FN-A06-01 · 04 · 06 · 08 · 09) · 데이터모델 §4.2
//
// 🔴 **본인 것만 읽는다.** 화면에서 거르지 않고 쿼리에서 자른다 — 전체를 브라우저로
//    내려보낸 뒤 감추는 구현은 `REQ-N-011`(프론트엔드 은닉으로 대체하지 않는다) 위반이다.
//    RLS 가 한 번 더 막지만(`builder_select_authenticated` 는 전체를 주므로 여기서는
//    쿼리가 1차 방어다), 순서를 뒤집지 않는다.

import 'server-only';

import type { BuilderRow, LinkGrade } from '@orca/supabase';

import { createSupabaseServerClient } from '@/lib/supabase-server';

export type MyProject = {
  id: string;
  slug: string;
  title: string;
  isPublic: boolean;
  linkGrade: LinkGrade;
  updatedAt: string;
  /** FN-A06-04 — 대표 / 참여 구분 */
  isOwner: boolean;
  /** FN-A06-06 — 참여 건이면 대표가 누구인지. 대표 건이면 null */
  ownerName: string | null;
};

/** 로그인한 빌더의 프로필. 타인 것은 조회 자체를 하지 않는다 */
export async function getMyProfile(builderId: string): Promise<BuilderRow | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('builder')
    .select('*')
    .eq('id', builderId)
    .maybeSingle();
  if (error || !data) return null;
  return data;
}

/**
 * 담당 프로젝트 — 대표 · 참여를 구분해 돌려준다 (FN-A06-04 · 06).
 *
 * 대표를 먼저 놓는다. 편집할 수 있는 것이 위에 있어야 화면이 「무엇을 할 수 있는가」로
 * 읽힌다.
 */
export async function getMyProjects(builderId: string): Promise<MyProject[]> {
  const supabase = await createSupabaseServerClient();

  const { data: myLinks } = await supabase
    .from('project_builder')
    .select('project_id, is_owner')
    .eq('builder_id', builderId);

  const links = myLinks ?? [];
  if (links.length === 0) return [];

  const projectIds = links.map((link) => link.project_id);

  // 참여 건의 대표가 누구인지 알아야 한다 (FN-A06-06). 같은 프로젝트의 **다른** 연결을
  // 함께 읽어 대표 한 명을 찾는다 — 대표는 부분 유니크 인덱스로 1명이 강제된다
  const [{ data: projects }, { data: owners }, { data: builders }] = await Promise.all([
    supabase
      .from('project')
      .select('id, slug, title, is_public, link_grade, updated_at')
      .in('id', projectIds),
    supabase
      .from('project_builder')
      .select('project_id, builder_id')
      .in('project_id', projectIds)
      .eq('is_owner', true),
    supabase.from('builder').select('id, display_name'),
  ]);

  const builderName = new Map((builders ?? []).map((row) => [row.id, row.display_name]));
  const ownerOf = new Map((owners ?? []).map((row) => [row.project_id, row.builder_id]));
  const isOwnerOf = new Map(links.map((link) => [link.project_id, link.is_owner]));

  return (projects ?? [])
    .map((row) => {
      const isOwner = isOwnerOf.get(row.id) ?? false;
      const ownerId = ownerOf.get(row.id);
      return {
        id: row.id,
        slug: row.slug,
        title: row.title,
        isPublic: row.is_public,
        linkGrade: row.link_grade,
        updatedAt: row.updated_at,
        isOwner,
        // 대표 건에는 표시하지 않는다 — 자기 자신을 「대표: 나」로 적을 이유가 없다
        ownerName: isOwner ? null : (ownerId ? (builderName.get(ownerId) ?? null) : null),
      };
    })
    .sort((a, b) => {
      if (a.isOwner !== b.isOwner) return a.isOwner ? -1 : 1;
      return a.title.localeCompare(b.title, 'ko');
    });
}

/**
 * 대표로 지정된 프로젝트 한 건 (FN-A06-05).
 *
 * 🔴 **대표가 아니면 null 이다.** 참여 건의 주소를 직접 쳐도 열리지 않는다.
 *    RLS(`project_update_own`)가 쓰기를 막지만, 읽기는 authenticated 에게 전체가
 *    열려 있어(`project_select_authenticated`) 여기서 잘라야 한다.
 */
export async function getMyOwnedProject(
  builderId: string,
  projectId: string,
): Promise<{ project: NonNullable<Awaited<ReturnType<typeof fetchProject>>>; } | null> {
  const supabase = await createSupabaseServerClient();

  const { data: link } = await supabase
    .from('project_builder')
    .select('is_owner')
    .eq('project_id', projectId)
    .eq('builder_id', builderId)
    .maybeSingle();

  if (!link?.is_owner) return null;

  const project = await fetchProject(projectId);
  if (!project) return null;
  return { project };
}

async function fetchProject(projectId: string) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from('project').select('*').eq('id', projectId).maybeSingle();
  return data;
}
