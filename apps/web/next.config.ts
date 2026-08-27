import path from 'node:path';
import type { NextConfig } from 'next';

/**
 * 인사이트 커버 이미지 호스트 (P-13 · FN-A07-07).
 *
 * 본문 이미지는 A-07 에서 Supabase Storage 로 올라가므로 원격 URL 이다. `next/image` 는
 * 허용 목록에 없는 호스트를 거부한다 — 등록하지 않으면 **런타임에만** 터진다.
 * 빌드는 통과하고 카드가 렌더되는 순간 죽는다.
 *
 * 호스트를 하드코딩하지 않고 프로젝트 URL 에서 뽑는다. 값이 없으면(로컬에서 키 없이
 * 빌드하는 경우) 목록도 비어 있어 원격 이미지를 부를 일이 없다.
 */
function supabaseImageHost(): string | undefined {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!raw) return undefined;
  try {
    return new URL(raw).hostname;
  } catch {
    return undefined;
  }
}

const imageHost = supabaseImageHost();

const nextConfig: NextConfig = {
  // 모노레포 루트 기준으로 파일 추적한다 (앱 디렉터리 바깥에 공유 설정이 있다).
  outputFileTracingRoot: path.join(import.meta.dirname, '../..'),
  // Promoted out of `experimental` in Next.js 16.
  typedRoutes: true,
  ...(imageHost
    ? {
        images: {
          remotePatterns: [
            {
              protocol: 'https' as const,
              hostname: imageHost,
              pathname: '/storage/v1/object/public/**',
            },
          ],
        },
      }
    : {}),
};

export default nextConfig;
