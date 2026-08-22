// P-01 랜딩 · 섹션 7 일하는 방식
//
// 근거 — 화면설계 §5.1 · 기능명세 §4.1 · 디자인규칙 「P-01 랜딩 배경 리듬」
//   FN-P01-27  ⚠ **이 화면은 확정문서와 다르게 간다 (8/20 · 사용자 지시).**
//              명세는 「2행 4열 · 단계마다 라벨 + 설명」이고 인수 기준이
//              「8단계가 한 화면 · 라벨 + 설명 각 1건」인데, 여기는 8단계 나열이 아니라
//              **4묶음 축약**이다. P-01 은 요약, P-09 는 상세로 층을 가른 결과다.
//              8단계 전체는 P-09(/process)에 그대로 남아 있고 아래 링크가 그 경로다.
//              발주사 승인이 필요한 항목이다 — 되돌릴 때는 content/p01-copy.ts 의
//              groups 와 components/landing/ProcessGrid.tsx 를 함께 본다.
//              **8/21 에 배치가 한 번 더 벌어졌다** — 4묶음이 4열에서 세로 나열이 됐고,
//              8/22 에 그 행의 짜임을 섹션 3 과 같게 맞췄다 (사용자 지시)
//   FN-P01-10  이 섹션에서 P-09(/process)로 이동하는 링크를 제공한다.
//              4묶음만 남은 지금은 이 링크가 8단계로 가는 **유일한** 경로다. 지우지 않는다
//   FN-P01-13  아이브로우 라벨 없음. 제목 위에 보조 라벨을 두지 않는다
//   배경 리듬  7 일하는 방식 = bg-canvas · text-ink-inverse (「어둠 ②」 구간).
//              **8/22 에 섹션 6 이 빠지면서 이 섹션 혼자 그 구간을 갖는다.**
//              전환은 2→3 · 5→7 · 7→8 세 번으로 유지된다 — 값을 바꾸면 전환이
//              한 번 더 늘어 4구간 리듬이 깨진다
//   인터랙션   행 아래 구분선이 그려진다 → components/landing/ProcessGrid.tsx.
//              제목·부제·링크는 움직이지 않는다
//
// **좌 제목 · 우 4묶음 2단이 됐다 (8/21 · 사용자 지시).**
//   제목 · 부제 · P-09 링크가 왼쪽 열에 한 덩어리로 모이고, 오른쪽 열이 4묶음을 갖는다.
//   Section 의 layout='split' 이 lg 이상에서 5:7 로 나누고 lg 미만에서는 접는다.
//   링크는 여전히 섹션 안 한 곳뿐이고 자리만 목록 아래에서 부제 아래로 옮겼다 —
//   FN-P01-10 이 요구하는 것은 이동 경로의 존재이지 그 위치가 아니다.
//
// 화면에 남는 숫자는 제목의 "8단계"와 STEP 번호뿐이다. 둘 다 확정된 프로세스
// 구조이지 실적 수치가 아니므로 POL-01 대상이 아니다 (P-09 도 같은 판단을 적어 뒀다).
//
// 링크 색 — 어두운 배경 위에서는 `text-brand`(#1b64da)가 bg-canvas(#15140f) 대비
// 3:1 에 못 미친다. 섹션 4·5 의 브랜드색 링크를 그대로 옮겨오지 않고, 헤더·푸터가
// 어두운 배경에서 쓰는 방식(글자색과 `text-subtle` 사이의 전환)을 따른다.
//
// 부제를 Section 의 description 슬롯에 넣지 않는다. 그 슬롯은 `text-muted` 를 고정으로
// 갖는데 그 값(#5e5a50)은 bg-canvas 위에서 대비가 3:1 에 못 미쳐 읽히지 않는다
// (ProblemSection.tsx 와 같은 판단 — 어두운 배경 위의 연한 글자는 `text-subtle` 이 맡는다).
// 대신 aside 슬롯에 부제와 링크를 직접 그려 넘긴다. 제목과의 간격 `--space-4` 는
// description 슬롯이 쓰는 값과 같게 맞췄다 — 밝은 섹션(4·5)과 제목-부제 간격이 같아진다.

import Link from 'next/link';

import { ProcessGrid } from '@/components/landing/ProcessGrid';
import { Section } from '@/components/landing/Section';
import { p01Copy } from '@/content/p01-copy';

export function ProcessSection() {
  return (
    <Section
      id="process"
      heading={p01Copy.process.heading}
      layout="split"
      className="bg-canvas text-ink-inverse"
      aside={
        <>
          <p className="mt-[var(--space-4)] max-w-[var(--layout-copy)] text-subtle text-[length:var(--font-size-md)] leading-[var(--leading-relaxed)]">
            {p01Copy.process.description}
          </p>

          <div className="mt-[var(--space-8)]">
            <Link
              href="/process"
              className="inline-flex min-h-11 items-center gap-[var(--space-2)] font-semibold text-ink-inverse text-[length:var(--font-size-md)] hover:text-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink-inverse"
            >
              {p01Copy.process.moreLabel}
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="size-4"
              >
                <path d="m9 18 6-6-6-6" />
              </svg>
            </Link>
          </div>
        </>
      }
    >
      <ProcessGrid groups={p01Copy.process.groups} />
    </Section>
  );
}
