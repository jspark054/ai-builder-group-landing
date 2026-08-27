// A-05 조회 계층 — **서버 전용**
//
// 근거 — FN-A05-02(엔티티별 건수) · 마이그레이션 0002 §4(RLS)
//
// ⚠ 건수를 저장하지 않는다 (하드룰 4 — 파생 값 금지). 요청마다 세 번 센다.
//   관리 화면이고 행이 수십 단위라 집계 컬럼을 둘 이유가 없다.
//
// ⚠ 사용자 세션 클라이언트로 읽는다 (service role 이 아니다). 관리자 세션이라
//   RLS 가 비공개까지 내준다 — 비공개를 못 세면 「전체 n건」이 관리 화면에서
//   거짓이 된다. 다른 관리 조회 계층과 같은 이유다.
//
// 목록을 그대로 재사용하지 않는 것도 의도다. `listBuilders()` 는 조인과 전체 컬럼을
// 끌고 오는데 여기 필요한 것은 플래그 한 칸이다.

import 'server-only';

import { createSupabaseServerClient } from '@/lib/supabase-server';

/** 공개 여부만 가르는 엔티티 (빌더 · 프로젝트) */
export type VisibilityCount = {
  total: number;
  /** `is_public = true` */
  publicCount: number;
};

export type InsightCount = {
  total: number;
  /** 공개 조건을 실제로 만족하는 글 — `status = published` **이고** `published_at` 이 있다 (하드룰 6) */
  published: number;
  draft: number;
  /** 1인 운영 전제로 진입 경로가 없는 상태다. 0 이면 화면에 내지 않는다 */
  review: number;
  /**
   * `status = published` 인데 `published_at` 이 비어 공개 화면에서 404 인 글.
   * 스키마에 이것을 막는 CHECK 가 없어(0002 §insight) 손으로 고치면 생길 수 있다.
   */
  missingPublishedAt: number;
};

/** 각 항목은 조회에 실패하면 null 이다. 0 으로 떨어뜨리면 「없음」과 구분되지 않는다 */
export type DashboardCounts = {
  builder: VisibilityCount | null;
  project: VisibilityCount | null;
  insight: InsightCount | null;
};

export async function getDashboardCounts(): Promise<DashboardCounts> {
  const supabase = await createSupabaseServerClient();

  // 서로를 기다릴 이유가 없다
  const [builders, projects, insights] = await Promise.all([
    supabase.from('builder').select('is_public'),
    supabase.from('project').select('is_public'),
    supabase.from('insight').select('status, published_at'),
  ]);

  return {
    builder: countVisibility(builders.data),
    project: countVisibility(projects.data),
    insight: countInsights(insights.data),
  };
}

function countVisibility(rows: { is_public: boolean }[] | null): VisibilityCount | null {
  if (!rows) return null;
  return {
    total: rows.length,
    publicCount: rows.filter((row) => row.is_public).length,
  };
}

function countInsights(
  rows: { status: string; published_at: string | null }[] | null,
): InsightCount | null {
  if (!rows) return null;

  const live = rows.filter((row) => row.status === 'published' && row.published_at !== null);

  return {
    total: rows.length,
    published: live.length,
    draft: rows.filter((row) => row.status === 'draft').length,
    review: rows.filter((row) => row.status === 'review').length,
    missingPublishedAt: rows.filter(
      (row) => row.status === 'published' && row.published_at === null,
    ).length,
  };
}
