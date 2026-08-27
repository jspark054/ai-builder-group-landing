// A-05 대시보드 `/admin` — 관리자 전용
//
// 근거 — 기능명세 §5.5(FN-A05-01 진입 경로 · FN-A05-02 건수 요약) ·
//        화면설계 §6.5(「구성은 A-02에 준한다」) · IA §154(P1)
//
// 도면이 없는 화면이다. 화면설계가 한 줄로 A-02 를 가리키므로 조판을 그쪽에서 가져왔다 —
// 제목 + 부제, 그 아래 카드. 카드 테두리·모서리도 `.card` 그대로다.
//
// ⚠ **새 데이터를 만들지 않는다.** 세 카드는 이미 있는 테이블을 셀 뿐이라
//   A-02 · A-03 · A-07 이 고치면 여기가 따라 바뀐다.
//
// 카드 전체가 링크다. FN-A05-01(진입 경로)은 사이드바가 이미 하지만, 숫자를 보고
// 바로 그 화면으로 가는 것이 대시보드에서 실제로 하는 동작이다.
//
// 이 화면은 관리자 전용이다. 빌더가 주소를 직접 치면 A-06 으로 돌아간다 —
// 판정은 레이아웃이 아니라 여기서 한다 (lib/authz.ts 주석 참조).

import Link from 'next/link';

import { requireAdmin } from '@/lib/authz';
import { getDashboardCounts } from '@/lib/queries/dashboard';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const viewer = await requireAdmin();
  const { builder, project, insight } = await getDashboardCounts();

  return (
    <div>
      <div>
        <h1 className="text-2xl font-bold tracking-tight">대시보드</h1>
        <p className="mt-1 text-sm text-neutral-500">{viewer.name} 님, 콘텐츠 현황입니다.</p>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          href="/builders"
          label="빌더"
          value={builder && `${builder.total}명`}
          detail={builder && `공개 ${builder.publicCount}명 · 비공개 ${builder.total - builder.publicCount}명`}
        />

        <StatCard
          href="/projects"
          label="프로젝트"
          value={project && `${project.total}개`}
          detail={project && `공개 ${project.publicCount}개 · 비공개 ${project.total - project.publicCount}개`}
        />

        <StatCard
          href="/insights"
          label="인사이트"
          value={insight && `${insight.total}건`}
          detail={
            insight &&
            [
              `발행 ${insight.published}건`,
              `임시저장 ${insight.draft}건`,
              // 진입 경로가 없는 상태다. 0 이면 없는 단계처럼 두는 편이 정확하다
              ...(insight.review > 0 ? [`검토 ${insight.review}건`] : []),
            ].join(' · ')
          }
          // A-02 가 POL-02 위반을 잡아 주는 것과 같은 자리다 — 「발행했는데 왜 404 지」로
          // 막히기 전에 관리 화면이 먼저 말한다
          warning={
            insight && insight.missingPublishedAt > 0
              ? `발행 상태이지만 발행 일시가 없어 공개 화면에서 404 인 글이 ${insight.missingPublishedAt}건 있습니다.`
              : null
          }
        />
      </div>
    </div>
  );
}

/**
 * 숫자 하나와 그 내역 한 줄.
 *
 * `value` 가 null 이면 **조회 실패**다. 0 으로 떨어뜨리면 「아직 없음」과 구분되지 않아
 * 운영자가 데이터가 지워진 줄 안다.
 */
function StatCard({
  href,
  label,
  value,
  detail,
  warning = null,
}: {
  href: string;
  label: string;
  value: string | null;
  detail: string | null;
  warning?: string | null;
}) {
  return (
    <Link
      href={href}
      className="card block transition-colors hover:border-neutral-400 focus-visible:border-neutral-400 focus-visible:outline-none"
    >
      <p className="text-sm text-neutral-500">{label}</p>

      {value === null ? (
        <p className="mt-2 text-sm text-neutral-500">불러오지 못했습니다</p>
      ) : (
        <>
          <p className="mt-2 text-3xl font-bold tabular-nums tracking-tight">{value}</p>
          <p className="mt-1 text-sm tabular-nums text-neutral-500">{detail}</p>
          {warning && <p className="mt-3 text-sm text-red-600">{warning}</p>}
        </>
      )}
    </Link>
  );
}
