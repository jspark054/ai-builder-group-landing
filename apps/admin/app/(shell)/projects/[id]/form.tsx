'use client';

// A-03 편집 폼.
//
// 근거 — 화면설계 §6.3 도면 순서 · 기능명세 §5.3 · POL-03 · POL-04 · POL-06 · POL-08
//
// 🔴 입력을 controlled 로 둔다. 카운터(FN-A03-05)와 체크리스트(FN-A03-16)가 입력에
//    따라 실시간으로 바뀌어야 해서다. `useActionState` 는 컴포넌트를 다시 마운트하지
//    않으므로 저장이 실패해도 값이 그대로 남는다 — 결정시트의 「실패해도 입력값을
//    잃지 않는다」가 여기서 성립한다.
//
// ⚠ 네이티브 `<select>` 를 쓰지 않는다 (`components/Select.tsx`). 다만 **체크박스와
//   라디오는 그대로 쓴다** — 그 규칙은 select 를 가리킨다.

import Link from 'next/link';
import { useActionState, useState } from 'react';

import { Select } from '@/components/Select';
import {
  AXIS_LABEL,
  AXIS_ORDER,
  BODY_FIELDS,
  BODY_MIN,
  BODY_RECOMMENDED,
  LINK_GRADE_LABEL,
  LINK_GRADE_ORDER,
  META_DESC_MAX,
  META_DESC_MIN,
  META_TITLE_MAX,
  SUMMARY_MIN,
  bodyLength,
  publishChecklist,
} from '@/lib/projects';
import type { BuilderOption, CategoryOption, ProjectEditData } from '@/lib/queries/projects';

import { deleteProject, saveProject, type SaveState } from '../actions';

export function ProjectForm({
  builders,
  categories,
  data,
  defaultSortOrder,
}: {
  builders: BuilderOption[];
  categories: CategoryOption[];
  data: ProjectEditData | null;
  defaultSortOrder: number;
}) {
  const [state, formAction, pending] = useActionState<SaveState, FormData>(saveProject, null);
  const project = data?.project ?? null;
  const isNew = project === null;

  const [summary, setSummary] = useState(project?.summary ?? '');
  const [body, setBody] = useState({
    bodyWhat: project?.body_what ?? '',
    bodyWhy: project?.body_why ?? '',
    bodyHow: project?.body_how ?? '',
    bodyResult: project?.body_result ?? '',
  });
  const [thumbnailUrl, setThumbnailUrl] = useState(project?.thumbnail_url ?? '');
  const [thumbnailAlt, setThumbnailAlt] = useState(project?.thumbnail_alt ?? '');
  const [liveUrl, setLiveUrl] = useState(project?.live_url ?? '');
  const [linkGrade, setLinkGrade] = useState(project?.link_grade ?? 'none');
  const [ogImageUrl, setOgImageUrl] = useState(project?.og_image_url ?? '');
  const [metaTitle, setMetaTitle] = useState(project?.meta_title ?? '');
  const [metaDescription, setMetaDescription] = useState(project?.meta_description ?? '');
  const [selectedBuilders, setSelectedBuilders] = useState<string[]>(
    data?.builders.map((b) => b.builderId) ?? [],
  );
  const [ownerId, setOwnerId] = useState(
    data?.builders.find((b) => b.isOwner)?.builderId ?? '',
  );
  const [selectedCategories, setSelectedCategories] = useState<string[]>(data?.categoryIds ?? []);

  const bodyChars = bodyLength(Object.values(body));

  const checklist = publishChecklist({
    liveUrl,
    linkGrade,
    thumbnailUrl,
    thumbnailAlt,
    metaTitle,
    metaDescription,
    ogImageUrl,
    bodyChars,
    builderCount: selectedBuilders.length,
  });
  const unmet = checklist.filter((item) => item.ok === false).length;

  function toggleBuilder(id: string): void {
    setSelectedBuilders((prev) => {
      const next = prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id];
      // 대표로 지정된 빌더를 빼면 대표도 함께 비운다 — 서버가 거절하기 전에 화면에서 맞춘다
      if (!next.includes(ownerId)) setOwnerId('');
      // 처음 고른 한 명은 자동으로 대표가 된다. 대표는 정확히 1인이라(FN-A03-11)
      // 한 명뿐일 때 굳이 다시 고르게 할 이유가 없다
      if (next.length === 1) setOwnerId(next[0] ?? '');
      return next;
    });
  }

  return (
    <div>
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {isNew ? '새 프로젝트' : '프로젝트 편집'}
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            <Link href="/projects" className="hover:underline">
              ← 목록으로
            </Link>
            {project && <> · {project.is_public ? '공개 중' : '비공개'}</>}
          </p>
        </div>
      </div>

      {state && (
        <p
          role="alert"
          className={
            'mt-5 flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ' +
            (state.ok
              ? 'border-neutral-900 bg-white text-neutral-900'
              : 'border-red-200 bg-red-50 text-red-700')
          }
        >
          <span aria-hidden="true" className="font-semibold">
            {state.ok ? '✓' : '!'}
          </span>
          {state.message}
        </p>
      )}

      <form action={formAction} className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <input type="hidden" name="id" value={project?.id ?? ''} />

        {/* ── 본문 쪽 ── */}
        <div className="space-y-5">
          <div className="card">
            <label className="label" htmlFor="title">
              제목
            </label>
            <input
              id="title"
              name="title"
              type="text"
              required
              defaultValue={project?.title ?? ''}
              className="field"
            />

            <div className="mt-4">
              <label className="label" htmlFor="slug">
                주소
              </label>
              <div className="flex items-center gap-2">
                <span className="shrink-0 text-sm text-neutral-400">/portfolio/</span>
                <input
                  id="slug"
                  name="slug"
                  type="text"
                  required
                  defaultValue={project?.slug ?? ''}
                  readOnly={project?.is_public === true}
                  className={
                    'field' + (project?.is_public ? ' bg-neutral-100 text-neutral-500' : '')
                  }
                />
              </div>
              <p className="mt-1.5 text-xs text-neutral-400">
                {project?.is_public
                  ? '공개 중인 프로젝트의 주소는 바꾸지 않습니다. 링크와 색인이 함께 죽습니다.'
                  : '한글을 그대로 씁니다. 발행 후에는 바꾸지 않습니다.'}
              </p>
            </div>

            <div className="mt-4">
              <label className="label" htmlFor="summary">
                요약
              </label>
              <textarea
                id="summary"
                name="summary"
                rows={2}
                required
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                className="field"
              />
              {/* POL-04 — 카드에서 한 줄이 비지 않도록 최소 40자 */}
              <p
                className={
                  'mt-1.5 text-xs ' +
                  (summary.length > 0 && summary.length < SUMMARY_MIN
                    ? 'text-red-600'
                    : 'text-neutral-400')
                }
              >
                {summary.length}자 · 최소 {SUMMARY_MIN}자
              </p>
            </div>
          </div>

          {/* FN-A03-04 — 본문 4문항. 이 문항이 곧 P-04 의 h2 소제목이 된다 */}
          <div className="card">
            <div className="flex items-baseline justify-between">
              <span className="label mb-0">본문 — 4문항</span>
              <span
                className={
                  'text-xs ' + (bodyChars < BODY_MIN ? 'text-red-600' : 'text-neutral-400')
                }
              >
                {bodyChars}자 · 최소 {BODY_MIN}자 · 권장 {BODY_RECOMMENDED}자
              </span>
            </div>

            {/* FN-A03-06 · POL-04 — 미달이면 경고한다. 저장은 막지 않는다 */}
            {bodyChars > 0 && bodyChars < BODY_MIN && (
              <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                본문이 {BODY_MIN}자에 미치지 못합니다. 답변엔진이 인용할 분량이 되지 않습니다.
              </p>
            )}

            <div className="mt-4 space-y-4">
              {BODY_FIELDS.map((field) => (
                <div key={field.name}>
                  <label className="label" htmlFor={field.name}>
                    {field.label} <span className="font-normal text-neutral-400">{field.hint}</span>
                  </label>
                  <textarea
                    id={field.name}
                    name={field.name}
                    rows={5}
                    value={body[field.name]}
                    onChange={(e) => setBody((prev) => ({ ...prev, [field.name]: e.target.value }))}
                    className="field"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* FN-A03-09 · 11 — 담당 빌더 복수 + 대표 1인 */}
          <div className="card">
            <span className="label">담당 빌더</span>
            {builders.length === 0 ? (
              <p className="text-sm text-neutral-500">등록된 빌더가 없습니다.</p>
            ) : (
              <ul className="space-y-2">
                {builders.map((builder) => {
                  const checked = selectedBuilders.includes(builder.id);
                  return (
                    <li key={builder.id} className="flex items-center gap-3">
                      <label className="flex flex-1 items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          name="builderIds"
                          value={builder.id}
                          checked={checked}
                          onChange={() => toggleBuilder(builder.id)}
                        />
                        {builder.displayName}
                      </label>
                      <label
                        className={
                          'flex items-center gap-1.5 text-xs ' +
                          (checked ? 'text-neutral-600' : 'text-neutral-300')
                        }
                      >
                        <input
                          type="radio"
                          name="ownerId"
                          value={builder.id}
                          checked={ownerId === builder.id}
                          disabled={!checked}
                          onChange={() => setOwnerId(builder.id)}
                        />
                        대표
                      </label>
                    </li>
                  );
                })}
              </ul>
            )}
            <p className="mt-3 text-xs text-neutral-400">
              대표는 프로젝트당 한 명입니다. 공동 건도 편집 권한은 대표 1인이 갖습니다.
            </p>
          </div>

          {/* FN-A03-10 — 분류 다중 선택. 축으로 묶어 표시한다 */}
          <div className="card">
            <span className="label">분류</span>
            <div className="space-y-4">
              {AXIS_ORDER.map((axis) => {
                const items = categories.filter((c) => c.axis === axis);
                if (items.length === 0) return null;
                return (
                  <div key={axis}>
                    <p className="mb-2 text-xs font-medium text-neutral-500">{AXIS_LABEL[axis]}</p>
                    <ul className="flex flex-wrap gap-x-5 gap-y-2">
                      {items.map((category) => (
                        <li key={category.id}>
                          <label className="flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              name="categoryIds"
                              value={category.id}
                              checked={selectedCategories.includes(category.id)}
                              onChange={() =>
                                setSelectedCategories((prev) =>
                                  prev.includes(category.id)
                                    ? prev.filter((v) => v !== category.id)
                                    : [...prev, category.id],
                                )
                              }
                            />
                            {category.name}
                          </label>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── 사이드 ── */}
        <div className="space-y-5">
          {/* FN-A03-16 · POL-08 — 경고하되 차단하지 않는다 */}
          <div className="card">
            <div className="flex items-baseline justify-between">
              <span className="label mb-0">공개 전 체크리스트</span>
              <span className={'text-xs ' + (unmet > 0 ? 'text-red-600' : 'text-neutral-400')}>
                미충족 {unmet}
              </span>
            </div>
            <ul className="mt-3 space-y-1.5 text-xs">
              {checklist.map((item) => (
                <li key={item.no} className="flex gap-2">
                  <span
                    aria-hidden="true"
                    className={
                      item.ok === null
                        ? 'text-neutral-400'
                        : item.ok
                          ? 'text-neutral-900'
                          : 'text-red-600'
                    }
                  >
                    {item.ok === null ? '·' : item.ok ? '✓' : '!'}
                  </span>
                  <span className={item.ok === false ? 'text-red-600' : 'text-neutral-600'}>
                    {item.label}
                    {item.ok === null && (
                      <span className="ml-1 text-neutral-400">— 직접 확인</span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-neutral-400">
              미충족 항목이 있어도 저장은 됩니다. 공개 여부는 운영자가 판단합니다.
            </p>
          </div>

          <div className="card">
            <label className="label" htmlFor="thumbnailUrl">
              대표 이미지 주소
            </label>
            <input
              id="thumbnailUrl"
              name="thumbnailUrl"
              type="text"
              required
              value={thumbnailUrl}
              onChange={(e) => setThumbnailUrl(e.target.value)}
              placeholder="/images/… 또는 https://…"
              className="field"
            />

            <div className="mt-4">
              <label className="label" htmlFor="thumbnailAlt">
                대체 텍스트
              </label>
              <input
                id="thumbnailAlt"
                name="thumbnailAlt"
                type="text"
                required
                value={thumbnailAlt}
                onChange={(e) => setThumbnailAlt(e.target.value)}
                className="field"
              />
              <p className="mt-1.5 text-xs text-neutral-400">
                보이는 것을 설명합니다. 비우면 저장되지 않습니다.
              </p>
            </div>
          </div>

          {/* FN-A03-07 · 08 · POL-03 */}
          <div className="card">
            <label className="label" htmlFor="liveUrl">
              라이브 링크
            </label>
            <input
              id="liveUrl"
              name="liveUrl"
              type="text"
              value={liveUrl}
              onChange={(e) => setLiveUrl(e.target.value)}
              placeholder="https://…"
              className="field"
            />

            <div className="mt-4">
              <label className="label" htmlFor="linkGrade">
                링크 등급
              </label>
              <Select
                id="linkGrade"
                name="linkGrade"
                required
                defaultValue={linkGrade}
                options={LINK_GRADE_ORDER.map((grade) => ({
                  value: grade,
                  label: LINK_GRADE_LABEL[grade],
                }))}
                aria-label="링크 등급"
              />
              <p className="mt-1.5 text-xs text-neutral-400">
                「없음」이면 공개 카드에서 바로가기 버튼이 나오지 않습니다.
              </p>
            </div>
          </div>

          <div className="card">
            <label className="label" htmlFor="metaTitle">
              SEO 제목
            </label>
            <input
              id="metaTitle"
              name="metaTitle"
              type="text"
              value={metaTitle}
              onChange={(e) => setMetaTitle(e.target.value)}
              className="field"
            />
            <p
              className={
                'mt-1.5 text-xs ' +
                (metaTitle.length > META_TITLE_MAX ? 'text-red-600' : 'text-neutral-400')
              }
            >
              {metaTitle.length}자 · 권장 {META_TITLE_MAX}자 이내
            </p>

            <div className="mt-4">
              <label className="label" htmlFor="metaDescription">
                SEO 설명
              </label>
              <textarea
                id="metaDescription"
                name="metaDescription"
                rows={4}
                value={metaDescription}
                onChange={(e) => setMetaDescription(e.target.value)}
                className="field"
              />
              <p
                className={
                  'mt-1.5 text-xs ' +
                  (metaDescription.length > 0 &&
                  (metaDescription.length < META_DESC_MIN ||
                    metaDescription.length > META_DESC_MAX)
                    ? 'text-red-600'
                    : 'text-neutral-400')
                }
              >
                {metaDescription.length}자 · 권장 {META_DESC_MIN}~{META_DESC_MAX}자
              </p>
            </div>

            <div className="mt-4">
              <label className="label" htmlFor="ogImageUrl">
                OG 이미지 주소
              </label>
              <input
                id="ogImageUrl"
                name="ogImageUrl"
                type="text"
                value={ogImageUrl}
                onChange={(e) => setOgImageUrl(e.target.value)}
                className="field"
              />
              {/* FN-A03-13 — 비우면 대표 이미지를 쓴다. 값을 복사해 넣지 않는다 */}
              <p className="mt-1.5 text-xs text-neutral-400">
                비우면 대표 이미지를 씁니다.
              </p>
            </div>
          </div>

          <div className="card">
            <label className="label" htmlFor="sortOrder">
              정렬 순서
            </label>
            <input
              id="sortOrder"
              name="sortOrder"
              type="number"
              defaultValue={defaultSortOrder}
              className="field"
            />
            <p className="mt-1.5 text-xs text-neutral-400">낮은 숫자가 앞에 옵니다.</p>

            {/* FN-A03-14 — 공개 여부. 운영 권한자만 바꿀 수 있고 서버가 다시 본다 */}
            <label className="mt-4 flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="isPublic"
                defaultChecked={project?.is_public ?? false}
              />
              공개
            </label>
          </div>

          <div className="card">
            <button type="submit" disabled={pending} className="btn-primary w-full disabled:opacity-50">
              저장
            </button>
          </div>
        </div>
      </form>

      {/* 삭제는 저장 폼 밖에 둔다 — 같은 폼 안에 두면 엔터 한 번에 눌릴 수 있다 */}
      {project && (
        <form action={deleteProject} className="mt-8">
          <input type="hidden" name="id" value={project.id} />
          <button
            type="submit"
            className="text-sm text-red-600 underline underline-offset-4 hover:text-red-700"
          >
            이 프로젝트 삭제
          </button>
        </form>
      )}
    </div>
  );
}
