import { z } from 'zod';

/**
 * Content model for AI 빌더 그룹 랜딩 페이지, per
 * `project-docs/기획안_확정본_AI빌더그룹_랜딩페이지_v1.0.md` §5.
 *
 * Four content types: builders, projects, posts (blog), education.
 *
 * `inquiries` is deliberately NOT modeled here. The contact form is a
 * plug(pluuug) embed, and plug's own CRM owns storage and the lead list —
 * see `wiki/decisions/ADR-0004-plug-form-integration.md`. Do not add an
 * inquiries schema without first revisiting that ADR.
 */

/**
 * Content lifecycle. The admin app moves a post through these states;
 * the web app only ever renders `published`.
 */
export const PostStatus = z.enum(['draft', 'in_review', 'scheduled', 'published', 'archived']);
export type PostStatus = z.infer<typeof PostStatus>;

/**
 * Provenance of every image in the repo.
 *
 * HARD RULE (see CLAUDE.md § Image Policy): the only machine-generated
 * value allowed here is `codex-imagegen`. An agent may never write
 * `claude` or any other model — Claude image synthesis is forbidden.
 *
 * `user-upload` covers images a human attaches through the admin editor,
 * including Supabase Storage uploads. Uploading is not generating.
 */
export const ImageSource = z.enum(['codex-imagegen', 'user-upload', 'web-search', 'none']);
export type ImageSource = z.infer<typeof ImageSource>;

export const ImageSchema = z.object({
  src: z.string().min(1),
  alt: z.string().min(1, 'alt text is required for accessibility and SEO'),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  /** Where the image came from. Required so review can audit provenance. */
  source: ImageSource,
  /** Original prompt (codex-imagegen) or source URL (web-search). */
  origin: z.string().optional(),
  credit: z.string().optional(),
  license: z.string().optional(),
});
export type Image = z.infer<typeof ImageSchema>;

/** Sitemap hints, surfaced per-post so editors can prioritise cornerstone content. */
export const ChangeFreq = z.enum(['always', 'hourly', 'daily', 'weekly', 'monthly', 'yearly', 'never']);
export type ChangeFreq = z.infer<typeof ChangeFreq>;

export const TwitterCard = z.enum(['summary', 'summary_large_image']);
export const OgType = z.enum(['article', 'website']);

/**
 * Technical SEO metadata.
 *
 * Everything here maps to something a crawler actually reads — a meta tag,
 * a link rel, a sitemap field, or a robots directive. Nothing is decorative.
 */
export const SeoSchema = z.object({
  title: z.string().max(60, 'SEO title should stay under 60 chars').optional(),
  description: z.string().max(160, 'meta description should stay under 160 chars').optional(),
  keywords: z.array(z.string()).default([]),

  // ── Indexing control ─────────────────────────────────────
  canonical: z.string().optional(),
  noindex: z.boolean().default(false),
  nofollow: z.boolean().default(false),
  /**
   * Extra robots directives, e.g. `max-snippet:-1`, `max-image-preview:large`.
   * These matter for GEO: they control how much an answer engine may quote.
   */
  robotsDirectives: z.array(z.string()).default([]),

  // ── Open Graph ───────────────────────────────────────────
  ogType: OgType.default('article'),
  ogTitle: z.string().optional(),
  ogDescription: z.string().optional(),
  ogImage: z.string().optional(),

  // ── Twitter / X ──────────────────────────────────────────
  twitterCard: TwitterCard.default('summary_large_image'),
  twitterSite: z.string().optional(),
  twitterCreator: z.string().optional(),

  // ── Sitemap ──────────────────────────────────────────────
  changefreq: ChangeFreq.default('monthly'),
  priority: z.number().min(0).max(1).default(0.7),

  // ── i18n ─────────────────────────────────────────────────
  /** hreflang alternates. `hreflang: 'x-default'` is allowed. */
  alternates: z
    .array(z.object({ hreflang: z.string().min(1), href: z.string().min(1) }))
    .default([]),

  /** Include this post in `/llms.txt`. Turn off for thin or time-bound pages. */
  llmsTxt: z.boolean().default(true),
});
export type Seo = z.infer<typeof SeoSchema>;

/**
 * GEO = Generative Engine Optimization.
 * Structured signals that answer engines (ChatGPT, Claude, Perplexity,
 * AI Overviews) extract when citing a page — plus locale targeting.
 */
export const GeoSchema = z.object({
  /** BCP-47 locale, e.g. `ko-KR`. */
  locale: z.string().default('ko-KR'),
  /** Markets this post targets, e.g. ['KR', 'US']. */
  targetMarkets: z.array(z.string()).default([]),
  /** One-paragraph extractive summary an answer engine can quote verbatim. */
  answerSummary: z.string().optional(),
  /** Named entities the post should be associated with. */
  entities: z.array(z.string()).default([]),
  /** Q&A pairs rendered as FAQPage JSON-LD — the highest-yield GEO signal. */
  faq: z
    .array(
      z.object({
        question: z.string().min(1),
        answer: z.string().min(1),
      }),
    )
    .default([]),
  /** Primary sources cited in the body; answer engines weight cited pages higher. */
  citations: z
    .array(
      z.object({
        title: z.string().min(1),
        url: z.string().url(),
      }),
    )
    .default([]),
});
export type Geo = z.infer<typeof GeoSchema>;

/** Editorial review record produced by the admin review screen. */
export const ReviewSchema = z.object({
  reviewer: z.string().optional(),
  reviewedAt: z.string().optional(),
  checks: z
    .object({
      factual: z.boolean().default(false),
      tone: z.boolean().default(false),
      seo: z.boolean().default(false),
      geo: z.boolean().default(false),
      images: z.boolean().default(false),
      links: z.boolean().default(false),
    })
    // zod 4: `.default()` expects the parsed output; `.prefault()` feeds the
    // value through parsing so the inner field defaults still apply.
    .prefault({}),
  notes: z.string().optional(),
});
export type Review = z.infer<typeof ReviewSchema>;

/**
 * Slug rules.
 *
 * Natural-language slugs are allowed and preferred: keeping the target keyword
 * in the URL is a real ranking and click-through signal, and Korean/Japanese
 * readers see a legible URL rather than transliterated mush. Browsers
 * percent-encode non-ASCII on the wire and display it decoded.
 *
 * Constraints: lowercase, no whitespace, hyphen-separated. `\p{Lo}` covers
 * Hangul, Kana and Han; `\p{Ll}` covers lowercase Latin/Cyrillic/Greek.
 */
export const SLUG_PATTERN = /^[\p{Ll}\p{Lo}\p{N}]+(?:-[\p{Ll}\p{Lo}\p{N}]+)*$/u;

export const PostFrontmatterSchema = z.object({
  title: z.string().min(1),
  slug: z
    .string()
    .min(1)
    .max(120, 'slug should stay under 120 chars')
    .regex(SLUG_PATTERN, 'slug must be lowercase, hyphen-separated, with no whitespace'),
  description: z.string().default(''),
  status: PostStatus.default('draft'),
  /** Agent or human that authored the draft. */
  author: z.string().default('unknown'),
  createdAt: z.string(),
  updatedAt: z.string(),
  publishedAt: z.string().optional(),
  tags: z.array(z.string()).default([]),
  category: z.string().default('general'),
  cover: ImageSchema.optional(),
  seo: SeoSchema.prefault({}),
  geo: GeoSchema.prefault({}),
  review: ReviewSchema.prefault({}),
});
export type PostFrontmatter = z.infer<typeof PostFrontmatterSchema>;

/**
 * The shape callers pass to `writePost`. Fields with schema defaults are
 * optional here — the parse step fills them in.
 */
export type PostFrontmatterInput = z.input<typeof PostFrontmatterSchema>;

export interface Post extends PostFrontmatter {
  /** Markdown body, frontmatter stripped. */
  body: string;
  /** Absolute path on disk. Empty when the post came from Supabase. */
  filePath: string;
  readingTimeMinutes: number;
}

/**
 * builders — 빌더(팀원) 프로필. §5 `builders` 테이블.
 *
 * No publish toggle: §6 lists only registration/edit/reorder for builders,
 * not a visibility toggle like projects have.
 */
export const BuilderFrontmatterSchema = z.object({
  name: z.string().min(1),
  slug: z
    .string()
    .min(1)
    .max(120, 'slug should stay under 120 chars')
    .regex(SLUG_PATTERN, 'slug must be lowercase, hyphen-separated, with no whitespace'),
  /** e.g. "바이브코딩 개발자" */
  title: z.string().min(1),
  bio: z.string().default(''),
  profileImage: ImageSchema.optional(),
  /** 수료 과정 — 4단 신뢰 체인 중 "교육" 연결점. */
  courseName: z.string().default(''),
  /** 노출 순서. 낮을수록 먼저 노출. */
  order: z.number().int().default(0),
  /** 빌더 상세 페이지도 개별 URL을 가지므로(§4) 메타 태그가 필요하다. */
  seo: SeoSchema.prefault({}),
});
export type BuilderFrontmatter = z.infer<typeof BuilderFrontmatterSchema>;
export type BuilderFrontmatterInput = z.input<typeof BuilderFrontmatterSchema>;

export interface Builder extends BuilderFrontmatter {
  filePath: string;
}

/**
 * projects — 빌더의 포트폴리오 프로젝트. §5 `projects` 테이블.
 *
 * `builderId` is a slug reference, not a uuid FK — file-based content has no
 * database, so the builder's slug doubles as its stable identifier
 * (see ADR-0001).
 */
export const ProjectFrontmatterSchema = z.object({
  builderId: z.string().min(1, 'projects must reference a builder slug'),
  title: z.string().min(1),
  slug: z
    .string()
    .min(1)
    .max(120, 'slug should stay under 120 chars')
    .regex(SLUG_PATTERN, 'slug must be lowercase, hyphen-separated, with no whitespace'),
  problem: z.string().default(''),
  solution: z.string().default(''),
  result: z.string().default(''),
  category: z.string().default('general'),
  cover: ImageSchema.optional(),
  liveUrl: z.string().url().optional(),
  /** Gate for §0-2's unresolved question: is the live link OK to publish? */
  showLiveUrl: z.boolean().default(false),
  isPublished: z.boolean().default(false),
  createdAt: z.string(),
  seo: SeoSchema.prefault({}),
});
export type ProjectFrontmatter = z.infer<typeof ProjectFrontmatterSchema>;
export type ProjectFrontmatterInput = z.input<typeof ProjectFrontmatterSchema>;

export interface Project extends ProjectFrontmatter {
  filePath: string;
}

/**
 * education — 교육·커뮤니티 신뢰 신호. §5 `education / community` 테이블.
 *
 * No slug: these render as list items inside the 교육·커뮤니티 섹션, not as
 * individually addressable pages (§4 IA).
 */
export const EducationType = z.enum(['course', 'seminar', 'study']);
export type EducationType = z.infer<typeof EducationType>;

export const EducationFrontmatterSchema = z.object({
  type: EducationType,
  title: z.string().min(1),
  description: z.string().default(''),
  /** 누적 회차·기수·인원 등 신뢰 신호가 되는 숫자. */
  countValue: z.number().int().nonnegative().default(0),
  /** 무료 에셋 목업 허용 (대표님 지침, §8-2). */
  image: ImageSchema.optional(),
});
export type EducationFrontmatter = z.infer<typeof EducationFrontmatterSchema>;
export type EducationFrontmatterInput = z.input<typeof EducationFrontmatterSchema>;

export interface Education extends EducationFrontmatter {
  filePath: string;
}
