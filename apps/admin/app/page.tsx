/**
 * A-05 대시보드 자리. 템플릿 블로그 검수 화면을 걷어낸 뒤의 껍데기다.
 *
 * 관리 화면 7종(A-01 로그인 · A-02 빌더 · A-03 프로젝트 · A-05 대시보드 ·
 * A-06 빌더 개인 관리 · A-07 인사이트)은 Supabase 스키마 확정 후 구현한다.
 * A-04(교육 과정 관리)는 범위 밖이다.
 */
export default function DashboardPage() {
  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-bold tracking-tight">관리자</h1>
      <p className="text-sm text-neutral-500">관리 화면은 아직 구현 전입니다.</p>
    </div>
  );
}
