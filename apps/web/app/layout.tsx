import type { Metadata } from 'next';

import { Analytics } from '@/components/Analytics';
import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import {
  bingVerification,
  googleVerification,
  naverVerification,
  siteDescription,
  siteLocale,
  siteName,
  siteUrl,
  twitterSite,
} from '@/lib/site';

// The single app stylesheet. It imports ai-builder-design-tokens.css itself.
import './ai-builder-tailwind-theme.css';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: siteName,
    template: `%s | ${siteName}`,
  },
  description: siteDescription,
  applicationName: siteName,
  openGraph: {
    type: 'website',
    siteName,
    locale: siteLocale.replace('-', '_'),
    url: siteUrl,
  },
  twitter: {
    card: 'summary_large_image',
    ...(twitterSite ? { site: twitterSite } : {}),
  },
  // Search Console / Search Advisor ownership. Each is emitted only when the
  // corresponding env var is set, so an empty .env ships no stray meta tags.
  verification: {
    ...(googleVerification ? { google: googleVerification } : {}),
    ...(bingVerification ? { other: { 'msvalidate.01': bingVerification } } : {}),
  },
  // RSS 선언을 두지 않는다 (8/20). `/rss.xml` 을 만든 적이 없어 죽은 참조였고,
  // 인사이트 발행 글이 0건이라 지금 피드를 만들 내용도 없다.
  // P-12 에 첫 글이 들어올 때 피드 라우트와 함께 되살린다.
  alternates: {
    canonical: siteUrl,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-snippet': -1,
      'max-image-preview': 'large',
      'max-video-preview': -1,
    },
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang={siteLocale.split('-')[0]}>
      <head>
        {/* Pretendard is not bundled — without this the design falls back to system fonts. */}
        <link
          rel="stylesheet"
          as="style"
          crossOrigin=""
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css"
        />
        {/* Naver Search Advisor has no first-class slot in Next's metadata API. */}
        {naverVerification && <meta name="naver-site-verification" content={naverVerification} />}
        {/* Points LLM crawlers at the machine-readable site summary. */}
        <link rel="llms" href={`${siteUrl}/llms.txt`} />
      </head>
      <body className="min-h-dvh">
        <Header />

        {/* 폭 제한을 두지 않는다 — 랜딩 섹션은 배경이 화면 끝까지 닿아야 한다.
            읽기용 화면(blog · about)은 각자의 중첩 레이아웃에서 폭을 잡는다. */}
        <main>{children}</main>

        <Footer />

        <Analytics />
      </body>
    </html>
  );
}
