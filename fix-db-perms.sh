#!/bin/bash
set -e

echo "=== Fixing database permissions ==="
echo "Current permissions:"
ls -la /opt/roonDashboard/*.sqlite* 2>&1 || echo "No db files found"

echo ""
echo "Setting correct ownership..."
sudo chown set:set /opt/roonDashboard/roon-dashboard.sqlite* 2>&1 || true

echo ""
echo "Setting write permissions..."
sudo chmod 664 /opt/roonDashboard/roon-dashboard.sqlite* 2>&1 || true

echo ""
echo "Ensuring directory is writable (needed for WAL mode)..."
sudo chown set:set /opt/roonDashboard
sudo chmod 775 /opt/roonDashboard

echo ""
echo "New permissions:"
ls -la /opt/roonDashboard/*.sqlite* 2>&1 || echo "No db files found"
ls -la /opt/roonDashboard/ | grep "^d" | head -1

echo ""
echo "Restarting service..."
sudo systemctl restart roon-dashboard
sleep 3

echo ""
echo "=== Service Status ==="
sudo systemctl status roon-dashboard --no-pager | head -10

echo ""
echo "=== Testing Database Write ==="
echo "Waiting for a play to be tracked..."
sleep 10

echo ""
echo "=== Recent Logs (looking for Tracker messages) ==="
sudo journalctl -u roon-dashboard -n 100 --no-pager | grep -E "\[Tracker\]" | tail -20

echo ""
echo "=== Database Check ==="
sqlite3 /opt/roonDashboard/roon-dashboard.sqlite "SELECT COUNT(*) as total_plays FROM plays;" 2>&1

echo ""
echo "=== Recent Plays ==="
sqlite3 /opt/roonDashboard/roon-dashboard.sqlite "SELECT track_title, artist, played_secs FROM plays ORDER BY started_at DESC LIMIT 3;" 2>&1

echo ""
echo "Done!"

