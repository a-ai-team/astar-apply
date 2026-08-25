#!/usr/bin/env bash
# Blocks commits that would leak secrets or copyrighted material. Wired as a Claude Code
# PreToolUse hook (see .claude/settings.json) and usable as a git pre-commit hook.
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"

staged=$(git diff --cached --name-only --diff-filter=ACMR || true)
[ -z "$staged" ] && exit 0

fail=0
while IFS= read -r f; do
  case "$f" in
    .env|.env.*) [ "$f" = ".env.example" ] || { echo "BLOCKED: env file staged: $f"; fail=1; } ;;
    .eval/*|supabase/.temp/*) echo "BLOCKED: local artefact staged: $f"; fail=1 ;;
    *.pdf) echo "BLOCKED: PDF staged: $f"; fail=1 ;;
    *.jpg|*.jpeg|*.png|*.heic)
      case "$f" in fixtures/*|public/*|src/app/*|docs/*) ;; *) echo "BLOCKED: image outside fixtures/public: $f"; fail=1 ;; esac ;;
  esac
done <<< "$staged"

# Secret-shaped strings in staged text
if git diff --cached -U0 -- . ':(exclude)package-lock.json' | grep -E '^\+' | grep -Eq 'sk-ant-[A-Za-z0-9_-]{20,}|eyJhbGciOi[A-Za-z0-9_-]{30,}|sb_secret_[A-Za-z0-9_-]{10,}|postgresql://[^ ]+:[^ @]+@'; then
  echo "BLOCKED: secret-shaped string in staged diff"; fail=1
fi

# 400Q guide markers
if git diff --cached -U0 -- . ':(exclude)scripts/dev/precommit-check.sh' | grep -E '^\+' | grep -Eiq 'breakingintowallstreet|Access the Full IB Interview Guide'; then
  echo "BLOCKED: 400Q guide text detected in staged diff"; fail=1
fi

[ "$fail" -eq 0 ] || { echo "precommit-check failed — unstage the files above."; exit 2; }
exit 0
