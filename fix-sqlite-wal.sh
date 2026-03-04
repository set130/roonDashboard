#!/bin/bash
set -e

echo "=== Stopping service ==="
sudo systemctl stop roon-dashboard

echo ""
echo "=== Removing stale WAL journal files ==="
sudo rm -f /opt/roonDashboard/roon-dashboard.sqlite-wal
sudo rm -f /opt/roonDashboard/roon-dashboard.sqlite-shm

echo ""
echo "=== Ensuring correct ownership and permissions ==="
sudo chown set:set /opt/roonDashboard/roon-dashboard.sqlite
sudo chmod 664 /opt/roonDashboard/roon-dashboard.sqlite
sudo chown set:set /opt/roonDashboard
sudo chmod 775 /opt/roonDashboard

echo ""
echo "=== Starting service ==="
sudo systemctl start roon-dashboard

echo ""
echo "Waiting for service to initialize..."
sleep 5

echo ""
echo "=== Service Status ==="
sudo systemctl status roon-dashboard --no-pager | head -10

echo ""
echo "=== Testing database write with SQLite directly ==="
sudo -u set sqlite3 /opt/roonDashboard/roon-dashboard.sqlite "INSERT INTO plays (track_title, artist, album, duration_secs, played_secs, started_at, ended_at) VALUES ('TEST', 'TEST', 'TEST', 100, 50, datetime('now'), datetime('now'));"
echo "Test insert successful!"

echo ""
echo "=== Verifying test row ==="
sudo -u set sqlite3 /opt/roonDashboard/roon-dashboard.sqlite "SELECT COUNT(*) FROM plays WHERE track_title='TEST';"

echo ""
echo "=== Cleaning up test row ==="
sudo -u set sqlite3 /opt/roonDashboard/roon-dashboard.sqlite "DELETE FROM plays WHERE track_title='TEST';"

echo ""
echo "=== Checking new file permissions ==="
ls -la /opt/roonDashboard/*.sqlite*

echo ""
echo "=== Waiting 10 seconds for real tracking data ==="
sleep 10

echo ""
echo "=== Recent Tracker Logs ==="
sudo journalctl -u roon-dashboard --since '30 seconds ago' --no-pager | grep Tracker | tail -10

echo ""
echo "=== Database Row Count ==="
sqlite3 /opt/roonDashboard/roon-dashboard.sqlite "SELECT COUNT(*) FROM plays;"

echo ""
echo "Done! Database should now be writable."

