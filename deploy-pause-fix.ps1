#!/usr/bin/env pwsh
# Deploy the pause/resume fix to the server

Write-Host "=== Deploying Pause/Resume Fix ===" -ForegroundColor Cyan

# 1. Test syntax locally first
Write-Host "`n1. Testing syntax..." -ForegroundColor Yellow
node -c server/tracker.js
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Syntax error in tracker.js! Fix it before deploying." -ForegroundColor Red
    exit 1
}
Write-Host "✅ Syntax OK" -ForegroundColor Green

# 2. Show what will be deployed
Write-Host "`n2. Files to deploy:" -ForegroundColor Yellow
Write-Host "   - server/tracker.js (modified)" -ForegroundColor White

# 3. Backup reminder
Write-Host "`n3. Pre-deployment checklist:" -ForegroundColor Yellow
Write-Host "   [ ] Server backup completed?" -ForegroundColor White
Write-Host "   [ ] Database backup completed?" -ForegroundColor White
Write-Host "   [ ] Ready to restart service?" -ForegroundColor White

$confirm = Read-Host "`nContinue with deployment? (yes/no)"
if ($confirm -ne "yes") {
    Write-Host "Deployment cancelled." -ForegroundColor Yellow
    exit 0
}

# 4. If you have SSH access to server, you can add deployment commands here
Write-Host "`n4. Deployment steps:" -ForegroundColor Yellow
Write-Host "   Run these commands on your server:" -ForegroundColor White
Write-Host ""
Write-Host "   # Backup current version" -ForegroundColor Cyan
Write-Host "   sudo cp /opt/roonDashboard/server/tracker.js /opt/roonDashboard/server/tracker.js.backup" -ForegroundColor Gray
Write-Host ""
Write-Host "   # Copy new version (adjust path as needed)" -ForegroundColor Cyan
Write-Host "   sudo cp /path/to/your/local/server/tracker.js /opt/roonDashboard/server/tracker.js" -ForegroundColor Gray
Write-Host ""
Write-Host "   # Restart service" -ForegroundColor Cyan
Write-Host "   sudo systemctl restart roon-dashboard" -ForegroundColor Gray
Write-Host ""
Write-Host "   # Check status" -ForegroundColor Cyan
Write-Host "   sudo systemctl status roon-dashboard" -ForegroundColor Gray
Write-Host ""
Write-Host "   # Watch logs" -ForegroundColor Cyan
Write-Host "   sudo journalctl -u roon-dashboard -f" -ForegroundColor Gray

Write-Host "`n✅ Local validation complete. Follow the steps above to deploy." -ForegroundColor Green
Write-Host "`n💡 Tip: Test by pausing/resuming a track and checking the database!" -ForegroundColor Cyan

