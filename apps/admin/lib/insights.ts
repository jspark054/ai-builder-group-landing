// A-07 인사이트 도메인 — 라벨 · 슬러그 규칙 · 커버 이미지 추출.
//
// 근거 — 기능명세 §5.7(FN-A07-01~10) · §4.11 · IA §4 · 데이터모델 §3.6a
//
// 순수 함수만 둔다. 세션이나 DB 를 건드리지 않으므로 클라이언트 컴포넌트도 import 할 수
// 있다 — 화면이 라벨을 다시 적으면 서버가 저장하는 값과 갈라진다.

import type { InsightCategory, InsightStatus } from '@orca/supabase';

/**
 * 카테고리 라벨. 기능명세 §4.11 카피표(770행)가 원본이다.
 * 확정 소구점 3개와 1:1 대응한다 — 지어내거나 바꾸지 않는다.
 */
export const CATEGORY_LABEL: Record<InsightCategory, string> = {
  before: '맡기기 전에',
  process: '만드는 과정',
  people: '만든 사람들',
};

export const CATEGORY_ORDER: InsightCategory[] = ['before', 'process', 'people'];

/** 발행 상태 라벨. 화면설계 §6.5a 마이크로카피 그대로다 */
export const STATUS_LABEL: Record<InsightStatus, string> = {
  draft: '임시저장',
  review: '검토 중',
  published: '발행됨',
};

export const STATUS_ORDER: InsightStatus[] = ['draft', 'review', 'published'];

/**
 * `/insights/{category}` 가 점유한 예약어 (IA §4).
 *
 * 🔴 검증을 여기 한 곳에만 두지 않는다. DB CHECK(`insight_slug_not_reserved`)가 같은 것을
 *    한 번 더 막는다 — 앱에 구멍이 나도 카테고리 목록이 글에 가려지지 않게.
 */
export const RESERVED_SLUGS: readonly string[] = ['before', 'process', 'people'];

export function isReservedSlug(slug: string): boolean {
  return RESERVED_SLUGS.includes(slug);
}

/**
 * 제목 → 슬러그 (FN-A07-03).
 *
 * **한글을 로마자로 바꾸지 않는다** (REQ-N-013 · IA §6.1). 키워드가 주소에 남는 것이
 * 목적이라 음차하면 의미가 사라진다. DB 에도 문자 패턴 제약을 두지 않았다.
 *
 * ⚠ 발행 후에는 슬러그를 바꾸지 않는다. 편집 화면이 잠근다.
 */
export function toSlug(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, '') // 문장부호 제거
    .replace(/\s+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

/**
 * 본문 첫 이미지 → 커버 (FN-A07-07).
 *
 * 본문은 마크다운이라 `![alt](url)` 을 찾는다. 에디터가 넣는 형식이 그것이다.
 * 없으면 null 이고, 화면은 커버 자리를 비운다 (POL-02 — 빈 요소를 그리지 않는다).
 *
 * 파생 값을 저장하는 것은 데이터모델 §6 의 명시적 예외다. 목록마다 본문을 파싱하면
 * 비싸고, OG 태그는 SSR 시점에 확정돼야 한다.
 */
export function coverImageFromBody(body: string): string | null {
  const match = /!\[[^\]]*\]\(([^)\s]+)/.exec(body);
  return match?.[1] ?? null;
}

/** 목록 표기용. 로케일 포맷터를 쓰지 않는다 — 서버·브라우저 결과가 갈리면 하이드레이션이 깨진다 */
export function ymd(iso: string | null): string {
  return iso ? iso.slice(0, 10).replace(/-/g, '.') : '—';
}
