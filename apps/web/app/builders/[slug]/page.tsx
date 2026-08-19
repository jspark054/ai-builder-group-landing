// P-06 빌더 상세 `/builders/{slug}`
//
// **영업팀이 발주자에게 단독 전달하는 자료다. 이 URL 하나로 설득이 성립해야 한다.**
//
// 근거 — 화면설계 §5.5 · 기능명세 §4.5 · 화면목록(IA) §3.1 · POL-02 · POL-05
//   FN-P06-01  프로필(표기명 · 이미지 · 기수 · 수료 과정 · 이력)을 표시한다
//   FN-P06-02  담당 프로젝트를 추가 클릭 없이 C-01 요약 카드로 전개한다
//   FN-P06-03  각 카드에서 P-04 로 이동한다 (FN-C01-06 — 카드가 갖는다)
//   FN-P06-04  각 카드에서 외부 서비스로 이동한다 (FN-C01-07 — 카드가 갖는다)
//   FN-P06-05  수료 과정명을 **텍스트로만** 표시한다 (링크 요소 0개 · P-08 폐지)
//   FN-P06-07  이력 최대 5개 (POL-05)
//   FN-P06-08  self canonical
//   화면설계 §3.1  이 화면의 C-01 은 **담당 빌더 표기를 생략**한다
//
// 서버 컴포넌트다. getBuilderDetail() 은 service role 로 읽으므로 클라이언트에서
// 부르면 안 된다 (lib/queries/builder-detail.ts 머리말 참조). 이 화면에 클라이언트
// 경계가 없어 공개 화면 조건(REQ-N-001 서버 렌더 HTML)이 그대로 성립한다.
//
// 판단 여섯 가지를 여기에 남긴다.
//
// 1) 문의 CTA(FN-P06-06)를 렌더하지 않는다
//    C-03 의 목적지인 **P-10 `/contact` 이 아직 없다.** 붙이면 화면에서 가장 큰
//    버튼이 404 로 간다. P-04 와 같은 처리다. 대체 CTA 도 만들지 않는다 (REQ-F-007).
//    **P-10 을 만들면 담당 프로젝트 뒤에 `<ContactCta source="p06" slug={builder.slug} />`
//    한 줄을 넣는다.** 부품·문구·파라미터는 이미 준비돼 있다
//    (components/cta/contact-cta.tsx · contactCtaCopy.label.builder).
//
// 2) 인트로(FN-P06-09)를 렌더하지 않는다
//    기능명세 §4.5 의 인트로 문안은 「기획-2안 카피 (v3.0)」으로 명시돼 있고
//    기획-2안은 결정시트 `I-7` 의 교체 대상이다. 기획안·PRD 에 대체 문구가 없어
//    지어내지 않았다 (CLAUDE.md 「카피 기준」). 확정 문안 수령 시 h1 아래에 넣는다.
//
// 3) 이력 접기(FN-P06-07)를 만들지 않는다
//    상한 5개는 지킨다(쿼리가 자른다). 초과분 접기는 `<summary>` 라벨 문구가
//    필요한데 확정 문구가 없다. `career` 가 전 건 `[]` 이라 현재 도달하지 않는 분기다.
//
// 4) C-02 빌더 카드를 쓰지 않는다
//    C-02 의 사용 화면은 **P-01 · P-05** 다 (화면설계 §4.2). 이 화면은 프로필이
//    본문이므로 카드를 얹으면 같은 정보가 두 번 나온다. 이니셜 폴백 규칙만 공유한다
//    (lib/display-name.ts).
//
// 5) 목록 복귀 링크를 두지 않는다
//    §5.5 도면에 없고, 목록인 P-05 `/builders` 가 아직 없어 404 로 간다.
//    P-05 를 만들 때 P-04 와 같은 형태로 넣는다.
//
// 6) 빈 값 블록을 렌더하지 않는다 (POL-02)
//    `bio` 는 null, `career` 는 `[]`, `course_id` 는 null 이다 — 전부 의도된 값이고
//    발주사 수령 대상이다. 라벨만 남는 빈 블록을 만들지 않는다. 값을 지어내지도 않는다.
//    담당 프로젝트 0건도 같은 처리다. **404 로 만들지 않는다** — POL-02 는
//    「목록에 노출하지 않는다」까지만 규정하고 상세의 404 를 정하지 않는다.

import type { Metadata } from 'next';
import Image from 'next/image';

import { ProjectCard } from '@/components/cards/project-card';
import { PlaceholderNotice } from '@/components/PlaceholderNotice';
import { builderCardCopy, placeholderNoticeCopy } from '@/content/component-copy';
import { displayNameInitial } from '@/lib/display-name';
import { getBuilderDetail, getPublicBuilderSlugs } from '@/lib/queries/builder-detail';
import { absoluteUrl } from '@/lib/site';
import { notFound } from 'next/navigation';

import { p06Copy } from './p06-copy';

/**
 * IA §3.1 — 렌더링 `SSG+ISR`.
 *
 * getBuilderDetail() 은 supabase-js 로 읽어 Next 의 fetch 캐시를 타지 않는다.
 * P-01 · P-03 · P-04 와 같은 주기로 맞춘다 — 같은 데이터를 보여주는 화면들의
 * 신선도가 갈라지면 목록과 상세의 내용이 어긋난다.
 */
export const revalidate = 3600;

/** P-06 상세 URL. 슬러그가 언젠가 한글이 될 수 있으므로 인코딩해 둔다 (REQ-N-013) */
function builderUrl(slug: string): string {
  return absoluteUrl(`/builders/${encodeURIComponent(slug)}`);
}

/**
 * 라우트 파라미터를 DB 의 슬러그 값으로 되돌린다.
 *
 * **Next 16 은 `params` 를 디코딩해 주지 않는다** (8/19 P-04 에서 실측).
 * 현재 슬러그는 `builder-a` ~ `builder-f` 라 ASCII 뿐이지만, 빌더 슬러그도
 * `REQ-N-013` 대상이라 실명·닉네임 기반 한글로 바뀔 수 있다. 그때 전 건이 404 가
 * 되는 사고를 막으려고 P-04 와 같은 처리를 지금 넣는다.
 *
 * 반쪽짜리 `%` 가 든 주소는 decodeURIComponent 가 URIError 를 던지므로 원문을
 * 돌려주고 조회에서 404 로 떨어뜨린다. 여기서 throw 하면 500 이 된다.
 */
function decodeSlug(raw: string): string {
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

/**
 * 공개 빌더의 상세 경로를 빌드 시점에 굳힌다.
 *
 * 담당 프로젝트 0건인 빌더는 목록에서 빠지므로(POL-02) 여기에도 오지 않는다 —
 * 프리렌더 대상이 아닐 뿐 404 는 아니다. dynamicParams 기본값이 true 라
 * 주소를 직접 치면 런타임에 렌더된다 (담당 프로젝트 절만 비어 나온다).
 * 디코딩된 원문을 그대로 넘긴다 — Next 가 경로를 만들 때 인코딩한다.
 */
export async function generateStaticParams(): Promise<{ slug: string }[]> {
  const slugs = await getPublicBuilderSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const builder = await getBuilderDetail(decodeSlug(slug));

  // 404 로 갈 경로에는 메타를 만들지 않는다. 레이아웃 기본값이 남는다
  if (!builder) return {};

  return {
    // POL-06 — 표기명이 맨 앞에 온다(핵심 키워드 앞 15자 이내).
    // absolute 로 넘기는 이유: 루트 layout 의 `%s | {siteName}` 템플릿을 타면
    // 사이트명이 두 번 붙는다
    title: { absolute: `${builder.displayName} | ${p06Copy.metaTitleSuffix}` },
    // ⚠ description 을 넣지 않는다. 근거가 될 문장이 `bio` 인데 전 건 null 이고,
    //   여기서 소개 문장을 지어내는 것은 카피 기준 위반이다 (CLAUDE.md · POL-13).
    //   루트 layout 의 사이트 설명이 그대로 쓰인다. bio 가 채워지면 여기에 싣는다.
    // FN-P06-08 — self canonical
    alternates: { canonical: builderUrl(builder.slug) },
    openGraph: {
      type: 'profile',
      title: `${builder.displayName} | ${p06Copy.metaTitleSuffix}`,
      url: builderUrl(builder.slug),
      // ⚠ 이미지도 전 건 미등록이라 og:image 가 없다. 코드로 만들지 않는다 (하드 룰 3).
      //   PRD `FR-2.9` ③이 "이미지 없는 빌더도 텍스트 기반 자동 생성"을 요구하는데
      //   생성 수단이 확정되지 않았다 — 별건으로 남긴다
      ...(builder.imageUrl
        ? { images: [{ url: builder.imageUrl, alt: builder.imageAlt ?? builder.displayName }] }
        : {}),
    },
  };
}

/** 컨테이너 폭·좌우 여백. PageHeader · P-03 · P-04 와 같은 값이다 */
const CONTAINER = 'mx-auto w-full max-w-[var(--layout-container)] px-[var(--layout-gutter)]';

export default async function BuilderDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const builder = await getBuilderDetail(decodeSlug(slug));

  // 화면설계 §5.5 — 비공개 빌더 접근은 404. 쿼리가 이미 is_public 을 걸렀다.
  // 없는 슬러그도 같은 경로로 404 가 된다.
  //
  // **담당 프로젝트 0건은 404 가 아니다.** POL-02 는 「프로젝트 0건인 빌더 —
  // 목록에 노출하지 않는다」까지만 규정하고 상세의 404 를 정하지 않는다. 기능명세
  // §4.5 예외처리표는 오히려 「빈 상태 안내」로 적고 있다. 확정 문서에 없는 동작을
  // 만들지 않는다. 아래 담당 프로젝트 절이 0건이면 목록만 비운다.
  if (!builder) notFound();

  return (
    <>
      {/* 디자인규칙 「다른 공개 화면」 — 페이지 헤더 bg-canvas + text-ink-inverse */}
      <header className="bg-canvas text-ink-inverse">
        <div className={`${CONTAINER} py-[var(--section-block)]`}>
          {/* §5.5 도면 — 좌측 원형 프로필, 우측 표기명·기수. 좁은 화면에서는 세로로 쌓인다 */}
          <div className="flex flex-col gap-[var(--space-6)] sm:flex-row sm:items-center sm:gap-[var(--space-8)]">
            {/* 원형 · aspect-square 고정. shrink-0 이 없으면 가로 플렉스에서 눌려 타원이 된다.
                `rounded-round` 는 쓰지 않는다 — `--radius-round` 가 @theme 에 없어
                유틸 클래스가 생성되지 않는다 (C-02 와 같은 이유). 변수를 직접 참조한다 */}
            <div className="relative aspect-square w-24 shrink-0 overflow-hidden rounded-[var(--radius-round)] border border-border">
              {builder.imageUrl ? (
                // alt 는 등록값을 그대로 쓴다. 화면에서 만들지 않는다.
                // 미등록이면 빈 alt — 표기명이 바로 옆에 있어 중복 낭독이 된다
                <Image
                  src={builder.imageUrl}
                  alt={builder.imageAlt ?? ''}
                  fill
                  priority
                  sizes="96px"
                  className="absolute inset-0 h-full w-full object-cover"
                />
              ) : (
                // POL-02 — 이미지 미등록 폴백. 규칙은 C-02 와 공유한다 (lib/display-name.ts)
                <span
                  aria-hidden="true"
                  className="absolute inset-0 flex items-center justify-center font-semibold text-ink-inverse text-[length:var(--font-size-xl)] leading-[var(--leading-tight)]"
                >
                  {displayNameInitial(builder.displayName)}
                </span>
              )}
            </div>

            <div className="min-w-0">
              {/* FN-P06-01 — 표기명 h1. 실명·닉네임 구분 없이 그대로 렌더한다 (POL-12) */}
              <h1 className="font-bold text-[length:var(--font-size-display-md)] leading-[var(--leading-tight)] tracking-[var(--tracking-tight)]">
                {builder.displayName}
              </h1>

              {/* FN-P06-01 기수 · FN-P06-05 수료 과정.
                  수료 과정은 **텍스트다.** 링크 요소를 두지 않는다 (P-08 폐지 · 인수 기준 "링크 요소 0개").
                  미연결이면 렌더하지 않는다 — 라벨만 남는 빈 자리를 만들지 않는다 */}
              <div className="mt-[var(--space-4)] flex flex-wrap items-center gap-[var(--space-3)]">
                <p className="rounded-pill bg-surface-soft px-[var(--space-3)] py-[var(--space-1)] font-medium text-brand text-[length:var(--font-size-xs)]">
                  {builderCardCopy.cohortLabel(builder.cohort)}
                </p>
                {builder.courseTitle && (
                  <p className="text-subtle text-[length:var(--font-size-sm)]">
                    {builder.courseTitle}
                  </p>
                )}
              </div>

              {/* §5.5 도면 「한 줄 소개」. 라벨이 없는 자리라 문단만 놓는다.
                  null 이면 이 블록 자체가 없다 (POL-02) */}
              {builder.bio && (
                <p className="mt-[var(--space-4)] max-w-[var(--layout-copy)] text-subtle text-[length:var(--font-size-lg)] leading-[var(--leading-relaxed)]">
                  {builder.bio}
                </p>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* 디자인규칙 「다른 공개 화면」 — 본문은 한 덩어리로 밝게 간다 */}
      <div className="bg-surface-raised text-ink">
        <div className={`${CONTAINER} py-[var(--section-block)]`}>
          {/* FN-P06-07 · POL-05 — 최대 5개. 쿼리가 이미 잘라서 넘긴다.
              빈 배열이면 제목까지 통째로 렌더하지 않는다 (POL-02) */}
          {builder.career.length > 0 && (
            <section className="max-w-[var(--layout-content)]">
              <h2 className="font-semibold text-[length:var(--font-size-lg)] leading-[var(--leading-heading)] tracking-[var(--tracking-heading)]">
                {p06Copy.career}
              </h2>
              <ul className="mt-[var(--space-4)] flex flex-col gap-[var(--space-3)]">
                {builder.career.map((entry) => (
                  <li
                    key={`${entry.period} ${entry.org} ${entry.title}`}
                    className="flex flex-col gap-[var(--space-1)] border-t border-border pt-[var(--space-3)] sm:flex-row sm:items-baseline sm:justify-between sm:gap-[var(--space-4)]"
                  >
                    <p className="font-medium text-[length:var(--font-size-md)]">
                      {entry.title}
                      <span className="ml-[var(--space-2)] font-normal text-muted text-[length:var(--font-size-sm)]">
                        {entry.org}
                      </span>
                    </p>
                    <p className="shrink-0 text-muted text-[length:var(--font-size-sm)]">
                      {entry.period}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* 실데이터 반영 시 이 블록을 지운다 (components/PlaceholderNotice.tsx 참조).
              빌더 문구를 쓴다 — 이 화면의 임시 데이터는 빌더 쪽이다.
              담당 프로젝트 절 밖에 둔다. 0건이어도 「표시된 빌더는 예시」는 여전히 사실이다 */}
          <div className={builder.career.length > 0 ? 'mt-[var(--space-12)]' : ''}>
            <PlaceholderNotice text={placeholderNoticeCopy.builder} />
          </div>

          {/* FN-P06-02 — 담당 프로젝트를 추가 클릭 없이 전부 전개한다.
              0건이면 제목까지 통째로 렌더하지 않는다 — 라벨만 남는 빈 블록을 만들지
              않는다는 POL-02 원칙("빈 요소를 렌더하지 않는다")을 bio · career 와 같게 적용한다.
              기능명세 §4.5 는 「빈 상태 안내」로 적지만 P-06 용 안내 문구가 확정돼 있지
              않아 문장을 지어내지 않았다 (P-03 의 emptyState 는 그 화면 전용 지시 문안이다).
              목록 쪽에서 0건 빌더가 이미 빠지므로(POL-02) 실제로 오는 경로는
              직접 주소 입력뿐이다 */}
          {builder.projects.length > 0 && (
            <section className="mt-[var(--space-12)]">
              <h2 className="font-semibold text-[length:var(--font-size-xl)] leading-[var(--leading-heading)] tracking-[var(--tracking-heading)]">
                {p06Copy.projects}
              </h2>

              <ul className="mt-[var(--space-6)] grid grid-cols-1 gap-[var(--space-6)] md:grid-cols-2 lg:grid-cols-3">
                {builder.projects.map((project) => (
                  <li key={project.slug} className="flex">
                    {/* 화면설계 §3.1 — 이 화면의 C-01 은 담당 빌더 표기를 생략한다.
                        빌더 본인의 페이지라 이름이 한 번 더 나오면 중복이다.
                        `showBuilder` prop 을 실제로 쓰는 유일한 호출부다 */}
                    <ProjectCard data={project} showBuilder={false} />
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* FN-P06-06 문의 CTA 는 여기 들어간다. P-10 `/contact` 미구현이라 비워 둔다 —
              머리말 판단 1 참조. 대체 버튼을 만들지 않는다 (REQ-F-007) */}
        </div>
      </div>
    </>
  );
}
