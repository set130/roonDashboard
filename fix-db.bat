@echo off
echo Running database permission fix on server...
echo.

ssh set@192.168.0.25 "sudo chown set:set /opt/roonDashboard/roon-dashboard.sqlite* 2>&1"
echo Ownership updated.

ssh set@192.168.0.25 "sudo chmod 664 /opt/roonDashboard/roon-dashboard.sqlite* 2>&1"
echo Permissions set to 664.

ssh set@192.168.0.25 "sudo chown set:set /opt/roonDashboard"
ssh set@192.168.0.25 "sudo chmod 775 /opt/roonDashboard"
echo Directory permissions updated.

ssh set@192.168.0.25 "sudo systemctl restart roon-dashboard"
echo Service restarted.

timeout /t 5 /nobreak > nul

ssh set@192.168.0.25 "curl -s http://localhost:3001/api/status"
echo.

echo.
echo Checking for database writes in 15 seconds...
timeout /t 15 /nobreak > nul

ssh set@192.168.0.25 "sqlite3 /opt/roonDashboard/roon-dashboard.sqlite 'SELECT COUNT(*) FROM plays;'"

echo.
echo Done! Check the dashboard for history.

