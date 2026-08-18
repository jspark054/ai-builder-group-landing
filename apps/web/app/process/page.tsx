// P-09 일하는 방식 `/process`
//
// 근거 — 화면설계 §5.7 · 기능명세 §4.7 · 요구사항 REQ-F-040~043 · 결정시트 I-7
//   FN-P09-01  메시지를 도구명보다 앞에 둔다 → H1 에 제품명이 없다
//   FN-P09-02  8단계를 전부 표시한다
//   FN-P09-03  각 단계 사이에 검수보고서·컨펌 관문을 표시한다 → 일곱 곳 전부
//   FN-P09-04  역할 분리 조직을 표시한다 → 문장 + 노드 3개(영업팀 → 팀장 → 실무)
//   FN-P09-05  관리 도구를 실화면 또는 다이어그램으로 표시한다 → 다이어그램 택
//
// DB 연동이 없는 정적 화면이라 서버 컴포넌트 그대로 둔다 ('use client' 없음).
// 공개 화면이므로 서버가 콘텐츠를 담은 HTML 을 반환한다 (REQ-N-001).
//
// 판단 세 가지를 여기에 남긴다.
//
// 1) 실화면 캡처 대신 다이어그램
//    화면설계 §5.7 의 촬영 3조건 중 「실데이터 축적」이 미충족이다. 값이 0인 화면을
//    노출하면 POL-01 불합격이다 (PRD FR-4.3 · POL-09). 다이어그램은 외부 에셋을
//    기다리지 않도록 이미지가 아니라 div/CSS 로 조립했다.
//
// 2) 모션 없음
//    P-01 의 배경 리듬·섹션별 인터랙션은 랜딩 전용이다 (디자인규칙 「다른 공개 화면」).
//    특히 섹션 7 의 연결선 드로잉을 여기로 옮겨오지 않는다 — 읽으러 온 화면이다.
//
// 3) 문의 CTA 없음
//    C-03 은 P-01 · P-04 · P-06 3종 전용이다. 네 번째를 신설하면 REQ-F-007(P0) 위반이다
//    (기능명세 §4.7 하단 구현 제약이 이 화면을 명시해 경고한다).
//    헤더 GNB 의 문의 버튼(C-04)은 별개이므로 그대로 둔다.
//
// 단계에 번호를 붙이지 않았다. 순서는 나열 순서와 관문이 갖고 있고,
// 화면에 남는 숫자는 헤더 서브의 "8단계"(확정 프로세스 구조) 하나뿐이다 (POL-01).

import type { Metadata } from 'next';
import { Fragment } from 'react';

import { Section } from '@/components/landing/Section';

import { headerCopy, organizationCopy, processCopy, toolCopy } from './p09-copy';

export const metadata: Metadata = {
  title: '일하는 방식',
  // 새 문장을 만들지 않고 화면 서브카피를 그대로 쓴다 (POL-06 길이 · POL-13 카피 확정).
  description: headerCopy.subtitle,
  alternates: { canonical: '/process' },
};

/** 단계 사이 관문. 일곱 곳 전부에 같은 모양으로 들어간다 (FN-P09-03). */
function Gate() {
  return (
    <div className="flex flex-col items-center py-[var(--space-3)]">
      <span aria-hidden="true" className="h-[var(--space-4)] w-px bg-border" />
      <span className="rounded-pill border border-border-strong bg-surface-soft px-[var(--space-4)] py-[var(--space-1-5)] font-semibold text-brand text-[length:var(--font-size-xs)] tracking-[var(--tracking-label)]">
        {processCopy.gate}
      </span>
      <span aria-hidden="true" className="h-[var(--space-4)] w-px bg-border" />
    </div>
  );
}

export default function ProcessPage() {
  const { steps } = processCopy;
  const { nodes } = organizationCopy;
  const { diagram } = toolCopy;

  return (
    <>
      {/* 블록 1 — 페이지 헤더. 디자인규칙 「다른 공개 화면」: 헤더만 어둡고 본문은 밝다 */}
      <section className="bg-canvas text-ink-inverse">
        <div className="mx-auto w-full max-w-[var(--layout-container)] px-[var(--layout-gutter)] py-[var(--section-block)]">
          <h1 className="max-w-[var(--layout-content)] font-bold text-[length:var(--font-size-display-md)] leading-[var(--leading-tight)] tracking-[var(--tracking-tight)]">
            {headerCopy.headingLines.map((line, index) => (
              <Fragment key={line}>
                {index > 0 && <br />}
                {line}
              </Fragment>
            ))}
          </h1>
          <p className="mt-[var(--space-6)] max-w-[var(--layout-copy)] text-subtle text-[length:var(--font-size-lg)] leading-[var(--leading-relaxed)]">
            {headerCopy.subtitle}
          </p>
        </div>
      </section>

      {/* 본문 세 블록은 한 덩어리로 밝게 간다. 배경을 블록마다 뒤집지 않는다 */}
      <div className="bg-surface-raised text-ink">
        {/* 블록 2 — 8단계 프로세스 (FN-P09-02 · FN-P09-03) */}
        <Section id="process-steps" heading={processCopy.heading}>
          <ol className="mx-auto max-w-[var(--layout-content)]">
            {steps.map((step, index) => (
              <li key={step.label}>
                {/* 관문은 단계와 단계 사이에만 놓는다 — 첫 단계 앞에는 없다 */}
                {index > 0 && <Gate />}
                <div className="rounded-card border border-border p-[var(--space-6)]">
                  <p className="font-semibold text-[length:var(--font-size-lg)] leading-[var(--leading-heading)]">
                    {step.label}
                  </p>
                  <p className="mt-[var(--space-2)] text-muted text-[length:var(--font-size-base)] leading-[var(--leading-relaxed)]">
                    {step.description}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </Section>

        {/* 블록 3 — 역할 분리 조직 (FN-P09-04)
            인수 기준이 "구조 확인"이라 문장만으로는 부족하다. 노드와 방향을 같이 그린다 */}
        <Section id="organization" heading={organizationCopy.heading} description={organizationCopy.body}>
          <div className="flex flex-col items-stretch gap-[var(--space-2)] sm:flex-row sm:items-center">
            {nodes.map((node, index) => (
              <Fragment key={node}>
                {index > 0 && (
                  <span aria-hidden="true" className="text-center text-subtle text-[length:var(--font-size-xl)] leading-none sm:px-[var(--space-2)]">
                    <span className="sm:hidden">↓</span>
                    <span className="hidden sm:inline">→</span>
                  </span>
                )}
                <span className="flex-1 rounded-card border border-border bg-surface-soft px-[var(--space-5)] py-[var(--space-5)] text-center font-semibold text-[length:var(--font-size-md)]">
                  {node}
                </span>
              </Fragment>
            ))}
          </div>
        </Section>

        {/* 블록 4 — 실물 증거 (FN-P09-05)
            이미지 파일이 아니라 div/CSS 로 조립한다. 외부 에셋 수급을 기다리지 않는다.
            제품명·수치를 넣지 않는다 (기획안 §2-1 · POL-01) */}
        <Section id="tool" heading={toolCopy.heading}>
          <div className="mx-auto max-w-[var(--layout-content)] rounded-panel border border-border bg-surface-soft p-[var(--space-8)]">
            <p className="inline-flex rounded-card bg-canvas px-[var(--space-6)] py-[var(--space-4)] font-semibold text-ink-inverse text-[length:var(--font-size-md)]">
              {diagram.root}
            </p>

            {/* 뿌리에서 가지 묶음으로 내려가는 세로선 */}
            <span aria-hidden="true" className="ml-[var(--space-6)] block h-[var(--space-6)] w-px bg-border-strong" />

            <ul className="ml-[var(--space-6)]">
              {diagram.branches.map((branch, index) => {
                const isLast = index === diagram.branches.length - 1;

                return (
                  <li key={branch} className="relative py-[var(--space-2)] pl-[var(--space-8)]">
                    {/* 마지막 가지에서 세로선을 절반만 그려 `└` 모양을 만든다 */}
                    <span
                      aria-hidden="true"
                      className={`absolute top-0 left-0 w-px bg-border-strong ${isLast ? 'h-1/2' : 'h-full'}`}
                    />
                    <span aria-hidden="true" className="absolute top-1/2 left-0 h-px w-[var(--space-6)] bg-border-strong" />
                    <span className="inline-flex rounded-card border border-border bg-surface-raised px-[var(--space-5)] py-[var(--space-3)] text-[length:var(--font-size-base)]">
                      {branch}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        </Section>
      </div>
    </>
  );
}
