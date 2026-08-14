# 디자인 규칙 — AI 빌더그룹 랜딩페이지

> 랜딩페이지 화면 작업 시 참고하는 문서입니다.
> CLAUDE.md 하드룰에 요약이 있고, 상세는 여기에 있습니다.
> 위치: `/project-docs/디자인규칙_AI빌더그룹_랜딩페이지.md`

---

## 스타일시트 구조

앱 스타일시트는 `ai-builder-tailwind-theme.css` 하나입니다.
이 파일이 `ai-builder-design-tokens.css`를 import 하므로 따로 불러올 필요 없습니다.

---

## 색 — 이름 규칙 (중요)

두 파일이 같은 색을 다른 이름으로 부릅니다. 혼동을 막기 위해 아래로 통일합니다.

**Tailwind 클래스를 쓸 때는 `ink` 계열만 사용합니다.**

사용 가능한 색 클래스는 아래가 전부입니다.

| 용도 | 클래스 |
|---|---|
| 어두운 배경 (네이비) | `bg-canvas` |
| 어두운 카드/패널 | `bg-surface` |
| 밝은 배경 (흰색) | `bg-surface-raised` |
| 밝은 배경 (연한 파랑) | `bg-surface-soft` |
| 기본 글자색 (밝은 배경 위) | `text-ink` |
| 반전 글자색 (어두운 배경 위) | `text-ink-inverse` |
| 보조 설명 글자 | `text-muted` |
| 더 흐린 글자 | `text-subtle` |
| 브랜드 강조 (버튼 등) | `bg-brand` / `text-brand` |
| 브랜드 연한 톤 | `text-brand-soft` |
| 테두리 | `border-border` |
| 강조 테두리 | `border-border-strong` |

### 금지 사항

- **Tailwind 기본 색상 클래스 금지.** `bg-blue-500`, `text-gray-600`, `bg-white`, `text-black` 등.
  기본 팔레트가 `--color-*: initial`로 비활성화되어 있어서 **에러 없이 조용히 무시됩니다.**
  색이 안 먹으면 대부분 이 원인입니다.
- **그림자 금지.** `shadow-sm`, `shadow-md`, `shadow-lg` 등 전부.
  이 디자인은 깊이를 테두리와 배경 대비로만 표현합니다.
- **임의의 색 추가 금지.** 위 표에 없는 색이 필요하면 먼저 물어볼 것.

---

## 클래스로 없는 토큰 쓰는 법

간격, 디스플레이 폰트 크기, 레이아웃 폭, 모션 값은 Tailwind 유틸리티로 생성되지 않습니다.
필요하면 임의 값 문법으로 토큰을 직접 참조합니다.

```html
<!-- 레이아웃 폭 -->
<div class="max-w-[var(--layout-container)]">   <!-- 75rem, 전체 컨테이너 -->
<div class="max-w-[var(--layout-content)]">     <!-- 48rem, 본문 영역 -->
<div class="max-w-[var(--layout-copy)]">        <!-- 42rem, 읽기 좋은 문단 폭 -->

<!-- 좌우 여백 -->
<div class="px-[var(--layout-gutter)]">

<!-- 섹션 상하 여백 -->
<section class="py-[var(--section-block)]">     <!-- 6rem -->

<!-- 큰 제목 -->
<h1 class="text-[length:var(--font-size-display-lg)]">
<h2 class="text-[length:var(--font-size-display-md)]">
```

**새 토큰을 만들지 마세요.** 기존 토큰 파일에 있는 것만 씁니다.

---

## 섹션 배경 리듬

12개 화면이 하나의 시스템처럼 보이게 하는 핵심 규칙입니다.

- 섹션은 **어두운 배경(`bg-canvas`)과 밝은 배경(`bg-surface-raised`)을 교대**로 배치합니다.
- 어두운 배경 위에서는 반드시 `text-ink-inverse`, 밝은 배경 위에서는 `text-ink`.
- 동일한 배경 클래스가 연속 3개 이상 이어지지 않게 합니다.
  (밝은 계열끼리의 연속은 무방합니다 — `bg-surface-raised` → `bg-surface-soft` → `bg-surface-raised`)
- **P-01 랜딩은 이 규칙 대신 아래 "P-01 랜딩 배경 리듬"의 4구간 구조를 따릅니다.**
- 연한 파랑(`bg-surface-soft`)은 밝은 구간 안에서 변화를 줄 때만 씁니다.

---

## 폰트

Pretendard는 별도로 로드해야 합니다. 로드하지 않으면 시스템 폰트로 대체되어 시안과 달라집니다.

`layout` 최상단에 CDN 링크를 넣습니다.

```html
<link rel="stylesheet" as="style" crossorigin
  href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css" />
```

---

## 모양

- 카드 모서리: `rounded-card` (16px)
- 큰 패널 모서리: `rounded-panel` (24px)
- 버튼/뱃지: `rounded-pill`

---

## 반복 부품 (첫 화면 완성 후 추출)

미리 만들지 말 것. 1번 화면을 끝까지 완성한 뒤, 실제로 반복되는 것만 뽑습니다.

- [ ] Button (기본 / 보조)
- [ ] Section (배경색 + 상하 여백 + 최대 폭 래퍼)
- [ ] Card
- [ ] Label (작은 대문자 라벨, `tracking-label` 사용)
- [ ] Hero
- [ ] Footer

---

## 작업 원칙

- 화면 하나씩 완성합니다. 여러 화면을 동시에 건드리지 않습니다.
- 기획 확정 문서와 다르게 구현해야 할 상황이면, 임의로 바꾸지 말고 먼저 알립니다.
- 카피 문구는 확정본에서만 가져옵니다. 새로 만들지 않습니다.

---

## P-01 랜딩 배경 리듬

교대가 아니라 **네 구간의 덩어리**로 묶는다. 전환은 세 번뿐이다 (2→3, 5→6, 7→8).

| # | 섹션 | 배경 | 글자색 | 구간 |
|:---:|---|---|---|---|
| 1 | 히어로 | `bg-canvas` | `text-ink-inverse` | 어둠 ① — 문제와 불신 |
| 2 | 문제 제기 | `bg-canvas` | `text-ink-inverse` | |
| 3 | 선택 기준 | `bg-surface-raised` | `text-ink` | 밝음 ① — 검증 가능한 증거 |
| 4 | 포트폴리오 | `bg-surface-soft` | `text-ink` | |
| 5 | 빌더 | `bg-surface-raised` | `text-ink` | |
| 6 | 교육 · 조직 | `bg-canvas` | `text-ink-inverse` | 어둠 ② — 조직의 무게 |
| 7 | 일하는 방식 | `bg-canvas` | `text-ink-inverse` | |
| 8 | 문의 | `bg-surface-raised` | `text-ink` | 밝음 ② — 초대 |

### 설계 의도

2→3이 가장 큰 전환점이다. 어둠 속에서 문제를 제기하다가 선택 기준에서 밝게 열리며
페이지의 태도가 바뀐다.

네 구간은 요구사항의 3축과 대응한다. 밝음①이 포트폴리오 축, 어둠②가 교육 축과
일하는 방식 축이다.

**한 칸씩 교대로 뒤집지 않는다.** 전환이 여덟 번이 되면 리듬이 사라진다.

---

## P-01 섹션별 인터랙션

POL-11①의 판정 기준을 통과하기 위한 배치다. **인접한 두 섹션은 반드시 다른 인터랙션을
쓰고, 아무것도 적용하지 않는 구간을 남긴다.**

| # | 섹션 | 인터랙션 |
|:---:|---|---|
| 1 | 히어로 | **없음** — 화면설계 §5.1 "모션 최소화" |
| 2 | 문제 제기 | 인용문 한 줄만 페이드 인 |
| 3 | 선택 기준 | 3쌍 문답이 순차 등장 (stagger) |
| 4 | 포트폴리오 | 제목 고정, **카드만** 상승 |
| 5 | 빌더 | 좌우 가로 스크롤 |
| 6 | 교육 · 조직 | **없음** — 의도적 공백 |
| 7 | 일하는 방식 | 8단계 연결선이 스크롤에 따라 그려짐 |
| 8 | 문의 | **없음** |

### 반드시 지킬 것

- **전 섹션에 등장 애니메이션을 깔지 않는다.** POL-11①-2 위반이며 반려 사유다.
  비워둔 구간(1 · 6 · 8)을 임의로 채우지 않는다.
- 4번과 5번은 POL-11 문서에 명시된 합격 예시를 그대로 적용한 것이다.
- 연속한 두 섹션이 같은 인터랙션을 쓰지 않는다 (FN-P01-02).

### 모션 값

토큰 값을 사용한다. 다른 팀 결과물의 수치를 가져오지 않는다.

```css
transition:
  opacity var(--duration-base) var(--ease-out),
  transform var(--duration-base) var(--ease-out);
```

- 지속 시간: `--duration-base` (300ms)
- 가속: `--ease-out`
- 이동 거리: `--move-sm` (0.5rem) 또는 `--move-md` (0.75rem)

구현은 `IntersectionObserver`로 화면 진입을 감지해 클래스를 붙이는 방식.

---

## 다른 공개 화면 (P-03 ~ P-13)

목록과 상세 페이지는 단순하게 간다.

- 페이지 헤더: `bg-canvas` + `text-ink-inverse`
- 본문 전체: `bg-surface-raised`

**랜딩만 리듬이 있고 나머지는 조용하다.** 읽으러 온 페이지에서 배경이 계속 바뀌면
피로해진다.

---

## 한글 조판

- 전역에 `word-break: keep-all` 적용. 단어 중간에서 줄이 끊기지 않게 한다.
- 히어로 제목은 `<br>`로 직접 끊는다. 자동 줄바꿈에 맡기지 않는다.
- 섹션 상하 여백은 `--section-block` (6rem)으로 통일한다. 예외를 만들지 않는다.
- 제목과 본문의 크기 차이를 크게 벌린다. 중간 크기를 남발하면 위계가 사라진다.
