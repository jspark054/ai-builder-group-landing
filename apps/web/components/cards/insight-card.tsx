// 인사이트 카드 (P-12 · P-13 관련 글)
//
// 근거 — 화면설계 §5.11 · 기능명세 FN-P12-05(제목 · 카테고리 · 작성 빌더 · 대표 이미지)
//
// ⚠ 화면설계 §5.11 은 「C-01 프로젝트 카드의 **그리드 규격**을 재사용한다. 새 카드
//   컴포넌트를 만들지 않는다」고 적었다. 실제로 `ProjectCard` 를 그대로 쓸 수는 없다 —
//   그 소품은 `liveUrl` · `linkGrade` · `thumbnailAlt` 처럼 프로젝트에만 있는 값을
//   요구한다. 그래서 **규격(테두리 · 라운드 · 매트 · 여백 · 그리드 분기점)은 그대로 두고**
//   필드만 다른 카드를 둔다. 시각 규격이 갈라지면 안 되므로 값은 C-01 에서 그대로 옮겼다.
//
// ⚠ 커버 이미지는 **본문 첫 이미지**이고 alt 를 따로 갖지 않는다 (FN-A07-07 은 alt 를
//   저장하지 않는다). 카드에서 제목을 alt 로 지어내지 않는다 — 본문 안에서 이미 alt 를
//   가진 이미지이고, 카드에서는 제목 바로 옆의 장식이라 `alt=""` 가 맞다.

import Image from 'next/image';
import Link from 'next/link';

import { CATEGORY_LABEL } from '@/app/insights/p12-copy';
import type { InsightCardData } from '@/lib/queries/insights';

export function InsightCard({ data }: { data: InsightCardData }) {
  return (
    <article className="relative flex h-full w-full flex-col overflow-hidden rounded-card border border-border bg-surface-raised text-ink">
      {/* POL-02 — 커버가 없으면 이미지 자리를 접는다. 빈 액자를 두지 않는다 */}
      {data.coverImageUrl && (
        <div className="shrink-0 bg-border-strong p-[var(--space-4)]">
          <div className="relative aspect-[16/10] w-full overflow-hidden rounded-card bg-surface-raised">
            <Image
              src={data.coverImageUrl}
              alt=""
              fill
              sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
              className="absolute inset-0 h-full w-full object-cover"
            />
          </div>
        </div>
      )}

      <div className="flex flex-1 flex-col p-[var(--space-5)]">
        <ul className="mb-[var(--space-3)] flex flex-wrap gap-[var(--space-2)]">
          <li className="rounded-pill bg-surface-soft px-[var(--space-3)] py-[var(--space-1)] text-brand text-[length:var(--font-size-xs)] font-medium">
            {CATEGORY_LABEL[data.category]}
          </li>
        </ul>

        <h3 className="font-semibold text-[length:var(--font-size-lg)] leading-[var(--leading-heading)] tracking-[var(--tracking-heading)]">
          {/* ::after 가 카드 전체를 덮어 클릭 영역이 된다 (중첩 <a> 없이).
              슬러그는 자연어 한글이다 — Link 가 인코딩하고 상세의 params 가 디코딩해 받는다.
              여기서 encodeURIComponent 를 하면 이중 인코딩이 되어 404 가 난다 */}
          <Link
            href={`/insights/${data.slug}`}
            className="after:absolute after:inset-0 after:content-['']"
          >
            {data.title}
          </Link>
        </h3>

        {/* FN-P12-05 · REQ-F-095 — 작성 빌더를 표기한다. 익명으로 두지 않는다 */}
        <p className="mt-auto pt-[var(--space-4)] text-muted text-[length:var(--font-size-sm)]">
          {data.builderName}
        </p>
      </div>
    </article>
  );
}
