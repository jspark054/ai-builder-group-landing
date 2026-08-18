// C-02 빌더 카드 — P-01 섹션 5 · P-05 공용
//
// 근거 — 기능명세 §3.2 · 화면설계 §4.2 · POL-02 · POL-05 · POL-12
//   FN-C02-01  표기명 (실명·닉네임 모두 정상 렌더)
//   FN-C02-02  프로필 이미지 (실사·아바타)
//   FN-C02-03  이미지 미등록 시 이니셜 폴백
//   FN-C02-04  기수 배지
//   FN-C02-05  담당 프로젝트 수 (집계는 쿼리가 한다 — lib/queries/builder-cards.ts)
//   FN-C02-06  카드 클릭 → P-06
//   POL-05     이력(career)은 카드에 표기하지 않는다. props 로도 받지 않는다
//
// 화면별로 별도 카드를 만들지 않는다 (기능명세 §3.2 · 화면설계 §4.2).
// 문구는 content/component-copy.ts 에서만 가져온다. 여기에 문장을 쓰지 않는다.
//
// variant — 표기 수위만 다르고 컴포넌트는 하나다
//   P-01 섹션 5 는 §4.1 v4.0~v4.4 개정으로 C-02 기본형과 다른 표기를 요구한다.
//     FN-P01-26  기수 배지를 두지 않는다 (인수 기준 "기수 표기 0건")
//                — 사유: 배지가 발주자에게 판단 근거가 되지 않고 경력이 짧다는 인상만 준다
//     FN-P01-29  외부 박스를 두지 않는다. 구분은 배경색 차이 (POL-11)
//     FN-P01-35  원형은 배경 채움 없이 테두리만
//   화면마다 카드를 새로 만들지 말라는 규칙은 그대로다. 별도 파일이 아니라
//   이 파일 안에서 표기 수위를 나눈다. 데이터 형태(BuilderCardData)는 공용이다.
//
// 카드 전체 클릭
//   C-01 과 달리 카드 안에 다른 링크가 없다. 중첩 <a> 문제가 없으므로
//   ::after 오버레이 대신 <Link> 로 카드를 통째로 감싼다.
//
// POL-12 표기 수위 혼재
//   실사·아바타·미등록이 한 목록에 섞여도 그리드가 무너지면 안 된다.
//   이미지 칸을 고정 크기 aspect-square 로 두고 폴백도 같은 칸을 채우므로,
//   세 유형의 카드 높이가 같다. 이미지 유무로 레이아웃이 달라지지 않는다.
//
// 모션
//   호버 인터랙션은 넣지 않는다. 색 이동만으로 상태를 알린다 (POL-11①-2).

import Image from 'next/image';
import Link from 'next/link';

import { builderCardCopy } from '@/content/component-copy';

export type BuilderCardData = {
  slug: string;
  /** FN-C02-01 — 실명·닉네임 구분 없이 그대로 렌더한다 (POL-12) */
  displayName: string;
  /** 미등록이면 null → 이니셜 폴백 (FN-C02-03) */
  imageUrl: string | null;
  /** 이미지 등록 시 필수 (FN-A02-06). 없으면 표기명이 바로 옆에 있으므로 장식 이미지로 둔다 */
  imageAlt: string | null;
  cohort: number;
  /** FN-C02-05 — 공개 프로젝트만 집계한 수. POL-02 로 0 은 들어오지 않는다 */
  projectCount: number;
};

/**
 * 표기 수위.
 * - `p05` — C-02 기본형. 박스 + 기수 배지 + 담당 프로젝트 수 (FN-C02-04·05)
 * - `p01` — P-01 섹션 5 전용. 원형 + 표기명만 (FN-P01-26 · 29 · 35)
 *
 * 기본값이 `p05` 인 이유: 기능명세 §3.2 가 정의하는 C-02 의 형태가 그쪽이다.
 * 항목을 빼는 쪽이 예외이므로 호출부가 명시하게 둔다.
 */
export type BuilderCardVariant = 'p05' | 'p01';

type BuilderCardProps = {
  data: BuilderCardData;
  variant?: BuilderCardVariant;
};

/**
 * FN-C02-03 — 표기명 첫 글자.
 * `[0]` 이 아니라 `Array.from` 인 이유: 이모지·일부 문자가 서로게이트 쌍이라
 * 인덱스 접근이 반쪽 코드 유닛을 잘라 깨진 글자를 렌더한다.
 */
function initial(displayName: string): string {
  const [first] = Array.from(displayName.trim());
  return first ?? '';
}

const FOCUS_RING =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand';

/** 두 variant 가 공유하는 뼈대. 세로 플렉스 · 가운데 정렬 · 터치 영역 하한 */
const FRAME_BASE = `flex h-full min-h-11 w-full flex-col items-center text-center text-ink ${FOCUS_RING}`;

const FRAME_CLASS: Record<BuilderCardVariant, string> = {
  // C-02 기본형 — 박스가 카드 경계를 만든다
  p05: `${FRAME_BASE} rounded-card border border-border bg-surface-raised p-[var(--space-6)] hover:border-brand`,
  // FN-P01-29 — 외부 박스 없음. 테두리·배경 모두 두지 않는다.
  // 경계가 없으므로 호버는 표기명 색 이동으로 알린다 (POL-11①-2 · 모션 없이)
  p01: `${FRAME_BASE} py-[var(--space-2)] hover:text-brand`,
};

/** 원형 이미지 칸. 폴백도 같은 칸을 채우므로 세 유형의 높이가 같다 (POL-12) */
const AVATAR_BASE =
  'relative aspect-square w-full max-w-24 shrink-0 overflow-hidden rounded-[var(--radius-round)]';

const AVATAR_CLASS: Record<BuilderCardVariant, string> = {
  p05: `${AVATAR_BASE} bg-surface-soft`,
  // FN-P01-35 — 배경 채움 없이 테두리만 (인수 기준 "배경 채움 0건")
  p01: `${AVATAR_BASE} border border-border`,
};

export function BuilderCard({ data, variant = 'p05' }: BuilderCardProps) {
  // P-06(`/builders/[slug]`)이 아직 없어 typedRoutes 가 문자열 href 를 거부한다.
  // UrlObject 형태는 경로 검증 대상이 아니라 통과하고 런타임 동작도 같다.
  // P-06 을 만든 뒤 문자열 템플릿으로 되돌린다. (같은 우회를 project-card.tsx 도 쓴다)
  const detailHref = { pathname: `/builders/${data.slug}` };

  // FN-P01-26 · 29 — P-01 섹션 5 는 원형과 표기명만 남긴다
  const showDetails = variant === 'p05';

  return (
    <article className="h-full w-full">
      {/* FN-C02-06 — 카드 전체가 P-06 진입 링크다.
          min-h-11(44px)은 sm 미만에서도 터치 영역 하한을 보장한다 (REQ-N-014) */}
      <Link href={detailHref} className={FRAME_CLASS[variant]}>
        {/* 원형 · aspect-square 고정.
            shrink-0 이 없으면 세로 플렉스에서 눌려 원이 타원이 된다 —
            카드 높이는 행에서 가장 큰 카드가 정하는데, 눌리는 쪽은 늘 이미지다.
            max-w-24 는 P-01 의 6열 그리드에서 셀이 96px 보다 좁아질 때 원을 줄인다.

            `rounded-round` 는 쓰지 않는다. `--radius-round` 가 design-tokens.css 의
            :root 에만 있고 tailwind-theme.css 의 @theme 에는 없어 유틸 클래스가
            생성되지 않는다 (빌드 CSS 에서 미출력 확인). 변수를 직접 참조한다. */}
        <div className={AVATAR_CLASS[variant]}>
          {data.imageUrl ? (
            // FN-C02-02 — alt 는 등록값을 그대로 쓴다. 화면에서 만들지 않는다.
            // 미등록이면 빈 alt — 표기명이 바로 아래에 있어 중복 낭독이 된다.
            <Image
              src={data.imageUrl}
              alt={data.imageAlt ?? ''}
              fill
              sizes="(min-width: 640px) 96px, 33vw"
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            // FN-C02-03 — 이니셜 폴백. variant 와 무관하게 유지한다.
            // 표기명이 아래에 그대로 있으므로 보조기술에는 읽히지 않게 둔다.
            <span
              aria-hidden="true"
              className="absolute inset-0 flex items-center justify-center font-semibold text-brand text-[length:var(--font-size-xl)] leading-[var(--leading-tight)]"
            >
              {initial(data.displayName)}
            </span>
          )}
        </div>

        {/* FN-C02-01 — 실명·닉네임 어느 쪽이든 같은 자리에 같은 크기로 놓는다 (POL-12) */}
        <h3 className="mt-[var(--space-4)] line-clamp-2 font-semibold text-[length:var(--font-size-lg)] leading-[var(--leading-heading)] tracking-[var(--tracking-heading)]">
          {data.displayName}
        </h3>

        {/* FN-C02-04 — P-01 은 기수를 표기하지 않는다 (FN-P01-26 인수 기준 "기수 표기 0건") */}
        {showDetails && (
          <p className="mt-[var(--space-2)] rounded-pill bg-surface-soft px-[var(--space-3)] py-[var(--space-1)] font-medium text-brand text-[length:var(--font-size-xs)]">
            {builderCardCopy.cohortLabel(data.cohort)}
          </p>
        )}

        {/* FN-C02-05 — mt-auto 로 카드 바닥에 붙여, 표기명이 두 줄로 늘어난 카드와도
            건수 줄의 세로 위치가 어긋나지 않는다 (POL-12) */}
        {showDetails && (
          <p className="mt-auto pt-[var(--space-3)] text-muted text-[length:var(--font-size-sm)]">
            {builderCardCopy.projectCount(data.projectCount)}
          </p>
        )}
      </Link>
    </article>
  );
}
