'use client';

// A-02 편집 폼.
//
// 근거 — 화면설계 §6.2 도면 순서 · 기능명세 §5.2 · POL-02 · POL-04 · POL-05 · POL-06 ·
//        POL-08 · POL-12
//
// 🔴 입력을 controlled 로 둔다. 체크리스트(FN-A02-12)와 카운터가 입력에 따라 실시간으로
//    바뀌어야 하고, 저장이 실패해도 값이 남아야 한다.
//
// ⚠ 이력은 `career` jsonb 한 컬럼이다. 화면에서 배열로 다루고 hidden input 에 JSON 으로
//   실어 보낸다 — 서버가 같은 모양으로 되돌린다 (actions.ts 의 parseCareerField).

import Link from 'next/link';
import { useActionState, useState } from 'react';

import type { BuilderRow } from '@orca/supabase';

import { Select } from '@/components/Select';
import {
  BIO_MIN,
  CAREER_DISPLAY_LIMIT,
  META_DESC_MAX,
  META_DESC_MIN,
  META_TITLE_MAX,
  NAME_TYPE_LABEL,
  NAME_TYPE_ORDER,
  parseCareer,
  publishChecklist,
  type CareerEntry,
} from '@/lib/builders';
import type { CourseOption } from '@/lib/queries/builders';

import { deleteBuilder, saveBuilder, type SaveState } from '../actions';

const EMPTY_CAREER: CareerEntry = { title: '', org: '', period: '' };

export function BuilderForm({
  builder,
  courses,
  defaultCohort,
  deleteBlocked = false,
}: {
  builder: BuilderRow | null;
  courses: CourseOption[];
  defaultCohort: number;
  deleteBlocked?: boolean;
}) {
  const [state, formAction, pending] = useActionState<SaveState, FormData>(saveBuilder, null);
  const isNew = builder === null;

  const [imageUrl, setImageUrl] = useState(builder?.image_url ?? '');
  const [imageAlt, setImageAlt] = useState(builder?.image_alt ?? '');
  const [bio, setBio] = useState(builder?.bio ?? '');
  const [career, setCareer] = useState<CareerEntry[]>(parseCareer(builder?.career ?? []));
  const [isPinned, setIsPinned] = useState(builder?.is_pinned ?? false);
  const [metaTitle, setMetaTitle] = useState(builder?.meta_title ?? '');
  const [metaDescription, setMetaDescription] = useState(builder?.meta_description ?? '');
  const [ogImageUrl, setOgImageUrl] = useState(builder?.og_image_url ?? '');

  const checklist = publishChecklist({
    imageUrl,
    imageAlt,
    metaTitle,
    metaDescription,
    ogImageUrl,
  });
  const unmet = checklist.filter((item) => item.ok === false).length;

  function updateCareer(index: number, field: keyof CareerEntry, value: string): void {
    setCareer((prev) =>
      prev.map((entry, i) => (i === index ? { ...entry, [field]: value } : entry)),
    );
  }

  return (
    <div>
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {isNew ? '새 빌더' : '빌더 편집'}
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            <Link href="/builders" className="hover:underline">
              ← 목록으로
            </Link>
            {builder && <> · {builder.is_public ? '공개 중' : '비공개'}</>}
          </p>
        </div>
      </div>

      {deleteBlocked && (
        <p
          role="alert"
          className="mt-5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          이 빌더가 작성한 인사이트 글이 남아 있어 삭제할 수 없습니다. 글을 먼저 정리하세요.
        </p>
      )}

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
        <input type="hidden" name="id" value={builder?.id ?? ''} />
        {/* 이력은 JSON 으로 실어 보낸다 */}
        <input type="hidden" name="career" value={JSON.stringify(career)} />

        {/* ── 본문 쪽 ── */}
        <div className="space-y-5">
          <div className="card">
            <label className="label" htmlFor="displayName">
              표기명
            </label>
            <input
              id="displayName"
              name="displayName"
              type="text"
              required
              defaultValue={builder?.display_name ?? ''}
              className="field"
            />

            <div className="mt-4">
              <label className="label" htmlFor="nameType">
                표기 유형
              </label>
              <Select
                id="nameType"
                name="nameType"
                required
                defaultValue={builder?.name_type ?? 'nickname'}
                options={NAME_TYPE_ORDER.map((value) => ({
                  value,
                  label: NAME_TYPE_LABEL[value],
                }))}
                aria-label="표기 유형"
              />
              {/* POL-12 — 실명이어야 성립하는 것이 아니다 */}
              <p className="mt-1.5 text-xs text-neutral-400">
                본인 선택입니다. 기수·이력은 표기 유형과 무관하게 공통 노출됩니다.
              </p>
            </div>

            <div className="mt-4">
              <label className="label" htmlFor="slug">
                주소
              </label>
              <div className="flex items-center gap-2">
                <span className="shrink-0 text-sm text-neutral-400">/builders/</span>
                <input
                  id="slug"
                  name="slug"
                  type="text"
                  required
                  defaultValue={builder?.slug ?? ''}
                  readOnly={builder?.is_public === true}
                  className={
                    'field' + (builder?.is_public ? ' bg-neutral-100 text-neutral-500' : '')
                  }
                />
              </div>
              <p className="mt-1.5 text-xs text-neutral-400">
                {builder?.is_public
                  ? '공개 중인 빌더의 주소는 바꾸지 않습니다. 링크와 색인이 함께 죽습니다.'
                  : '한글을 그대로 씁니다. 공개 후에는 바꾸지 않습니다.'}
              </p>
            </div>
          </div>

          <div className="card">
            <label className="label" htmlFor="bio">
              한 줄 소개
            </label>
            <textarea
              id="bio"
              name="bio"
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="field"
            />
            {/* POL-04 — 빌더 소개 최소 30자 */}
            <p
              className={
                'mt-1.5 text-xs ' +
                (bio.length > 0 && bio.length < BIO_MIN ? 'text-red-600' : 'text-neutral-400')
              }
            >
              {bio.length}자 · 최소 {BIO_MIN}자
            </p>
          </div>

          {/* FN-A02-05 · POL-05 */}
          <div className="card">
            <div className="flex items-baseline justify-between">
              <span className="label mb-0">이력</span>
              <span
                className={
                  'text-xs ' +
                  (career.length > CAREER_DISPLAY_LIMIT ? 'text-red-600' : 'text-neutral-400')
                }
              >
                {career.length}개 · 상세 표기 {CAREER_DISPLAY_LIMIT}개까지
              </span>
            </div>

            {career.length > CAREER_DISPLAY_LIMIT && (
              <p className="mt-3 rounded-lg border border-neutral-300 bg-neutral-50 px-3 py-2 text-xs text-neutral-700">
                {CAREER_DISPLAY_LIMIT}개를 넘는 항목은 공개 화면에서 접힙니다. 저장은 됩니다.
              </p>
            )}

            {career.length === 0 ? (
              <p className="text-sm text-neutral-500">등록된 이력이 없습니다.</p>
            ) : (
              <ul className="space-y-3">
                {career.map((entry, index) => (
                  // 배열 인덱스를 key 로 쓴다 — 이 목록은 순서가 곧 정체성이고
                  // 항목에 안정적인 id 가 없다 (jsonb 배열이다)
                  <li key={index} className="grid gap-2 sm:grid-cols-[1fr_1fr_9rem_auto]">
                    <input
                      type="text"
                      value={entry.title}
                      onChange={(e) => updateCareer(index, 'title', e.target.value)}
                      placeholder="역할 · 직함"
                      aria-label={`이력 ${index + 1} 역할`}
                      className="field"
                    />
                    <input
                      type="text"
                      value={entry.org}
                      onChange={(e) => updateCareer(index, 'org', e.target.value)}
                      placeholder="소속"
                      aria-label={`이력 ${index + 1} 소속`}
                      className="field"
                    />
                    <input
                      type="text"
                      value={entry.period}
                      onChange={(e) => updateCareer(index, 'period', e.target.value)}
                      placeholder="2024-2025"
                      aria-label={`이력 ${index + 1} 기간`}
                      className="field"
                    />
                    <button
                      type="button"
                      onClick={() => setCareer((prev) => prev.filter((_, i) => i !== index))}
                      className="btn-secondary shrink-0"
                    >
                      삭제
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <button
              type="button"
              onClick={() => setCareer((prev) => [...prev, EMPTY_CAREER])}
              className="btn-secondary mt-4"
            >
              + 이력 추가
            </button>
          </div>
        </div>

        {/* ── 사이드 ── */}
        <div className="space-y-5">
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
              미충족 항목이 있어도 저장은 됩니다. 다만 이미지의 대체 텍스트는 없으면 저장되지
              않습니다.
            </p>
          </div>

          <div className="card">
            <label className="label" htmlFor="imageUrl">
              프로필 이미지 주소
            </label>
            <input
              id="imageUrl"
              name="imageUrl"
              type="text"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="/images/… 또는 https://…"
              className="field"
            />
            {/* POL-02 · POL-12 — 미등록도 개인 선택이다. 이니셜 폴백이 걸린다 */}
            <p className="mt-1.5 text-xs text-neutral-400">
              비워도 됩니다. 그 경우 표기명 이니셜이 표시됩니다.
            </p>

            <div className="mt-4">
              <label className="label" htmlFor="imageAlt">
                대체 텍스트
              </label>
              <input
                id="imageAlt"
                name="imageAlt"
                type="text"
                value={imageAlt}
                onChange={(e) => setImageAlt(e.target.value)}
                className="field"
              />
              {/* FN-A02-06 — 이미지가 있으면 필수. 경고가 아니라 차단이다 */}
              <p
                className={
                  'mt-1.5 text-xs ' +
                  (imageUrl !== '' && imageAlt === '' ? 'text-red-600' : 'text-neutral-400')
                }
              >
                이미지를 등록하면 필수입니다. 비우면 저장되지 않습니다.
              </p>
            </div>
          </div>

          <div className="card">
            <label className="label" htmlFor="cohort">
              기수
            </label>
            <input
              id="cohort"
              name="cohort"
              type="number"
              min={1}
              required
              defaultValue={defaultCohort}
              className="field"
            />

            <div className="mt-4">
              <label className="label" htmlFor="courseId">
                수료 과정
              </label>
              <Select
                id="courseId"
                name="courseId"
                defaultValue={builder?.course_id ?? undefined}
                placeholder="미연결"
                options={courses.map((course) => ({ value: course.id, label: course.title }))}
                aria-label="수료 과정"
              />
              {/* 현재 전 건 null 이다 — 교육 라인업 수령(안건 8) 전까지 그대로 둔다 */}
              <p className="mt-1.5 text-xs text-neutral-400">
                교육 라인업 확정 전까지는 비워 둡니다.
              </p>
            </div>
          </div>

          <div className="card">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="isPublic" defaultChecked={builder?.is_public ?? false} />
              공개
            </label>

            {/* FN-A02-09 — 상단 고정은 P-05 의 시드 셔플보다 우선한다 */}
            <label className="mt-3 flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="isPinned"
                checked={isPinned}
                onChange={(e) => setIsPinned(e.target.checked)}
              />
              상단 고정
            </label>

            {isPinned && (
              <div className="mt-3">
                <label className="label" htmlFor="pinOrder">
                  고정 순서
                </label>
                <input
                  id="pinOrder"
                  name="pinOrder"
                  type="number"
                  defaultValue={builder?.pin_order ?? 1}
                  className="field"
                />
                <p className="mt-1.5 text-xs text-neutral-400">
                  낮은 숫자가 앞에 옵니다. 고정한 빌더는 P-05 상단에 배치됩니다.
                </p>
              </div>
            )}
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
            {/* FN-A02-11 — 초과는 경고만. 차단하지 않는다 */}
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
              <p className="mt-1.5 text-xs text-neutral-400">
                비우면 프로필 이미지를 씁니다.
              </p>
            </div>
          </div>

          <div className="card">
            <button
              type="submit"
              disabled={pending}
              className="btn-primary w-full disabled:opacity-50"
            >
              저장
            </button>
          </div>
        </div>
      </form>

      {builder && (
        <form action={deleteBuilder} className="mt-8">
          <input type="hidden" name="id" value={builder.id} />
          <button
            type="submit"
            className="text-sm text-red-600 underline underline-offset-4 hover:text-red-700"
          >
            이 빌더 삭제
          </button>
        </form>
      )}
    </div>
  );
}
