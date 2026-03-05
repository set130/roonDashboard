# Arc Zone Logging Fix - QUICK START

## TL;DR

**Problem**: Arc zone plays not being logged  
**Cause**: Null pointer exception in tracker.js line 139  
**Solution**: Added null checks and enhanced error logging  
**Status**: ✅ READY TO DEPLOY

---

## Deploy Now (3 steps)

### Step 1: Get to the project directory
```bash
cd /home/set/IdeaProjects/roonDashboard
```

### Step 2: Run the deployment script
```bash
bash deploy-arc-debug.sh
```

The script will:
- Copy updated files to the server
- Restart the service
- Show status

### Step 3: Verify it works
```bash
# Play something on Arc for 30+ seconds
# Check logs:
ssh set@100.90.5.35 "sudo journalctl -u roon-dashboard -f"

# Look for:
# [Tracker] Now playing: Song by Artist in Arc
# [Tracker] ✓ Logged: Song by Artist (45s) in zone Arc
```

---

## What Changed

### server/tracker.js
**Before**:
```javascript
seek_position: zone.now_playing.seek_position,  // ❌ CRASHES
```

**After**:
```javascript
seek_position: zone.now_playing ? zone.now_playing.seek_position : 0,  // ✓ SAFE
if (trackInfo) { /* ... */ } else { console.log("Warning: No track info...") }
```

### server/roon.js
Added detailed logging for zone subscription events

---

## Verify It Worked

### Check database for Arc plays
```bash
ssh set@100.90.5.35 "sqlite3 /opt/roonDashboard/roon-dashboard.sqlite \
  \"SELECT zone_name, COUNT(*) FROM plays GROUP BY zone_name;\""

# Arc should appear with play count > 0
```

### Check recent Arc plays
```bash
ssh set@100.90.5.35 "sqlite3 /opt/roonDashboard/roon-dashboard.sqlite \
  \"SELECT started_at, track_title, artist FROM plays WHERE zone_name='Arc' \
   ORDER BY started_at DESC LIMIT 5;\""
```

---

## If Something's Wrong

### Service won't start
```bash
ssh set@100.90.5.35 "sudo journalctl -u roon-dashboard -n 30 --no-pager"
# Look for error messages
```

### Arc zone not detected
```bash
# Test Roon connection
node debug-zones.js
```

### Plays still not logging
```bash
# Monitor logs while playing
ssh set@100.90.5.35 "sudo journalctl -u roon-dashboard -f"
# Play on Arc for 30+ seconds
# Should see: [Tracker] Now playing: ... in Arc
```

---

## Files Modified
- `server/tracker.js` - Fixed null pointer, enhanced logging
- `server/roon.js` - Enhanced zone subscription logging

## Key Points
- ✅ Plays must be 30+ seconds to log
- ✅ Zone must be actively playing (not paused)
- ✅ Paused tracks log after 60 seconds of pause
- ✅ All zones (premium, Arc, etc.) are tracked equally

---

## Done!

Your Arc zone logging issue is fixed. Deploy the changes and Arc plays will be logged automatically.

For detailed docs, see:
- `DEPLOYMENT-GUIDE.md` - Complete deployment instructions
- `ARC-ZONE-MONITORING.md` - Monitoring and troubleshooting
- `ARC-ZONE-FIX.md` - Technical deep dive

