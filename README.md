# AI 빌더그룹 랜딩페이지

검증된 바이브코더를 조직이 보증해 외주 프로젝트로 연결하는 공개 사이트 — 주식회사 똑똑한개발자 발주, 2조 수행.

## 구성

```
apps/web          공개 화면 (Next.js 16, :3000)
apps/admin        관리 화면 (Next.js 16, :3001)
packages/supabase 클라이언트 · 스토리지 · 마이그레이션
project-docs/     기획 · 확정 문서 · 진행 상태
```

## 로컬 실행

Node ≥ 20.11, pnpm ≥ 10 이 필요합니다.

```bash
pnpm install
cp .env.example .env    # 사이트 이름 · URL · Supabase 키 채우기

pnpm dev                # web + admin 동시 실행
pnpm dev:web            # 공개 화면만 (http://localhost:3000)
pnpm dev:admin          # 관리 화면만 (http://localhost:3001)
```

작업 후 검증:

```bash
pnpm typecheck          # 필수
pnpm build              # 앱을 건드렸다면
```

## 문서

작업 전에 `project-docs/` 에서 필요한 것만 골라 읽습니다. 충돌하면 위쪽이 우선입니다.

| 순위 | 위치 | 관할 |
|:---:|---|---|
| 1 | `project-docs/260812_서대표미팅_회의록.md` | 클라이언트 직접 결정 |
| 2 | `project-docs/확정문서/260811_4_결정시트.md` | 팀 결정 · tie-breaker |
| 3 | `project-docs/확정문서/` | 화면 · 기능 · 데이터 · 정책 |
| 4 | `project-docs/260814_구현결정_박진선.md` | 구현 단계 판단 |
| 5 | `project-docs/기획안_*.md` · `project-docs/PRD_*.md` | 카피 · 문구 |

- 현재 진행 상황은 `project-docs/devlog.md` 의 **NOW 블록**.
- 디자인 규칙은 `project-docs/디자인규칙_AI빌더그룹_랜딩페이지.md`.
- `project-docs/archive/` 는 구버전이라 참조하지 않습니다.
- 작업 규칙(스타일 · 모션 · 데이터 · 렌더링 하드 룰)은 `CLAUDE.md`.
