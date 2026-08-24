#!/usr/bin/env bash
# load-context.sh — 세션 시작 시 주입할 프로젝트 컨텍스트.
set -uo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT" || exit 0

echo "=============================================="
echo " AI 빌더그룹 랜딩페이지 — 세션 컨텍스트"
echo "=============================================="
echo

if [ -f project-docs/devlog.md ]; then
  sed -n '/^## NOW/,/^<!-- ===== 아래는 기록/p' project-docs/devlog.md | sed '$d'
else
  echo "(devlog.md 없음 — 사용자에게 알릴 것)"
fi
echo

cat <<'DOCS'
## 문서 우선순위 (충돌 시)
1. project-docs/260812_서대표미팅_회의록.md          ← 클라이언트 직접 결정
2. project-docs/확정문서/260811_4_결정시트.md
3. project-docs/확정문서/                            ← 화면·기능·데이터·정책
4. project-docs/260814_구현결정_박진선.md
5. project-docs/기획안_*.md · project-docs/PRD_*.md ← 카피·문구

전부 읽지 말고 필요한 것만 연다.
참조 금지: project-docs/archive/  (구버전 · 타팀 카피후보)
DOCS
echo

if git rev-parse --git-dir >/dev/null 2>&1; then
  echo "## git"
  echo "- 브랜치: \`$(git branch --show-current 2>/dev/null || echo '?')\`"
  echo "- 미커밋: $(git status --porcelain 2>/dev/null | wc -l | tr -d ' ')개"
  echo "- 최근 커밋:"
  git log --oneline -3 2>/dev/null | sed 's/^/  - /'
  echo
fi

echo "=============================================="
exit 0
