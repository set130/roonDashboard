#!/bin/bash
# Safe Update Script for Roon Dashboard on Ubuntu Server
# This script pulls latest changes, rebuilds, and restarts the service
# while preserving your database with all play history

set -e

echo "════════════════════════════════════════════════════════"
echo "  Roon Dashboard Update Script"
echo "════════════════════════════════════════════════════════"
echo ""

# Change to the project directory
cd /opt/roonDashboard || { echo "ERROR: /opt/roonDashboard not found"; exit 1; }

# Show current status
echo "[1/8] Current service status:"
sudo systemctl status roon-dashboard --no-pager -n 0 || true
echo ""

# Backup database (just in case)
echo "[2/8] Backing up database..."
if [ -f "roon-dashboard.sqlite" ]; then
    cp roon-dashboard.sqlite "roon-dashboard.sqlite.backup.$(date +%Y%m%d_%H%M%S)"
    echo "    ✓ Database backup created"
else
    echo "    ℹ No database file found yet (this is normal for first run)"
fi
echo ""

# Pull latest changes from GitHub
echo "[3/8] Pulling latest changes from GitHub..."
git fetch origin
git pull origin main
echo "    ✓ Code updated"
echo ""

# Install/update server dependencies if package.json changed
echo "[4/8] Checking server dependencies..."
if git diff HEAD@{1} HEAD --name-only | grep -q "package.json"; then
    echo "    package.json changed, updating dependencies..."
    npm install
    echo "    ✓ Server dependencies updated"
else
    echo "    ℹ No changes to package.json, skipping npm install"
fi
echo ""

# Install/update client dependencies and rebuild
echo "[5/8] Updating client dependencies..."
cd client
if git diff HEAD@{1} HEAD --name-only | grep -q "client/package.json"; then
    echo "    client/package.json changed, updating dependencies..."
    npm install
    echo "    ✓ Client dependencies updated"
else
    echo "    ℹ No changes to client/package.json, skipping npm install"
fi
echo ""

# Always rebuild the client if there are any client changes
echo "[6/8] Rebuilding client..."
if git diff HEAD@{1} HEAD --name-only | grep -q "client/"; then
    echo "    Client files changed, rebuilding..."
    npm run build
    echo "    ✓ Client rebuilt"
else
    echo "    ℹ No client changes detected, but rebuilding to be safe..."
    npm run build
    echo "    ✓ Client rebuilt"
fi
cd ..
echo ""

# Restart the service
echo "[7/8] Restarting roon-dashboard service..."
sudo systemctl restart roon-dashboard
echo "    ✓ Service restarted"
echo ""

# Wait for service to start
echo "[8/8] Waiting for service to initialize..."
sleep 3
echo ""

# Show final status
echo "════════════════════════════════════════════════════════"
echo "  Update Complete!"
echo "════════════════════════════════════════════════════════"
echo ""
echo "Service Status:"
sudo systemctl status roon-dashboard --no-pager -n 5 || true
echo ""
echo "Recent Logs:"
sudo journalctl -u roon-dashboard --no-pager -n 10 --since "1 minute ago" || true
echo ""
echo "────────────────────────────────────────────────────────"
echo "✓ Your database and play history are preserved"
echo "✓ Dashboard is accessible at: http://YOUR_SERVER_IP:3001"
echo ""
echo "Useful commands:"
echo "  • Check status:  sudo systemctl status roon-dashboard"
echo "  • View logs:     sudo journalctl -u roon-dashboard -f"
echo "  • Stop service:  sudo systemctl stop roon-dashboard"
echo "  • Start service: sudo systemctl start roon-dashboard"
echo "════════════════════════════════════════════════════════"

