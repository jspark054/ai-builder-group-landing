// P-04 프로젝트 상세 데이터 — **서버 전용**
//
// 근거 — 화면설계 §5.3 · 기능명세 §4.3 · 데이터모델 §3.2~3.5 · POL-03 · POL-09
//   FN-P04-01  프로젝트명 h1 · 슬러그는 검색어와 일치 (자연어 한글)
//   FN-P04-02  대표 이미지 + alt
//   FN-P04-03  본문 4문항
//   FN-P04-06  링크 등급별 바로가기 (POL-03 — `none` 은 버튼 미노출)
//   FN-P04-07  담당 빌더 전원을 P-06 으로 링크
//   화면설계 §5.3  분류는 **전부** 표시한다 (C-01 카드의 "최대 2개"는 카드 규칙이다)
//   화면설계 §5.3  비공개·없는 슬러그는 404
//
// ⚠ 클라이언트에서 호출하지 말 것.
//   `project_builder` 는 익명 SELECT 가 RLS 로 차단돼 있고 anon GRANT 도 없다
//   (0002 §project_builder · 0004_grants.sql). 브라우저에서 부르면 담당 빌더가
//   **에러 없이 빈 배열**이 된다. 그래서 service role 클라이언트를 쓰고 서버
//   컴포넌트에서만 호출한다. (service role 키는 클라이언트 번들에 없으므로
//   브라우저에서 부르면 requireConfig 단계에서 throw 한다 — 조용히 틀리지는 않는다.)
//
// 카드마다·빌더마다 개별 조회를 붙이지 않는다. 한 화면당 이 함수 1회가 전부다.
//
// PostgREST 중첩 select 를 쓰지 않고 평면 쿼리로 나눈 이유는
// packages/supabase/src/types.ts 주석 참조 (Relationships 미정의 → 중첩 결과 타입이 무너진다).

import { createAdminSupabase, isSupabaseConfigured } from '@orca/supabase';

/** POL-03 링크 등급. `none` 이면 외부 링크 버튼이 없다 (FN-P04-06). */
export type LinkGrade = 'live' | 'deploy' | 'repo' | 'video' | 'none';

/** FN-P04-07 — 담당 빌더 1명. 이름과 P-06 링크에 쓸 슬러그가 전부다 (POL-05 이력 미표기). */
export type ProjectDetailBuilder = {
  slug: string;
  displayName: string;
};

export type ProjectDetailData = {
  slug: string;
  title: string;
  summary: string;
  /** FN-P04-03 — 4문항. 화면이 h2 를 붙인다. 순서는 what → why → how → result 고정 */
  bodyWhat: string;
  bodyWhy: string;
  bodyHow: string;
  bodyResult: string;
  thumbnailUrl: string;
  thumbnailAlt: string;
  liveUrl: string | null;
  linkGrade: LinkGrade;
  /** 화면설계 §5.3 — **전부** 표시한다. 상한을 두지 않는다 */
  categories: { name: string }[];
  /** FN-P04-07 — 공개 빌더만. 비공개는 P-06 이 404 라 링크 대상에서 빠진다 */
  builders: ProjectDetailBuilder[];
  /** JSON-LD 의 datePublished · dateModified (FN-P04-10) */
  createdAt: string;
  updatedAt: string;
};

/**
 * generateStaticParams 용 공개 슬러그 목록.
 *
 * 썸네일 유무로 거르지 않는다 — 그건 카드 목록(POL-02)의 규칙이고, 상세는 주소가
 * 색인 대상이라 페이지가 사라지면 안 된다. 공개 여부만 본다.
 */
export async function getPublicProjectSlugs(): Promise<string[]> {
  if (!isSupabaseConfigured()) {
    console.warn('[project-detail] Supabase 미설정 — 상세 경로를 프리렌더하지 않습니다.');
    return [];
  }

  const supabase = createAdminSupabase();
  const { data, error } = await supabase
    .from('project')
    .select('slug')
    .eq('is_public', true)
    .order('sort_order', { ascending: true });

  if (error) throw new Error(`프로젝트 슬러그를 읽지 못했습니다: ${error.message}`);
  return (data ?? []).map((row) => row.slug);
}

/**
 * 슬러그 한 건을 P-04 화면용 형태로 읽는다.
 *
 * 없거나 비공개면 `null` 을 준다 — 호출부가 notFound() 를 부른다 (화면설계 §5.3).
 *
 * `slug` 는 **디코딩된 원문**을 받는다 (`에듀셀파`). 라우트 파라미터는 퍼센트
 * 인코딩된 채로 들어오므로 호출부(P-04 의 `decodeSlug`)가 풀어서 넘긴다 —
 * 디코딩을 여기 두면 슬러그 출처가 라우트 하나로 굳어 A-03 등 다른 호출부에서
 * 두 번 푸는 사고가 난다.
 */
export async function getProjectDetail(slug: string): Promise<ProjectDetailData | null> {
  // 로컬 `pnpm build` 는 루트 .env 를 읽지 않는다 (build 스크립트가 with-env.sh 를 거치지 않는다).
  // 그 상태에서 throw 하면 프리렌더가 통째로 깨지므로 null 로 넘긴다 — 호출부가 404 로 만든다.
  // 설정은 있는데 권한·질의가 잘못된 경우는 아래에서 그대로 throw 한다. 조용히 넘기지 않는다.
  if (!isSupabaseConfigured()) {
    console.warn('[project-detail] Supabase 미설정 — 상세를 404 로 렌더합니다.');
    return null;
  }

  const supabase = createAdminSupabase();

  const { data: project, error } = await supabase
    .from('project')
    // 컬럼 목록은 **문자열 리터럴로** 둔다. 상수로 빼서 이어 붙이면 supabase-js 가
    // 결과 타입을 추론하지 못해 Row 가 통째로 GenericStringError 가 된다 (실측 TS2339).
    .select(
      'id, slug, title, summary, body_what, body_why, body_how, body_result, thumbnail_url, thumbnail_alt, live_url, link_grade, created_at, updated_at',
    )
    .eq('slug', slug)
    // 화면설계 §5.3 — 비공개는 404 다. 쿼리에서 거르므로 화면이 판단할 것이 없다
    .eq('is_public', true)
    .maybeSingle();

  if (error) throw new Error(`프로젝트를 읽지 못했습니다: ${error.message}`);
  if (!project) return null;

  const [categoryLinks, builderLinks] = await Promise.all([
    supabase.from('project_category').select('category_id').eq('project_id', project.id),
    supabase
      .from('project_builder')
      .select('builder_id, is_owner, sort_order')
      .eq('project_id', project.id),
  ]);

  if (categoryLinks.error) {
    throw new Error(`프로젝트 분류를 읽지 못했습니다: ${categoryLinks.error.message}`);
  }
  if (builderLinks.error) {
    throw new Error(`담당 빌더를 읽지 못했습니다: ${builderLinks.error.message}`);
  }

  const categoryIds = (categoryLinks.data ?? []).map((row) => row.category_id);
  const builderIds = (builderLinks.data ?? []).map((row) => row.builder_id);

  const [categories, builders] = await Promise.all([
    categoryIds.length > 0
      ? supabase.from('category').select('id, name, sort_order').in('id', categoryIds)
      : Promise.resolve({ data: [], error: null } as const),
    builderIds.length > 0
      ? // 화면설계 §5.3 「비공개 빌더는 링크 제외」 — is_public 으로 여기서 거른다.
        // 비공개 빌더의 P-06 은 404 이므로 이름만 남기면 죽은 링크이거나 링크 없는
        // 이름이 된다. 둘 다 이 화면의 목적(전원을 P-06 으로 보낸다)에 맞지 않는다
        supabase
          .from('builder')
          .select('id, slug, display_name')
          .in('id', builderIds)
          .eq('is_public', true)
      : Promise.resolve({ data: [], error: null } as const),
  ]);

  if (categories.error) throw new Error(`분류를 읽지 못했습니다: ${categories.error.message}`);
  if (builders.error) throw new Error(`빌더를 읽지 못했습니다: ${builders.error.message}`);

  const categoryById = new Map((categories.data ?? []).map((row) => [row.id, row]));
  const builderById = new Map((builders.data ?? []).map((row) => [row.id, row]));

  // 카드와 같은 기준으로 정렬한다 — category.sort_order 앞선 것부터.
  // 다만 여기서는 상한이 없다. slice 하지 않는다 (화면설계 §5.3 "분류 전부")
  const projectCategories = (categoryLinks.data ?? [])
    .flatMap((link) => {
      const category = categoryById.get(link.category_id);
      return category ? [category] : [];
    })
    .sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name, 'ko'))
    .map((category) => ({ name: category.name }));

  // 정렬 기준은 project_builder.sort_order 다. 동순위일 때만 is_owner 가 앞선다.
  // `is_owner` 는 **정렬 근거로만** 쓴다 — 「대표」 배지를 화면에 만들지 않는다.
  // 화면설계 §5.3 · 기능명세 §4.3 어디에도 대표 표기 규칙이 없어서다.
  // (C-01 은 첫 1명만 이름을 내보내므로 is_owner 를 1순위로 둔다. 여기는 전원을
  //  나열하므로 운영자가 지정한 순서가 1순위다. 현재 데이터에서는 결과가 같다)
  const projectBuilders = (builderLinks.data ?? [])
    .sort((a, b) => a.sort_order - b.sort_order || Number(b.is_owner) - Number(a.is_owner))
    .flatMap((link) => {
      const builder = builderById.get(link.builder_id);
      return builder ? [{ slug: builder.slug, displayName: builder.display_name }] : [];
    });

  return {
    slug: project.slug,
    title: project.title,
    summary: project.summary,
    bodyWhat: project.body_what,
    bodyWhy: project.body_why,
    bodyHow: project.body_how,
    bodyResult: project.body_result,
    thumbnailUrl: project.thumbnail_url,
    thumbnailAlt: project.thumbnail_alt,
    liveUrl: project.live_url,
    linkGrade: project.link_grade,
    categories: projectCategories,
    builders: projectBuilders,
    createdAt: project.created_at,
    updatedAt: project.updated_at,
  };
}
