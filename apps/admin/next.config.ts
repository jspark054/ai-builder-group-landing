import path from 'node:path';
import type { NextConfig } from 'next';

import { BASE_PATH } from './lib/routes';

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(import.meta.dirname, '../..'),

  /**
   * 관리 화면 경로는 확정문서 IA §3.2 가 `/admin` 아래로 고정했다
   * (A-01 `/admin/login` · A-02 `/admin/builders` · A-05 `/admin` · A-07 `/admin/insights`).
   *
   * 이 앱은 web(:3000)과 분리된 별도 Next 앱이라 라우트 루트가 `/` 다. basePath 를 두면
   * `app/login/page.tsx` 가 `/admin/login` 으로 나가 IA 표와 그대로 맞고, 인증 게이트
   * (proxy.ts)의 matcher 와 로그인 후 복귀 경로(`?next=`) 검증도 한 접두어로 정리된다.
   *
   * 값은 lib/routes.ts 가 갖는다 — `redirect()` 가 basePath 를 붙여 주지 않아
   * 서버 액션 쪽에서도 같은 값이 필요하기 때문이다.
   *
   * 개발 주소는 http://localhost:3001/admin 이 된다. `/` 로 들어가면 404 다.
   */
  basePath: BASE_PATH,
};

export default nextConfig;
