/**
 * A-05 대시보드 `/admin` 자리. 템플릿 블로그 검수 화면을 걷어낸 뒤의 껍데기다.
 *
 * 관리 화면 7종 중 A-01(로그인)만 구현됐다. A-02 빌더 · A-03 프로젝트 · A-06 빌더 개인 ·
 * A-07 인사이트가 남았고, A-04(교육 과정 관리)는 범위 밖이다.
 *
 * 이 화면은 관리자 전용이다. 빌더가 주소를 직접 치면 A-06 으로 돌아간다 —
 * 판정은 레이아웃이 아니라 여기서 한다 (lib/authz.ts 주석 참조).
 */

import { requireAdmin } from '@/lib/authz';

export default async function DashboardPage() {
  await requireAdmin();

  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-bold tracking-tight">대시보드</h1>
      <p className="text-sm text-neutral-500">관리 화면은 아직 구현 전입니다.</p>
    </div>
  );
}
