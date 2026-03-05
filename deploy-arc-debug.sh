#!/bin/bash
# Deploy debug logging changes to the Roon Dashboard server

set -e

REMOTE_HOST="100.90.5.35"
REMOTE_USER="set"
REMOTE_PATH="/opt/roonDashboard"

echo "Deploying Arc zone debugging changes to $REMOTE_HOST..."

# Copy the modified server files (using sudo on remote)
echo "[1] Copying modified files..."
scp server/roon.js "$REMOTE_USER@$REMOTE_HOST:/tmp/roon.js"
scp server/tracker.js "$REMOTE_USER@$REMOTE_HOST:/tmp/tracker.js"
echo "    Files copied to /tmp"

echo "[1.5] Moving files to destination with sudo..."
ssh "$REMOTE_USER@$REMOTE_HOST" "sudo mv /tmp/roon.js $REMOTE_PATH/server/roon.js && sudo mv /tmp/tracker.js $REMOTE_PATH/server/tracker.js"
echo "    Files moved to destination"

# Restart the service
echo "[2] Restarting roon-dashboard service..."
ssh "$REMOTE_USER@$REMOTE_HOST" "sudo systemctl restart roon-dashboard"
echo "    Service restarted"

echo "[3] Waiting for service to initialize..."
sleep 3

echo "[4] Checking service status..."
ssh "$REMOTE_USER@$REMOTE_HOST" "sudo systemctl status roon-dashboard --no-pager" | head -20

echo ""
echo "[5] Tailing logs for Arc zone detection..."
echo "    (Press Ctrl+C to stop)"
ssh "$REMOTE_USER@$REMOTE_HOST" "sudo journalctl -u roon-dashboard -f" || true

echo ""
echo "Deployment complete!"

