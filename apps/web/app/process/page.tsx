// P-09 일하는 방식 `/process`
//
// 근거 — 화면설계 §5.7 · 기능명세 §4.7 · 요구사항 REQ-F-040~043 · 결정시트 I-7
//   FN-P09-01  메시지를 도구명보다 앞에 둔다 → H1 에 제품명이 없다
//   FN-P09-02  8단계를 전부 표시한다
//   FN-P09-03  각 단계 사이에 검수보고서·컨펌 관문을 표시한다 → 여덟 곳 전부
//   FN-P09-04  역할 분리 조직을 표시한다 → 블록 3 왼쪽 열(영업팀 → 팀장 → 실무)
//   FN-P09-05  관리 도구를 실화면 또는 다이어그램으로 표시한다 → 블록 3 오른쪽 열
//
// **8/22 개편 — 목업 `abg_complete_final_v2_home_and_detail.html` (사용자 제공).**
//   본문이 세 블록에서 **두 블록**이 됐다. 종전 블록 3(역할 조직) · 블록 4(관리 도구)가
//   한 제목 아래 좌 「조율」 · 우 「기록」 두 열로 합쳐졌다. 두 인수 기준은 열이 하나씩
//   맡으므로 그대로 충족한다. 블록 2 의 8단계는 카드 나열에서 좌 묶음 · 우 레일 2단이
//   됐다 (ProcessSteps.tsx).
//   목업의 색·치수를 그대로 옮기지 않았다 — `#F5F4F1`(웜 그레이) 같은 값이 토큰에 없다.
//   가져온 것은 배치이고 색·크기는 토큰으로 다시 짰다 (하드 룰 1).
//
// 이 파일은 서버 컴포넌트다. 클라이언트가 되는 곳은 블록 2 목록(ProcessSteps) 하나뿐이고
// 그마저 SSR 마크업을 그대로 내보내므로 공개 화면 조건(REQ-N-001)은 유지된다.
//
// 판단 네 가지를 여기에 남긴다.
//
// 1) 실화면 캡처 대신 다이어그램
//    화면설계 §5.7 의 촬영 3조건 중 「실데이터 축적」이 미충족이다. 값이 0인 화면을
//    노출하면 POL-01 불합격이다 (PRD FR-4.3 · POL-09). 블록 3 오른쪽 열은 외부 에셋을
//    기다리지 않도록 이미지가 아니라 div/CSS 로 조립했다.
//
// 2) 움직이는 것은 블록 2 하나뿐이다
//    현재 읽는 단계를 점과 글자색으로 표시한다. 등장 애니메이션이 아니라 위치 표시다.
//    나머지 두 블록(헤더 · 조직)은 의도적으로 비운다 — 전 섹션에 깔면
//    POL-11①-2(절제) 반려 사유다. 특히 P-01 섹션 7 의 연결선 드로잉을 여기로
//    옮겨오지 않는다. 읽으러 온 화면이다.
//
// 3) 문의 CTA 없음
//    C-03 은 P-01 · P-04 · P-06 3종 전용이다. 네 번째를 신설하면 REQ-F-007(P0) 위반이다
//    (기능명세 §4.7 하단 구현 제약이 이 화면을 명시해 경고한다).
//    헤더 GNB 의 문의 버튼(C-04)은 별개이므로 그대로 둔다.
//
// 4) 본문 폭은 두 블록이 같은 값을 쓴다
//    Section 이 h2 에 --layout-content 를 걸고 있으므로 children 도 같은 폭으로 맞춘다.
//    가운데 정렬(mx-auto)을 쓰지 않는 이유는 제목이 왼쪽 정렬이라 축이 어긋나기 때문이다.
//    블록 3 본문을 Section 의 description 슬롯에 넣지 않은 것도 같은 이유다 —
//    그 슬롯은 --layout-copy(42rem)로 고정돼 있어 혼자만 폭이 좁아진다.
//    Section 은 P-01 과 공유하는 부품이므로 이 화면 사정으로 고치지 않는다.
//
// 화면에 남는 숫자는 단계 번호 01~08 뿐이다. 확정된 프로세스 구조이지 실적 수치가
// 아니므로 POL-01 대상이 아니다. 블록 3 조직 노드에는 번호를 붙이지 않는다 —
// 붙이면 8단계와 같은 화면에서 「3단계 프로세스」로 읽힌다.
// 묶음 표기 「STEP 01–02」 는 단계 번호를 그대로 옮긴 것이다. 묶음에 별도 번호를
// 붙이지 않는다 — 붙이는 순간 8단계가 아니라 4단계 프로세스로 읽힌다.

import type { Metadata } from 'next';

import { Section } from '@/components/landing/Section';
import { PageHeader } from '@/components/layout/PageHeader';

import { ProcessSteps } from './ProcessSteps';
import { headerCopy, organizationCopy, processCopy, toolCopy } from './p09-copy';

export const metadata: Metadata = {
  title: '일하는 방식',
  // 화면 카피가 아니라 전용 문장을 쓴다. 헤더 세 줄 어느 것도 POL-06 의 80자에
  // 닿지 않으므로 metaDescription 은 그 세 줄을 재구성한 값이다
  description: headerCopy.metaDescription,
  alternates: { canonical: '/process' },
};

/** 두 블록이 공유하는 본문 폭. Section 의 h2 와 같은 값이라 왼쪽 축이 맞는다. */
const BLOCK_WIDTH = 'max-w-[var(--layout-content)]';

/**
 * 본문 블록 사이 이음매를 좁힌다.
 * --section-block 이 위·아래로 두 겹 겹치면 블록 끝 문장이 허공에 남는다.
 * Section 은 P-01 과 공유하는 부품이라 고치지 않고(하드 룰), 블록 안에서
 * 아래쪽 한 겹만 당겨 상쇄한다.
 *
 * 블록 2 에만 건다. 마지막 블록(조직)은 푸터와의 간격이라 그대로 둔다.
 */
const TRAILING_PULL = '-mb-[var(--section-block)]';

/** 열 이름. 두 열이 같은 값을 쓴다 */
const COLUMN_LABEL =
  'font-semibold text-muted text-[length:var(--font-size-xs)] tracking-[var(--tracking-label)]';

export default function ProcessPage() {
  const { nodes } = organizationCopy;

  return (
    <>
      {/* 블록 1 — 페이지 헤더. 디자인규칙 「다른 공개 화면」: 헤더만 어둡고 본문은 밝다.
          마크업은 components/layout/PageHeader.tsx 가 갖는다 (P-03 착수 시 추출) */}
      <PageHeader
        headingLines={headerCopy.headingLines}
        tagline={headerCopy.tagline}
        subtitle={headerCopy.subtitle}
      />

      {/* 본문 두 블록은 한 덩어리로 밝게 간다. 배경을 블록마다 뒤집지 않는다 —
          디자인규칙 「다른 공개 화면」이 본문 전체를 bg-surface-raised 로 못 박는다.
          목업은 블록 3 을 회색으로 깔았지만 그 색이 토큰에 없기도 하다 */}
      <div className="bg-surface-raised text-ink">
        {/* 블록 2 — 8단계 프로세스 (FN-P09-02 · FN-P09-03)
            스크롤 위치 표시 때문에 이 목록만 클라이언트다 */}
        <Section id="process-steps" heading={processCopy.heading}>
          <ProcessSteps
            className={`${BLOCK_WIDTH} ${TRAILING_PULL}`}
            lead={processCopy.lead}
            groups={processCopy.groups}
            gate={processCopy.gate}
          />
        </Section>

        {/* 블록 3 — 역할 분리 조직 + 관리 도구 기록 (FN-P09-04 · FN-P09-05)
            8/22 에 두 블록이 하나가 됐다. 제목 하나 아래 좌 「조율」 · 우 「기록」이다.
            인수 기준이 "구조 확인"이라 문장만으로는 부족하므로 노드와 순서를 같이 그린다 */}
        <Section id="organization" heading={organizationCopy.heading}>
          <div className={BLOCK_WIDTH}>
            <p className="max-w-[var(--layout-copy)] text-muted text-[length:var(--font-size-md)] leading-[var(--leading-relaxed)]">
              {organizationCopy.body}
            </p>

            <div className="mt-[var(--space-8)] grid gap-[var(--space-8)] md:grid-cols-[minmax(0,15rem)_minmax(0,1fr)] md:gap-[var(--space-12)]">
              {/* 왼쪽 — 조율 (FN-P09-04 · REQ-F-042 영업팀 → 팀장 → 기획·디자인·개발)
                  세 칸의 무게를 같게 두면 제목이 말하는 「한 창구」가 어디인지 보이지 않는다.
                  가운데 노드(팀장)만 브랜드 색으로 채운다 — 순서는 그대로다.
                  화살표를 두지 않는다. 세로로 쌓인 순서가 곧 흐름이고, 바로 위 8단계의
                  세로 레일과 방향이 부딪히지 않는다 */}
              <div>
                <p className={COLUMN_LABEL}>{organizationCopy.columnLabel}</p>

                {/* 칸 사이는 1px 틈이다. 바탕이 비쳐 실선처럼 보인다 —
                    칸마다 테두리를 두르면 세 상자가 따로 놀아 흐름이 끊긴다 */}
                <ol className="mt-[var(--space-4)] grid gap-px border-border border-y bg-border">
                  {nodes.map((node, index) => {
                    // 흐름의 가운데가 곧 창구다. 노드가 셋이라는 것은 REQ-F-042 확정값이다
                    const isHub = index === Math.floor(nodes.length / 2);

                    return (
                      <li
                        key={node.name}
                        className={`px-[var(--space-4)] py-[var(--space-4)] ${
                          isHub ? 'bg-brand' : 'bg-surface-raised'
                        }`}
                      >
                        {/* 브랜드 색 위의 보조 글자는 surface-soft 다. subtle(#b5afa2)은
                            brand(#1b64da) 위에서 대비가 서지 않는다 */}
                        <p
                          className={`text-[length:var(--font-size-xs)] ${
                            isHub ? 'text-surface-soft' : 'text-subtle'
                          }`}
                        >
                          {node.role}
                        </p>
                        <p
                          className={`mt-[var(--space-1)] font-semibold text-[length:var(--font-size-base)] ${
                            isHub ? 'text-ink-inverse' : 'text-ink'
                          }`}
                        >
                          {node.name}
                        </p>
                      </li>
                    );
                  })}
                </ol>
              </div>

              {/* 오른쪽 — 기록 (FN-P09-05)
                  이미지 파일이 아니라 div/CSS 로 조립한다. 외부 에셋 수급을 기다리지 않는다.
                  제품명·수치를 넣지 않는다 (기획안 §2-1 · POL-01).
                  도구 이름을 목록 머리에 두면 「이 안에 남는다」는 관계가 선 없이 성립한다 */}
              <div>
                <p className={COLUMN_LABEL}>{toolCopy.columnLabel}</p>

                <p className="mt-[var(--space-4)] border-ink border-t pt-[var(--space-3)] font-semibold text-ink text-[length:var(--font-size-base)]">
                  {toolCopy.root}
                </p>

                {/* 체크 표시는 블록 2 관문 마커와 같은 도형이다 — 두 블록이 같은
                    「확인하고 남긴다」를 말한다. 여기서는 문구가 뜻을 다 갖고 있어 장식이다 */}
                <ul className="border-border border-b">
                  {toolCopy.items.map((item) => (
                    <li
                      key={item}
                      className="flex items-center gap-[var(--space-3)] border-border border-t py-[var(--space-3)]"
                    >
                      <svg
                        aria-hidden="true"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="size-4 shrink-0 text-brand"
                      >
                        <path d="m5 13 4 4L19 7" />
                      </svg>
                      <span className="text-ink text-[length:var(--font-size-sm)]">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </Section>
      </div>
    </>
  );
}
