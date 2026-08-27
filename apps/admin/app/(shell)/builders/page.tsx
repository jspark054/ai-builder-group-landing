// A-02 빌더 관리 `/admin/builders` — 관리자 전용
//
// 근거 — 화면설계 §6.2 · 기능명세 §5.2(FN-A02-01) · POL-02 · POL-12
//
// ⚠ **담당 프로젝트 수를 목록에 둔다.** POL-02 가 「프로젝트 0건인 빌더는 목록에
//   노출하지 않는다」이므로, 공개로 켜 두어도 0건이면 P-05 에 나오지 않는다.
//   그 사실이 관리 화면에서 보이지 않으면 운영자는 「공개했는데 왜 안 보이지」로 막힌다.

import Link from 'next/link';

import { requireAdmin } from '@/lib/authz';
import { NAME_TYPE_LABEL, ymd } from '@/lib/builders';
import { listBuilders } from '@/lib/queries/builders';

export const dynamic = 'force-dynamic';

export default async function BuilderListPage() {
  await requireAdmin();

  const rows = await listBuilders();
  const publicCount = rows.filter((row) => row.isPublic).length;
  // 공개인데 프로젝트가 없어 P-05 에 안 나오는 빌더
  const hiddenByPolicy = rows.filter((row) => row.isPublic && row.projectCount === 0).length;

  return (
    <div>
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">빌더 관리</h1>
          <p className="mt-1 text-sm text-neutral-500">
            전체 {rows.length}명 · 공개 {publicCount}명
          </p>
        </div>
        <Link href="/builders/new" className="btn-primary">
          + 새 빌더
        </Link>
      </div>

      {hiddenByPolicy > 0 && (
        <p className="mt-5 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-700">
          공개 상태이지만 담당 프로젝트가 없어 목록에 노출되지 않는 빌더가 {hiddenByPolicy}명
          있습니다 (POL-02).
        </p>
      )}

      {rows.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-neutral-200 bg-white px-6 py-16 text-center">
          <p className="font-medium">아직 등록된 빌더가 없습니다</p>
          <p className="mt-1 text-sm text-neutral-500">「+ 새 빌더」로 시작하세요.</p>
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-neutral-200 bg-white">
          <table className="w-full min-w-[52rem] text-sm">
            <thead className="border-b border-neutral-200 text-left text-xs text-neutral-500">
              <tr>
                <th className="px-5 py-3 font-medium">표기명</th>
                <th className="px-5 py-3 font-medium">표기</th>
                <th className="px-5 py-3 font-medium">기수</th>
                <th className="px-5 py-3 font-medium">이미지</th>
                <th className="px-5 py-3 font-medium">프로젝트</th>
                <th className="px-5 py-3 font-medium">공개</th>
                <th className="px-5 py-3 font-medium">수정일</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-neutral-100 last:border-b-0">
                  <td className="px-5 py-4">
                    <Link href={`/builders/${row.id}`} className="font-medium hover:underline">
                      {row.displayName}
                    </Link>
                    {row.isPinned && (
                      <span className="ml-2 rounded-full border border-neutral-300 px-2 py-0.5 text-xs text-neutral-600">
                        고정 {row.pinOrder ?? ''}
                      </span>
                    )}
                    <span className="mt-0.5 block text-xs text-neutral-400">
                      /builders/{row.slug}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-neutral-600">{NAME_TYPE_LABEL[row.nameType]}</td>
                  <td className="px-5 py-4 tabular-nums text-neutral-600">{row.cohort}기</td>
                  <td className="px-5 py-4 text-neutral-600">
                    {/* POL-02 — 미등록이어도 정상이다. 이니셜 폴백이 걸린다 */}
                    {row.hasImage ? '등록' : '미등록'}
                  </td>
                  <td
                    className={
                      'px-5 py-4 tabular-nums ' +
                      (row.isPublic && row.projectCount === 0
                        ? 'text-red-600'
                        : 'text-neutral-600')
                    }
                  >
                    {row.projectCount}건
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={
                        'inline-block rounded-full px-2.5 py-1 text-xs ' +
                        (row.isPublic
                          ? 'bg-neutral-900 text-white'
                          : 'border border-neutral-300 text-neutral-600')
                      }
                    >
                      {row.isPublic ? '공개 중' : '비공개'}
                    </span>
                  </td>
                  <td className="px-5 py-4 tabular-nums text-neutral-500">{ymd(row.updatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
