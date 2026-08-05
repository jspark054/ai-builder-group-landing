import type { Builder, Education, Post, Project } from './schema.ts';

export type Severity = 'error' | 'warn' | 'info';

export interface AuditIssue {
  field: string;
  severity: Severity;
  message: string;
  /** Which reviewer lane owns the fix. */
  lane: 'seo' | 'geo' | 'images' | 'editorial';
}

export interface AuditResult {
  slug: string;
  score: number; // 0-100
  issues: AuditIssue[];
  publishable: boolean;
}

const MIN_BODY_CHARS = 600;

/** Same scoring formula for every content type so review verdicts stay comparable. */
function toAuditResult(slug: string, issues: AuditIssue[]): AuditResult {
  const errors = issues.filter((i) => i.severity === 'error').length;
  const warnings = issues.filter((i) => i.severity === 'warn').length;
  const score = Math.max(0, 100 - errors * 20 - warnings * 7);
  return { slug, score, issues, publishable: errors === 0 };
}

/** Shared image-provenance checks (hard rule 1). Reused across every content type. */
function auditImage(
  add: (field: string, severity: Severity, lane: AuditIssue['lane'], message: string) => void,
  field: string,
  image: Post['cover'],
) {
  if (!image) return;
  if (!image.alt.trim()) add(`${field}.alt`, 'error', 'images', `${field} has no alt text.`);
  if (image.source === 'none') add(`${field}.source`, 'error', 'images', `${field} provenance is unset.`);
  if (image.source === 'codex-imagegen' && !image.origin) {
    add(`${field}.origin`, 'warn', 'images', `Codex-generated ${field} is missing its prompt in \`origin\`.`);
  }
  if (image.source === 'web-search' && !image.license) {
    add(`${field}.license`, 'error', 'images', `Web-sourced ${field} has no license recorded.`);
  }
}

/**
 * Deterministic pre-publish audit. The admin review screen and the
 * `content-reviewer` agent both run this so a human and an agent
 * always see the same verdict — no model judgment involved.
 */
export function auditPost(post: Post): AuditResult {
  const issues: AuditIssue[] = [];
  const add = (field: string, severity: Severity, lane: AuditIssue['lane'], message: string) =>
    issues.push({ field, severity, lane, message });

  // ── Editorial ──────────────────────────────────────────────
  if (post.body.length < MIN_BODY_CHARS) {
    add('body', 'warn', 'editorial', `Body is ${post.body.length} chars; aim for ${MIN_BODY_CHARS}+.`);
  }
  if (!/^#{1,3}\s/m.test(post.body)) {
    add('body', 'warn', 'editorial', 'No headings found. Answer engines rely on heading structure.');
  }
  if (!post.description.trim()) {
    add('description', 'error', 'editorial', 'Description is empty.');
  }

  // ── SEO ────────────────────────────────────────────────────
  const seoTitle = post.seo.title ?? post.title;
  if (seoTitle.length > 60) add('seo.title', 'warn', 'seo', `SEO title is ${seoTitle.length} chars (>60).`);
  const metaDescription = post.seo.description ?? post.description;
  if (!metaDescription) add('seo.description', 'error', 'seo', 'Meta description is missing.');
  else if (metaDescription.length > 160)
    add('seo.description', 'warn', 'seo', `Meta description is ${metaDescription.length} chars (>160).`);
  if (post.seo.keywords.length === 0) add('seo.keywords', 'info', 'seo', 'No target keywords set.');
  if (post.tags.length === 0) add('tags', 'warn', 'seo', 'No tags — internal linking and topic clusters suffer.');

  // ── Technical SEO ──────────────────────────────────────────
  if (post.seo.canonical && !/^https?:\/\//.test(post.seo.canonical)) {
    add('seo.canonical', 'error', 'seo', 'Canonical must be an absolute URL (https://…).');
  }
  if (post.seo.ogImage && !/^(https?:\/\/|\/)/.test(post.seo.ogImage)) {
    add('seo.ogImage', 'error', 'seo', 'OG image must be an absolute URL or a root-relative path.');
  }
  if (post.seo.priority < 0 || post.seo.priority > 1) {
    add('seo.priority', 'error', 'seo', 'Sitemap priority must be between 0.0 and 1.0.');
  }
  for (const alternate of post.seo.alternates) {
    if (!/^(https?:\/\/|\/)/.test(alternate.href)) {
      add('seo.alternates', 'error', 'seo', `hreflang "${alternate.hreflang}" has a relative href.`);
    }
  }
  if (post.status === 'published' && post.seo.noindex) {
    add('seo.noindex', 'warn', 'seo', 'Published but noindex — the page will not be indexed or cited.');
  }
  // A keyword-bearing slug is one of the few signals fully under our control.
  if (/^post-\d+$/.test(post.slug)) {
    add('slug', 'warn', 'seo', 'Auto-generated slug. Use a natural-language slug containing the target keyword.');
  }
  if (post.slug.length > 80) {
    add('slug', 'info', 'seo', `Slug is ${post.slug.length} chars; shorter URLs travel better.`);
  }

  // ── GEO (generative engine optimization) ───────────────────
  if (!post.geo.answerSummary) {
    add('geo.answerSummary', 'warn', 'geo', 'No extractive summary for answer engines to quote.');
  }
  if (post.geo.faq.length === 0) {
    add('geo.faq', 'warn', 'geo', 'No FAQ pairs — FAQPage JSON-LD is the highest-yield GEO signal.');
  }
  if (post.geo.citations.length === 0) {
    add('geo.citations', 'info', 'geo', 'No cited sources; cited pages are surfaced more often.');
  }
  if (post.geo.entities.length === 0) {
    add('geo.entities', 'info', 'geo', 'No named entities declared.');
  }

  // ── Images & provenance ────────────────────────────────────
  if (!post.cover) {
    add('cover', 'info', 'images', 'No cover image. Run `pnpm imagegen` (Codex) or attach one manually.');
  } else {
    auditImage(add, 'cover', post.cover);
  }

  // ── Publish gate ───────────────────────────────────────────
  if (post.status === 'published' && !post.publishedAt) {
    add('publishedAt', 'error', 'editorial', 'Published post has no publish date.');
  }

  return toAuditResult(post.slug, issues);
}

/**
 * Deterministic pre-publish audit for a builder profile.
 * No `status` field exists for builders (§6) — visibility is all-or-nothing
 * once a file exists, so there is no publish gate here, only quality checks.
 */
export function auditBuilder(builder: Builder): AuditResult {
  const issues: AuditIssue[] = [];
  const add = (field: string, severity: Severity, lane: AuditIssue['lane'], message: string) =>
    issues.push({ field, severity, lane, message });

  if (!builder.bio.trim()) add('bio', 'warn', 'editorial', 'Bio is empty — this is the builder\'s trust signal.');
  if (!builder.courseName.trim()) {
    add('courseName', 'info', 'editorial', 'No course name set — weakens the 교육 link in the trust chain.');
  }

  if (!builder.profileImage) {
    add('profileImage', 'warn', 'images', 'No profile image. Run `pnpm imagegen` (Codex) or attach one manually.');
  } else {
    auditImage(add, 'profileImage', builder.profileImage);
  }

  const metaDescription = builder.seo.description ?? builder.bio;
  if (!metaDescription) add('seo.description', 'warn', 'seo', 'Meta description is missing.');
  else if (metaDescription.length > 160) {
    add('seo.description', 'warn', 'seo', `Meta description is ${metaDescription.length} chars (>160).`);
  }

  return toAuditResult(builder.slug, issues);
}

/**
 * Deterministic pre-publish audit for a portfolio project.
 * The publish gate mirrors hard rule 2: `isPublished` requires the
 * evidence fields (problem/solution/result) that make the claim checkable.
 */
export function auditProject(project: Project): AuditResult {
  const issues: AuditIssue[] = [];
  const add = (field: string, severity: Severity, lane: AuditIssue['lane'], message: string) =>
    issues.push({ field, severity, lane, message });

  if (!project.problem.trim()) add('problem', 'error', 'editorial', 'Problem statement is empty.');
  if (!project.solution.trim()) add('solution', 'error', 'editorial', 'Solution statement is empty.');
  if (!project.result.trim()) add('result', 'error', 'editorial', 'Result statement is empty.');

  if (!project.cover) {
    add('cover', 'info', 'images', 'No cover image. Run `pnpm imagegen` (Codex) or attach one manually.');
  } else {
    auditImage(add, 'cover', project.cover);
  }

  // §0-2: live-link exposure is still an unresolved policy question — a
  // link can exist without being shown, but it can't be shown without existing.
  if (project.showLiveUrl && !project.liveUrl) {
    add('showLiveUrl', 'error', 'editorial', '`showLiveUrl` is on but no `liveUrl` is set.');
  }

  if (project.isPublished) {
    if (!project.problem.trim() || !project.solution.trim() || !project.result.trim()) {
      add('isPublished', 'error', 'editorial', 'Published project is missing problem/solution/result evidence.');
    }
  }

  return toAuditResult(project.slug, issues);
}

/**
 * Deterministic pre-publish audit for an education/community trust signal.
 * Uses `type` as the audit key since education entries have no slug (§4 IA
 * — they render inline, not as individually addressable pages).
 */
export function auditEducation(education: Education): AuditResult {
  const issues: AuditIssue[] = [];
  const add = (field: string, severity: Severity, lane: AuditIssue['lane'], message: string) =>
    issues.push({ field, severity, lane, message });

  if (!education.description.trim()) add('description', 'warn', 'editorial', 'Description is empty.');
  if (education.countValue <= 0) {
    add('countValue', 'info', 'editorial', 'Count value is 0 — this trust signal will not be very persuasive.');
  }

  if (!education.image) {
    add('image', 'info', 'images', 'No image. Free-asset mockups are allowed for education entries (§8-2).');
  } else {
    auditImage(add, 'image', education.image);
  }

  return toAuditResult(`education:${education.type}:${education.title}`, issues);
}
