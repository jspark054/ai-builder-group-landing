// P-06 빌더 상세 데이터 — **서버 전용**
//
// 근거 — 화면설계 §5.5 · 기능명세 §4.5 · 데이터모델 §3.1 · POL-02 · POL-05
//   FN-P06-01  프로필(표기명 · 이미지 · 기수 · 수료 과정 · 이력)
//   FN-P06-02  담당 프로젝트를 추가 클릭 없이 C-01 요약 카드로 전개한다
//   FN-P06-05  수료 과정명은 **텍스트로만** (P-08 폐지 · v3.3) → 여기서는 title 만 넘긴다
//   FN-P06-07  이력 최대 5개 (POL-05)
//   화면설계 §5.5  공동 프로젝트가 담당자 전원 페이지에 각각 노출된다 (G-3d)
//   화면설계 §5.5  비공개 빌더 접근은 404
//
// ⚠ 클라이언트에서 호출하지 말 것.
//   `project_builder` 는 익명 SELECT 가 RLS 로 차단돼 있고 anon GRANT 도 없다.
//   브라우저에서 부르면 담당 프로젝트가 **에러 없이 0건**이 되어 화면이 통째로
//   404 가 된다. service role 클라이언트를 쓰고 서버 컴포넌트에서만 호출한다.
//
// 카드 조립을 여기서 다시 하지 않는다. `getProjectCards({ builderId })` 가 P-01 · P-03 과
// 같은 규칙(POL-02 썸네일 필터 · 분류 2개 상한 · sort_order)으로 만들어 준다.
// 화면마다 카드 쿼리를 새로 만들면 규칙이 갈라진다.

import { createAdminSupabase, isSupabaseConfigured } from '@orca/supabase';

import type { ProjectCardData } from '@/components/cards/project-card';
import { getBuilderCards } from '@/lib/queries/builder-cards';
import { getProjectCards } from '@/lib/queries/project-cards';

/**
 * 이력 한 줄. 구조는 데이터모델 §3.1 이 정한다 —
 * `[{ "title": "...", "org": "...", "period": "2024-2025" }]`
 */
export type CareerEntry = {
  title: string;
  org: string;
  period: string;
};

export type BuilderDetailData = {
  slug: string;
  displayName: string;
  /** 미등록이면 null → 이니셜 폴백 (POL-02) */
  imageUrl: string | null;
  imageAlt: string | null;
  cohort: number;
  /** 한 줄 소개. 없으면 null — 화면이 블록 자체를 렌더하지 않는다 (POL-02) */
  bio: string | null;
  /** FN-P06-07 — 최대 5개로 이미 잘라서 넘긴다. 빈 배열이면 화면이 블록을 뺀다 */
  career: CareerEntry[];
  /** FN-P06-05 — 수료 과정명. 미연결이면 null. **링크로 만들지 않는다** (P-08 폐지) */
  courseTitle: string | null;
  /** FN-P06-02 — 담당 공개 프로젝트. C-01 카드 형태 그대로 */
  projects: ProjectCardData[];
  /**
   * A-02 · A-06 에서 입력한 SEO 메타 (FN-A02-07 · POL-06).
   *
   * ⚠ `metaTitle` 은 **접미사를 포함한 완성된 제목**이다. 화면이 뒤에 무엇을 붙이지
   *   않는다 (08-27 사용자 지시 · P-04 와 같은 규칙).
   */
  metaTitle: string | null;
  metaDescription: string | null;
};

/** POL-05 · FN-P06-07 — 상세 표기 상한. 저장 제한이 아니라 화면 규칙이다 */
const CAREER_LIMIT = 5;

/**
 * `career` jsonb 를 화면이 쓸 형태로 좁힌다.
 *
 * 컬럼 타입이 `unknown[]` 이라 그대로 렌더하면 `any` 를 들이는 것과 같다.
 * 세 필드가 모두 문자열인 항목만 통과시키고 나머지는 조용히 버린다 — 관리 화면
 * (A-02)이 아직 없어 형태가 보장되지 않는다. 여기서 throw 하면 빌더 한 명의
 * 이력 오타가 페이지 전체를 500 으로 만든다.
 */
function parseCareer(raw: unknown): CareerEntry[] {
  if (!Array.isArray(raw)) return [];

  return raw.flatMap((item) => {
    if (typeof item !== 'object' || item === null) return [];
    const { title, org, period } = item as Record<string, unknown>;
    if (typeof title !== 'string' || typeof org !== 'string' || typeof period !== 'string') {
      return [];
    }
    return [{ title, org, period }];
  });
}

/**
 * generateStaticParams 용 슬러그 목록.
 *
 * `getBuilderCards()` 를 그대로 쓴다 — 그쪽이 이미 `is_public` 과 담당 프로젝트
 * 0건(POL-02)을 걸러 준다. 여기서 같은 조건을 다시 쓰면 두 곳이 갈라져
 * 목록에는 있는데 상세는 404 인 빌더가 생긴다.
 */
export async function getPublicBuilderSlugs(): Promise<string[]> {
  const builders = await getBuilderCards();
  return builders.map((builder) => builder.slug);
}

/**
 * 슬러그 한 건을 P-06 화면용 형태로 읽는다.
 *
 * 없거나 비공개면 `null` 을 준다 — 호출부가 notFound() 를 부른다 (화면설계 §5.5).
 *
 * `slug` 는 **디코딩된 원문**을 받는다. 라우트 파라미터는 퍼센트 인코딩된 채로
 * 들어오므로 호출부(P-06 의 `decodeSlug`)가 풀어서 넘긴다 — P-04 와 같은 처리다.
 */
export async function getBuilderDetail(slug: string): Promise<BuilderDetailData | null> {
  // 로컬 `pnpm build` 는 루트 .env 를 읽지 않는다 (build 스크립트가 with-env.sh 를 거치지 않는다).
  // 그 상태에서 throw 하면 프리렌더가 통째로 깨지므로 null 로 넘긴다 — 호출부가 404 로 만든다.
  if (!isSupabaseConfigured()) {
    console.warn('[builder-detail] Supabase 미설정 — 상세를 404 로 렌더합니다.');
    return null;
  }

  const supabase = createAdminSupabase();

  const { data: builder, error } = await supabase
    .from('builder')
    // 컬럼 목록은 문자열 리터럴로 둔다. 상수로 빼면 supabase-js 가 결과 타입을
    // 추론하지 못해 Row 가 통째로 GenericStringError 가 된다 (P-04 에서 실측)
    .select(
      'id, slug, display_name, image_url, image_alt, cohort, bio, career, course_id, meta_title, meta_description',
    )
    .eq('slug', slug)
    // 화면설계 §5.5 — 비공개 빌더 접근은 404. 쿼리에서 거르므로 화면이 판단할 것이 없다
    .eq('is_public', true)
    .maybeSingle();

  if (error) throw new Error(`빌더를 읽지 못했습니다: ${error.message}`);
  if (!builder) return null;

  // FN-P06-02 — 담당 공개 프로젝트. 공동 담당 건도 포함된다 (G-3d)
  const projects = await getProjectCards({ builderId: builder.id });

  // FN-P06-05 — 수료 과정명. course 가 비어 있으면 조회 자체를 건너뛴다
  let courseTitle: string | null = null;
  if (builder.course_id) {
    const { data: course, error: courseError } = await supabase
      .from('course')
      .select('title')
      .eq('id', builder.course_id)
      .maybeSingle();

    if (courseError) throw new Error(`수료 과정을 읽지 못했습니다: ${courseError.message}`);
    courseTitle = course?.title ?? null;
  }

  return {
    slug: builder.slug,
    displayName: builder.display_name,
    imageUrl: builder.image_url,
    imageAlt: builder.image_alt,
    cohort: builder.cohort,
    // 빈 문자열은 미등록으로 본다 — 라벨만 남은 빈 블록을 만들지 않는다 (POL-02)
    bio: builder.bio && builder.bio.trim() !== '' ? builder.bio : null,
    career: parseCareer(builder.career).slice(0, CAREER_LIMIT),
    courseTitle,
    projects,
    metaTitle: builder.meta_title,
    metaDescription: builder.meta_description,
  };
}
