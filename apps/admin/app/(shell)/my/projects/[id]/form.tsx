'use client';

// A-06 대표 프로젝트 편집 폼.
//
// 근거 — 기능명세 §5.6 · POL-04 · POL-06
//
// A-03 과 같은 4문항 구조를 쓰되 **잠긴 항목이 다르다** (FN-A06-07).
//   잠김 — slug · 공개 여부 · 정렬 순서 · 분류 · 담당 빌더
//   열림 — 제목 · 요약 · 본문 4문항 · 대표 이미지 · 라이브 링크 · SEO 메타
//
// 🔴 잠긴 항목도 **보여 준다.** 「권한 표시 규칙」이 「무엇이 있는지는 알되 바꿀 수 없게」다.
//    비활성 입력에는 `name` 을 주지 않아 폼에 실릴 자리 자체를 없앤다.
//
// ⚠ 공개 전 체크리스트(POL-08)는 두지 않았다. 그 체크리스트는 **공개 전환을 판단하는**
//   도구인데 공개 여부는 빌더가 만질 수 없다. 판단할 수 없는 사람에게 판단 도구를
//   보여 주면 화면만 길어진다. 분량 카운터는 남긴다 — 본문은 빌더가 쓴다.

import Link from 'next/link';
import { useActionState, useState } from 'react';

import type { ProjectRow } from '@orca/supabase';

import {
  BODY_FIELDS,
  BODY_MIN,
  BODY_RECOMMENDED,
  LINK_GRADE_LABEL,
  META_DESC_MAX,
  META_DESC_MIN,
  META_TITLE_MAX,
  SUMMARY_MIN,
  bodyLength,
} from '@/lib/projects';

import { saveMyProject, type SaveState } from '../../actions';

function LockedField({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div>
      <span className="label">{label}</span>
      <input
        type="text"
        value={value}
        readOnly
        disabled
        className="field bg-neutral-100 text-neutral-500"
      />
      <p className="mt-1.5 text-xs text-neutral-400">{note}</p>
    </div>
  );
}

export function MyProjectForm({ project }: { project: ProjectRow }) {
  const [state, formAction, pending] = useActionState<SaveState, FormData>(saveMyProject, null);

  const [summary, setSummary] = useState(project.summary);
  const [body, setBody] = useState({
    bodyWhat: project.body_what,
    bodyWhy: project.body_why,
    bodyHow: project.body_how,
    bodyResult: project.body_result,
  });
  const [thumbnailUrl, setThumbnailUrl] = useState(project.thumbnail_url);
  const [thumbnailAlt, setThumbnailAlt] = useState(project.thumbnail_alt);
  const [metaTitle, setMetaTitle] = useState(project.meta_title ?? '');
  const [metaDescription, setMetaDescription] = useState(project.meta_description ?? '');

  const bodyChars = bodyLength(Object.values(body));

  return (
    <div>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">프로젝트 편집</h1>
        <p className="mt-1 text-sm text-neutral-500">
          <Link href="/my" className="hover:underline">
            ← 내 프로필로
          </Link>
          {' · 대표'}
        </p>
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
        <input type="hidden" name="id" value={project.id} />

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
              defaultValue={project.title}
              className="field"
            />

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
        </div>

        <div className="space-y-5">
          {/* FN-A06-07 — 잠긴 항목. 보이되 바뀌지 않는다 */}
          <div className="card">
            <p className="mb-3 text-xs text-neutral-500">
              아래 항목은 운영 담당자가 관리합니다. 바꾸려면 문의해 주세요.
            </p>
            <div className="space-y-4">
              <LockedField
                label="주소"
                value={`/portfolio/${project.slug}`}
                note="공개 후에는 바뀌지 않습니다."
              />
              <LockedField
                label="공개 여부"
                value={project.is_public ? '공개 중' : '비공개'}
                note="공개 전환은 운영 담당자가 판단합니다."
              />
              <LockedField
                label="정렬 순서"
                value={String(project.sort_order)}
                note="목록 순서는 운영 담당자가 정합니다."
              />
              <LockedField
                label="분류 · 담당 빌더"
                value="운영 담당자 관리"
                note="분류와 담당 빌더 연결은 관리 화면에서만 바뀝니다."
              />
            </div>
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
              <p
                className={
                  'mt-1.5 text-xs ' +
                  (thumbnailUrl !== '' && thumbnailAlt === ''
                    ? 'text-red-600'
                    : 'text-neutral-400')
                }
              >
                보이는 것을 설명합니다. 비우면 저장되지 않습니다.
              </p>
            </div>
          </div>

          <div className="card">
            <label className="label" htmlFor="liveUrl">
              라이브 링크
            </label>
            <input
              id="liveUrl"
              name="liveUrl"
              type="text"
              defaultValue={project.live_url ?? ''}
              placeholder="https://…"
              className="field"
            />
            {/* 등급은 잠근다 — 검증력 판정은 운영이 한다 (POL-03) */}
            <p className="mt-1.5 text-xs text-neutral-400">
              현재 등급 「{LINK_GRADE_LABEL[project.link_grade]}」 — 등급은 운영 담당자가
              정합니다.
            </p>
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
    </div>
  );
}
