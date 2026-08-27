// A-06 빌더 개인 관리 `/admin/my` — 빌더 전용
//
// 근거 — 기능명세 §5.6 · IA §3.2
//   FN-A06-01  로그인한 빌더의 프로필을 조회한다 (본인 레코드만)
//   FN-A06-04  담당 프로젝트를 대표 · 참여로 구분해 목록 표시한다
//   FN-A06-06  참여 건에 대표 빌더가 누구인지 표시한다
//   FN-A06-08  최종 수정 일시를 표시한다
//
// 예외 처리 (기능명세 §5.6 표)
//   계정은 있으나 builder 레코드 미연결 → 안내 후 관리자 문의 유도
//     `requireBuilder()` 가 그 경우 role 을 'builder' 로 만들지 않으므로 여기 오지 않는다.
//     `getViewer()` 가 null 을 돌려주고 로그인 화면에서 「관리 화면 권한이 없습니다」로 끊긴다.
//   대표 프로젝트 0건 → 프로필만 편집. 빈 상태 안내

import Link from 'next/link';
import { notFound } from 'next/navigation';

import { requireBuilder } from '@/lib/authz';
import { ymd } from '@/lib/builders';
import { getMyProfile, getMyProjects } from '@/lib/queries/my';

import { MyProfileForm } from './profile-form';

export const dynamic = 'force-dynamic';

export default async function MyPage() {
  const viewer = await requireBuilder();

  const [profile, projects] = await Promise.all([
    getMyProfile(viewer.builderId),
    getMyProjects(viewer.builderId),
  ]);

  if (!profile) notFound();

  const owned = projects.filter((project) => project.isOwner);
  const joined = projects.filter((project) => !project.isOwner);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">내 프로필</h1>
        {/* FN-A06-08 — 최종 수정 일시 */}
        <p className="mt-1 text-sm text-neutral-500">
          마지막 수정 {ymd(profile.updated_at)} · {profile.is_public ? '공개 중' : '비공개'}
        </p>
      </div>

      <MyProfileForm profile={profile} />

      {/* FN-A06-04 — 대표 · 참여 구분 */}
      <section>
        <h2 className="text-lg font-semibold tracking-tight">담당 프로젝트</h2>
        <p className="mt-1 text-sm text-neutral-500">
          대표로 지정된 건만 편집할 수 있습니다.
        </p>

        {projects.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-neutral-200 bg-white px-6 py-12 text-center">
            <p className="font-medium">연결된 프로젝트가 없습니다</p>
            <p className="mt-1 text-sm text-neutral-500">
              프로젝트 연결은 운영 담당자가 합니다.
            </p>
          </div>
        ) : (
          <div className="mt-4 space-y-6">
            {owned.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-medium text-neutral-500">대표</p>
                <ul className="divide-y divide-neutral-100 overflow-hidden rounded-2xl border border-neutral-200 bg-white">
                  {owned.map((project) => (
                    <li key={project.id} className="flex items-center gap-4 px-5 py-4">
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/my/projects/${project.id}`}
                          className="font-medium hover:underline"
                        >
                          {project.title}
                        </Link>
                        <span className="mt-0.5 block text-xs text-neutral-400">
                          /portfolio/{project.slug} · 수정 {ymd(project.updatedAt)}
                        </span>
                      </div>
                      <span
                        className={
                          'shrink-0 rounded-full px-2.5 py-1 text-xs ' +
                          (project.isPublic
                            ? 'bg-neutral-900 text-white'
                            : 'border border-neutral-300 text-neutral-600')
                        }
                      >
                        {project.isPublic ? '공개 중' : '비공개'}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {joined.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-medium text-neutral-500">참여</p>
                <ul className="divide-y divide-neutral-100 overflow-hidden rounded-2xl border border-neutral-200 bg-white">
                  {joined.map((project) => (
                    <li key={project.id} className="flex items-center gap-4 px-5 py-4">
                      <div className="min-w-0 flex-1">
                        {/* 편집 링크를 두지 않는다. 참여 건은 열리지 않는다 (FN-A06-05) */}
                        <p className="font-medium text-neutral-700">{project.title}</p>
                        <span className="mt-0.5 block text-xs text-neutral-400">
                          {/* FN-A06-06 — 대표가 누구인지 */}
                          대표 {project.ownerName ?? '미지정'} · 수정 {ymd(project.updatedAt)}
                        </span>
                      </div>
                      <span
                        className={
                          'shrink-0 rounded-full px-2.5 py-1 text-xs ' +
                          (project.isPublic
                            ? 'bg-neutral-900 text-white'
                            : 'border border-neutral-300 text-neutral-600')
                        }
                      >
                        {project.isPublic ? '공개 중' : '비공개'}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
