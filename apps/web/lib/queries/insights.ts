// P-12 · P-13 인사이트 데이터 — **서버 전용**
//
// 근거 — 기능명세 §4.11 · §4.12 · 데이터모델 §3.6a · 하드룰 6
//   FN-P12-01  발행된 글을 최신순으로
//   FN-P12-05  카드에 제목·카테고리·작성 빌더·대표 이미지
//   FN-P13-04  경로는 `/insights/{slug}` · 한글 슬러그 허용
//   FN-P13-06  같은 카테고리의 다른 글
//
// 🔴 **공개 조건은 두 가지를 모두 만족할 때다** — `status = 'published'` **이고**
//    `published_at` 이 있을 때. 하나만 걸면 발행 시각 없는 글이 샌다.
//    RLS 의 익명 정책(마이그레이션 0002)이 같은 조건을 갖고 있지만, 이 쿼리는
//    service role 로 돌아 RLS 를 지나지 않는다 — **여기서 반드시 다시 건다.**
//
// ⚠ 다른 공개 화면과 같은 이유로 service role 을 쓴다. 공개 화면에는 세션이 없다.

import { createAdminSupabase, isSupabaseConfigured } from '@orca/supabase';
import type { InsightCategory } from '@orca/supabase';

export type InsightCardData = {
  slug: string;
  title: string;
  category: InsightCategory;
  /** 미등록이면 null — 카드가 이미지 자리를 접는다 (POL-02) */
  coverImageUrl: string | null;
  builderName: string;
  publishedAt: string;
};

export type InsightDetailData = InsightCardData & {
  body: string;
  updatedAt: string;
  metaTitle: string | null;
  metaDescription: string | null;
  /**
   * FN-P13-02·03 — 바이라인은 표기명이고 P-06 으로 간다.
   *
   * ⚠ 화면설계 §5.12 도면은 `{빌더명} · {담당 역할}` 인데 `builder` 에 **역할 컬럼이 없다.**
   *   지어내지 않고 이름만 쓴다 (하드룰 4 — 컬럼을 임의로 늘리지 않는다).
   * ⚠ 기능명세는 「실명 바이라인」이라 적었지만 `name_type` 이 `nickname` 일 수 있다.
   *   POL-12 가 표기 수위를 개인 선택으로 두므로 등록값을 그대로 쓴다.
   */
  builderSlug: string;
};

/** 발행 조건. 두 축을 한 곳에 둔다 — 화면마다 다시 적으면 반드시 갈라진다 */
function publishedOnly<T extends { eq: (c: string, v: string) => T; not: (c: string, o: string, v: null) => T }>(
  query: T,
): T {
  return query.eq('status', 'published').not('published_at', 'is', null);
}

type BuilderLite = { id: string; slug: string; display_name: string };

async function builderMap(): Promise<Map<string, BuilderLite>> {
  const supabase = createAdminSupabase();
  const { data } = await supabase.from('builder').select('id, slug, display_name');
  return new Map((data ?? []).map((row) => [row.id, row]));
}

/**
 * 발행된 글 목록. `category` 를 주면 그 카테고리만.
 *
 * Supabase 미설정이면 빈 배열이다 — 화면은 빈 상태 문구를 렌더한다 (FN-P12-04).
 */
export async function getInsightCards(category?: InsightCategory): Promise<InsightCardData[]> {
  if (!isSupabaseConfigured()) return [];

  const supabase = createAdminSupabase();
  let query = supabase
    .from('insight')
    .select('slug, title, category, cover_image_url, builder_id, published_at')
    .order('published_at', { ascending: false });

  query = publishedOnly(query);
  if (category) query = query.eq('category', category);

  const [{ data, error }, builders] = await Promise.all([query, builderMap()]);
  if (error || !data) return [];

  return data.map((row) => ({
    slug: row.slug,
    title: row.title,
    category: row.category,
    coverImageUrl: row.cover_image_url,
    builderName: builders.get(row.builder_id)?.display_name ?? '',
    publishedAt: row.published_at ?? '',
  }));
}

/** 상세 한 건. 공개 조건에 맞지 않으면 null — 호출부가 404 로 바꾼다 */
export async function getInsightDetail(slug: string): Promise<InsightDetailData | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = createAdminSupabase();
  const { data, error } = await publishedOnly(
    supabase
      .from('insight')
      .select(
        'slug, title, body, category, cover_image_url, builder_id, published_at, updated_at, meta_title, meta_description',
      )
      .eq('slug', slug),
  ).maybeSingle();

  if (error || !data) return null;

  const builder = (await builderMap()).get(data.builder_id);
  // 작성 빌더는 NOT NULL 이다. 행이 없으면 데이터가 깨진 것이라 렌더하지 않는다 —
  // 바이라인 없는 글은 REQ-F-095(익명 발행 금지)에 어긋난다
  if (!builder) return null;

  return {
    slug: data.slug,
    title: data.title,
    body: data.body,
    category: data.category,
    coverImageUrl: data.cover_image_url,
    builderName: builder.display_name,
    builderSlug: builder.slug,
    publishedAt: data.published_at ?? '',
    updatedAt: data.updated_at,
    metaTitle: data.meta_title,
    metaDescription: data.meta_description,
  };
}

/**
 * FN-P13-06 — 같은 카테고리의 다른 글. 「고아 페이지 0건」이 인수 기준이다.
 * 자기 자신은 뺀다. 없으면 빈 배열이고 화면이 블록 자체를 접는다 (POL-02).
 */
export async function getRelatedInsights(
  category: InsightCategory,
  excludeSlug: string,
  limit = 2,
): Promise<InsightCardData[]> {
  const cards = await getInsightCards(category);
  return cards.filter((card) => card.slug !== excludeSlug).slice(0, limit);
}

/** 사이트맵과 generateStaticParams 가 쓴다 */
export async function getPublicInsightSlugs(): Promise<string[]> {
  const cards = await getInsightCards();
  return cards.map((card) => card.slug);
}
