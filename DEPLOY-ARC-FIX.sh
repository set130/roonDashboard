#!/bin/bash
# Deployment commands for Arc Zone Logging Fix

# Step 1: Commit changes locally
cd /home/set/IdeaProjects/roonDashboard

git add server/tracker.js server/roon.js
git commit -m "Fix Arc zone logging: add null checks and enhanced error logging

- Fixed null pointer exception when zone.now_playing is null
- Added defensive checks before accessing now_playing properties
- Enhanced error messages for database insertion failures
- Added comprehensive zone subscription event logging
- Added warning logs for zones with no track info

This fixes the issue where Arc zone plays were not being logged.

Files modified:
- server/tracker.js: Added null checks, better error handling
- server/roon.js: Added zone subscription event logging
"

# Step 2: Push to repository
git push origin main

# Step 3: Deploy to remote server
echo "Deploying to remote server..."

REMOTE_HOST="100.90.5.35"
REMOTE_USER="set"
REMOTE_PATH="/opt/roonDashboard"

# Copy files to remote /tmp first
scp server/roon.js "$REMOTE_USER@$REMOTE_HOST:/tmp/roon.js.new"
scp server/tracker.js "$REMOTE_USER@$REMOTE_HOST:/tmp/tracker.js.new"

# Move to actual location with sudo
ssh "$REMOTE_USER@$REMOTE_HOST" << 'SSH_CMD'
  sudo bash -c '
    echo "Moving files to production..."
    mv /tmp/roon.js.new /opt/roonDashboard/server/roon.js
    mv /tmp/tracker.js.new /opt/roonDashboard/server/tracker.js
    chown root:root /opt/roonDashboard/server/roon.js /opt/roonDashboard/server/tracker.js
    chmod 644 /opt/roonDashboard/server/roon.js /opt/roonDashboard/server/tracker.js
    echo "Files deployed successfully"
  '
SSH_CMD

# Step 4: Restart service
echo "Restarting roon-dashboard service..."
ssh "$REMOTE_USER@$REMOTE_HOST" "sudo systemctl restart roon-dashboard"

# Step 5: Check status
echo ""
echo "Service status:"
ssh "$REMOTE_USER@$REMOTE_HOST" "sudo systemctl status roon-dashboard --no-pager" | head -15

echo ""
echo "Deployment complete!"
echo "Monitor logs with: ssh $REMOTE_USER@$REMOTE_HOST 'sudo journalctl -u roon-dashboard -f'"

