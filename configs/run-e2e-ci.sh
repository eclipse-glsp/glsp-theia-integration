#!/usr/bin/env bash
set -euo pipefail

# Stream diagnostics while the tests are alive: an upload step cannot run after runner loss.
monitor_resources() {
    local sleep_pid=''
    trap 'if [[ -n "$sleep_pid" ]]; then kill "$sleep_pid" 2>/dev/null || true; fi; exit 0' TERM INT
    while true; do
        date -u '+Runner resources at %Y-%m-%dT%H:%M:%SZ'
        free -m
        df -h / /dev/shm
        # Only process names, not arguments, to avoid exposing command-line credentials.
        ps -eo pid,ppid,comm,%cpu,%mem,rss --sort=-rss | head -n 11 || true
        sleep 60 &
        sleep_pid=$!
        wait "$sleep_pid"
    done
}

monitor_resources &
monitor_pid=$!
cleanup() {
    kill "$monitor_pid" 2>/dev/null || true
    wait "$monitor_pid" 2>/dev/null || true
}
trap cleanup EXIT

# Preserve the test command's exit status, including failures.
"$@"
