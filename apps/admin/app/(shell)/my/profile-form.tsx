'use client';

// A-06 프로필 편집 폼.
//
// 근거 — 기능명세 §5.6 「권한 표시 규칙」
//
// 🔴 **잠긴 필드는 비활성 상태로 보이되 수정되지 않는다.** 감추지 않는 것이 규칙이다 —
//    숨기면 빌더가 관리자에게 **무엇을 요청해야 하는지** 알 수 없다.
//
// 🔴 그리고 **잠금은 화면이 아니라 서버가 강제한다** (REQ-N-011). 아래 비활성 입력은
//    안내일 뿐이고, 서버 액션이 그 컬럼을 아예 패치에 넣지 않으며(actions.ts),
//    0008 트리거가 마지막으로 막는다. 세 겹 중 화면은 가장 약한 겹이다.
//
// ⚠ 잠긴 입력에는 `name` 을 주지 않는다. `disabled` 는 폼 직렬화에서 빠지지만, 그 사실에
//   기대지 않는다 — 이름이 없으면 값이 실릴 자리 자체가 없다.

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
  type CareerEntry,
} from '@/lib/builders';

import { saveMyProfile, type SaveState } from './actions';

const EMPTY_CAREER: CareerEntry = { title: '', org: '', period: '' };

/** 잠긴 값을 보여 주는 칸. 읽기 전용이고 폼에 실리지 않는다 */
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

export function MyProfileForm({ profile }: { profile: BuilderRow }) {
  const [state, formAction, pending] = useActionState<SaveState, FormData>(saveMyProfile, null);

  const [imageUrl, setImageUrl] = useState(profile.image_url ?? '');
  const [imageAlt, setImageAlt] = useState(profile.image_alt ?? '');
  const [bio, setBio] = useState(profile.bio ?? '');
  const [career, setCareer] = useState<CareerEntry[]>(parseCareer(profile.career));
  const [metaTitle, setMetaTitle] = useState(profile.meta_title ?? '');
  const [metaDescription, setMetaDescription] = useState(profile.meta_description ?? '');
  const [ogImageUrl, setOgImageUrl] = useState(profile.og_image_url ?? '');

  function updateCareer(index: number, field: keyof CareerEntry, value: string): void {
    setCareer((prev) =>
      prev.map((entry, i) => (i === index ? { ...entry, [field]: value } : entry)),
    );
  }

  return (
    <div>
      {state && (
        <p
          role="alert"
          className={
            'mb-5 flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ' +
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

      <form action={formAction} className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <input type="hidden" name="career" value={JSON.stringify(career)} />

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
              defaultValue={profile.display_name}
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
                defaultValue={profile.name_type}
                options={NAME_TYPE_ORDER.map((value) => ({
                  value,
                  label: NAME_TYPE_LABEL[value],
                }))}
                aria-label="표기 유형"
              />
              <p className="mt-1.5 text-xs text-neutral-400">
                실명과 닉네임 중 선택하실 수 있습니다.
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
            <p
              className={
                'mt-1.5 text-xs ' +
                (bio.length > 0 && bio.length < BIO_MIN ? 'text-red-600' : 'text-neutral-400')
              }
            >
              {bio.length}자 · 최소 {BIO_MIN}자
            </p>
          </div>

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

            {career.length === 0 ? (
              <p className="text-sm text-neutral-500">등록된 이력이 없습니다.</p>
            ) : (
              <ul className="space-y-3">
                {career.map((entry, index) => (
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

        <div className="space-y-5">
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
              className="field"
            />
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
              <p
                className={
                  'mt-1.5 text-xs ' +
                  (imageUrl !== '' && imageAlt === '' ? 'text-red-600' : 'text-neutral-400')
                }
              >
                이미지를 등록하면 필수입니다.
              </p>
            </div>
          </div>

          {/* FN-A06-03 — 잠긴 항목. 보이되 바뀌지 않는다 */}
          <div className="card">
            <p className="mb-3 text-xs text-neutral-500">
              아래 항목은 운영 담당자가 관리합니다. 바꾸려면 문의해 주세요.
            </p>
            <div className="space-y-4">
              <LockedField
                label="주소"
                value={`/builders/${profile.slug}`}
                note="공개 후에는 바뀌지 않습니다. 링크와 색인이 함께 죽습니다."
              />
              <LockedField label="기수" value={`${profile.cohort}기`} note="운영 담당자가 정합니다." />
              <LockedField
                label="공개 여부"
                value={profile.is_public ? '공개 중' : '비공개'}
                note="공개 전환은 운영 담당자가 판단합니다."
              />
              <LockedField
                label="상단 고정"
                value={
                  profile.is_pinned ? `고정 ${profile.pin_order ?? ''}`.trim() : '고정 안 함'
                }
                note="목록 상단 배치는 운영 담당자가 정합니다."
              />
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
              <p className="mt-1.5 text-xs text-neutral-400">비우면 프로필 이미지를 씁니다.</p>
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
