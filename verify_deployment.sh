#!/bin/bash

echo "=== Roon Dashboard Deployment Verification ==="
echo ""

# Check service file
echo "[1] Checking service file configuration..."
grep ROON_CORE_IP /etc/systemd/system/roon-dashboard.service || echo "ERROR: Service file not found or missing ROON_CORE_IP"

echo ""
echo "[2] Checking service status..."
sudo systemctl status roon-dashboard --no-pager | head -5

echo ""
echo "[3] Checking recent logs..."
sudo journalctl -u roon-dashboard --no-pager -n 30 | grep -E "Connecting|Configuration|connected|unpaired|Error"

echo ""
echo "[4] Checking if port 3001 is listening..."
sudo ss -tlnp | grep 3001 || echo "Port 3001 not listening"

echo ""
echo "[5] Checking environment variables in service..."
sudo systemctl show -p Environment roon-dashboard.service

echo ""
echo "=== Verification Complete ==="

