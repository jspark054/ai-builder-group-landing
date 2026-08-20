// P-09 일하는 방식 `/process`
//
// 근거 — 화면설계 §5.7 · 기능명세 §4.7 · 요구사항 REQ-F-040~043 · 결정시트 I-7
//   FN-P09-01  메시지를 도구명보다 앞에 둔다 → H1 에 제품명이 없다
//   FN-P09-02  8단계를 전부 표시한다
//   FN-P09-03  각 단계 사이에 검수보고서·컨펌 관문을 표시한다 → 일곱 곳 전부
//   FN-P09-04  역할 분리 조직을 표시한다 → 문장 + 노드 3개(영업팀 → 팀장 → 실무)
//   FN-P09-05  관리 도구를 실화면 또는 다이어그램으로 표시한다 → 다이어그램 택
//
// 이 파일은 서버 컴포넌트다. 클라이언트가 되는 곳은 블록 2 목록(ProcessSteps) 하나뿐이고
// 그마저 SSR 마크업을 그대로 내보내므로 공개 화면 조건(REQ-N-001)은 유지된다.
//
// 판단 네 가지를 여기에 남긴다.
//
// 1) 실화면 캡처 대신 다이어그램
//    화면설계 §5.7 의 촬영 3조건 중 「실데이터 축적」이 미충족이다. 값이 0인 화면을
//    노출하면 POL-01 불합격이다 (PRD FR-4.3 · POL-09). 다이어그램은 외부 에셋을
//    기다리지 않도록 이미지가 아니라 div/CSS 로 조립했다.
//
// 2) 움직이는 것은 블록 2 하나뿐이다
//    현재 읽는 단계를 색과 테두리로 표시한다. 등장 애니메이션이 아니라 위치 표시다.
//    나머지 세 블록(헤더 · 조직 · 다이어그램)은 의도적으로 비운다 — 전 섹션에 깔면
//    POL-11①-2(절제) 반려 사유다. 특히 P-01 섹션 7 의 연결선 드로잉을 여기로
//    옮겨오지 않는다. 읽으러 온 화면이다.
//
// 3) 문의 CTA 없음
//    C-03 은 P-01 · P-04 · P-06 3종 전용이다. 네 번째를 신설하면 REQ-F-007(P0) 위반이다
//    (기능명세 §4.7 하단 구현 제약이 이 화면을 명시해 경고한다).
//    헤더 GNB 의 문의 버튼(C-04)은 별개이므로 그대로 둔다.
//
// 4) 본문 폭은 세 블록이 같은 값을 쓴다
//    Section 이 h2 에 --layout-content 를 걸고 있으므로 children 도 같은 폭으로 맞춘다.
//    가운데 정렬(mx-auto)을 쓰지 않는 이유는 제목이 왼쪽 정렬이라 축이 어긋나기 때문이다.
//    다이어그램 패널도 같다 — 가운데로 보내면 h2 의 왼쪽 축과 어긋난다.
//    블록 3 본문을 Section 의 description 슬롯에 넣지 않은 것도 같은 이유다 —
//    그 슬롯은 --layout-copy(42rem)로 고정돼 있어 혼자만 폭이 좁아진다.
//    Section 은 P-01 과 공유하는 부품이므로 이 화면 사정으로 고치지 않는다.
//
// 화면에 남는 숫자는 헤더 서브의 "8단계"와 단계 번호 01~08 뿐이다.
// 둘 다 확정된 프로세스 구조이지 실적 수치가 아니므로 POL-01 대상이 아니다.
// 묶음 표기 「STEP 01–02」 는 단계 번호를 그대로 옮긴 것이다. 묶음에 별도 번호를
// 붙이지 않는다 — 붙이는 순간 8단계가 아니라 4단계 프로세스로 읽힌다.

import type { Metadata } from 'next';
import { Fragment } from 'react';

import { Section } from '@/components/landing/Section';
import { PageHeader } from '@/components/layout/PageHeader';

import { ProcessSteps } from './ProcessSteps';
import { headerCopy, organizationCopy, processCopy, toolCopy } from './p09-copy';

export const metadata: Metadata = {
  title: '일하는 방식',
  // 화면 카피가 아니라 전용 문장을 쓴다 (8/20). 헤더가 3단이 되면서 세 줄 어느 것도
  // POL-06 의 80자에 닿지 않는다. metaDescription 은 그 세 줄을 재구성한 값이다
  description: headerCopy.metaDescription,
  alternates: { canonical: '/process' },
};

/** 세 블록이 공유하는 본문 폭. Section 의 h2 와 같은 값이라 왼쪽 축이 맞는다. */
const BLOCK_WIDTH = 'max-w-[var(--layout-content)]';

/**
 * 본문 블록 사이 이음매를 좁힌다.
 * --section-block 이 위·아래로 두 겹 겹치면 블록 끝 문장이 허공에 남는다.
 * Section 은 P-01 과 공유하는 부품이라 고치지 않고(하드 룰), 블록 안에서
 * 아래쪽 한 겹만 당겨 상쇄한다.
 *
 * 블록 2 · 3 에만 건다. 마지막 블록(다이어그램)은 푸터와의 간격이라 그대로 둔다.
 */
const TRAILING_PULL = '-mb-[var(--section-block)]';

export default function ProcessPage() {
  const { nodes } = organizationCopy;
  const { diagram } = toolCopy;

  return (
    <>
      {/* 블록 1 — 페이지 헤더. 디자인규칙 「다른 공개 화면」: 헤더만 어둡고 본문은 밝다.
          마크업은 components/layout/PageHeader.tsx 가 갖는다 (P-03 착수 시 추출) */}
      <PageHeader
        headingLines={headerCopy.headingLines}
        tagline={headerCopy.tagline}
        subtitle={headerCopy.subtitle}
      />

      {/* 본문 세 블록은 한 덩어리로 밝게 간다. 배경을 블록마다 뒤집지 않는다 */}
      <div className="bg-surface-raised text-ink">
        {/* 블록 2 — 8단계 프로세스 (FN-P09-02 · FN-P09-03)
            스크롤 위치 표시 때문에 이 목록만 클라이언트다.

            잠깐 4묶음 개요 블록을 이 위에 두고 제목·리드를 좌우 2단으로 놓느라
            Section 대신 <section> 을 직접 썼다가 되돌렸다 (8/20) — 개요가 P-01 섹션 7 과
            중복이 되어 제거됐고, 남은 것이 제목 + 리드 + 목록이라 Section 의 모양과
            정확히 같다. 블록 3 · 4 와 구조를 하나로 유지한다 */}
        <Section id="process-steps" heading={processCopy.heading}>
          <ProcessSteps
            className={`${BLOCK_WIDTH} ${TRAILING_PULL}`}
            lead={processCopy.lead}
            groups={processCopy.groups}
            gate={processCopy.gate}
          />
        </Section>

        {/* 블록 3 — 역할 분리 조직 (FN-P09-04)
            인수 기준이 "구조 확인"이라 문장만으로는 부족하다. 노드와 방향을 같이 그린다 */}
        <Section id="organization" heading={organizationCopy.heading}>
          <div className={`${BLOCK_WIDTH} ${TRAILING_PULL}`}>
            <p className="text-muted text-[length:var(--font-size-md)] leading-[var(--leading-relaxed)]">
              {organizationCopy.body}
            </p>

            <div className="mt-[var(--space-8)] flex flex-col items-stretch gap-[var(--space-2)] sm:flex-row sm:items-center">
              {nodes.map((node, index) => (
                <Fragment key={node}>
                  {index > 0 && (
                    <span
                      aria-hidden="true"
                      className="text-center text-subtle text-[length:var(--font-size-xl)] leading-none sm:px-[var(--space-2)]"
                    >
                      <span className="sm:hidden">↓</span>
                      <span className="hidden sm:inline">→</span>
                    </span>
                  )}
                  <span className="flex-1 rounded-card border border-border px-[var(--space-5)] py-[var(--space-5)] text-center font-semibold text-ink text-[length:var(--font-size-md)]">
                    {node}
                  </span>
                </Fragment>
              ))}
            </div>
          </div>
        </Section>

        {/* 블록 4 — 관리 도구 다이어그램 (FN-P09-05)
            이미지 파일이 아니라 div/CSS 로 조립한다. 외부 에셋 수급을 기다리지 않는다.
            제품명·수치를 넣지 않는다 (기획안 §2-1 · POL-01) */}
        <Section id="tool" heading={toolCopy.heading}>
          <div className={`${BLOCK_WIDTH} rounded-panel border border-border p-[var(--space-8)]`}>
            {/* 뿌리 — 패널 상단 중앙 */}
            <div className="flex justify-center">
              <p className="rounded-card bg-brand px-[var(--space-6)] py-[var(--space-4)] text-center font-semibold text-ink-inverse text-[length:var(--font-size-md)]">
                {diagram.root}
              </p>
            </div>

            {/* 뿌리에서 아래로 내려가는 줄기 */}
            <span aria-hidden="true" className="mx-auto block h-[var(--space-6)] w-px bg-border-strong" />

            {/* 가로 분기선. 4열일 때 첫 가지 중앙 ~ 마지막 가지 중앙이 좌우 12.5% 지점이다.
                2열로 접히면 행이 둘로 나뉘어 이 선이 두 번째 행에 닿지 않으므로 그리지 않는다 */}
            <span aria-hidden="true" className="mx-[12.5%] hidden h-px bg-border-strong md:block" />

            {/* 가지 카드는 행에서 가장 높은 것에 맞춘다. 「단계별 검수보고서 발송」이
                두 줄이라 혼자 튀어나오던 자리다 */}
            <ul className="mt-[var(--space-4)] grid grid-cols-2 items-stretch gap-[var(--space-4)] md:mt-0 md:grid-cols-4">
              {diagram.branches.map((branch) => (
                <li key={branch} className="flex h-full flex-col items-center">
                  <span aria-hidden="true" className="hidden h-[var(--space-6)] w-px bg-border-strong md:block" />
                  <span className="flex w-full flex-1 items-center justify-center rounded-card border border-border px-[var(--space-4)] py-[var(--space-4)] text-center text-[length:var(--font-size-base)]">
                    {branch}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </Section>
      </div>
    </>
  );
}
