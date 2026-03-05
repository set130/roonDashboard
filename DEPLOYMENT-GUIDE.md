# Arc Zone Logging Fix - DEPLOYMENT GUIDE

## Status: ✅ READY FOR DEPLOYMENT

All code changes have been completed and validated. The fix addresses the null pointer exception that was preventing Arc zone plays from being logged.

---

## What Was Fixed

### The Problem
Arc zone plays were not being logged to the database because of a critical null pointer exception in `server/tracker.js` line 139:

```javascript
// BEFORE (Crashed on Arc zone):
seek_position: zone.now_playing.seek_position,  // ❌ Crashes if now_playing is null
```

### The Solution
Added defensive null checking and enhanced error logging:

```javascript
// AFTER (Handles gracefully):
seek_position: zone.now_playing ? zone.now_playing.seek_position : 0,  // ✓ Safe
if (trackInfo) {
  // Process zone
} else {
  console.log("[Tracker] Warning: No track info available for zone " + zone.display_name);
}
```

---

## Files Modified

1. **server/tracker.js** (4 changes)
   - Line 26-31: Enhanced error messages with zone name and track title
   - Line 57-59: Added zone event logging to show all zones being processed
   - Line 136-151: Fixed null pointer exception with defensive checks
   - Line 161-163: Added zone removal event logging

2. **server/roon.js** (1 change)
   - Line 35-51: Enhanced zone subscription event logging for full transparency

---

## Deployment Methods

### METHOD 1: Quick Deploy (Recommended if SSH works)
```bash
cd /home/set/IdeaProjects/roonDashboard
bash deploy-arc-debug.sh
```

This script will:
- Copy files via SCP
- Move them to production with sudo
- Restart the service
- Show status and logs

**Expected output:**
```
Deploying Arc zone debugging changes to 100.90.5.35...
[1] Copying modified files...
[2] Moving files to destination with sudo...
[3] Restarting roon-dashboard service...
[4] Checking service status...
● roon-dashboard.service - Roon Dashboard
    Active: active (running)
```

---

### METHOD 2: Manual Deployment (If SSH not available)

**Step 1: Connect to server**
```bash
ssh set@100.90.5.35
```

**Step 2: Copy files (from local machine in new terminal)**
```bash
cd /home/set/IdeaProjects/roonDashboard
scp server/roon.js set@100.90.5.35:/tmp/roon.js
scp server/tracker.js set@100.90.5.35:/tmp/tracker.js
```

**Step 3: Deploy on server**
```bash
# On the server:
sudo cp /tmp/roon.js /opt/roonDashboard/server/roon.js
sudo cp /tmp/tracker.js /opt/roonDashboard/server/tracker.js
sudo systemctl restart roon-dashboard
sudo systemctl status roon-dashboard
```

---

### METHOD 3: Git-First Deployment (Best Practice)

**Step 1: Review and commit changes**
```bash
cd /home/set/IdeaProjects/roonDashboard

# See exactly what changed
git diff server/tracker.js
git diff server/roon.js

# Commit the changes
git add server/tracker.js server/roon.js
git commit -m "Fix Arc zone logging: add null checks and enhanced logging

- Fixed null pointer exception when zone.now_playing is null
- Added defensive checks before accessing now_playing properties
- Enhanced error messages for database insertion failures
- Added comprehensive zone subscription event logging
- This fixes Arc zone plays not being logged
"

# Push to repository
git push origin main
```

**Step 2: Deploy**
```bash
# Use METHOD 1 or 2 above to deploy
bash deploy-arc-debug.sh
```

---

## Post-Deployment Verification

### Immediate Check (5 minutes)
```bash
# Check service is running
ssh set@100.90.5.35 "sudo systemctl status roon-dashboard"

# Check for errors on startup
ssh set@100.90.5.35 "sudo journalctl -u roon-dashboard -n 20 --no-pager"
```

Expected to see:
```
[Roon] Discovery mode - searching for Roon Core on local network...
[Roon] Core paired: setsrv
[Roon] Zone subscription event: cmd=Subscribed
[Roon] Initial zones: premium, Arc
[Tracker] Zones received: premium (zone-xxx) [...], Arc (zone-yyy) [...]
```

### Functional Test (Next Arc play)
```bash
# Monitor logs while playing on Arc
ssh set@100.90.5.35 "sudo journalctl -u roon-dashboard -f"

# Play something on Arc for at least 30 seconds
# Look for in the logs:
# [Tracker] Now playing: Song Title by Artist in Arc
# [Tracker] ✓ Logged: Song Title by Artist (45s) in zone Arc
```

### Database Verification (After next Arc play)
```bash
# Check Arc plays are in the database
ssh set@100.90.5.35 "sqlite3 /opt/roonDashboard/roon-dashboard.sqlite \
  \"SELECT zone_name, COUNT(*) as plays FROM plays GROUP BY zone_name;\""

# Should show Arc with play count > 0
```

---

## Troubleshooting

### Service won't start
```bash
# Check logs for errors
sudo journalctl -u roon-dashboard -n 50 --no-pager

# Check file permissions
ls -la /opt/roonDashboard/server/tracker.js /opt/roonDashboard/server/roon.js

# Should be readable by the node process
```

### Arc zone not detected
```bash
# Test Roon Core connection
node /home/set/IdeaProjects/roonDashboard/debug-zones.js

# Should connect and list all zones including Arc
```

### Plays still not logging
```bash
# Check the error message
sudo journalctl -u roon-dashboard --no-pager | grep -i "failed\|error"

# Check minimum play duration (30 seconds required)
# Check if Arc zone is actually playing
sudo journalctl -u roon-dashboard -f
# Play on Arc and watch for: "[Tracker] Now playing: ..."
```

### Database errors
```bash
# Check database integrity
sqlite3 /opt/roonDashboard/roon-dashboard.sqlite "PRAGMA integrity_check;"

# Rebuild if needed
sudo sqlite3 /opt/roonDashboard/roon-dashboard.sqlite "VACUUM;"
```

---

## What to Expect After Deployment

### Immediate (Service restart)
- Service starts cleanly
- No errors in logs
- All zones detected (premium, Arc, etc.)
- Logs show each zone event

### Short-term (Next Arc play)
- "Now playing" message appears in logs
- Play is committed after 30+ seconds
- Record is inserted into database
- Error messages (if any) are detailed and actionable

### Long-term (Ongoing monitoring)
- Arc plays consistently logged
- Database reflects all Arc zone activity
- Logs provide full transparency into events

---

## Key Log Messages

### Success Indicators ✅
```
[Roon] Initial zones: premium, Arc
[Tracker] Zones received: premium [...], Arc [...]
[Tracker] Now playing: Song by Artist in Arc
[Tracker] ✓ Logged: Song by Artist (120s) in zone Arc
```

### Warning Indicators ⚠️
```
[Tracker] Warning: No track info available for zone Arc
```

### Error Indicators ❌
```
[Tracker] ✗ Failed to insert play for 'Song' in zone Arc: database locked
[Roon] Zone subscription event: cmd=Error
```

---

## Rollback Instructions (If needed)

If something goes wrong:

```bash
# Restore from git
cd /home/set/IdeaProjects/roonDashboard
git checkout HEAD -- server/tracker.js server/roon.js

# Redeploy old version
ssh set@100.90.5.35 "sudo systemctl stop roon-dashboard"
scp server/tracker.js set@100.90.5.35:/tmp/tracker.js
scp server/roon.js set@100.90.5.35:/tmp/roon.js
ssh set@100.90.5.35 "sudo cp /tmp/tracker.js /opt/roonDashboard/server/tracker.js && sudo cp /tmp/roon.js /opt/roonDashboard/server/roon.js && sudo systemctl start roon-dashboard"
```

---

## Quick Reference

| Command | Purpose |
|---------|---------|
| `bash deploy-arc-debug.sh` | Deploy and restart service |
| `sudo systemctl status roon-dashboard` | Check service status |
| `sudo journalctl -u roon-dashboard -f` | Monitor logs in real-time |
| `node debug-zones.js` | Test Roon Core connection |
| `sqlite3 /opt/roonDashboard/roon-dashboard.sqlite "SELECT * FROM plays WHERE zone_name='Arc';"` | Check Arc plays in DB |

---

## Summary

✅ **Code**: Fixed and validated
✅ **Documentation**: Complete
✅ **Testing**: Ready
⏳ **Deployment**: Awaiting execution

**Next Step**: Run `bash deploy-arc-debug.sh` when ready to deploy

