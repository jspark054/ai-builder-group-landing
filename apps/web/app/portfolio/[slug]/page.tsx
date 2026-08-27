// P-04 프로젝트 상세 `/portfolio/{slug}`
//
// **색인 우선순위 1위 화면이다.**
//
// 근거 — 화면설계 §5.3 · 기능명세 §4.3 · 화면목록(IA) §3.1 · POL-03 · POL-06
//   FN-P04-01  프로젝트명을 h1 으로 표시한다. 슬러그는 검색어와 일치시킨다
//   FN-P04-02  대표 이미지를 표시한다 (alt 존재 · OG 이미지로 지정)
//   FN-P04-03  본문을 4문항 구조로 표시한다 (4개 소제목이 h2 로 렌더)
//   FN-P04-04  본문 문단을 2~3줄 단위로 구성한다
//   FN-P04-06  링크 등급에 따른 바로가기 버튼 (POL-03 — `none` 은 미노출)
//   FN-P04-07  담당 빌더 전원을 P-06 으로 링크한다
//   FN-P04-09  self canonical
//   FN-P04-10  구조화 데이터 `Article`
//   FN-COM-04  외부 링크는 `target="_blank"` · `rel="noopener"`
//
// 서버 컴포넌트다. getProjectDetail() 은 service role 로 읽으므로 클라이언트에서
// 부르면 안 된다 (lib/queries/project-detail.ts 머리말 참조). 이 화면에 클라이언트
// 경계가 없어 공개 화면 조건(REQ-N-001 서버 렌더 HTML)이 그대로 성립한다.
//
// 판단 다섯 가지를 여기에 남긴다.
//
// 1) 문의 CTA(FN-P04-08)를 렌더한다 — 08-26 추가
//    C-03 의 목적지인 P-10 `/contact` 이 8/22 에 열리면서(플러그 폼으로 넘기는 화면)
//    「목적지가 404 라 비워 둔다」는 종전 사유가 해소됐다. 도면(§5.3)대로 본문과
//    담당 빌더 **사이**에 둔다. 대체 CTA 는 여전히 만들지 않는다 (REQ-F-007).
//
// 2) PageHeader 를 쓰지 않는다
//    PageHeader 는 h1 + 서브카피 두 개짜리 껍데기다. 이 화면의 헤더에는 목록 복귀
//    링크와 분류 배지가 더 붙는다. 껍데기에 슬롯을 늘리면 P-03 · P-09 가 함께 흔들린다.
//    그래서 배경·컨테이너 클래스만 같은 값으로 맞춰 쓴다 (Section 미수정 규칙과 같은 처리).
//
// 3) 본문 사이 이미지(FN-P04-05)를 두지 않는다
//    쓸 이미지가 없다. 자리만 잡아 두면 빈 상자가 되고, 코드로 SVG 를 그려 채우는
//    것은 하드 룰 3 위반이다. 이미지를 수령하면 문항 사이에 넣는다.
//
// 4) 본문을 마크다운으로 렌더하지 않는다
//    `body_*` 4열은 개행 없는 평문이다 (8/19 실측). renderMarkdown 을 태우면
//    관리자가 넣지 않은 서식이 생길 여지만 만든다. 문단 하나로 그대로 낸다.
//
// 5) 담당 빌더에 C-02 카드를 쓰지 않는다
//    C-02 의 사용 화면은 **P-01 · P-05** 다 (화면설계 §4.2). 이 화면이 쓰면 기수·
//    담당 건수까지 딸려 와 도면에 없는 정보가 붙고 쿼리도 늘어난다. 이름 + 링크만 낸다.

import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { ContactCta } from '@/components/cta/contact-cta';
import { PlaceholderNotice } from '@/components/PlaceholderNotice';
import { placeholderNoticeCopy, projectCardCopy } from '@/content/component-copy';
import { projectArticleJsonLd, projectUrl } from '@/lib/jsonld';
import {
  getProjectDetail,
  getPublicProjectSlugs,
  type ProjectDetailData,
} from '@/lib/queries/project-detail';
import { siteLocale } from '@/lib/site';

import { p04Copy } from './p04-copy';

/**
 * IA §3.1 — 렌더링 `SSG+ISR`.
 *
 * getProjectDetail() 은 supabase-js 로 읽어 Next 의 fetch 캐시를 타지 않는다.
 * P-01 · P-03 과 같은 주기로 맞춘다 — 같은 데이터를 보여주는 세 화면의 신선도가
 * 갈라지면 목록과 상세의 내용이 어긋난다.
 */
export const revalidate = 3600;

/**
 * 공개 프로젝트의 상세 경로를 빌드 시점에 굳힌다.
 *
 * 슬러그가 **자연어 한글**이다 (REQ-N-013). 여기에는 디코딩된 원문을 그대로 넘긴다 —
 * Next 가 경로를 만들 때 인코딩하고, 요청이 오면 다시 디코딩해 params 로 준다.
 * 여기서 encodeURIComponent 를 하면 이중 인코딩이 되어 매칭이 깨진다.
 *
 * 목록이 비어도(로컬 빌드처럼 Supabase 미설정) 빈 배열이면 된다 —
 * dynamicParams 기본값이 true 라 런타임에 요청이 오면 그때 렌더한다.
 */
export async function generateStaticParams(): Promise<{ slug: string }[]> {
  const slugs = await getPublicProjectSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProjectDetail(decodeSlug(slug));

  // 404 로 갈 경로에는 메타를 만들지 않는다. 레이아웃 기본값이 남는다
  if (!project) return {};

  /**
   * A-03 에서 입력한 값이 있으면 그것이 우선이다 (FN-A03-12 · POL-06).
   *
   * 🔴 `metaTitle` 은 **접미사까지 포함된 완성된 제목**이다. 여기서 뒤에 무엇을 붙이지
   *    않는다 (08-27 사용자 지시). 건마다 접미사 길이를 달리해야 40자 상한에 맞출 수
   *    있어서다 — 「우리동네광고」는 「AI 빌더그룹 포트폴리오」를 붙이면 42자가 된다.
   *
   * 미입력이면 지금까지 쓰던 방식으로 떨어진다. ⚠ 그 fallback 의 description 은
   * `summary`(44~50자)라 POL-06 하한(80자)에 미달한다 — 값이 채워지면 해소된다.
   */
  const title = project.metaTitle ?? `${project.title} | ${p04Copy.metaTitleSuffix}`;
  // 새 문장을 만들지 않는다 (POL-13). 둘 다 A-03 에서 입력한 값이거나 기존 컬럼이다
  const description = project.metaDescription ?? project.summary;

  return {
    // absolute 로 넘기는 이유: 루트 layout 의 `%s | {siteName}` 템플릿을 타면
    // 사이트명이 두 번 붙어 40자 제한을 넘긴다
    title: { absolute: title },
    description,
    // FN-P04-09 — self canonical. 한글 슬러그라 인코딩된 절대 URL 로 넘긴다
    alternates: { canonical: projectUrl(project.slug) },
    openGraph: {
      type: 'article',
      title,
      description,
      url: projectUrl(project.slug),
      // FN-P04-02 — 대표 이미지를 OG 이미지로 지정한다.
      // ⚠ 5건 중 4건이 SVG 플레이스홀더다. 대부분의 크롤러가 SVG 를 OG 이미지로
      //   읽지 못한다. 대체본을 만들지 않는다 (하드 룰 3) — 실이미지 수령 시 해소된다
      images: [{ url: project.thumbnailUrl, alt: project.thumbnailAlt }],
    },
  };
}

/**
 * 라우트 파라미터를 DB 의 슬러그 값으로 되돌린다.
 *
 * **Next 16 은 `params` 를 디코딩해 주지 않는다.** 슬러그가 자연어 한글이라
 * (REQ-N-013) 여기 들어오는 값은 `%EC%97%90%EB%93%80%EC%85%80%ED%8C%8C` 형태다.
 * 빌드 시점(generateStaticParams 로 만든 경로)에도 요청 시점에도 똑같이 인코딩돼
 * 있다 — 8/19 실측. 이걸 그대로 조회하면 **전 건이 404 가 된다.**
 *
 * 이미 디코딩된 값이 들어와도 안전하다 — 한글에는 `%` 가 없어 그대로 통과한다.
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

/** 컨테이너 폭·좌우 여백. PageHeader · P-03 과 같은 값이다 */
const CONTAINER = 'mx-auto w-full max-w-[var(--layout-container)] px-[var(--layout-gutter)]';

/** FN-P04-03 — 4문항. 순서 고정. 데이터가 비어도 항목을 빼지 않는다 */
function bodySections(project: ProjectDetailData): { heading: string; body: string }[] {
  return [
    { heading: p04Copy.bodyHeadings.what, body: project.bodyWhat },
    { heading: p04Copy.bodyHeadings.why, body: project.bodyWhy },
    { heading: p04Copy.bodyHeadings.how, body: project.bodyHow },
    { heading: p04Copy.bodyHeadings.result, body: project.bodyResult },
  ];
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = await getProjectDetail(decodeSlug(slug));

  // 화면설계 §5.3 — 비공개·없는 슬러그는 404. 쿼리가 이미 is_public 을 걸렀다
  if (!project) notFound();

  // FN-P04-06 · POL-03 — 등급이 none 이거나 주소가 없으면 버튼 자체를 렌더하지 않는다
  const externalLabel =
    project.linkGrade === 'none' || !project.liveUrl
      ? null
      : projectCardCopy.linkLabel[project.linkGrade];

  // FN-P04-10 — Article. 화면 본문보다 답변엔진이 먼저 읽는다 (REQ-N-001 · GEO)
  const jsonLd = projectArticleJsonLd({
    slug: project.slug,
    title: project.title,
    description: project.summary,
    imageUrl: project.thumbnailUrl,
    publishedAt: project.createdAt,
    updatedAt: project.updatedAt,
    authorNames: project.builders.map((builder) => builder.displayName),
    categories: project.categories.map((category) => category.name),
    locale: siteLocale,
  });

  return (
    <>
      <script
        type="application/ld+json"
        // 생성기가 만든 객체만 넣는다. 사용자 입력을 문자열로 이어 붙이지 않는다
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* 디자인규칙 「다른 공개 화면」 — 페이지 헤더 bg-canvas + text-ink-inverse */}
      <header className="bg-canvas text-ink-inverse">
        <div className={`${CONTAINER} py-[var(--section-block)]`}>
          {/* 화면설계 §5.3 도면 최상단. 목록으로 되돌아가는 유일한 경로다 */}
          <Link
            href="/portfolio"
            className="inline-flex min-h-11 items-center gap-[var(--space-2)] text-subtle text-[length:var(--font-size-sm)] hover:text-ink-inverse focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
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
              <path d="m15 18-6-6 6-6" />
            </svg>
            {p04Copy.backToList}
          </Link>

          {/* FN-P04-01 — 프로젝트명 h1. 화면에 h1 은 이것 하나뿐이다 */}
          <h1 className="mt-[var(--space-6)] max-w-[var(--layout-content)] font-bold text-[length:var(--font-size-display-md)] leading-[var(--leading-tight)] tracking-[var(--tracking-tight)]">
            {project.title}
          </h1>

          {/* 화면설계 §5.3 — 분류 **전부**. C-01 의 "최대 2개"는 카드 규칙이라 여기 없다.
              배지 모양은 C-01 과 같은 값을 쓴다 (rounded-pill · surface-soft · brand) */}
          {project.categories.length > 0 && (
            <ul className="mt-[var(--space-6)] flex flex-wrap gap-[var(--space-2)]">
              {project.categories.map((category) => (
                <li
                  key={category.name}
                  className="rounded-pill bg-surface-soft px-[var(--space-3)] py-[var(--space-1)] font-medium text-brand text-[length:var(--font-size-xs)]"
                >
                  {category.name}
                </li>
              ))}
            </ul>
          )}
        </div>
      </header>

      {/* 디자인규칙 「다른 공개 화면」 — 본문은 한 덩어리로 밝게 간다 */}
      <div className="bg-surface-raised text-ink">
        <div className={`${CONTAINER} py-[var(--section-block)]`}>
          {/* FN-P04-02 — 대표 이미지. alt 는 등록값을 그대로 쓴다. 화면에서 만들지 않는다.
              등록 썸네일 5건의 비율은 1.44~2.12 로 제각각이다 (16:10 로 통일돼 있지 않다).
              16:10 상자 + object-cover 라 크롭이 생기지만, C-01 카드와 같은 규칙이므로
              목록에서 보던 잘림새가 상세에서도 그대로 이어진다.

              매트 — C-01 과 같은 처리다 (8/21). 색은 `border-strong`
              (= --primitive-blue-100 #d4e3fe). `surface-soft`(#ecf3ff) 를 쓰면 안 된다 —
              P-01 섹션 4 배경이 그 값이라 카드 쪽에서 매트가 사라진다.
              패딩만 카드(--space-4)보다 크다. 이 이미지는 폭 896px 이라 16px 을 두면
              매트가 테두리처럼 보인다. 32px 이 카드의 매트 비율(약 4%)과 맞는 값이다 */}
          <div className="w-full max-w-[var(--layout-content-wide)] overflow-hidden rounded-card border border-border bg-border-strong p-[var(--space-8)]">
            <div className="relative aspect-[16/10] w-full overflow-hidden rounded-card bg-surface-raised">
              <Image
                src={project.thumbnailUrl}
                alt={project.thumbnailAlt}
                fill
                priority
                sizes="(min-width: 1024px) 56rem, 100vw"
                className="absolute inset-0 h-full w-full object-cover"
              />
            </div>
          </div>

          {/* FN-P04-06 · FN-COM-04 — 외부 링크는 새 탭 · rel="noopener".
              등급 none 4건은 여기 자체가 렌더되지 않는다 */}
          {externalLabel && project.liveUrl && (
            <div className="mt-[var(--space-6)]">
              <a
                href={project.liveUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${project.title} ${externalLabel}, ${projectCardCopy.newWindow}`}
                className="inline-flex min-h-11 items-center gap-[var(--space-2)] rounded-pill bg-brand px-[var(--space-6)] font-semibold text-ink-inverse text-[length:var(--font-size-md)] hover:bg-brand-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
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
            </div>
          )}

          {/* FN-P04-03 · 04 — 4문항이 그대로 h2 가 된다. 문단은 자기완결 블록 하나다.
              본문 사이 이미지(FN-P04-05)는 두지 않는다 — 이미지가 없다 */}
          <div className="mt-[var(--space-12)] max-w-[var(--layout-copy)]">
            {bodySections(project).map((section) => (
              <section key={section.heading} className="mt-[var(--space-10)] first:mt-0">
                <h2 className="font-semibold text-[length:var(--font-size-xl)] leading-[var(--leading-heading)] tracking-[var(--tracking-heading)]">
                  {section.heading}
                </h2>
                <p className="mt-[var(--space-4)] whitespace-pre-line text-muted text-[length:var(--font-size-md)] leading-[var(--leading-relaxed)]">
                  {section.body}
                </p>
              </section>
            ))}
          </div>

          {/* FN-P04-08 — C-03 문의 CTA. 도면(§5.3)이 본문과 담당 빌더 **사이**에 둔다.
              문구·파라미터는 C-03 이 갖는다 (contactCtaCopy.label.portfolio ·
              `ref={slug}&utm_source=portfolio`). 대체 버튼을 곁들이지 않는다 (REQ-F-007) */}
          <div className="mt-[var(--space-12)]">
            <ContactCta source="p04" slug={project.slug} />
          </div>

          {/* FN-P04-07 — 담당 빌더 전원. 각각 P-06 으로 보낸다.
              「대표」 표기를 만들지 않는다 — 화면설계·기능명세에 대표 표기 규칙이 없다.
              is_owner 는 쿼리의 정렬 근거로만 쓰인다 */}
          {project.builders.length > 0 && (
            <section className="mt-[var(--space-12)] max-w-[var(--layout-content)] border-t border-border pt-[var(--space-8)]">
              <h2 className="font-semibold text-[length:var(--font-size-lg)] leading-[var(--leading-heading)] tracking-[var(--tracking-heading)]">
                {p04Copy.builders}
              </h2>
              <ul className="mt-[var(--space-4)] flex flex-wrap gap-[var(--space-3)]">
                {project.builders.map((builder) => (
                  <li key={builder.slug} className="flex">
                    {/* P-06(`/builders/[slug]`)이 아직 없어 typedRoutes 가 문자열 href 를
                        거부한다. UrlObject 는 경로 검증 대상이 아니라 통과하고 런타임
                        동작도 같다. P-06 을 만든 뒤 문자열 템플릿으로 되돌린다.
                        (같은 우회를 cards/builder-card.tsx 도 쓴다) */}
                    <Link
                      href={{ pathname: `/builders/${builder.slug}` }}
                      className="inline-flex min-h-11 items-center gap-[var(--space-2)] rounded-pill border border-border px-[var(--space-5)] font-medium text-ink text-[length:var(--font-size-sm)] hover:border-brand hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                    >
                      {builder.displayName}
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
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* 실데이터 반영 시 이 블록을 지운다 (components/PlaceholderNotice.tsx 참조).
              본문 하단이다 — 읽기를 끝낸 자리에서 밝힌다 */}
          <div className="mt-[var(--space-12)] max-w-[var(--layout-content)]">
            <PlaceholderNotice text={placeholderNoticeCopy.portfolio} />
          </div>
        </div>
      </div>
    </>
  );
}
