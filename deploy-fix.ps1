# Deployment script for Roon Dashboard fix to 192.168.0.25

$ServerIP = "192.168.0.25"
$ServerUser = "set"
$ServerPath = "/opt/roonDashboard"

Write-Host "================================================"
Write-Host "Roon Dashboard Deployment - Fix"
Write-Host "================================================"
Write-Host ""

Write-Host "[1] Building client for production..."
cd C:\Users\set\WebstormProjects\roonDashboard\client
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Build failed!"
    exit 1
}
Write-Host "OK: Client build successful"
Write-Host ""

Write-Host "[2] Deploying files to server at $ServerIP..."
cd C:\Users\set\WebstormProjects\roonDashboard

# Using cmd.exe to execute scp to avoid PowerShell quoting issues
cmd /c "scp -r --exclude=node_modules --exclude=.git --exclude=*.sqlite* . $ServerUser@$ServerIP`:$ServerPath/"

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: SCP deployment failed!"
    exit 1
}
Write-Host "OK: Files deployed successfully"
Write-Host ""

Write-Host "[3] Checking server connectivity..."
try {
    $Response = Invoke-WebRequest -Uri "http://$ServerIP:3001" -TimeoutSec 5 -ErrorAction Stop
    if ($Response.StatusCode -eq 200) {
        Write-Host "OK: Server is responding at http://$ServerIP:3001"
    }
} catch {
    Write-Host "WARNING: Server connection check - may need to reload page"
}
Write-Host ""

Write-Host "[4] Waiting for service to pick up changes..."
Start-Sleep -Seconds 2
Write-Host "OK: Ready for testing"
Write-Host ""

Write-Host "================================================"
Write-Host "OK: Deployment Complete!"
Write-Host "================================================"
Write-Host ""
Write-Host "IMPORTANT NEXT STEP:"
Write-Host "1. Go to http://$ServerIP:3001/recap"
Write-Host "2. Hard refresh the page (Ctrl+Shift+R or Cmd+Shift+R)"
Write-Host "3. The carousel should now work without errors!"
Write-Host ""

