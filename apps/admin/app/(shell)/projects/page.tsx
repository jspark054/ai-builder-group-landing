// A-03 프로젝트 관리 `/admin/projects` — 관리자 전용
//
// 근거 — 화면설계 §6.3 · 기능명세 §5.3(FN-A03-01 · FN-A03-14 · FN-A03-15)
//
// 조판은 A-07 목록과 같다. 발주사 Admin CMS 의 포트폴리오 표를 따랐고, 그쪽이 쓰는
// 「노출 중 / 미노출」 pill 도 같은 자리에 둔다 — 운영자가 이미 아는 조작이다.
//
// ⚠ 순서 변경 버튼(↑↓)을 두지 않았다. `sort_order` 는 편집 화면에서 숫자로 고친다.
//   행마다 버튼을 두려면 저장 액션이 두 행을 한 트랜잭션으로 맞바꿔야 하는데,
//   그 처리를 지금 넣으면 A-03 의 본체(4문항 · 체크리스트)보다 커진다. FN-A03-15 는
//   「수동 조정」이 인수 기준이고 숫자 입력이 그것을 만족한다.

import Link from 'next/link';

import { requireAdmin } from '@/lib/authz';
import { LINK_GRADE_LABEL, ymd } from '@/lib/projects';
import { listProjects } from '@/lib/queries/projects';

export const dynamic = 'force-dynamic';

export default async function ProjectListPage() {
  await requireAdmin();

  const rows = await listProjects();
  const publicCount = rows.filter((row) => row.isPublic).length;

  return (
    <div>
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">프로젝트 관리</h1>
          <p className="mt-1 text-sm text-neutral-500">
            전체 {rows.length}개 · 공개 {publicCount}개
          </p>
        </div>
        <Link href="/projects/new" className="btn-primary">
          + 새 프로젝트
        </Link>
      </div>

      {rows.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-neutral-200 bg-white px-6 py-16 text-center">
          <p className="font-medium">아직 등록된 프로젝트가 없습니다</p>
          <p className="mt-1 text-sm text-neutral-500">「+ 새 프로젝트」로 시작하세요.</p>
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-neutral-200 bg-white">
          <table className="w-full min-w-[52rem] text-sm">
            <thead className="border-b border-neutral-200 text-left text-xs text-neutral-500">
              <tr>
                <th className="px-5 py-3 font-medium">순서</th>
                <th className="px-5 py-3 font-medium">제목</th>
                <th className="px-5 py-3 font-medium">담당 빌더</th>
                <th className="px-5 py-3 font-medium">링크 등급</th>
                <th className="px-5 py-3 font-medium">공개</th>
                <th className="px-5 py-3 font-medium">수정일</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-neutral-100 last:border-b-0">
                  <td className="px-5 py-4 tabular-nums text-neutral-400">{row.sortOrder}</td>
                  <td className="px-5 py-4">
                    <Link href={`/projects/${row.id}`} className="font-medium hover:underline">
                      {row.title}
                    </Link>
                    <span className="mt-0.5 block text-xs text-neutral-400">
                      /portfolio/{row.slug}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-neutral-600">
                    {/* POL-02 — 연결이 없으면 빈 칸이 아니라 없다고 적는다 */}
                    {row.builderNames.length > 0 ? row.builderNames.join(' · ') : '미연결'}
                  </td>
                  <td className="px-5 py-4 text-neutral-600">
                    {LINK_GRADE_LABEL[row.linkGrade]}
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
