# Deploy Arc Plays Logging Fix
# This script deploys the enhanced tracker.js with detailed logging

$ServerIP = "192.168.0.25"
$ServerUser = "set"

Write-Host "=== Deploying Arc Plays Logging Fix ===" -ForegroundColor Cyan
Write-Host ""

# Step 1: Copy tracker.js to server
Write-Host "[1/4] Copying tracker.js to server..." -ForegroundColor Yellow
scp server/tracker.js ${ServerUser}@${ServerIP}:/tmp/tracker.js
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to copy tracker.js" -ForegroundColor Red
    exit 1
}
Write-Host "    ✓ tracker.js copied" -ForegroundColor Green

# Step 2: Backup and deploy tracker.js
Write-Host "[2/4] Deploying tracker.js on server..." -ForegroundColor Yellow
ssh ${ServerUser}@${ServerIP} @"
    sudo cp /opt/roonDashboard/server/tracker.js /opt/roonDashboard/server/tracker.js.bak
    sudo cp /tmp/tracker.js /opt/roonDashboard/server/tracker.js
    echo '✓ tracker.js deployed and backed up'
"@
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to deploy tracker.js" -ForegroundColor Red
    exit 1
}

# Step 3: Restart service
Write-Host "[3/4] Restarting roon-dashboard service..." -ForegroundColor Yellow
ssh ${ServerUser}@${ServerIP} "sudo systemctl restart roon-dashboard; sleep 2"
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to restart service" -ForegroundColor Red
    exit 1
}
Write-Host "    ✓ Service restarted" -ForegroundColor Green

# Step 4: Show logs
Write-Host "[4/4] Checking service logs..." -ForegroundColor Yellow
Write-Host ""
ssh ${ServerUser}@${ServerIP} "journalctl -u roon-dashboard --no-pager -n 50 | tail -30"

Write-Host ""
Write-Host "=== Deployment Complete ===" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Play a track on your Arc device for 30+ seconds"
Write-Host "2. Monitor logs with: ssh set@192.168.0.25 'journalctl -u roon-dashboard -f'"
Write-Host "3. Look for these log messages:" -ForegroundColor Yellow
Write-Host "   - 'Zone: Arc (ID: ...)' - Shows Arc zone is detected"
Write-Host "   - 'Now tracking: <track> in Arc' - Tracking started"
Write-Host "   - 'Logged: <track> ... in zone Arc' - Play was logged successfully"
Write-Host ""

