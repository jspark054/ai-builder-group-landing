// P-01 랜딩 · 섹션 2 문제 제기
//
// 근거 — 화면설계 §5.1 · 기능명세 §4.1 · 디자인규칙 「P-01 랜딩 배경 리듬」
//   FN-P01-13  아이브로우 라벨 없음
//   FN-P01-17  섹션 2 위·아래에 두 줄을 **반대 방향**(위 → · 아래 ←)으로 무한 이동
//   FN-P01-18  공개 프로젝트가 0건이면 마퀴를 렌더하지 않는다 (POL-11①-3)
//   FN-P01-19  스크롤을 가로채지 않는다 — 리스너 0건. 전부 CSS 다
//   FN-P01-20  인용문은 본문과 **같은 크기·굵기**를 쓰고 색으로만 구분한다.
//              인용이 연한 쪽이다 — 인용이 답보다 강해지면 불안을 파는 인상이 된다 (POL-13).
//              답은 이 섹션이 아니라 섹션 3 이 한다
//   REQ-F-004  사고 사례를 나열하지 않는다
//   배경 리듬  2 문제 제기 = bg-canvas · text-ink-inverse (「어둠 ①」 구간)
//
// 제목(h2)을 두지 않아 Section.tsx 를 쓰지 않는다. Section 은 heading 이 필수이고,
// 이 섹션은 인용과 본문 두 덩어리뿐이다. 컨테이너 폭·좌우 여백·상하 여백은 같은 값을 쓴다.
//
// 색 — FN-P01-20 은 인용을 `--color-muted` 로 지정하지만 그 값(#5e5a50)은
// `bg-canvas`(#15140f) 위에서 대비가 3:1 에 못 미쳐 읽히지 않는다. 어두운 배경 위의
// 연한 글자는 `text-subtle` 이 맡는다 (디자인규칙 색 표 · 히어로 서브카피도 같은 선택이다).
// "본문보다 연하게"라는 조건은 그대로 지킨다.
//
// ─────────────────────────────────────────────────────────────────────────
// 마퀴 도입 (8/21)
//
// `FN-P01-17` 은 v3.6 부터 명세에 있었으나 미구현이었다. 띠에 넣을 것이 프로젝트
// 썸네일인데 DB 가 테스트 데이터뿐이라 그대로 흘리면 `POL-11①-3`(더미 데이터)에
// 걸렸기 때문이다. **8/20 에 썸네일 5건이 전부 실제 캡처가 되면서 그 차단이 풀렸다.**
//
// 명세와 다른 지점 — 아래 줄이 포트폴리오 화면이 아니라 **문구**다 (사용자 지시).
//   `FN-P01-17` 은 두 줄 다 「포트폴리오 화면」으로 적고 있다. 위 줄은 명세 그대로
//   두고 아래 줄만 문구로 바꿨다. 인수 기준인 "두 줄이 반대 방향 · 이음매 없음"은
//   충족하지만 아래 줄의 내용이 다르다. **발주사 승인이 필요한 항목이다.**
//   되돌릴 지점은 이 파일의 아래 <Marquee> 하나이고, 문구는 p01-copy.ts 에 있다.
//
//   위 줄을 실물로 남긴 이유가 있다. 이 섹션의 본문이 "이미지와 소개 문구만으로는
//   선택의 근거가 충분하지 않습니다" 인데 위아래 둘 다 문구가 흐르면 섹션이 자기
//   말을 반박한다. 실물(위) 위에 문구(아래)를 얹는 순서라야 본문과 어긋나지 않는다.
//
// 넣지 않은 것 — `FN-P01-16`(sticky 고정 + 3문장 순차 등장) 과
//   `FN-P01-24`(흑백 진입 → 컬러 전환) 는 이번 범위가 아니다.
//   16 을 넣으면 이 섹션의 인터랙션이 "텍스트 순차 등장"이 되어 **섹션 3 과 같아진다**
//   (`FN-P01-02` 인접 섹션 상이 조건 위반). 24 는 스크롤 구동 전환이라 16 과 한 벌이다.
//   움직이는 것은 띠까지이고, 인용 한 줄의 페이드 인은 그대로 둔다.
//
// 인터랙션 배치 — 1 없음 / **2 마퀴** / 3 순차 등장 / 4 카드 상승 / 5 — /
//   6 없음 / 7 연결선 / 8 없음. 인접한 두 섹션이 겹치지 않고 비워둔 구간(1·6·8)이
//   그대로 남는다 (`FN-P01-02` · `POL-11①-2`).
// ─────────────────────────────────────────────────────────────────────────

import Image from 'next/image';
import { Fragment } from 'react';

import { Marquee } from '@/components/landing/Marquee';
import { ProblemQuote } from '@/components/landing/ProblemQuote';
import { p01Copy } from '@/content/p01-copy';
import { getProjectCards } from '@/lib/queries/project-cards';

/**
 * 두 줄의 주기를 다르게 둔다. 같은 값이면 두 띠가 주기적으로 나란히 서서
 * 기계적으로 보인다. 토큰이 없는 값이라 여기서 정한다 (테마 CSS 머리말 참조).
 */
const DURATION = { projects: '72s', phrases: '48s' } as const;

/**
 * 한 벌 안에서 내용을 몇 번 되풀이할지 (Marquee 머리말 참조).
 * **한 벌 폭 ≥ 화면 폭** 이어야 띠 끝에 빈틈이 안 생긴다.
 *
 * 실측 한 바퀴 폭 (8/21) — 프로젝트 5건 930px · 문구 4건 1524px.
 * 아래 값이면 한 벌이 각각 2790px · 3048px 이 되어 2560px 모니터까지 덮는다.
 * 둘 다 이보다 한 단계 줄이면 2560 에서 빈틈이 난다 (930×2=1860 · 1524×1=1524).
 *
 * 문구가 2건이던 때는 한 바퀴가 725px 라 4회 되풀이가 필요했다. 2건이 더 들어와
 * 한 바퀴가 배로 넓어지면서 2회로 줄었다 — 문구가 늘면 이 값은 내려간다.
 */
const REPEAT = { projects: 3, phrases: 2 } as const;

export async function ProblemSection() {
  // 섹션 4 와 같은 쿼리다. 같은 데이터를 두 번 읽지만 요청 단위로 캐시되고,
  // 띠 전용 쿼리를 새로 만들면 정렬 규칙이 두 벌이 된다.
  const projects = await getProjectCards();

  return (
    <section id="problem" className="bg-canvas text-ink-inverse">
      {/* 위 줄 → · 실제 포트폴리오 화면 (FN-P01-17 명세 그대로).
          FN-P01-18 — 0건이면 렌더하지 않는다. 빈 띠도 가짜 이미지도 두지 않는다.
          띠 내용은 장식이다. 같은 캡처가 섹션 4 에서 이름·설명과 함께 다시 나오므로
          여기서 alt 를 읽히면 같은 목록을 두 번 듣게 된다 — decorative 로 가리고
          띠가 무엇인지만 label 로 알린다 */}
      {projects.length > 0 && (
        <Marquee
          direction="right"
          duration={DURATION.projects}
          repeat={REPEAT.projects}
          label={p01Copy.problem.marqueeProjectsLabel}
        >
          {projects.map((project) => (
            // 높이만 정하고 폭은 비율이 정하게 둔다. 세로를 고정해야 띠의 두께가
            // 일정하고, 캡처마다 원본 비율이 조금씩 달라도 줄이 울지 않는다.
            // 값은 `--space-24`(6rem = 96px) 다 — 간격 토큰 중 가장 큰 것이고,
            // 이보다 키우려면 토큰 밖 수치를 써야 한다
            <div
              key={project.slug}
              className="mr-[var(--space-4)] h-[var(--space-24)] shrink-0 overflow-hidden rounded-card bg-surface"
            >
              {/* `loading="eager"` 다. 기본값 lazy 로 두면 오른쪽에서 흘러 들어오는
                  칸이 빈 채로 나타났다가 뒤늦게 채워진다 — 띠가 끊겨 보인다.
                  `priority` 는 쓰지 않는다. 그건 preload 까지 걸어 히어로 LCP 캡처와
                  대역폭을 다투게 된다. 두 벌이 같은 URL 을 쓰므로 실제 요청은 5건이고,
                  `sizes` 로 작은 후보를 고르게 해 한 건당 수십 KB 에 그친다 */}
              <Image
                src={project.thumbnailUrl}
                alt=""
                width={1200}
                height={750}
                loading="eager"
                sizes="200px"
                className="h-full w-auto object-cover"
              />
            </div>
          ))}
        </Marquee>
      )}

      <div className="mx-auto w-full max-w-[var(--layout-container)] px-[var(--layout-gutter)] py-[var(--section-block)]">
        {/* 인용과 본문이 같은 크기·굵기를 쓰도록 타이포는 이 래퍼가 한 번만 정한다.
            둘 사이에서 달라지는 것은 색뿐이다 (FN-P01-20).
            정렬도 여기서 한 번만 건다 — 인용과 본문이 같은 축을 쓴다.

            가운데 정렬이다. 히어로와 축이 어긋나지만, 인용 한 줄이 화면 가운데
            놓이는 편이 문제 제기 구간의 무대감에 맞는다는 판단이다 (8/20).

            크기는 `--font-size-xl`(1.5rem) 이다. `lg`(1.125rem)에서 한 단계 올렸다 (8/20).
            상한 두 가지를 지킨다 —
              히어로 서브카피 **이하**  → 히어로도 같은 `xl` 로 함께 올렸다 (Hero.tsx).
                섹션 2 만 올리면 히어로보다 커져 랜딩 도입부의 위계가 뒤집힌다.
              섹션 3 제목 **미만**      → 제목은 `2xl`(1.875rem)이라 그대로 아래에 있다.
            사다리에 `lg`와 `2xl` 사이 토큰이 `xl` 하나뿐이라 이 값이 유일한 선택이다.
            새 토큰을 만들지 않는다 */}
        <div className="mx-auto max-w-[var(--layout-content)] text-center text-[length:var(--font-size-xl)] leading-[var(--leading-body)]">
          {/* R1 — 따옴표는 문자 그대로 포함된 문안이다 (기능명세 §4.1 카피표 v4.7).
              연한 쪽은 인용이다 */}
          <ProblemQuote className="text-subtle">{p01Copy.problem.quote}</ProblemQuote>

          {/* R2 — 두 줄을 <br> 로 직접 끊는다. 자동 줄바꿈에 맡기지 않는다.
              페이드 인을 걸지 않는 쪽이다 */}
          <p className="mt-[var(--space-8)]">
            {p01Copy.problem.bodyLines.map((line, index) => (
              <Fragment key={line}>
                {index > 0 && <br />}
                {line}
              </Fragment>
            ))}
          </p>
        </div>
      </div>

      {/* 아래 줄 ← · 문구 (사용자 지시. 명세는 여기도 포트폴리오 화면이다).
          `--tracking-label`(0.13em)을 쓴다 — 대문자 라틴 문자열은 자간을 벌리지 않으면
          글자가 붙어 읽힌다. 라벨용으로 이미 있는 토큰이다.
          구분 기호는 `·` 다. 원안의 `✦` 는 Pretendard 에 없다 (p01-copy.ts 참조) */}
      <Marquee direction="left" duration={DURATION.phrases} repeat={REPEAT.phrases}>
        {p01Copy.problem.marqueePhrases.map((phrase) => (
          <span
            key={phrase}
            className="shrink-0 whitespace-nowrap font-semibold text-subtle text-[length:var(--font-size-sm)] tracking-[var(--tracking-label)]"
          >
            {phrase}
            {/* 간격은 `--space-24`(6rem) 다. 문구가 2건이던 때 한 바퀴가 437px 밖에
                안 돼 같은 말이 한 화면에 3.3번 보여서 벌린 값이고, 4건이 된 뒤에도
                그대로 둔다 — 대문자 라틴이 촘촘하면 띠가 답답해 보인다 (실측 8/21) */}
            <span aria-hidden="true" className="mx-[var(--space-24)]">
              ·
            </span>
          </span>
        ))}
      </Marquee>
    </section>
  );
}
