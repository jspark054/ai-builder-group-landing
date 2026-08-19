// C-02 빌더 카드 데이터 — **서버 전용**
//
// 근거 — 기능명세 §3.2 · 화면설계 §4.2 · 데이터모델 §3.1 · §3.3 · POL-02 · POL-12
//   FN-C02-05  담당 프로젝트 수. **공개 상태 프로젝트만** 집계
//   화면설계 §4.2  **공동 담당 건 포함** (G-3d) → is_owner 로 거르지 않는다
//   POL-02     담당 프로젝트 0건인 빌더는 목록에 노출하지 않는다 (여기서 거른다)
//
// ⚠ 클라이언트에서 호출하지 말 것.
//   `project_builder` 는 익명 SELECT 가 RLS 로 차단돼 있고 anon GRANT 도 없다
//   (0002 §project_builder · 0004_grants.sql). 브라우저에서 부르면 담당 건수가
//   전부 0 이 되어 **모든 빌더가 POL-02 로 사라진다.** 그래서 service role
//   클라이언트를 쓰고 서버 컴포넌트에서만 호출한다. (service role 키는 클라이언트
//   번들에 없으므로 브라우저에서 부르면 requireConfig 단계에서 throw 한다 —
//   조용히 틀리지는 않는다.)
//
// 정렬은 `is_pinned` desc → `pin_order` asc → `cohort` asc 다.
//   P-05 의 FN-P05-02(비고정 빌더 일별 시드 셔플)는 **기본값이 아니다.**
//   P-01 섹션 5 와 P-05 가 같은 쿼리를 쓰는데 셔플은 P-05 규칙이라, 기본으로 켜면
//   랜딩 섹션 순서까지 매일 흔들린다. `shuffleSeed` 를 넘긴 호출부에서만 적용한다.
//
//   셔플을 화면이 아니라 여기서 하는 이유는 `FN-P05-03`(고정 빌더는 셔플 대상에서
//   제외) 때문이다. 고정 여부는 `builder.is_pinned` 인데 C-02 카드가 쓰지 않는 값이라
//   `BuilderCardData` 에 없다. 화면에 넘기려고 카드 타입에 아무도 렌더하지 않는
//   필드를 더하느니, 값을 쥔 여기서 가른다. 날짜 판단(어느 시간대의 「오늘」인가)은
//   화면이 하고 시드 문자열만 받는다.
//
// PostgREST 중첩 select 를 쓰지 않고 평면 쿼리로 나눈 이유는
// packages/supabase/src/types.ts 주석 참조 (Relationships 미정의 → 중첩 결과 타입이 무너진다).

import { createAdminSupabase, isSupabaseConfigured } from '@orca/supabase';

import type { BuilderCardData } from '@/components/cards/builder-card';
import { seededShuffle } from '@/lib/daily-shuffle';

/** 빈 문자열·공백만 있는 값은 미등록으로 본다 (thumbnail_url 은 NOT NULL 이라 '' 가 들어올 수 있다). */
function isBlank(value: string | null | undefined): boolean {
  return !value || value.trim() === '';
}

export type BuilderCardOptions = {
  /**
   * 넘기면 **비고정 빌더만** 이 시드로 셔플한다 (P-05 · FN-P05-02 · FN-P05-03).
   * 같은 시드면 항상 같은 순서다. 넘기지 않으면 아래 결정적 순서 그대로다.
   */
  shuffleSeed?: string;
};

/**
 * 공개 빌더를 C-02 카드용 형태로 읽는다.
 *
 * - `builder.is_public = true`
 * - 담당 공개 프로젝트가 0건인 빌더는 제외 (POL-02)
 * - `is_pinned` desc · `pin_order` asc · `cohort` asc
 * - `shuffleSeed` 를 넘기면 고정분을 앞에 둔 채 나머지만 섞는다 (POL-07)
 */
export async function getBuilderCards(
  options: BuilderCardOptions = {},
): Promise<BuilderCardData[]> {
  // 로컬 `pnpm build` 는 루트 .env 를 읽지 않는다 (build 스크립트가 with-env.sh 를 거치지 않는다).
  // 그 상태에서 throw 하면 프리렌더가 통째로 깨지므로 빈 목록으로 넘긴다 —
  // 섹션은 POL-02 에 따라 스스로 숨는다. Vercel 은 환경변수가 주입되므로 실제 값으로 렌더된다.
  // 설정은 있는데 권한·질의가 잘못된 경우는 아래에서 그대로 throw 한다. 조용히 넘기지 않는다.
  if (!isSupabaseConfigured()) {
    console.warn('[builder-cards] Supabase 미설정 — 빌더 목록을 비운 채로 렌더합니다.');
    return [];
  }

  const supabase = createAdminSupabase();

  const [builderResult, projectResult] = await Promise.all([
    supabase
      .from('builder')
      .select('id, slug, display_name, image_url, image_alt, cohort, is_pinned, pin_order')
      .eq('is_public', true)
      // 고정 빌더가 먼저, 그 안에서 지정 순서대로 (FN-P05-03).
      // pin_order 는 is_pinned = false 일 때 NULL 이라 nullsFirst 를 꺼 둔다.
      .order('is_pinned', { ascending: false })
      .order('pin_order', { ascending: true, nullsFirst: false })
      .order('cohort', { ascending: true })
      // 위 세 값이 모두 같아도 순서가 요청마다 흔들리지 않게 고정한다
      .order('created_at', { ascending: true }),
    supabase.from('project').select('id, thumbnail_url').eq('is_public', true),
  ]);

  if (builderResult.error) {
    throw new Error(`빌더 목록을 읽지 못했습니다: ${builderResult.error.message}`);
  }
  if (projectResult.error) {
    throw new Error(`공개 프로젝트를 읽지 못했습니다: ${projectResult.error.message}`);
  }

  const builders = builderResult.data ?? [];
  if (builders.length === 0) return [];

  // POL-02 상 썸네일 미등록 프로젝트는 존재할 수 없지만(등록 불가 처리),
  // C-01 쿼리가 그런 행을 카드에서 떨어뜨린다. 여기서도 같은 기준으로 세지 않으면
  // P-06 의 "N건"과 실제로 그려지는 카드 수가 어긋난다. 집계 기준을 C-01 에 맞춘다.
  const publicProjectIds = (projectResult.data ?? [])
    .filter((row) => !isBlank(row.thumbnail_url))
    .map((row) => row.id);

  // 공개 프로젝트가 하나도 없으면 전원 0건이다 → POL-02 로 전원 제외
  if (publicProjectIds.length === 0) return [];

  // 공동 담당도 1건으로 센다 (화면설계 §4.2 · G-3d). is_owner 를 보지 않는 이유다.
  // project_builder 의 (project_id, builder_id) 유니크 제약이 중복 계수를 막는다.
  const { data: links, error: linkError } = await supabase
    .from('project_builder')
    .select('project_id, builder_id')
    .in('project_id', publicProjectIds)
    .in(
      'builder_id',
      builders.map((builder) => builder.id),
    );

  if (linkError) {
    throw new Error(`담당 관계를 읽지 못했습니다: ${linkError.message}`);
  }

  const countByBuilderId = new Map<string, number>();
  for (const link of links ?? []) {
    countByBuilderId.set(link.builder_id, (countByBuilderId.get(link.builder_id) ?? 0) + 1);
  }

  // filter 는 순서를 보존하므로 위 order 절의 정렬이 그대로 남는다.
  // is_pinned 는 카드가 쓰지 않아 BuilderCardData 에 넣지 않고 여기서만 들고 있는다
  const visible = builders.flatMap((builder) => {
    const projectCount = countByBuilderId.get(builder.id) ?? 0;
    // POL-02 — 0건 빌더는 노출하지 않는다. 결과물 검증이라는 소구에 기여하지 못한다
    if (projectCount === 0) return [];

    return [
      {
        isPinned: builder.is_pinned,
        card: {
          slug: builder.slug,
          displayName: builder.display_name,
          imageUrl: isBlank(builder.image_url) ? null : builder.image_url,
          imageAlt: builder.image_alt,
          cohort: builder.cohort,
          projectCount,
        },
      },
    ];
  });

  if (options.shuffleSeed === undefined) return visible.map((row) => row.card);

  // FN-P05-03 — 고정분은 지정 순서(pin_order) 그대로 상단. 셔플 대상이 아니다.
  // FN-P05-02 — 나머지만 시드로 섞는다. 같은 시드면 같은 순서다
  const pinned = visible.filter((row) => row.isPinned).map((row) => row.card);
  const rest = visible.filter((row) => !row.isPinned).map((row) => row.card);

  return [...pinned, ...seededShuffle(rest, options.shuffleSeed)];
}
