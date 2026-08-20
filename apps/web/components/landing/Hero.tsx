// P-01 랜딩 · 섹션 1 히어로
//
// 근거 — 화면설계 §5.1 · 기능명세 §4.1 · 디자인규칙 「P-01 랜딩 배경 리듬」
//   FN-P01-13  아이브로우 라벨 없음
//   FN-P01-14  높이 66dvh · 그 안에서 수직 중앙 정렬
//   FN-P01-15  H1 은 발주사 실측 스펙 — 700 clamp(30px,3.9vw,52px)/1.24 · -0.03em
//   FN-P01-19  스크롤 이벤트를 가로채지 않는다
//   FN-P01-37  스크롤 유도는 문구가 아닌 기호. 텍스트 0자 · 모션 0건
//   FN-C03-01~03  CTA 는 C-03 컴포넌트가 그린다 (components/cta/contact-cta.tsx).
//                 문구 "프로젝트 상담하기" · P-10 이동 · utm_source=home 은 그쪽이 정한다
//   FN-C03-05  마이크로카피는 v3.2 부터 P-01 미적용
//   POL-11①-2  등장 애니메이션 없음 — 이 섹션에는 어떤 모션도 두지 않는다
//
// 카피는 content/p01-copy.ts 의 B안(신뢰 중심). 이 파일에 문장을 직접 쓰지 않는다.
//   FR-1.7(본사 관계 표기)은 회신 대기 중이라 서브 둘째 줄에 회사명·관계 표기를
//   넣지 않는다. 주어는 「조직」까지만 두고, 회신 후 수식만 앞에 붙일 수 있게
//   문장을 열어 둔 상태다. 교체할 때도 이 파일이 아니라 카피 파일만 고친다.
//   근거는 결정시트 I-7 · 요구사항정의서 §2.4(REQ-F-032 압축 서술 허용).
//
// ─────────────────────────────────────────────────────────────────────────
// 2단 재구성 (8/21)
//
// 기능명세 §4.1 이 히어로 데이터 소스를 「정적 + 대표 프로젝트」로 적고 있고
// 화면설계 §5.1 도면에도 이미지 박스가 있는데 그동안 미구현이었다. 그 박스를 채운다.
// 다만 도면은 이미지를 서브카피 **아래**에 세로로 쌓은 1단이다. 좌우 2단은 도면이
// 정하지 않은 부분을 채운 것이지 도면 그대로가 아니다.
//
// 비율은 7:5 다 (텍스트가 넓은 쪽). 5:7 로 뒤집으면 텍스트열이 447px 이 되고
// 서브카피 둘째 줄이 접혀 **<br> 로 끊은 2줄 구조가 3줄로 깨진다** — 첫 줄이
// SEO 키워드 줄이라 그 구조가 의미를 갖는다 (FR-6.1). 7:5 는 625px 을 확보한다.
//
// **lg 미만에서 이미지를 렌더하지 않는다.** 1단으로 접으면 이미지가 세로로 쌓여
// 히어로가 768px 폭에서 949px · 360px 폭에서 746px 이 되고, FN-P01-14 의
// 「히어로 높이 ≈ 뷰포트 66%」가 정면으로 깨진다 (상한은 각각 676 · 528). 숨기면
// 좁은 화면은 2단 도입 전과 정확히 같은 높이로 돌아온다. 캡처를 아예 못 보게 되는
// 것은 아니다 — 같은 화면 섹션 4 가 포트폴리오 카드다. 다만 바로 아래는 아니고
// 섹션 2·3 을 지나야 나온다. 히어로에서 곧장 보이지 않는다는 손실은 실제로 있다.
//
// 여백을 건드리지 않는 한 좁은 화면에 캡처를 넣을 자리 자체가 없다. 360×800 기준
// 상한 528px 중 상하 패딩이 192px, 텍스트 덩어리(H1 2줄 + 서브 3줄 + CTA)가 약 306px 라
// 남는 것이 30px 인데 열 간격(--space-12)만 48px 다. 비율을 아무리 납작하게 잡아도
// 들어가지 않는다. 표시하려면 --section-block 이나 66dvh 자체를 바꿔야 한다.
//
// 실측 (8/21 · 헤드리스 크롬 · 정확한 뷰포트)
//   1440×900  히어로 594px = 상한 594  · H1 2줄 · 서브 2줄 · 텍스트열 625px
//   1280×800        528px = 상한 528
//   1024×768        507px = 상한 507
//    768×1024       676px = 상한 676  (이미지 숨김)
//    360×800        528px = 상한 528  (이미지 숨김)
// 360·390 에서 서브가 3줄이 되는 것은 2단 도입 전에도 같았다. 이번 변경의 결과가 아니다.
// ─────────────────────────────────────────────────────────────────────────

import Image from 'next/image';
import { Fragment } from 'react';

import { ContactCta } from '@/components/cta/contact-cta';
import { heroCopy } from '@/content/p01-copy';
import heroShot from '@/public/images/portfolio/edusherpa.png';

export function Hero() {
  return (
    <section className="relative flex min-h-[66dvh] items-center bg-canvas text-ink-inverse">
      <div className="mx-auto w-full max-w-[var(--layout-container)] px-[var(--layout-gutter)] py-[var(--section-block)]">
        {/* 세로 정렬은 가운데다. 텍스트 덩어리와 캡처의 중심선을 맞춘다.
            lg 미만에서는 grid-template-columns 가 없어 1단으로 흐르고,
            이미지 열은 아래 hidden 으로 아예 그려지지 않는다 */}
        <div className="grid items-center gap-[var(--space-12)] lg:grid-cols-[7fr_5fr]">
          <div>
            {/* FN-P01-15 실측 고정 스펙. 2단으로 바뀌어도 이 값은 건드리지 않는다.
                줄바꿈은 자동 흘림에 맡기지 않고 카피 파일이 지정한 대로 끊는다 */}
            <h1 className="max-w-[var(--layout-copy)] font-bold text-[length:clamp(30px,3.9vw,52px)] leading-[1.24] tracking-[-0.03em]">
              {heroCopy.headingLines.map((line, index) => (
                <Fragment key={line}>
                  {index > 0 && <br />}
                  {line}
                </Fragment>
              ))}
            </h1>

            {/* 줄바꿈은 자동 흘림에 맡기지 않고 직접 끊는다.
                첫 줄은 SEO 키워드(FR-6.1), 둘째 줄이 주장이다.

                크기는 `--font-size-xl`(1.5rem) 이다. 섹션 2 를 `lg`→`xl` 로 올리면서 함께
                올렸다 (8/20). 섹션 2 만 올리면 문제 제기 문단이 히어로 서브카피보다 커져
                도입부의 위계가 뒤집힌다 — 두 값을 같이 두는 것이 조건이다.
                위쪽 h1 은 최소 30px 부터라 24px 인 이 문단과의 간격은 좁아져도 뒤집히지 않는다 */}
            <p className="mt-[var(--space-6)] max-w-[var(--layout-copy)] text-subtle text-[length:var(--font-size-xl)] leading-[var(--leading-relaxed)]">
              {heroCopy.subLines.map((line, index) => (
                <Fragment key={line}>
                  {index > 0 && <br />}
                  {line}
                </Fragment>
              ))}
            </p>

            {/* C-03 문의 CTA. 문구·목적지·파라미터는 컴포넌트가 정한다 (FN-C03-01~03).
                히어로가 자체 <a> 를 갖고 있었으나 같은 CTA 가 두 곳에 정의된 상태라 걷어냈다.
                FN-C03-05 마이크로카피는 P-01 에서 v3.2 로 삭제됐다. 보조 링크·버튼도 두지 않는다
                (REQ-F-007 경쟁 CTA 금지, P0). */}
            <div className="mt-[var(--space-10)]">
              <ContactCta source="p01" />
            </div>
          </div>

          {/* 대표 프로젝트 캡처.
              `bg-surface` 매트로 액자화한다 — 캡처가 흰 배경 + 파스텔 일러스트라
              `bg-canvas`(#15140f) 위에서 화면에서 가장 밝은 덩어리가 되고, 시선이 H1
              보다 캡처로 먼저 간다. 텍스트가 주장이고 캡처는 근거인 화면이라 그 위계가
              뒤집히면 안 된다. 매트가 밝기 충격을 완충한다.

              테두리를 두지 않는다. `border-border`(#d7e2f5)는 흰 캡처 위에서 사실상
              보이지 않아 값을 못 했다 — 그 역할을 매트가 대신한다. 그림자는 쓰지 않는다.

              안쪽 모서리는 바깥 반경에서 패딩을 뺀 값이다. 같은 값을 쓰면 매트가
              캡처 모서리에서 두꺼워 보인다. */}
          <div className="hidden rounded-panel bg-surface p-[var(--space-4)] lg:block">
            {/* 정적 임포트다. DB 를 거치지 않는다 — 이 캡처는 LCP 후보이고,
                supabase 왕복을 태우면 첫 그림이 그만큼 늦는다. 히어로는 POL-02
                숨김 대상도 아니라 0건 분기가 필요 없다.
                임포트가 원본 크기(1200×750)를 함께 넘겨 CLS 가 0 이다.

                1200×750 은 정확히 16:10 이라 `aspect-[16/10]` 에서 잘리는 부분이 없다.
                비율을 명시해 두면 나중에 다른 비율 캡처로 바꿔도 히어로 높이가 흔들리지 않는다.

                `sizes` 의 447px 는 lg 이상에서 이 열의 실제 폭이다
                (컨테이너 1200 − 거터 80 − 간격 48 의 5/12).
                lg 미만은 `hidden` 이지만 display:none 이어도 브라우저는 후보를 고르므로,
                그 구간을 1px 로 선언해 쓰지도 않을 큰 파일을 받지 않게 한다. */}
            <Image
              src={heroShot}
              alt={heroCopy.imageAlt}
              priority
              sizes="(min-width: 1024px) 447px, 1px"
              className="aspect-[16/10] w-full rounded-[calc(var(--radius-panel)-var(--space-4))] object-cover"
            />
          </div>
        </div>
      </div>

      {/* FN-P01-37 — 기호만 둔다. 읽을 문장을 늘리지 않고, 움직이지도 않는다. */}
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="absolute bottom-[var(--space-8)] left-1/2 size-6 -translate-x-1/2 text-subtle"
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
    </section>
  );
}
