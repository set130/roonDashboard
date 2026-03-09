# Arc Tracking - Complete Summary (UPDATED)

## The Real Problem
**Your iPhone Regular Roon App:** ✅ Gets tracked perfectly with accurate durations  
**Your Arc App:** ❌ Doesn't get tracked at all  
**Last.fm:** ❌ Only tracks "played or not", not "how long"

## Root Cause Analysis (from Claude)

### What We Did Wrong
1. **History Poller was fundamentally broken**
   - Used wrong API (RoonApiBrowse is for library browsing, not history)
   - No playback history exists in Browse API
   - Broken deduplication (same song twice = only logged once)
   - Hardcoded all plays to 30 seconds
   - Never actually worked

2. **Wrong Assumption**
   - Assumed Arc doesn't fire zone events
   - Actually, Arc **should** appear in zone subscriptions

### What's Actually Happening
Arc plays either:
- Fire as `zones_changed` (reusing existing zone ID)
- Fire as `zones_added` (new zone)
- Don't fire at all (if playing offline/cellular)

## Solution Implemented

### 1. Removed Broken History Poller ✅
- Removed `require("./history-poller")`
- Removed `historyPoller.init(core)` 
- Removed `historyPoller.stopPolling()`
- File `server/history-poller.js` no longer used

### 2. Added Verbose Zone Logging ✅
```javascript
_transport.subscribe_zones(function (cmd, data) {
  console.log("[Roon] Zone subscription event: cmd=" + cmd);
  console.log("[Roon] RAW EVENT DATA:", JSON.stringify(data, null, 2));
  // ... rest of handler
});
```

This logs:
- Complete zone structure
- All zone metadata
- Zone IDs for every zone
- Whether Arc appears and how

### 3. Enhanced Zone ID Logging ✅
```javascript
console.log("[Roon] zones_changed: " + 
  data.zones_changed.map(z => z.display_name + " (ID: " + z.zone_id + ")").join(", ")
);
```

## How to Diagnose Arc

### Step 1: Play on Arc
Play any track on your Roon Arc device for 30+ seconds

### Step 2: Monitor Logs
```bash
ssh set@192.168.0.25 'journalctl -u roon-dashboard -f'
```

### Step 3: Check for Arc Zone Data
Look for:
```
[Roon] RAW EVENT DATA: {
  "zones_changed": [
    {
      "zone_id": "abc123",
      "display_name": "Arc",
      "state": "playing",
      "now_playing": { ... }
    }
  ]
}
```

### Step 4: Check Tracker Processing
```
[Tracker] Zone: Arc (ID: abc123)
  - State: playing
  - Has now_playing: YES
  - Track: Your Song
[Tracker] ✓ Now tracking: Your Song by Artist in Arc
[Tracker] ✓ Logged: Your Song by Artist (45s)
```

### Step 5: Verify Database
```bash
ssh set@192.168.0.25 "sqlite3 /opt/roonDashboard/roon-dashboard.sqlite \"SELECT zone_name, track_title, played_secs FROM plays WHERE zone_name LIKE '%Arc%' ORDER BY started_at DESC LIMIT 10;\""
```

## Possible Outcomes

| Outcome | What It Means | Solution |
|---------|---------------|----------|
| Arc appears in RAW EVENT DATA + tracker logs it + database has plays | ✅ **Working!** | Remove verbose logging |
| Arc appears in RAW EVENT DATA but tracker skips it | ⚠️ Play < 30s, paused, or missing data | Check tracker logs for reason |
| Arc appears in RAW EVENT DATA + tracker logs it but not in database | ⚠️ Database error | Check error logs |
| Arc doesn't appear in logs at all | ❌ Playing offline/cellular | Enable Last.fm scrobbling + create Last.fm poller |

## If Arc Plays Offline/Cellular Don't Work

### Last.fm Solution

1. **Enable in Roon**
   - Settings → Services → Last.fm
   - Connect your account
   - Roon scrobbles all plays (including Arc offline)

2. **Create Last.fm Poller** (if needed)
   - Use Last.fm API `user.getRecentTracks`
   - Poll every 60 seconds
   - Import plays not in database
   - Has accurate timestamps and durations

## Cleaning Up Verbose Logging

Once diagnosed, remove this line from `server/roon.js`:
```javascript
console.log("[Roon] RAW EVENT DATA:", JSON.stringify(data, null, 2));
```

Keep these:
```javascript
console.log("[Roon] zones_changed: " + ...);
console.log("[Roon] zones_added: " + ...);
```

## Files Changed

### Modified
- ✅ `server/roon.js` - Verbose logging, removed history poller

### No Longer Used
- ⚠️ `server/history-poller.js` - Can be deleted

### Backups on Server
- `/opt/roonDashboard/server/roon.js.bak`

## Deployment Status

✅ Deployed to server  
✅ Service restarted  
✅ Verbose logging enabled  
✅ History poller removed  
✅ Ready for diagnosis  

## Quick Test Commands

### Watch logs in real-time
```bash
ssh set@192.168.0.25 'journalctl -u roon-dashboard -f'
```

### Filter for Arc only
```bash
ssh set@192.168.0.25 'journalctl -u roon-dashboard -f | grep -i arc'
```

### Check service status
```bash
ssh set@192.168.0.25 'sudo systemctl status roon-dashboard'
```

### View recent logs
```bash
ssh set@192.168.0.25 'journalctl -u roon-dashboard --no-pager -n 100'
```

### Check database for Arc plays
```bash
ssh set@192.168.0.25 "sqlite3 /opt/roonDashboard/roon-dashboard.sqlite \"SELECT zone_name, track_title, artist, played_secs, started_at FROM plays ORDER BY started_at DESC LIMIT 20;\""
```

## What to Test

1. **Play on Arc at home** (on local network)
   - Should appear in zone events
   - Should be tracked and logged

2. **Play on Arc away from home** (cellular/VPN)
   - May not appear in zone events (Roon API limitation)
   - Would need Last.fm integration

3. **Different play durations**
   - < 30 seconds should be skipped
   - ≥ 30 seconds should be logged

4. **Pause and resume**
   - Pause < 60s should continue same play
   - Pause ≥ 60s should log play

## Expected Behavior

### Zone Events Fire (At Home)
```
[Roon] RAW EVENT DATA: { zones_changed: [ { display_name: "Arc", ... } ] }
[Tracker] ✓ Now tracking: Song in Arc
[Tracker] ✓ Logged: Song by Artist (45s)
```
✅ Arc plays logged correctly

### Zone Events Don't Fire (Offline)
```
(No Arc events in logs)
```
❌ Need Last.fm integration

## Documentation

- **ARC-PROPER-DIAGNOSIS.md** - Detailed diagnostic guide
- **ARC-FIX-FINAL.md** - Quick reference
- **ARC-LOGGING-FIX.md** - Tracker logging (still relevant)

---

## Next Steps

1. ✅ **Deployed** - Verbose logging is now active
2. 🎵 **Play on Arc** - Test with 30+ second track
3. 👀 **Check logs** - Look for Arc zone data
4. 📊 **Verify database** - Check if plays are logged
5. 📝 **Report back** - Share what the logs show

**The system is ready to diagnose! Play something on Arc and watch the logs.** 🎵

