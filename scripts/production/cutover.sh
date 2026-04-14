#!/usr/bin/env bash
set -eu

dry_run=0
release_tag="${RELEASE_TAG:-<release-tag>}"

while [ "$#" -gt 0 ]; do
  case "$1" in
    --dry-run)
      dry_run=1
      shift
      ;;
    --release-tag)
      release_tag="$2"
      shift 2
      ;;
    *)
      echo "Unknown argument: $1" >&2
      exit 1
      ;;
  esac
done

cat <<EOF
Production cutover order (production-only)

1. Apply infrastructure
   task deploy:plan
   task deploy:apply

2. Deploy the tagged release through GitHub Actions
   git tag ${release_tag}
   git push origin ${release_tag}

3. Run the explicit production migration step
   task deploy:migrate

4. Verify backend + frontend smoke checks
   task deploy:verify

Rollback handles to keep ready
- Previous known-good release tag
- Operator-accessible external database URL for emergency migration rollback
EOF

if [ "$dry_run" -eq 1 ]; then
  exit 0
fi

echo "This helper prints the required order only. Run the commands above deliberately." >&2
