// P-05 빌더 목록 `/builders`
//
// 근거 — 화면설계 §5.4 · 기능명세 §4.4 · 화면목록(IA) §3.1 · POL-02 · POL-07
//   FN-P05-01  공개 상태 빌더를 C-02 카드 그리드로 표시한다
//   FN-P05-02  일별 시드 랜덤으로 정렬한다
//              (인수 기준: 동일 날짜 내 순서 동일 · 날짜 변경 시 순서 변경)
//   FN-P05-03  고정 지정 빌더는 셔플에서 제외하고 상단에 배치한다
//   FN-P05-04  **기수별 그룹 소제목을 두지 않는다.** 단일 목록으로 구성한다
//   FN-P05-05  카드에서 P-06 으로 이동한다 (FN-C02-06 — 카드가 갖는다)
//   POL-02     담당 프로젝트 0건 빌더는 목록에 노출하지 않는다 (쿼리가 거른다)
//
// 서버 컴포넌트다. getBuilderCards() 는 service role 로 읽으므로 클라이언트에서
// 부르면 안 된다 (lib/queries/builder-cards.ts 머리말 참조). 이 화면에 클라이언트
// 경계가 없어 공개 화면 조건(REQ-N-001 서버 렌더 HTML)이 그대로 성립한다.
//
// 판단 네 가지를 여기에 남긴다.
//
// 1) 셔플은 쿼리에 옵트인으로 넘긴다. 여기서 배열을 섞지 않는다
//    `getBuilderCards()` 는 P-01 섹션 5 와 공용이라 셔플이 기본이면 랜딩 순서까지
//    매일 흔들린다. 그래서 `shuffleSeed` 를 넘긴 호출부에서만 켜진다.
//    섞는 일을 쿼리에 둔 것은 `FN-P05-03`(고정 빌더는 셔플 대상 제외) 때문이다 —
//    고정 여부(`is_pinned`)는 C-02 카드가 쓰지 않아 `BuilderCardData` 에 없고,
//    아무도 렌더하지 않는 필드를 카드 타입에 더하느니 값을 쥔 쪽에서 가르는 게 낫다.
//    **어느 시간대의 「오늘」인가는 화면이 정한다** — 시드 문자열만 넘긴다.
//
// 2) `revalidate` 는 1시간이지만 순서는 하루 단위로 고정된다
//    순서를 붙드는 것은 재생성 주기가 아니라 **시드**다. 시드가 Asia/Seoul 날짜라
//    같은 날 몇 번을 재생성해도 순서가 같고(POL-07 「재방문 탐색」·「검수 재현성」),
//    자정이 지나면 다음 재생성에서 바뀐다. 다른 화면과 주기를 맞춰 1시간으로 둔다.
//
// 3) 인트로·빈 상태 문구는 사용자 지시 문안이다 (8/20)
//    §5.4 · §4.4 에 P-05 문안이 없고 기획안·PRD 에도 없다. 지어내지 않고 받은 값을
//    그대로 쓴다 (app/builders/p05-copy.ts 머리말 참조). 문장을 다듬지 않는다.
//
// 4) 페이지네이션을 두지 않는다
//    §5.4 가 「인원 50명 초과 시 페이지네이션(**2차**)」로 미룬다. 현재 6명이다.
//    도입 시 「시드는 전체 페이지에 동일 적용」 조건이 붙는데, 시드가 이미 날짜
//    하나로만 정해지므로 그때도 같은 `shuffleSeed` 를 넘기고 잘라 쓰면 된다.

import type { Metadata } from 'next';

import { BuilderCard } from '@/components/cards/builder-card';
import { PageHeader } from '@/components/layout/PageHeader';
import { PlaceholderNotice } from '@/components/PlaceholderNotice';
import { placeholderNoticeCopy } from '@/content/component-copy';
import { seoulDateKey } from '@/lib/daily-shuffle';
import { getBuilderCards } from '@/lib/queries/builder-cards';
import { absoluteUrl } from '@/lib/site';

import { p05Copy } from './p05-copy';

/**
 * IA §3.1 — 렌더링 `SSG+ISR`.
 *
 * getBuilderCards() 는 supabase-js 로 읽어 Next 의 fetch 캐시를 타지 않는다.
 * P-01 · P-03 · P-04 · P-06 과 같은 주기로 맞춘다.
 */
export const revalidate = 3600;

export const metadata: Metadata = {
  // POL-06 — 화면명이 맨 앞에 온다. absolute 로 넘기는 이유는 루트 layout 의
  // `%s | {siteName}` 템플릿을 타면 사이트명이 두 번 붙기 때문이다 (P-04 · P-06 과 동일)
  title: { absolute: `${p05Copy.header.headingLines.join(' ')} | ${p05Copy.metaTitleSuffix}` },
  // 화면 카피가 아니라 전용 문장을 쓴다 (8/20). 헤더가 3단이 되면서 세 줄 어느 것도
  // POL-06 의 80자에 닿지 않는다. metaDescription 은 그 세 줄을 재구성한 값이다.
  // (종전에는 루트 layout 의 사이트 설명을 상속했다 — 이 화면이 자기 헤더 문안을
  //  갖게 된 지금은 화면과 검색 결과가 다른 말을 하게 되어 전용 문장으로 바꿨다)
  description: p05Copy.metaDescription,
  alternates: { canonical: absoluteUrl('/builders') },
};

export default async function BuilderListPage() {
  // FN-P05-01 · POL-02 — 공개 전수에서 담당 0건을 뺀 목록.
  // FN-P05-02 · FN-P05-03 — 고정분은 pin_order 순으로 상단에 남고 나머지만 섞인다.
  // 시드가 Asia/Seoul 날짜라 하루 안에서는 재생성해도 순서가 같다.
  // 현재 6명 전원 is_pinned = false 라 전원이 셔플 대상이다.
  const builders = await getBuilderCards({ shuffleSeed: seoulDateKey() });

  return (
    <>
      <PageHeader
        headingLines={p05Copy.header.headingLines}
        tagline={p05Copy.header.tagline}
        subtitle={p05Copy.header.subtitle}
      />

      {/* 디자인규칙 「다른 공개 화면」 — 본문은 한 덩어리로 밝게 간다 */}
      <div className="bg-surface-raised text-ink">
        <div className="mx-auto w-full max-w-[var(--layout-container)] px-[var(--layout-gutter)] py-[var(--section-block)]">
          {builders.length > 0 && (
            <>
              {/* 실데이터 반영 시 이 블록을 지운다 (components/PlaceholderNotice.tsx 참조).
                  0건일 때는 렌더하지 않는다 — "표시된 빌더는" 이 가리킬 대상이 없다.
                  간격은 목록 쪽 className 을 건드리지 않도록 이 래퍼가 갖는다 */}
              <div className="mb-[var(--space-6)]">
                <PlaceholderNotice text={placeholderNoticeCopy.builder} />
              </div>

              {/* FN-P05-04 — 단일 목록이다. 기수별 그룹 소제목을 두지 않는다.
                  기수는 카드 배지로만 나온다 (POL-07 하단 · C-02 의 p05 variant).
                  variant 를 넘기지 않아 기본값 `p05` 가 쓰인다 — 이 화면이
                  FN-C02-04(기수 배지) · FN-C02-05(담당 건수)가 처음 렌더되는 곳이다 */}
              <ul className="grid grid-cols-2 gap-[var(--space-6)] sm:grid-cols-3 lg:grid-cols-4">
                {builders.map((builder) => (
                  <li key={builder.slug} className="flex">
                    <BuilderCard data={builder} />
                  </li>
                ))}
              </ul>
            </>
          )}

          {/* POL-02 — 0건이어도 주소가 색인 대상이라 페이지를 숨기지 않는다.
              헤더를 남기고 목록 자리만 문구로 대체한다. 링크·버튼을 곁들이지 않는다 —
              이 화면에 경쟁 CTA 를 만들지 않는다 (REQ-F-007). P-03 과 같은 처리다.
              현재 6명 전원 담당 1건 이상이라 도달하지 않는 분기다. */}
          {builders.length === 0 && (
            <p className="text-muted text-[length:var(--font-size-md)] leading-[var(--leading-relaxed)]">
              {p05Copy.emptyState}
            </p>
          )}
        </div>
      </div>
    </>
  );
}
