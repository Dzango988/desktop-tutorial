#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 /path/to/target-repo [--force]"
  exit 1
fi

TARGET_REPO="$1"
FORCE="${2:-}"

if [[ ! -d "$TARGET_REPO/.git" ]]; then
  echo "Error: target directory is not a git repository: $TARGET_REPO"
  exit 1
fi

if [[ "$TARGET_REPO" == "$(pwd)" ]]; then
  echo "Error: target repo must be different from current repository"
  exit 1
fi

# Files we want to transfer.
FILES=(
  .gitignore
  README.md
  pytest.ini
  requirements.txt
  web_runner.py
  tests/conftest.py
  tests/test_taxieconom.py
)

for file in "${FILES[@]}"; do
  if [[ ! -f "$file" ]]; then
    echo "Error: source file not found: $file"
    exit 1
  fi

  src="$PWD/$file"
  dst="$TARGET_REPO/$file"

  mkdir -p "$(dirname "$dst")"

  if [[ -e "$dst" && "$FORCE" != "--force" ]]; then
    echo "Skip existing file: $dst (use --force to overwrite)"
    continue
  fi

  cp "$src" "$dst"
  echo "Copied: $file"
done

echo
echo "Done. Next steps in target repo:"
echo "  cd $TARGET_REPO"
echo "  git status"
echo "  git add ."
echo "  git commit -m 'Add taxieconom test automation suite'"
