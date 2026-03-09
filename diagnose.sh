#!/bin/bash
# Quick diagnostic script for roon-dashboard service

echo "=== Roon Dashboard Service Diagnostic ==="
echo ""

echo "[1] Service Status:"
sudo systemctl status roon-dashboard --no-pager | head -20
echo ""

echo "[2] Is Service Active?"
sudo systemctl is-active roon-dashboard
echo ""

echo "[3] Last 30 Log Lines:"
sudo journalctl -u roon-dashboard --no-pager -n 30
echo ""

echo "[4] Check for JavaScript errors:"
sudo journalctl -u roon-dashboard --no-pager -n 100 | grep -i "error\|exception\|failed" | tail -10
echo ""

echo "[5] Check Node.js version:"
node --version
echo ""

echo "[6] Check if roon.js exists:"
ls -lh /opt/roonDashboard/server/roon.js
echo ""

echo "[7] Check roon.js syntax:"
cd /opt/roonDashboard && node -c server/roon.js && echo "Syntax OK" || echo "Syntax ERROR"
echo ""

echo "=== Diagnostic Complete ==="

