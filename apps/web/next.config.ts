import path from 'node:path';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // 모노레포 루트 기준으로 파일 추적한다 (앱 디렉터리 바깥에 공유 설정이 있다).
  outputFileTracingRoot: path.join(import.meta.dirname, '../..'),
  // Promoted out of `experimental` in Next.js 16.
  typedRoutes: true,
};

export default nextConfig;
