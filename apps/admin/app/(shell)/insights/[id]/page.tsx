// A-07 인사이트 편집 `/admin/insights/{id}` — `new` 면 새 글
//
// 근거 — 화면설계 §6.5a · 기능명세 §5.7
//
// 권한 판정은 레이아웃이 아니라 여기서 한다 (lib/authz.ts 주석 참조).
// 화면 본체는 ./form.tsx 다 — 저장 실패 시 입력값을 유지해야 해서(FN-A07-09)
// `useActionState` 를 쓰는 클라이언트 컴포넌트여야 한다.

import { notFound } from 'next/navigation';

import { requireAdmin } from '@/lib/authz';
import { getInsight, listBuilderOptions } from '@/lib/queries/insights';

import { InsightForm } from './form';

export const dynamic = 'force-dynamic';

export default async function InsightEditPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();

  const { id } = await params;
  const builders = await listBuilderOptions();

  if (id === 'new') {
    return <InsightForm builders={builders} insight={null} />;
  }

  const insight = await getInsight(id);
  if (!insight) notFound();

  return <InsightForm builders={builders} insight={insight} />;
}
