// C-01 프로젝트 카드 — P-01 · P-03 · P-06 공용
//
// 근거 — 기능명세 §3.1 · 화면설계 §4.1 · POL-02 · POL-03
//   FN-C01-01  실제 화면 썸네일 · alt 필수
//   FN-C01-02  프로젝트명
//   FN-C01-03  요약 1~2줄
//   FN-C01-04  담당 빌더. 복수면 "OOO 외 N명" · P-06 에서는 표기 생략
//   FN-C01-05  분류 배지 최대 2개. 미지정 시 미표시
//   FN-C01-06  제목 · "자세히 보기" → P-04. **삭제 불가** (없으면 P-04 가 고아 페이지가 된다)
//   FN-C01-07  "바로가기" → 외부 서비스. 새 탭 · rel="noopener"
//   FN-C01-08  link_grade = 'none' 이면 바로가기만 미노출. 상세 진입은 유지
//
// 화면별로 별도 카드를 만들지 않는다 (기능명세 §3.1 · 화면설계 §4.1).
// 문구는 content/component-copy.ts 에서만 가져온다. 여기에 문장을 쓰지 않는다.
//
// 카드 전체 클릭
//   <a> 안에 <a> 는 무효라 카드를 링크로 감싸지 않는다. 제목 링크에 ::after 오버레이를
//   깔아 카드 전체를 클릭 영역으로 만들고, 바로가기만 그 위로 올린다 (z-index).
//
// 모션
//   호버 인터랙션은 이 단계에서 넣지 않는다. 색 이동만으로 상태를 알린다 (POL-11①-2).

import Image from 'next/image';
import Link from 'next/link';

import { projectCardCopy } from '@/content/component-copy';

/** POL-03 링크 등급. `none` 이면 외부 링크 버튼이 없다. */
type LinkGrade = 'live' | 'deploy' | 'repo' | 'video' | 'none';

export type ProjectCardData = {
  slug: string;
  title: string;
  summary: string;
  /** POL-02 — 미등록 건은 목록 쿼리에서 이미 제외된다. 여기서는 항상 값이 있다 */
  thumbnailUrl: string;
  thumbnailAlt: string;
  liveUrl: string | null;
  linkGrade: LinkGrade;
  /** 빈 배열이면 배지 줄 자체를 렌더하지 않는다 (FN-C01-05) */
  categories: { name: string }[];
  /** 빈 배열 허용 (FN-C01-04) */
  builders: { displayName: string }[];
};

type ProjectCardProps = {
  data: ProjectCardData;
  /** P-06 은 해당 빌더의 페이지이므로 담당 빌더를 표기하지 않는다 */
  showBuilder?: boolean;
};

/** FN-C01-04 — 0명 생략 · 1명 이름 · 2명 이상 "OOO 외 N명". */
function builderLabel(builders: { displayName: string }[]): string | null {
  const [first, ...rest] = builders;
  if (!first) return null;
  if (rest.length === 0) return first.displayName;
  return projectCardCopy.buildersMore(first.displayName, rest.length);
}

export function ProjectCard({ data, showBuilder = true }: ProjectCardProps) {
  // P-04(`/portfolio/[slug]`)가 아직 없어 typedRoutes 가 문자열 href 를 거부한다.
  // UrlObject 형태는 경로 검증 대상이 아니라 통과하고 런타임 동작도 같다.
  // P-04 를 만든 뒤 문자열 템플릿으로 되돌린다.
  const detailHref = { pathname: `/portfolio/${data.slug}` };
  const builderText = showBuilder ? builderLabel(data.builders) : null;
  const externalLabel =
    data.linkGrade === 'none' || !data.liveUrl ? null : projectCardCopy.linkLabel[data.linkGrade];

  return (
    <article className="relative flex h-full w-full flex-col overflow-hidden rounded-card border border-border bg-surface-raised text-ink">
      {/* FN-C01-01 — alt 는 등록값을 그대로 쓴다. 화면에서 만들지 않는다.
          shrink-0 이 없으면 세로 플렉스에서 눌려 비율이 무너진다 —
          카드 높이는 행에서 가장 큰 카드가 정하는데, 눌리는 쪽은 늘 썸네일이다. */}
      <div className="relative aspect-[16/10] w-full shrink-0 overflow-hidden bg-surface-soft">
        <Image
          src={data.thumbnailUrl}
          alt={data.thumbnailAlt}
          fill
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="absolute inset-0 h-full w-full object-cover"
        />
      </div>

      <div className="flex flex-1 flex-col p-[var(--space-5)]">
        {/* FN-C01-05 — 미지정이면 줄 자체를 두지 않는다. 빈 줄로 리듬을 흐리지 않는다 */}
        {data.categories.length > 0 && (
          <ul className="mb-[var(--space-3)] flex flex-wrap gap-[var(--space-2)]">
            {data.categories.map((category) => (
              <li
                key={category.name}
                className="rounded-pill bg-surface-soft px-[var(--space-3)] py-[var(--space-1)] text-brand text-[length:var(--font-size-xs)] font-medium"
              >
                {category.name}
              </li>
            ))}
          </ul>
        )}

        <h3 className="font-semibold text-[length:var(--font-size-lg)] leading-[var(--leading-heading)] tracking-[var(--tracking-heading)]">
          {/* ::after 가 카드 전체를 덮어 클릭 영역이 된다 (중첩 <a> 없이) */}
          <Link
            href={detailHref}
            className="line-clamp-2 after:absolute after:inset-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            {data.title}
          </Link>
        </h3>

        <p className="mt-[var(--space-2)] line-clamp-2 text-muted text-[length:var(--font-size-sm)] leading-[var(--leading-body)]">
          {data.summary}
        </p>

        {/* 좌 빌더 · 우 버튼. 빌더가 없어도 좌측 칸을 남겨 버튼 위치를 고정한다.
            2칸 그리드 + flex-wrap 이면 버튼 그룹이 카드 폭의 절반만 받아 버튼 2개가
            줄바꿈된다. 한 줄 유지가 조건이므로 flex 한 줄 + shrink-0 으로 바꿨다.
            버튼 높이(min-h-11)가 줄 높이를 정하므로 버튼 1개·2개 카드의 하단 줄 높이가 같다. */}
        <div className="mt-auto flex flex-col gap-[var(--space-3)] pt-[var(--space-5)] sm:flex-row sm:items-center sm:justify-between">
          <p className="min-w-0 truncate text-muted text-[length:var(--font-size-sm)]">
            {builderText}
          </p>

          <div className="flex shrink-0 items-center gap-[var(--space-2)]">
            <Link
              href={detailHref}
              aria-label={`${data.title} ${projectCardCopy.detail}`}
              className="relative z-1 inline-flex min-h-11 items-center whitespace-nowrap rounded-pill bg-brand px-[var(--space-4)] font-semibold text-ink-inverse text-[length:var(--font-size-sm)] hover:bg-brand-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              {projectCardCopy.detail}
            </Link>

            {/* FN-C01-07·08 — 등급이 none 이거나 주소가 없으면 렌더하지 않는다 */}
            {externalLabel && data.liveUrl && (
              <a
                href={data.liveUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${data.title} ${externalLabel}, ${projectCardCopy.newWindow}`}
                className="relative z-1 inline-flex min-h-11 items-center gap-[var(--space-2)] whitespace-nowrap rounded-pill border border-border px-[var(--space-4)] font-medium text-ink text-[length:var(--font-size-sm)] hover:border-brand hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              >
                {externalLabel}
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
                  <path d="M14 4h6v6" />
                  <path d="M20 4 11 13" />
                  <path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
                </svg>
              </a>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
