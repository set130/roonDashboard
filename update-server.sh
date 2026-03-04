#!/bin/bash
# Update roon-dashboard with the fix

set -e

cd /opt/roonDashboard || exit 1

# The key files that changed:
# - client/src/components/Recap.jsx (added prev, next, goTo functions)

echo "[1] Pulling latest changes from git..."
git pull origin master 2>/dev/null || echo "Note: Git pull skipped or failed, proceeding with manual copy"

echo "[2] Rebuilding client..."
cd client
npm install --legacy-peer-deps 2>/dev/null || npm install
npm run build
cd ..

echo "[3] Restarting the service..."
sudo systemctl restart roon-dashboard

echo "[4] Waiting for service to start..."
sleep 3

echo "[5] Checking service status..."
sudo systemctl status roon-dashboard --no-pager

echo ""
echo "=========================================="
echo "✓ Update Complete!"
echo "=========================================="
echo ""
echo "Access the dashboard at: http://192.168.0.25:3001/recap"
echo "Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)"

