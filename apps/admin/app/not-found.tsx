import Link from 'next/link';

import { getViewer } from '@/lib/authz';

/**
 * 관리 화면 404.
 *
 * ⚠ 문구가 「해당 글이 존재하지 않습니다」였다. 템플릿 블로그에서 넘어온 문장인데
 *   이 앱에서 404 가 나는 대부분은 글이 아니라 **프로젝트 · 빌더**다.
 *   특히 A-06 은 「대표가 아닌 프로젝트」를 404 로 수렴시키므로(FN-A06-05),
 *   그 자리에 「글」이라고 적혀 있으면 무엇을 못 찾았는지 오해하게 된다.
 *
 * ⚠ 돌아갈 곳도 역할에 따라 다르다. 빌더에게 대시보드는 없는 화면이다 —
 *   `/` 로 보내면 `requireAdmin()` 이 다시 `/my` 로 돌려보내 한 번 더 튄다.
 */
export default async function NotFound() {
  const viewer = await getViewer();
  const isBuilder = viewer?.role === 'builder';

  return (
    <div className="space-y-4 py-16 text-center">
      <h1 className="text-2xl font-bold">찾을 수 없음</h1>
      <p className="text-neutral-500">
        요청하신 화면이 없거나 접근할 수 없습니다.
      </p>
      <Link
        href={isBuilder ? '/my' : '/'}
        className="inline-block text-neutral-900 underline underline-offset-4"
      >
        {isBuilder ? '내 프로필로' : '대시보드로'}
      </Link>
    </div>
  );
}
