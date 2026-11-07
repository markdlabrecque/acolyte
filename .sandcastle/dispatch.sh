#!/usr/bin/env bash
set -euo pipefail
exec node .sandcastle/main.ts dispatch "$@"
