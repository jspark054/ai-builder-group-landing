// A-06 대표 프로젝트 편집 `/admin/my/projects/{id}` — 빌더 전용
//
// 근거 — 기능명세 §5.6(FN-A06-05 · 07 · 09)
//
// 🔴 **대표가 아니면 404 다.** 참여 건의 주소를 직접 쳐도 열리지 않는다 (FN-A06-05).
//    읽기는 authenticated 에게 전체가 열려 있어(`project_select_authenticated`)
//    RLS 가 막아 주지 않는다 — 쿼리에서 잘라야 한다.
//
// ⚠ 「권한 없음」이 아니라 404 로 수렴시킨다. 존재 여부까지 알려 줄 이유가 없다.

import { notFound } from 'next/navigation';

import { requireBuilder } from '@/lib/authz';
import { getMyOwnedProject } from '@/lib/queries/my';

import { MyProjectForm } from './form';

export const dynamic = 'force-dynamic';

export default async function MyProjectEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const viewer = await requireBuilder();
  const { id } = await params;

  const owned = await getMyOwnedProject(viewer.builderId, id);
  if (!owned) notFound();

  return <MyProjectForm project={owned.project} />;
}
