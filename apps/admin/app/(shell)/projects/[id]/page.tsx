// A-03 프로젝트 편집 `/admin/projects/{id}` — `new` 면 새 프로젝트
//
// 근거 — 화면설계 §6.3 · 기능명세 §5.3
//
// 권한 판정은 레이아웃이 아니라 여기서 한다 (lib/authz.ts 주석 참조).
// 화면 본체는 ./form.tsx 다 — 실시간 글자수 카운터(FN-A03-05)와 공개 전 체크리스트
// (FN-A03-16)가 입력에 따라 갱신돼야 해서 클라이언트 컴포넌트여야 한다.

import { notFound } from 'next/navigation';

import { requireAdmin } from '@/lib/authz';
import {
  getProjectForEdit,
  listBuilderOptions,
  listCategoryOptions,
  nextSortOrder,
} from '@/lib/queries/projects';

import { ProjectForm } from './form';

export const dynamic = 'force-dynamic';

export default async function ProjectEditPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();

  const { id } = await params;
  const [builders, categories] = await Promise.all([listBuilderOptions(), listCategoryOptions()]);

  if (id === 'new') {
    return (
      <ProjectForm
        builders={builders}
        categories={categories}
        data={null}
        defaultSortOrder={await nextSortOrder()}
      />
    );
  }

  const data = await getProjectForEdit(id);
  if (!data) notFound();

  return (
    <ProjectForm
      builders={builders}
      categories={categories}
      data={data}
      defaultSortOrder={data.project.sort_order}
    />
  );
}
