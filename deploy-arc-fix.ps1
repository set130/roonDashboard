# Deploy Arc Plays Fix - History Poller Solution
# This installs the Browse API and polls Roon's history to capture Arc plays

$ServerIP = "192.168.0.25"
$ServerUser = "set"

Write-Host "=== Deploying Arc Plays Fix (History Poller) ===" -ForegroundColor Cyan
Write-Host ""

# Step 1: Install dependencies locally first
Write-Host "[1/6] Installing node-roon-api-browse locally..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to install dependencies" -ForegroundColor Red
    exit 1
}
Write-Host "    ✓ Dependencies installed" -ForegroundColor Green

# Step 2: Copy files to server
Write-Host "[2/6] Copying files to server..." -ForegroundColor Yellow
scp package.json ${ServerUser}@${ServerIP}:/tmp/package.json
scp server/roon.js ${ServerUser}@${ServerIP}:/tmp/roon.js
scp server/history-poller.js ${ServerUser}@${ServerIP}:/tmp/history-poller.js
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to copy files" -ForegroundColor Red
    exit 1
}
Write-Host "    ✓ Files copied" -ForegroundColor Green

# Step 3: Deploy files on server
Write-Host "[3/6] Deploying files on server..." -ForegroundColor Yellow
ssh ${ServerUser}@${ServerIP} @"
    sudo cp /opt/roonDashboard/package.json /opt/roonDashboard/package.json.bak
    sudo cp /opt/roonDashboard/server/roon.js /opt/roonDashboard/server/roon.js.bak
    sudo cp /tmp/package.json /opt/roonDashboard/package.json
    sudo cp /tmp/roon.js /opt/roonDashboard/server/roon.js
    sudo cp /tmp/history-poller.js /opt/roonDashboard/server/history-poller.js
    echo '✓ Files deployed and backed up'
"@
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to deploy files" -ForegroundColor Red
    exit 1
}

# Step 4: Install dependencies on server
Write-Host "[4/6] Installing dependencies on server..." -ForegroundColor Yellow
ssh ${ServerUser}@${ServerIP} "cd /opt/roonDashboard; sudo npm install"
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to install dependencies on server" -ForegroundColor Red
    exit 1
}
Write-Host "    ✓ Dependencies installed on server" -ForegroundColor Green

# Step 5: Restart service
Write-Host "[5/6] Restarting roon-dashboard service..." -ForegroundColor Yellow
ssh ${ServerUser}@${ServerIP} "sudo systemctl restart roon-dashboard; sleep 3"
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to restart service" -ForegroundColor Red
    exit 1
}
Write-Host "    ✓ Service restarted" -ForegroundColor Green

# Step 6: Show logs
Write-Host "[6/6] Checking service logs..." -ForegroundColor Yellow
Write-Host ""
ssh ${ServerUser}@${ServerIP} "journalctl -u roon-dashboard --no-pager -n 60 | tail -40"

Write-Host ""
Write-Host "=== Deployment Complete ===" -ForegroundColor Green
Write-Host ""
Write-Host "How it works:" -ForegroundColor Cyan
Write-Host "- The dashboard now polls Roon's playback history every 30 seconds"
Write-Host "- This captures Arc plays and any other plays that don't trigger zone events"
Write-Host "- Zone tracking still works for real-time tracking of local zones"
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Play a track on Arc for 30+ seconds"
Write-Host "2. Wait up to 30 seconds for the history poll"
Write-Host "3. Check logs: ssh set@192.168.0.25 'journalctl -u roon-dashboard -f'"
Write-Host "4. Look for: '[HistoryPoller] Logged from history:  <track> in Arc'"
Write-Host ""
Write-Host "Monitor in real-time:"
Write-Host "ssh set@192.168.0.25 'journalctl -u roon-dashboard -f | grep -E \"(HistoryPoller|Arc)\"'"
Write-Host ""

