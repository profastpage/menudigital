#!/bin/bash
# Run dev server + Playwright screenshots in single session, then cleanup
set -e
cd /home/z/my-project

echo "=== Killing any existing next processes ==="
pkill -f "next dev" 2>/dev/null || true
pkill -f "next-server" 2>/dev/null || true
sleep 2

echo "=== Starting dev server on port 3001 (background) ==="
npx next dev -p 3001 > /tmp/next-dev.log 2>&1 &
DEV_PID=$!
echo "Dev PID: $DEV_PID"

# Wait for server to be ready
echo "=== Waiting for server... ==="
for i in {1..45}; do
  if curl -sS -o /dev/null http://localhost:3001/ 2>/dev/null; then
    echo "Server ready after ${i}s"
    break
  fi
  if ! ps -p $DEV_PID > /dev/null 2>&1; then
    echo "ERROR: Server process died. Logs:"
    tail -30 /tmp/next-dev.log
    exit 1
  fi
  sleep 1
done

# Verify it's still alive
if ! ps -p $DEV_PID > /dev/null 2>&1; then
  echo "ERROR: Server died after ready check"
  tail -30 /tmp/next-dev.log
  exit 1
fi

echo "=== Running Playwright screenshots ==="
node scripts/verify-changes-playwright.js || echo "Playwright exited with errors"

echo "=== Cleanup: killing dev server ==="
kill $DEV_PID 2>/dev/null || true
wait $DEV_PID 2>/dev/null || true
echo "Done."
