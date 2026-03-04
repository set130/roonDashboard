# Pre-Deployment Checklist

## Local Files Verified ✅

### 1. roon-dashboard.service
- [x] Location: `C:\Users\set\WebstormProjects\roonDashboard\roon-dashboard.service`
- [x] Has: `Environment="ROON_CORE_IP=192.168.0.25"`
- [x] Has: `WorkingDirectory=/opt/roonDashboard`
- [x] Has: `User=set`

### 2. server/roon.js  
- [x] Location: `C:\Users\set\WebstormProjects\roonDashboard\server\roon.js`
- [x] ROON_CORE_IP set to: `process.env.ROON_CORE_IP || "100.90.5.35"`
- [x] Has error handler: `roon.on("error", ...)`
- [x] Has unhandledRejection handler
- [x] Has uncaughtException handler
- [x] startRoon() logs: `Configuration - IP: ${ROON_CORE_IP}, Port: ${ROON_CORE_PORT}`
- [x] Connection wrapped in try-catch

### 3. server/index.js
- [x] Location: `C:\Users\set\WebstormProjects\roonDashboard\server/index.js`
- [x] Imports startRoon from roon.js
- [x] Calls `startRoon()` on server startup
- [x] Has error handlers

## Deployment Status

### Files Copied to Server (/tmp):
```
✅ roon-dashboard.service
✅ server/roon.js  
✅ deploy.sh (optional automation script)
```

### Commands to Execute on Server:

```bash
# If using manual deployment:
sudo mv /tmp/roon-dashboard.service /etc/systemd/system/roon-dashboard.service
sudo mv /tmp/roon.js /opt/roonDashboard/server/roon.js
sudo systemctl daemon-reload
sudo systemctl restart roon-dashboard
sleep 3
sudo journalctl -u roon-dashboard -n 50 --no-pager

# OR use automated script:
sudo bash /tmp/deploy.sh
```

## Post-Deployment Verification

After running the commands above, check for:

### In Service Logs:
```
[Server] API running on http://localhost:3001
[Roon] Configuration - IP: 192.168.0.25, Port: 9100
[Roon] Connecting to core at 192.168.0.25:9100...
[Roon] Core paired: <Roon Core Name>
```

### Via API:
```bash
curl http://192.168.0.25:3001/api/status
# Expected: {"connected":true}
```

### Via Environment Check:
```bash
sudo systemctl show -p Environment roon-dashboard.service
# Should show: Environment=ROON_CORE_IP=192.168.0.25 PORT=3001 NODE_ENV=production
```

## Troubleshooting

### If still showing "ERROR undefined":
1. Check logs for actual error: `sudo journalctl -u roon-dashboard -n 100 --no-pager`
2. Verify network: `telnet 192.168.0.25 9100` from server
3. Check firewall: Port 9100 should be open on Roon core machine
4. Verify Roon core is actually running

### If extension doesn't appear in Roon:
1. Restart Roon app on your control device
2. Try restarting Roon core
3. Check Roon logs if available
4. Extension should appear under Settings > Extensions

---
**Generated:** March 4, 2026
**Deployment Ready:** YES ✅

