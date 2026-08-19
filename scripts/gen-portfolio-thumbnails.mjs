#!/usr/bin/env node
/**
 * gen-portfolio-thumbnails.mjs — 포트폴리오 대표 이미지(SVG) 4장을 생성한다.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * ⚠ 임시 플레이스홀더다. **제출 전 교체 대상**이다.
 *
 * CLAUDE.md 하드 룰 3 은 "코드로 SVG 를 그려 이미지를 대신하지 않는다"이다.
 * 이 스크립트는 그 규칙의 예외로, 사용자 승인 아래 만든 임시물이다
 * (2026-08-19 결정). 실제 대표 이미지가 들어오면
 *   · 이 파일
 *   · apps/web/public/images/portfolio/*.svg
 *   · scripts/sql/portfolio-thumbnails.sql
 * 세 가지를 함께 지운다. PlaceholderNotice.tsx · 테스트 데이터와 수명이 같다.
 * ─────────────────────────────────────────────────────────────────────────
 *
 * 사용:
 *   node scripts/gen-portfolio-thumbnails.mjs
 *
 * 규격 — 1200x630 (OG 규격 겸용). 배경 단색 · 좌하단 프로젝트명 · 그 위 분류 라벨.
 * 로고·아이콘·이미지·그라디언트·그림자는 넣지 않는다.
 *
 * 색은 apps/web/app/ai-builder-design-tokens.css 에서 읽어 hex 로 박는다.
 * CSS 변수는 <img> 로 불린 SVG 안에서 해석되지 않기 때문이다.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TOKENS = path.join(ROOT, 'apps/web/app/ai-builder-design-tokens.css');
const OUT_DIR = path.join(ROOT, 'apps/web/public/images/portfolio');

/**
 * 토큰 CSS 에서 변수 하나를 읽는다. `var(--other)` 면 한 단계 더 따라간다.
 * 값이 없으면 조용히 기본색으로 넘어가지 않고 즉시 멈춘다 — 토큰이 바뀌면
 * 이미지도 같이 바뀌어야 하고, 그 사실을 놓치면 안 된다.
 */
function readToken(css, name) {
  const match = css.match(new RegExp(String.raw`^\s*${name}:\s*([^;]+);`, 'm'));
  if (!match) {
    console.error(`[gen-portfolio-thumbnails] 토큰을 찾을 수 없습니다: ${name}`);
    process.exit(1);
  }
  const value = match[1].trim();
  const ref = value.match(/^var\((--[\w-]+)\)$/);
  return ref ? readToken(css, ref[1]) : value;
}

const css = fs.readFileSync(TOKENS, 'utf8');
const canvas = readToken(css, '--color-canvas');
const brand = readToken(css, '--color-brand');
const textInverse = readToken(css, '--color-text-inverse');

// --font-sans 와 같은 스택. SVG 는 CSS 변수를 못 쓰므로 값을 옮겨 적는다.
const FONT_STACK =
  "'Pretendard Variable', Pretendard, ui-sans-serif, system-ui, " +
  "'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif";

const WIDTH = 1200;
const HEIGHT = 630;
const GUTTER = 80; // 의도한 시각 여백
const NAME_SIZE = 76;
const LABEL_SIZE = 24;

// C-01 카드 썸네일은 aspect-[16/10] · object-cover 다 (components/cards/project-card.tsx).
// 이 이미지(1200x630 = 1.905)가 카드(1.600)보다 넓어 높이 기준으로 맞춰지고
// 좌우가 균등하게 잘린다. 보이는 폭은 1.6 x 630 = 1008 이므로 좌우 각 96 이 사라진다.
//   가시 영역 = x ∈ [96, 1104]
// 따라서 x 를 96 + GUTTER 에 두어야 잘린 뒤 여백이 의도한 80 으로 남는다.
// 세로는 높이 기준 스케일이라 잘리지 않으므로 하단 여백은 GUTTER 그대로다.
const CROP_X = (WIDTH - (16 / 10) * HEIGHT) / 2; // 96
const SAFE_X = CROP_X + GUTTER; // 176
const NAME_BASELINE = HEIGHT - GUTTER; // 550
const LABEL_BASELINE = NAME_BASELINE - 88; // 이름 대문자 위로 한 숨

// --tracking-label 0.13em · --tracking-heading -0.015em 을 px 로 환산한다.
const LABEL_TRACKING = (LABEL_SIZE * 0.13).toFixed(2);
const NAME_TRACKING = (NAME_SIZE * -0.015).toFixed(2);

/** &, <, > 만 막으면 된다. 속성이 아니라 텍스트 노드에만 넣는다. */
function escapeXml(text) {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function render({ label, name }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">
  <rect width="${WIDTH}" height="${HEIGHT}" fill="${canvas}"/>
  <text x="${SAFE_X}" y="${LABEL_BASELINE}" fill="${brand}" font-family="${FONT_STACK}" font-size="${LABEL_SIZE}" font-weight="600" letter-spacing="${LABEL_TRACKING}">${escapeXml(label)}</text>
  <text x="${SAFE_X}" y="${NAME_BASELINE}" fill="${textInverse}" font-family="${FONT_STACK}" font-size="${NAME_SIZE}" font-weight="700" letter-spacing="${NAME_TRACKING}">${escapeXml(name)}</text>
</svg>
`;
}

const ITEMS = [
  { file: 'aerok-user.svg', name: 'Aerok User', label: 'WEB' },
  { file: 'nice-payment.svg', name: 'NICE 정보통신', label: 'WEB' },
  { file: 'btv-local-ad.svg', name: 'Btv 우리동네광고', label: 'WEB' },
  { file: 'family-care.svg', name: '패밀리케어', label: 'WEB' },
  // 에듀셀파는 여기에 없다 — 실제 화면 캡처(edusherpa.png)로 교체됐다.
  // 나머지 4건도 실제 대표 이미지가 들어오면 같은 방식으로 목록에서 뺀다.
];

fs.mkdirSync(OUT_DIR, { recursive: true });

for (const item of ITEMS) {
  const dest = path.join(OUT_DIR, item.file);
  fs.writeFileSync(dest, render(item), 'utf8');
  console.log(`[gen-portfolio-thumbnails] ${path.relative(ROOT, dest)}`);
}

console.log(
  `[gen-portfolio-thumbnails] ${ITEMS.length}장 생성 완료 ` +
    `(canvas ${canvas} · brand ${brand} · text ${textInverse})`,
);
