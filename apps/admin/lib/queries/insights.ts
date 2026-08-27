// A-07 조회 계층 — 화면과 Supabase 사이의 이음매.
//
// 근거 — FN-A07-01 · REQ-N-011 · 마이그레이션 0002 §4(RLS)
//
// 화면은 소품 모양만 알고 어디서 오는지 모른다. 쿼리를 화면에 흩어 두면 같은 목록을
// 두 화면이 다르게 만들기 시작한다.
//
// ⚠ **사용자 세션 클라이언트로 읽는다** (service role 이 아니다).
//   `insight_select_authenticated` 정책이 관리자에게 전체를, 그 외에게 발행분만 준다.
//   service role 로 읽으면 RLS 를 통째로 건너뛰어 마지막 방어선이 사라진다.
//   공개 화면(apps/web)이 service role 을 쓰는 것과 다른 이유다 — 거기는 세션이 없다.

import 'server-only';

import type { InsightCategory, InsightRow, InsightStatus } from '@orca/supabase';

import { createSupabaseServerClient } from '@/lib/supabase-server';

/** 목록 한 줄. 본문은 싣지 않는다 — 목록에 쓰지 않는데 가장 큰 컬럼이다 */
export type InsightListItem = {
  id: string;
  slug: string;
  title: string;
  category: InsightCategory;
  status: InsightStatus;
  builderName: string;
  updatedAt: string;
  publishedAt: string | null;
};

export type BuilderOption = { id: string; displayName: string };

/** 작성 빌더 선택지 (FN-A07-02). 비공개 빌더도 글을 쓸 수 있으므로 거르지 않는다 */
export async function listBuilderOptions(): Promise<BuilderOption[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from('builder')
    .select('id, display_name')
    .order('display_name');

  if (error || !data) return [];
  return data.map((row) => ({ id: row.id, displayName: row.display_name }));
}

export async function listInsights(): Promise<InsightListItem[]> {
  const supabase = await createSupabaseServerClient();

  // 빌더 이름은 한 번에 받아 메모리에서 붙인다. 행마다 조회하면 그대로 N+1 이고,
  // 관리 목록은 그게 가장 먼저 느려지는 화면이다.
  const [insights, builders] = await Promise.all([
    supabase
      .from('insight')
      .select('id, slug, title, category, status, builder_id, updated_at, published_at')
      .order('updated_at', { ascending: false }),
    listBuilderOptions(),
  ]);

  if (insights.error || !insights.data) return [];
  const builderName = new Map(builders.map((b) => [b.id, b.displayName]));

  return insights.data.map((row) => ({
    id: row.id,
    slug: row.slug,
    title: row.title,
    category: row.category,
    status: row.status,
    builderName: builderName.get(row.builder_id) ?? '—',
    updatedAt: row.updated_at,
    publishedAt: row.published_at,
  }));
}

/** 편집 화면 한 건. 없으면 null — 호출부가 notFound() 로 바꾼다 */
export async function getInsight(id: string): Promise<InsightRow | null> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from('insight').select('*').eq('id', id).maybeSingle();

  if (error || !data) return null;
  return data;
}
