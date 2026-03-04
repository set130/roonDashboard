# QUICK REFERENCE - ROON DASHBOARD FIX

## TL;DR - What Was Fixed

**Problem:** Service connecting to `localhost:9100` instead of `192.168.0.25:9100`

**Solution:** Changed service file environment variable from `ROON_CORE_IP=localhost` to `ROON_CORE_IP=192.168.0.25`

---

## Files Changed

### 1. `/etc/systemd/system/roon-dashboard.service`
```ini
Environment="ROON_CORE_IP=192.168.0.25"  ← This line was key
```

### 2. `/opt/roonDashboard/server/roon.js`
- Added error handlers
- Added debug logging
- Wrapped connection in try-catch

---

## One-Line Deployment

Copy this entire line and run on the server:

```bash
sudo cp /tmp/roon-dashboard.service /etc/systemd/system/roon-dashboard.service && sudo cp /tmp/roon.js /opt/roonDashboard/server/roon.js && sudo systemctl daemon-reload && sudo systemctl restart roon-dashboard && sleep 3 && echo "Deployment complete. Checking logs..." && sudo journalctl -u roon-dashboard -n 30 --no-pager | tail -15
```

---

## Quick Verification

```bash
# API Status
curl http://192.168.0.25:3001/api/status

# Should return: {"connected":true}

# If not, check logs:
sudo journalctl -u roon-dashboard -n 50 --no-pager
```

---

## What Should Happen

1. **Logs will show:**
   ```
   [Server] API running on http://localhost:3001
   [Roon] Configuration - IP: 192.168.0.25, Port: 9100
   [Roon] Connecting to core at 192.168.0.25:9100...
   [Roon] Core paired: <Your Roon Name>
   ```

2. **Roon app will show:**
   - Extension in Settings > Extensions
   - Dashboard tracking your music

3. **Dashboard will load at:**
   - http://192.168.0.25:3001

---

## Files in /tmp (ready to deploy)

```
/tmp/roon-dashboard.service  ✅
/tmp/roon.js                 ✅
/tmp/deploy.sh               ✅ (optional automation)
```

---

## If Something Goes Wrong

1. **Check the actual error:**
   ```bash
   sudo journalctl -u roon-dashboard -f
   ```

2. **Test Roon connectivity:**
   ```bash
   telnet 192.168.0.25 9100
   ```

3. **Verify environment:**
   ```bash
   sudo systemctl show -p Environment roon-dashboard.service
   ```

4. **Restart everything:**
   ```bash
   sudo systemctl restart roon-dashboard
   ```

---

## Key Takeaway

The entire issue was one environment variable:

**BEFORE:** `ROON_CORE_IP=localhost`  
**AFTER:** `ROON_CORE_IP=192.168.0.25`

Everything else just needed better error reporting so we could see what was happening! 🎵

