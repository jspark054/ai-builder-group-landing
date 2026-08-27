// A-02 빌더 편집 `/admin/builders/{id}` — `new` 면 새 빌더
//
// 근거 — 화면설계 §6.2 · 기능명세 §5.2
//
// 화면 본체는 ./form.tsx 다 — 이력 추가/삭제와 체크리스트가 입력에 따라 갱신돼야 해서
// 클라이언트 컴포넌트여야 한다.

import { notFound } from 'next/navigation';

import { requireAdmin } from '@/lib/authz';
import { getBuilderForEdit, latestCohort, listCourseOptions } from '@/lib/queries/builders';

import { BuilderForm } from './form';

export const dynamic = 'force-dynamic';

export default async function BuilderEditPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  await requireAdmin();

  const { id } = await params;
  const { error } = await searchParams;
  const courses = await listCourseOptions();

  if (id === 'new') {
    return (
      <BuilderForm builder={null} courses={courses} defaultCohort={await latestCohort()} />
    );
  }

  const builder = await getBuilderForEdit(id);
  if (!builder) notFound();

  return (
    <BuilderForm
      builder={builder}
      courses={courses}
      defaultCohort={builder.cohort}
      // 삭제가 FK 로 막혔을 때 (인사이트 글이 남아 있는 경우)
      deleteBlocked={error === 'delete'}
    />
  );
}
