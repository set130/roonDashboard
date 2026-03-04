#!/bin/bash
# Complete Roon Dashboard Deployment Script

set -e

echo "Starting Roon Dashboard Deployment..."
echo ""

# Check if running with sudo
if [ "$EUID" -ne 0 ]; then
  echo "This script must be run with sudo. Usage: sudo bash deploy.sh"
  exit 1
fi

# Verify files exist
if [ ! -f "/tmp/roon-dashboard.service" ]; then
  echo "ERROR: /tmp/roon-dashboard.service not found. Please copy the service file first."
  exit 1
fi

if [ ! -f "/tmp/roon.js" ]; then
  echo "ERROR: /tmp/roon.js not found. Please copy roon.js first."
  exit 1
fi

echo "[1] Backing up current service file..."
if [ -f "/etc/systemd/system/roon-dashboard.service" ]; then
  cp /etc/systemd/system/roon-dashboard.service /etc/systemd/system/roon-dashboard.service.bak
  echo "    Backup saved to /etc/systemd/system/roon-dashboard.service.bak"
fi

echo "[2] Deploying new service file..."
cp /tmp/roon-dashboard.service /etc/systemd/system/roon-dashboard.service
echo "    Service file deployed"

echo "[3] Deploying updated roon.js..."
cp /tmp/roon.js /opt/roonDashboard/server/roon.js
echo "    roon.js deployed"

echo "[4] Reloading systemd configuration..."
systemctl daemon-reload
echo "    Systemd reloaded"

echo "[5] Restarting roon-dashboard service..."
systemctl restart roon-dashboard
echo "    Service restarted"

echo ""
echo "[6] Waiting for service to initialize..."
sleep 3

echo ""
echo "[7] Service Status:"
systemctl status roon-dashboard --no-pager | head -10

echo ""
echo "[8] Recent Logs (configuration and connection info):"
journalctl -u roon-dashboard --no-pager -n 40 | grep -E "Configuration|Connecting|paired|Error" | tail -10

echo ""
echo "=== Deployment Complete ==="
echo ""
echo "Next steps:"
echo "1. Visit http://192.168.0.25:3001 in your browser"
echo "2. Check the Roon app for the 'Roon Dashboard' extension"
echo "3. Run: curl http://192.168.0.25:3001/api/status"
echo ""

