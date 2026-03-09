# QUICK FIX - No Logs Showing

## Problem
`journalctl -u roon-dashboard -f` shows nothing

## Quick Diagnostic

### Step 1: Check if service is running
```bash
ssh set@192.168.0.25 "sudo systemctl status roon-dashboard"
```

**Look for:**
- `Active: active (running)` = Good ✅
- `Active: failed` or `Active: inactive` = Problem ❌

### Step 2: View last 50 log lines
```bash
ssh set@192.168.0.25 "sudo journalctl -u roon-dashboard -n 50 --no-pager"
```

**Look for:**
- Recent timestamps
- "[Roon] Core paired" message
- Any error messages

### Step 3: Check for errors
```bash
ssh set@192.168.0.25 "sudo journalctl -u roon-dashboard -n 100 --no-pager | grep -i error"
```

## Quick Fix Options

### Option A: Restart Service

```bash
ssh set@192.168.0.25 "sudo systemctl restart roon-dashboard && sleep 3 && sudo systemctl status roon-dashboard"
```

Then try logs again:
```bash
ssh set@192.168.0.25 "journalctl -u roon-dashboard -f"
```

### Option B: Deploy Simplified Version

If the verbose roon.js has issues, use the simple version:

```bash
# Copy simple version to server
scp server/roon-simple.js set@192.168.0.25:/tmp/roon-simple.js

# Deploy it
ssh set@192.168.0.25 "sudo cp /tmp/roon-simple.js /opt/roonDashboard/server/roon.js && sudo systemctl restart roon-dashboard"

# Check status
ssh set@192.168.0.25 "sudo systemctl status roon-dashboard"

# Watch logs
ssh set@192.168.0.25 "journalctl -u roon-dashboard -f"
```

### Option C: Restore Backup

If latest deployment broke it:

```bash
ssh set@192.168.0.25 "sudo cp /opt/roonDashboard/server/roon.js.bak /opt/roonDashboard/server/roon.js && sudo systemctl restart roon-dashboard"
```

### Option D: Test Manually

Run service in foreground to see errors directly:

```bash
ssh set@192.168.0.25
sudo systemctl stop roon-dashboard
cd /opt/roonDashboard
node server/index.js
```

You'll see all output. Press Ctrl+C to stop, then:
```bash
sudo systemctl start roon-dashboard
```

## What to Look For

### If Service is Running
- Logs should show "[Roon] Starting..." and "[Roon] Core paired"
- If logs are silent, Core might not be connecting

### If Service Failed
- Check error message in status
- Look for "Cannot find module" = Missing dependencies
- Look for "SyntaxError" = Code problem
- Look for "ECONNREFUSED" = Can't reach Core

### If Logs Work But Nothing About Arc
- Service is fine
- Arc just not appearing in zone events
- Need to test Arc at home on WiFi

## Most Likely Issues

1. **Service didn't restart** - Run: `sudo systemctl restart roon-dashboard`
2. **Verbose logging broke it** - Deploy simple version (Option B)
3. **Missing dependencies** - Run: `cd /opt/roonDashboard && sudo npm install`
4. **Core not connected** - Check Roon app shows extension

## After You Get Logs Working

Once logs are showing again:

1. **Test Arc at home** - Connect iPhone to home WiFi
2. **Play song on Arc** - 30+ seconds
3. **Watch logs** - Look for Arc zone

---

**Start with Step 1-3 above and report what you see!**

