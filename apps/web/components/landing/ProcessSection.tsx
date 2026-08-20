// P-01 랜딩 · 섹션 7 일하는 방식
//
// 근거 — 화면설계 §5.1 · 기능명세 §4.1 · 디자인규칙 「P-01 랜딩 배경 리듬」
//   FN-P01-27  2행 4열 그리드이며 단계마다 라벨 + 설명을 함께 표기한다 (v4.2 개정).
//              인수 기준은 「8단계가 한 화면 · 라벨 + 설명 각 1건」 — 목록을 접지 않는다
//   FN-P01-10  이 섹션에서 P-09(/process)로 이동하는 링크를 제공한다
//   FN-P01-13  아이브로우 라벨 없음. 제목 위에 보조 라벨을 두지 않는다
//   배경 리듬  7 일하는 방식 = bg-canvas · text-ink-inverse (「어둠 ②」 구간).
//              섹션 6 과 같은 값이다 — 두 섹션 사이에 배경 전환을 두지 않는다.
//              전환은 2→3 · 5→6 · 7→8 세 번뿐이고, 여기서 한 번 더 뒤집으면 리듬이 깨진다
//   인터랙션   카드 사이 연결선이 그려진다 → components/landing/ProcessGrid.tsx.
//              제목·부제·링크는 움직이지 않는다
//
// 화면에 남는 숫자는 제목의 "8단계"와 칸 번호 01~08 뿐이다. 둘 다 확정된 프로세스
// 구조이지 실적 수치가 아니므로 POL-01 대상이 아니다 (P-09 도 같은 판단을 적어 뒀다).
//
// 링크 색 — 어두운 배경 위에서는 `text-brand`(#1b64da)가 bg-canvas(#15140f) 대비
// 3:1 에 못 미친다. 섹션 4·5 의 브랜드색 링크를 그대로 옮겨오지 않고, 헤더·푸터가
// 어두운 배경에서 쓰는 방식(글자색과 `text-subtle` 사이의 전환)을 따른다.
//
// 부제를 Section 의 description 슬롯에 넣지 않는다. 그 슬롯은 `text-muted` 를 고정으로
// 갖는데 그 값(#5e5a50)은 bg-canvas 위에서 대비가 3:1 에 못 미쳐 읽히지 않는다
// (ProblemSection.tsx 와 같은 판단 — 어두운 배경 위의 연한 글자는 `text-subtle` 이 맡는다).
// Section 은 P-09 와 공유하는 부품이라 고치지 않고(하드 룰), 부제를 children 으로 옮겼다.

import Link from 'next/link';

import { ProcessGrid } from '@/components/landing/ProcessGrid';
import { Section } from '@/components/landing/Section';
import { p01Copy } from '@/content/p01-copy';

/**
 * 부제를 children 으로 옮기면서 생긴 간격 차이를 되돌린다.
 * Section 은 children 앞에 `--space-10`(2.5rem)을 두고, description 슬롯은
 * h2 바로 아래 `--space-4`(1rem)에 놓인다. 그 차이만큼만 당겨 밝은 섹션(4·5)과
 * 제목-부제 간격을 같게 맞춘다. 새 토큰을 만들지 않고 기존 두 값의 차로 계산한다.
 */
const SUBTITLE_PULL = '-mt-[calc(var(--space-10)-var(--space-4))]';

export function ProcessSection() {
  return (
    <Section id="process" heading={p01Copy.process.heading} className="bg-canvas text-ink-inverse">
      <p
        className={`${SUBTITLE_PULL} max-w-[var(--layout-copy)] text-subtle text-[length:var(--font-size-md)] leading-[var(--leading-relaxed)]`}
      >
        {p01Copy.process.description}
      </p>

      <div className="mt-[var(--space-10)]">
        <ProcessGrid steps={p01Copy.process.steps} />
      </div>

      <div className="mt-[var(--space-10)]">
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
    </Section>
  );
}
