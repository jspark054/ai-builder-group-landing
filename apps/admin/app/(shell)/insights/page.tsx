// A-07 인사이트 관리 `/admin/insights` — 관리자 전용
//
// 근거 — 화면설계 §6.5a · 기능명세 §5.7(FN-A07-01 · FN-A07-10) · IA §3.2
//
// 목록을 발행 상태별로 본다. 필터는 링크(searchParams)로 건다 — 상태 하나 고르자고
// 클라이언트 컴포넌트를 들이지 않는다. 서버 컴포넌트가 기본이다.
//
// 조판은 발주사 Admin CMS 목록 화면을 따랐다 (2026-08-27 캡처) — 제목 + 건수 부제,
// 필터 줄, 표. 그림자 대신 테두리로 세운다 (하드룰 1).

import Link from 'next/link';

import type { InsightStatus } from '@orca/supabase';

import { requireAdmin } from '@/lib/authz';
import { CATEGORY_LABEL, STATUS_LABEL, STATUS_ORDER, ymd } from '@/lib/insights';
import { listInsights } from '@/lib/queries/insights';

export const dynamic = 'force-dynamic';

type Filter = InsightStatus | 'all';

function parseFilter(raw: string | undefined): Filter {
  return STATUS_ORDER.includes(raw as InsightStatus) ? (raw as InsightStatus) : 'all';
}

export default async function InsightListPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireAdmin();

  const active = parseFilter((await searchParams).status);
  const rows = await listInsights();
  const shown = active === 'all' ? rows : rows.filter((r) => r.status === active);

  // 건수는 필터가 걸리기 전 전체 기준으로 센다. 필터를 누를 때마다 다른 칩이 0 이 되면
  // 「그 상태에 몇 건이 있나」를 볼 수 없다.
  const count = (f: Filter) =>
    f === 'all' ? rows.length : rows.filter((r) => r.status === f).length;

  const chips: Filter[] = ['all', ...STATUS_ORDER];

  return (
    <div>
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">인사이트 관리</h1>
          <p className="mt-1 text-sm text-neutral-500">
            전체 {rows.length}개 · 발행 {count('published')}개
          </p>
        </div>
        <Link href="/insights/new" className="btn-primary">
          + 새 글
        </Link>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {chips.map((chip) => (
          <Link
            key={chip}
            href={chip === 'all' ? '/insights' : `/insights?status=${chip}`}
            aria-current={active === chip ? 'page' : undefined}
            className={
              'rounded-full border px-3 py-1.5 text-sm ' +
              (active === chip
                ? 'border-neutral-900 bg-neutral-900 text-white'
                : 'border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-100')
            }
          >
            {chip === 'all' ? '전체' : STATUS_LABEL[chip]}
            <span className="ml-1.5 text-xs opacity-70">{count(chip)}</span>
          </Link>
        ))}
      </div>

      {shown.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-neutral-200 bg-white px-6 py-16 text-center">
          <p className="font-medium">
            {rows.length === 0 ? '아직 작성된 글이 없습니다' : '이 상태의 글이 없습니다'}
          </p>
          <p className="mt-1 text-sm text-neutral-500">
            {rows.length === 0
              ? '「+ 새 글」로 첫 글을 시작하세요.'
              : '다른 상태를 선택해 보세요.'}
          </p>
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-neutral-200 bg-white">
          <table className="w-full min-w-[46rem] text-sm">
            <thead className="border-b border-neutral-200 text-left text-xs text-neutral-500">
              <tr>
                <th className="px-5 py-3 font-medium">제목</th>
                <th className="px-5 py-3 font-medium">카테고리</th>
                <th className="px-5 py-3 font-medium">빌더</th>
                <th className="px-5 py-3 font-medium">상태</th>
                <th className="px-5 py-3 font-medium">수정일</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((row) => (
                <tr key={row.id} className="border-b border-neutral-100 last:border-b-0">
                  <td className="px-5 py-4">
                    <Link href={`/insights/${row.id}`} className="font-medium hover:underline">
                      {row.title}
                    </Link>
                    <span className="mt-0.5 block text-xs text-neutral-400">
                      /insights/{row.slug}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-neutral-600">{CATEGORY_LABEL[row.category]}</td>
                  <td className="px-5 py-4 text-neutral-600">{row.builderName}</td>
                  <td className="px-5 py-4">
                    <StatusBadge status={row.status} />
                  </td>
                  <td className="px-5 py-4 text-neutral-500 tabular-nums">
                    {ymd(row.updatedAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/** 발행됨만 검게 세운다 — 대외로 나가 있는 글이 어느 것인지가 이 화면의 핵심 정보다 */
function StatusBadge({ status }: { status: InsightStatus }) {
  const tone =
    status === 'published'
      ? 'bg-neutral-900 text-white'
      : 'border border-neutral-300 text-neutral-600';
  return (
    <span className={`inline-block rounded-full px-2.5 py-1 text-xs ${tone}`}>
      {STATUS_LABEL[status]}
    </span>
  );
}
