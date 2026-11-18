#!/usr/bin/env bash
# Wrapper shell script for VGuard Chrome Native Messaging Host
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec node "$DIR/vguard-host.js"
