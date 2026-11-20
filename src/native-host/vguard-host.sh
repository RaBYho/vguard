#!/usr/bin/env bash
# Wrapper shell script for VGuard Chrome Native Messaging Host
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if command -v python3 >/dev/null 2>&1; then
  exec python3 "$DIR/vguard-host.py"
elif command -v node >/dev/null 2>&1; then
  exec node "$DIR/vguard-host.js"
elif [ -x /usr/bin/python3 ]; then
  exec /usr/bin/python3 "$DIR/vguard-host.py"
elif [ -x /usr/local/bin/node ]; then
  exec /usr/local/bin/node "$DIR/vguard-host.js"
else
  exec python3 "$DIR/vguard-host.py"
fi
