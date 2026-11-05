#!/usr/bin/env bash
set -euo pipefail

root=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)
iid=$(mktemp)
trap 'rm -f -- "$iid"' EXIT

# Use the build's image ID, not a shared tag: concurrent Mill worktrees must
# each test their own source snapshot.
docker build --iidfile "$iid" "$root"
docker run --rm --init --network none "$(<"$iid")"
