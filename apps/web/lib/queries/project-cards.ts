// C-01 프로젝트 카드 데이터 — **서버 전용**
//
// 근거 — 기능명세 §3.1 · 데이터모델 §3.2~3.5 · POL-02 · POL-03
//   FN-C01-01  썸네일 · alt
//   FN-C01-04  담당 빌더 (is_owner 우선 · sort_order)
//   FN-C01-05  분류 배지 최대 2개 · category.sort_order 앞선 것부터
//   FN-C01-08  link_grade = 'none' 이면 바로가기 미노출 → 화면이 판단하도록 등급을 그대로 넘긴다
//   POL-02     썸네일 미등록 건은 카드 렌더 대상에서 제외한다 (여기서 거른다)
//   FN-P03-03  정렬은 수동 지정값(project.sort_order) 오름차순
//
// ⚠ 클라이언트에서 호출하지 말 것.
//   `project_builder` 는 익명 SELECT 가 RLS 로 차단돼 있다. 브라우저에서 부르면
//   **에러 없이 빌더가 빈 배열로 나온다.** 그래서 service role 클라이언트를 쓰고,
//   서버 컴포넌트에서만 호출한다. (service role 키는 클라이언트 번들에 없으므로
//   브라우저에서 부르면 requireConfig 단계에서 throw 한다 — 조용히 틀리지는 않는다.)
//
// PostgREST 중첩 select 를 쓰지 않고 평면 쿼리 4회로 나눈 이유는
// packages/supabase/src/types.ts 주석 참조 (Relationships 미정의 → 중첩 결과 타입이 무너진다).

import { createAdminSupabase, isSupabaseConfigured } from '@orca/supabase';

import type { ProjectCardData } from '@/components/cards/project-card';

/** 빈 문자열·공백만 있는 값은 미등록으로 본다 (thumbnail_url 은 NOT NULL 이라 '' 가 들어올 수 있다). */
function isBlank(value: string | null | undefined): boolean {
  return !value || value.trim() === '';
}

export type ProjectCardFilter = {
  /**
   * 넘기면 이 빌더가 담당한 프로젝트만 남긴다 (P-06 · FN-P06-02).
   *
   * `is_owner` 를 보지 않으므로 **공동 담당 건도 포함**된다 — 화면설계 §5.5 의
   * 「공동 프로젝트가 담당자 전원 페이지에 각각 노출된다」(G-3d 확정)가 그 조항이다.
   *
   * 쿼리를 늘리지 않는다. 담당 관계는 아래에서 어차피 한 번 읽으므로 그 결과로 거른다.
   */
  builderId?: string;
};

/**
 * 공개 프로젝트를 C-01 카드용 형태로 읽는다.
 *
 * - `project.is_public = true`
 * - 썸네일이 없는 건은 제외 (POL-02)
 * - `project.sort_order` 오름차순 (동순위는 `created_at` 오름차순으로 고정)
 *
 * P-01 섹션 4 · P-03 은 인자 없이 부르고, P-06 만 `builderId` 를 넘긴다.
 * 카드 조립을 한 곳에 두기 위해서다 — 화면마다 카드 쿼리를 새로 만들지 않는다.
 */
export async function getProjectCards(
  filter: ProjectCardFilter = {},
): Promise<ProjectCardData[]> {
  // 로컬 `pnpm build` 는 루트 .env 를 읽지 않는다 (build 스크립트가 with-env.sh 를 거치지 않는다).
  // 그 상태에서 throw 하면 `/` 프리렌더가 통째로 깨지므로 빈 목록으로 넘긴다 —
  // 섹션은 POL-02 에 따라 스스로 숨는다. Vercel 은 환경변수가 주입되므로 실제 값으로 렌더된다.
  // 설정은 있는데 권한·질의가 잘못된 경우는 아래에서 그대로 throw 한다. 조용히 넘기지 않는다.
  if (!isSupabaseConfigured()) {
    console.warn('[project-cards] Supabase 미설정 — 포트폴리오 섹션을 비운 채로 렌더합니다.');
    return [];
  }

  const supabase = createAdminSupabase();

  const { data: projects, error } = await supabase
    .from('project')
    .select(
      'id, slug, title, summary, thumbnail_url, thumbnail_alt, live_url, link_grade, sort_order, created_at',
    )
    .eq('is_public', true)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) throw new Error(`프로젝트 목록을 읽지 못했습니다: ${error.message}`);
  if (!projects || projects.length === 0) return [];

  // POL-02 — 썸네일 미등록 건은 여기서 떨어뜨린다. 화면은 빈 이미지를 다루지 않는다.
  const visible = projects.filter((row) => !isBlank(row.thumbnail_url));
  if (visible.length === 0) return [];

  const projectIds = visible.map((row) => row.id);

  const [categoryLinks, builderLinks] = await Promise.all([
    supabase.from('project_category').select('project_id, category_id').in('project_id', projectIds),
    supabase
      .from('project_builder')
      .select('project_id, builder_id, is_owner, sort_order')
      .in('project_id', projectIds),
  ]);

  if (categoryLinks.error) {
    throw new Error(`프로젝트 분류를 읽지 못했습니다: ${categoryLinks.error.message}`);
  }
  if (builderLinks.error) {
    throw new Error(`프로젝트 담당 빌더를 읽지 못했습니다: ${builderLinks.error.message}`);
  }

  const categoryIds = [...new Set((categoryLinks.data ?? []).map((row) => row.category_id))];
  const builderIds = [...new Set((builderLinks.data ?? []).map((row) => row.builder_id))];

  const [categories, builders] = await Promise.all([
    categoryIds.length > 0
      ? supabase.from('category').select('id, name, sort_order').in('id', categoryIds)
      : Promise.resolve({ data: [], error: null } as const),
    builderIds.length > 0
      ? supabase.from('builder').select('id, display_name').in('id', builderIds)
      : Promise.resolve({ data: [], error: null } as const),
  ]);

  if (categories.error) throw new Error(`분류를 읽지 못했습니다: ${categories.error.message}`);
  if (builders.error) throw new Error(`빌더를 읽지 못했습니다: ${builders.error.message}`);

  const categoryById = new Map((categories.data ?? []).map((row) => [row.id, row]));
  const builderById = new Map((builders.data ?? []).map((row) => [row.id, row]));

  // P-06 필터. 정렬은 건드리지 않는다 — project.sort_order 오름차순이 그대로 남는다
  const scoped =
    filter.builderId === undefined
      ? visible
      : visible.filter((project) =>
          (builderLinks.data ?? []).some(
            (link) => link.project_id === project.id && link.builder_id === filter.builderId,
          ),
        );

  return scoped.map((project) => {
    // FN-C01-05 — category.sort_order 앞선 것부터 최대 2개.
    // 정렬을 DB 에 맡기지 않는 이유: 순서 기준이 연결 테이블이 아니라 category 쪽에 있다.
    const projectCategories = (categoryLinks.data ?? [])
      .filter((link) => link.project_id === project.id)
      .flatMap((link) => {
        const category = categoryById.get(link.category_id);
        return category ? [category] : [];
      })
      .sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name, 'ko'))
      .slice(0, 2)
      .map((category) => ({ name: category.name }));

    // FN-C01-04 — 대표(is_owner) 먼저, 그다음 sort_order. 표기 문구는 카드가 만든다.
    const projectBuilders = (builderLinks.data ?? [])
      .filter((link) => link.project_id === project.id)
      .sort(
        (a, b) => Number(b.is_owner) - Number(a.is_owner) || a.sort_order - b.sort_order,
      )
      .flatMap((link) => {
        const builder = builderById.get(link.builder_id);
        return builder ? [{ displayName: builder.display_name }] : [];
      });

    return {
      slug: project.slug,
      title: project.title,
      summary: project.summary,
      thumbnailUrl: project.thumbnail_url,
      thumbnailAlt: project.thumbnail_alt,
      liveUrl: project.live_url,
      linkGrade: project.link_grade,
      categories: projectCategories,
      builders: projectBuilders,
    };
  });
}
