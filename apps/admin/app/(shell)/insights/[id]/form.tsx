'use client';

// A-07 편집 폼.
//
// 근거 — 화면설계 §6.5a 도면 순서 그대로: 제목 → 주소 → 카테고리 → 작성 빌더 → 본문
//        → 대표 이미지(자동) → SEO → [임시저장] [발행]
//
// 🔴 클라이언트 컴포넌트인 이유는 딱 하나, **FN-A07-09** 다.
//    서버 액션이 실패를 결과 객체로 돌려주고 여기서 `useActionState` 로 받는다.
//    실패에 redirect 를 쓰면 폼이 새로 그려져 본문이 통째로 날아간다.
//    입력은 전부 uncontrolled 다 — 상태를 React 에 복사해 두지 않아야 재렌더에도 DOM 값이 남는다.
//
// ⚠ 네이티브 `<select>` 를 쓰지 않는다. `components/Select.tsx`(Radix) 를 쓴다.

import Link from 'next/link';
import { useActionState, useState } from 'react';

import type { InsightRow } from '@orca/supabase';

import { Editor } from '@/components/Editor';
import { Select } from '@/components/Select';
import { CATEGORY_LABEL, CATEGORY_ORDER, STATUS_LABEL, coverImageFromBody } from '@/lib/insights';
import type { BuilderOption } from '@/lib/queries/insights';

import { deleteInsight, saveInsight, type SaveState } from '../actions';

/** POL-06 — 초과해도 저장은 막지 않는다. 경고만 한다 */
const META_TITLE_MAX = 40;
const META_DESC_MIN = 80;
const META_DESC_MAX = 110;

export function InsightForm({
  builders,
  insight,
}: {
  builders: BuilderOption[];
  insight: InsightRow | null;
}) {
  const [state, formAction, pending] = useActionState<SaveState, FormData>(saveInsight, null);

  const isNew = insight === null;
  const published = insight?.status === 'published';

  // 대표 이미지는 본문에서 나온다 (FN-A07-07). 저장 전에도 보이게 여기서도 뽑는다 —
  // 서버가 저장 시 같은 규칙으로 다시 뽑으므로 이 값은 미리보기 전용이다.
  const [body, setBody] = useState(insight?.body ?? '');
  const cover = coverImageFromBody(body);

  const [metaTitleLen, setMetaTitleLen] = useState(insight?.meta_title?.length ?? 0);
  const [metaDescLen, setMetaDescLen] = useState(insight?.meta_description?.length ?? 0);

  return (
    <div>
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {isNew ? '새 인사이트' : '인사이트 편집'}
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            <Link href="/insights" className="hover:underline">
              ← 목록으로
            </Link>
            {insight && <> · 상태 {STATUS_LABEL[insight.status]}</>}
          </p>
        </div>
      </div>

      {/* 성공과 실패가 색만 다르면 회색 알림이 오류처럼 읽힌다. 표시를 따로 붙인다 */}
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

      <form action={formAction} className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <input type="hidden" name="id" value={insight?.id ?? ''} />

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
              defaultValue={insight?.title ?? ''}
              className="field"
            />

            <div className="mt-4">
              <label className="label" htmlFor="slug">
                주소
              </label>
              <div className="flex items-center gap-2">
                <span className="shrink-0 text-sm text-neutral-400">/insights/</span>
                <input
                  id="slug"
                  name="slug"
                  type="text"
                  defaultValue={insight?.slug ?? ''}
                  readOnly={published}
                  placeholder="비우면 제목에서 만듭니다"
                  className={'field' + (published ? ' bg-neutral-100 text-neutral-500' : '')}
                />
              </div>
              <p className="mt-1.5 text-xs text-neutral-400">
                {published
                  ? '발행된 글의 주소는 바꾸지 않습니다. 링크와 색인이 함께 죽습니다.'
                  : '한글을 그대로 씁니다. before · process · people 은 카테고리 전용입니다.'}
              </p>
            </div>
          </div>

          <div className="card">
            <span className="label">본문</span>
            <Editor
              name="body"
              defaultValue={insight?.body ?? ''}
              folder={insight?.id ?? 'new'}
              onChange={setBody}
            />
          </div>
        </div>

        {/* ── 사이드 ── */}
        <div className="space-y-5">
          <div className="card">
            <label className="label" htmlFor="category">
              카테고리
            </label>
            <Select
              id="category"
              name="category"
              required
              defaultValue={insight?.category ?? undefined}
              options={CATEGORY_ORDER.map((value) => ({ value, label: CATEGORY_LABEL[value] }))}
              aria-label="카테고리"
            />

            <div className="mt-4">
              <label className="label" htmlFor="builderId">
                작성 빌더
              </label>
              <Select
                id="builderId"
                name="builderId"
                required
                defaultValue={insight?.builder_id ?? undefined}
                options={builders.map((b) => ({ value: b.id, label: b.displayName }))}
                aria-label="작성 빌더"
              />
              <p className="mt-1.5 text-xs text-neutral-400">
                익명·조직 명의로 발행하지 않습니다.
              </p>
            </div>
          </div>

          <div className="card">
            <span className="label">대표 이미지</span>
            {cover ? (
              // eslint-disable-next-line @next/next/no-img-element -- 외부 Storage URL 미리보기다
              <img
                src={cover}
                alt=""
                className="w-full rounded-lg border border-neutral-200"
              />
            ) : (
              <p className="text-sm text-neutral-500">본문에 이미지를 넣으면 첫 장이 쓰입니다.</p>
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
              defaultValue={insight?.meta_title ?? ''}
              onChange={(e) => setMetaTitleLen(e.target.value.length)}
              className="field"
            />
            <Counter
              length={metaTitleLen}
              warn={metaTitleLen > META_TITLE_MAX}
              hint={`${META_TITLE_MAX}자 이내`}
            />

            <div className="mt-4">
              <label className="label" htmlFor="metaDescription">
                SEO 설명
              </label>
              <textarea
                id="metaDescription"
                name="metaDescription"
                rows={4}
                defaultValue={insight?.meta_description ?? ''}
                onChange={(e) => setMetaDescLen(e.target.value.length)}
                className="field"
              />
              <Counter
                length={metaDescLen}
                warn={metaDescLen > 0 && (metaDescLen < META_DESC_MIN || metaDescLen > META_DESC_MAX)}
                hint={`${META_DESC_MIN}~${META_DESC_MAX}자`}
              />
            </div>
          </div>

          <div className="card">
            <div className="flex flex-wrap gap-2">
              <button
                type="submit"
                name="intent"
                value="draft"
                disabled={pending}
                className="btn-secondary flex-1 disabled:opacity-50"
              >
                임시저장
              </button>
              <button
                type="submit"
                name="intent"
                value="publish"
                disabled={pending}
                className="btn-primary flex-1 disabled:opacity-50"
              >
                발행
              </button>
            </div>
            <p className="mt-2 text-xs text-neutral-500">발행하면 검색엔진에 노출됩니다.</p>
            {published && (
              <p className="mt-1 text-xs text-neutral-400">
                발행된 글을 임시저장하면 공개 화면에서 내려갑니다.
              </p>
            )}
          </div>
        </div>
      </form>

      {/* 삭제는 저장 폼 밖에 둔다 — 같은 폼 안에 두면 엔터 한 번에 눌릴 수 있다 */}
      {insight && (
        <form action={deleteInsight} className="mt-8">
          <input type="hidden" name="id" value={insight.id} />
          <button
            type="submit"
            className="text-sm text-red-600 underline underline-offset-4 hover:text-red-700"
          >
            이 글 삭제
          </button>
        </form>
      )}
    </div>
  );
}

/** POL-06 길이 안내. 초과해도 저장을 막지 않는다 — 「경고하되 차단하지 않는다」 */
function Counter({ length, warn, hint }: { length: number; warn: boolean; hint: string }) {
  return (
    <p className={'mt-1.5 text-xs ' + (warn ? 'text-red-600' : 'text-neutral-400')}>
      {length}자 · 권장 {hint}
    </p>
  );
}
