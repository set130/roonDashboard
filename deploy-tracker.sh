#!/bin/bash
set -e

echo "Deploying tracker.js..."
sudo cp /tmp/tracker.js /opt/roonDashboard/server/tracker.js

echo "Restarting service..."
sudo systemctl restart roon-dashboard

echo "Waiting for service to start..."
sleep 3

echo "=== Service Status ==="
sudo systemctl status roon-dashboard --no-pager | head -15

echo ""
echo "=== Recent Logs ==="
sudo journalctl -u roon-dashboard -n 50 --no-pager | tail -30

echo ""
echo "=== API Status ==="
curl -s http://localhost:3001/api/status

echo ""
echo "=== Now Playing ==="
curl -s http://localhost:3001/api/now-playing | head -50

echo ""
echo "=== Database Check ==="
sqlite3 /opt/roonDashboard/roon-dashboard.sqlite "SELECT COUNT(*) as total_plays, SUM(played_secs) as total_secs FROM plays;" 2>&1

echo ""
echo "=== Recent Plays ==="
sqlite3 /opt/roonDashboard/roon-dashboard.sqlite "SELECT track_title, artist, played_secs, started_at FROM plays ORDER BY started_at DESC LIMIT 5;" 2>&1

echo ""
echo "Deployment complete!"

