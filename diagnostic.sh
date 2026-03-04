#!/bin/bash
OUTPUT="/tmp/roon-dashboard-diagnostic.txt"
echo "Roon Dashboard Diagnostic Report" > $OUTPUT
echo "Generated: $(date)" >> $OUTPUT
echo "======================================" >> $OUTPUT

echo "" >> $OUTPUT
echo "=== Database File Permissions ===" >> $OUTPUT
ls -la /opt/roonDashboard/*.sqlite* 2>&1 >> $OUTPUT

echo "" >> $OUTPUT
echo "=== Directory Permissions ===" >> $OUTPUT
ls -ld /opt/roonDashboard 2>&1 >> $OUTPUT

echo "" >> $OUTPUT
echo "=== Service Status ===" >> $OUTPUT
systemctl is-active roon-dashboard 2>&1 >> $OUTPUT

echo "" >> $OUTPUT
echo "=== API Status ===" >> $OUTPUT
curl -s http://localhost:3001/api/status 2>&1 >> $OUTPUT

echo "" >> $OUTPUT
echo "=== Now Playing ===" >> $OUTPUT
curl -s http://localhost:3001/api/now-playing 2>&1 >> $OUTPUT

echo "" >> $OUTPUT
echo "=== Database Row Count ===" >> $OUTPUT
sqlite3 /opt/roonDashboard/roon-dashboard.sqlite "SELECT COUNT(*) as count FROM plays;" 2>&1 >> $OUTPUT

echo "" >> $OUTPUT
echo "=== Recent Tracker Logs ===" >> $OUTPUT
sudo journalctl -u roon-dashboard --since '5 minutes ago' --no-pager 2>&1 | grep "\[Tracker\]" | tail -30 >> $OUTPUT

echo "" >> $OUTPUT
echo "=== Recent Error Logs ===" >> $OUTPUT
sudo journalctl -u roon-dashboard --since '5 minutes ago' --no-pager 2>&1 | grep -i "error\|SQLITE\|readonly" | tail -20 >> $OUTPUT

echo "" >> $OUTPUT
echo "=== Service User ===" >> $OUTPUT
ps aux | grep "node.*roonDashboard" | grep -v grep | head -1 >> $OUTPUT

echo "" >> $OUTPUT
echo "Report saved to: $OUTPUT"
cat $OUTPUT

