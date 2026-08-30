#!/usr/bin/env bash
# POSIX 安装入口：转发到 setup.mjs
set -euo pipefail
cd "$(dirname "$0")"
exec node setup.mjs "$@"
