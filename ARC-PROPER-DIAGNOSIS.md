# Arc Plays Issue - Proper Diagnosis and Fix

## Summary
Removed the broken history poller and added verbose zone logging to properly diagnose Arc zone behavior.

## What Was Wrong

### The History Poller Was Fundamentally Broken

1. **Wrong API** - RoonApiBrowse is for browsing music library (artists, albums, playlists), NOT for accessing playback history
2. **No History Feed** - The "History" item we were searching for doesn't exist in the Browse API
3. **Broken Deduplication** - `lastSeenPlayId` was built from title + subtitle + image_key with no timestamp, so the same song played twice would only be logged once
4. **Hardcoded Duration** - Every play was logged as exactly 30 seconds, regardless of actual play time
5. **Never Worked** - The poller was constantly hitting "History item not found in browse" errors

### The Real Issue

Arc plays **should** appear through the zone subscription API we already have. If they're not showing up, it's because:

1. **Most likely**: Arc uses the same zone ID as an existing zone, so it fires `zones_changed` instead of `zones_added`
2. **Alternative**: Arc plays while away from home (offline/cellular) never touch your Core until you reconnect, and by then there's no event

## What Was Changed

### 1. Added Verbose Zone Logging (`server/roon.js`)

Added raw event data logging to see exactly what Arc zones look like:

```javascript
_transport.subscribe_zones(function (cmd, data) {
  console.log("[Roon] Zone subscription event: cmd=" + cmd);
  console.log("[Roon] RAW EVENT DATA:", JSON.stringify(data, null, 2));
  // ... rest of handler
});
```

This will show:
- Complete zone structure
- Zone IDs for all zones (including Arc)
- Whether Arc appears as `zones_added`, `zones_changed`, or `Subscribed`
- All zone metadata

### 2. Removed History Poller

Removed all history poller code:
- Removed `require("./history-poller")`
- Removed `historyPoller.init(core)` from `core_paired`
- Removed `historyPoller.stopPolling()` from `core_unpaired`
- Kept RoonApiBrowse in required_services (harmless to keep)

The file `server/history-poller.js` still exists but is no longer used.

### 3. Enhanced Zone ID Logging

Zone logs now show both name and ID:
```
Initial zones: Premium (abc123), Living Room (def456)
zones_added: Arc (ghi789)
zones_changed: Arc (ghi789)
```

## How to Diagnose Arc Issues

### Step 1: Check if Arc Zone Appears

**Play something on Arc**, then check logs:

```bash
ssh set@192.168.0.25 'journalctl -u roon-dashboard -f'
```

**Look for:**
```
[Roon] RAW EVENT DATA: {
  "zones_changed": [
    {
      "zone_id": "...",
      "display_name": "Arc",
      "state": "playing",
      "now_playing": { ... }
    }
  ]
}
```

### Step 2: Check Zone ID Consistency

**Compare zone IDs:**
- Does Arc always have the same zone ID?
- Does it share a zone ID with another zone?
- Does it appear as `zones_added` or `zones_changed`?

### Step 3: Check Tracker Processing

Look for tracker logs:
```
[Tracker] ===== Processing 1 zone(s) =====
[Tracker] Zone: Arc (ID: abc123)
  - State: playing
  - Has now_playing: YES
  - Track: Your Song
[Tracker] ✓ Now tracking: Your Song by Artist in Arc
```

If you see these, Arc **is** being tracked!

### Step 4: Check Database

```bash
ssh set@192.168.0.25 "sqlite3 /opt/roonDashboard/roon-dashboard.sqlite \"SELECT zone_name, zone_id, track_title, played_secs FROM plays ORDER BY started_at DESC LIMIT 20;\""
```

Look for entries with zone_name containing "Arc".

## Possible Outcomes

### Outcome 1: Arc Appears in Logs but Not in Database

**Problem**: Arc zone events are firing, but plays aren't being logged

**Causes**:
- Play duration < 30 seconds
- Track is paused indefinitely
- Zone state is not "playing"
- Now_playing data is missing

**Solution**: Check the tracker verbose logs for why it's being skipped

### Outcome 2: Arc Appears in zones_changed, Not zones_added

**Problem**: Arc reuses an existing zone ID

**Solution**: This is normal! The tracker handles `zones_changed` the same as `zones_added`. Plays should still be logged.

### Outcome 3: Arc Doesn't Appear in Logs at All

**Problem**: Arc zone events aren't firing

**Possible causes**:
- Arc is playing while disconnected from home network (cellular/offline)
- Arc plays don't sync to Core until later
- Extension isn't receiving Arc zone events

**Solution**: This is a Roon API limitation. See "Alternative Solutions" below.

### Outcome 4: Arc Appears and Plays Are Logged

**Problem**: No problem! It's working!

**Solution**: Remove the verbose logging to reduce log noise (see below)

## Alternative Solutions (If Arc Events Don't Fire)

### Option 1: Last.fm Integration

If Arc plays while offline/cellular don't fire zone events:

1. **Enable Last.fm scrobbling in Roon**
   - Settings → Services → Last.fm
   - Connect your Last.fm account
   - Roon will scrobble all plays (including Arc) to Last.fm

2. **Create Last.fm Poller**
   - Use Last.fm API `user.getRecentTracks`
   - Poll every 60 seconds
   - Import plays that aren't already in database
   - Last.fm has accurate timestamps and durations
   - Last.fm captures Arc plays even when offline

### Option 2: Accept the Limitation

If you only care about Arc plays while at home (on local network), the current zone subscription should work fine.

## Removing Verbose Logging (After Diagnosis)

Once you've diagnosed the issue, remove the verbose logging:

```javascript
// Remove this line:
console.log("[Roon] RAW EVENT DATA:", JSON.stringify(data, null, 2));
```

Keep the other logs:
```javascript
console.log("[Roon] Initial zones: " + ...);
console.log("[Roon] zones_changed: " + ...);
console.log("[Roon] zones_added: " + ...);
```

## Files Modified

### `server/roon.js`
- ✅ Added verbose RAW EVENT DATA logging
- ✅ Removed history poller initialization
- ✅ Removed history poller cleanup
- ✅ Enhanced zone logging to show zone IDs

### `server/tracker.js`
- ✅ Already has verbose logging (from previous fix)
- ✅ Logs every zone change with full details

### `server/history-poller.js`
- ⚠️ No longer used (but still exists on disk)
- Can be deleted if desired

## Deployment Status

✅ **Deployed** to server  
✅ **Service restarted** with verbose logging  
✅ **History poller removed**  
✅ **Ready for diagnosis**  

## Next Steps

1. **Play something on Arc** for 30+ seconds
2. **Watch the logs** in real-time:
   ```bash
   ssh set@192.168.0.25 'journalctl -u roon-dashboard -f'
   ```
3. **Look for RAW EVENT DATA** containing Arc zone info
4. **Check if tracker processes it** (look for "Now tracking: ... in Arc")
5. **Verify in database** if plays are logged
6. **Report findings** - what do the logs show?

## Expected Log Output

### When Arc Starts Playing

```
[Roon] Zone subscription event: cmd=Changed
[Roon] RAW EVENT DATA: {
  "zones_changed": [
    {
      "zone_id": "1234567890abcdef",
      "display_name": "Arc",
      "state": "playing",
      "now_playing": {
        "three_line": {
          "line1": "Song Title",
          "line2": "Artist Name",
          "line3": "Album Name"
        },
        "image_key": "...",
        "length": 245,
        "seek_position": 0
      }
    }
  ]
}
[Roon] zones_changed: Arc (ID: 1234567890abcdef)
[Tracker] ===== Processing 1 zone(s) =====
[Tracker] Zone: Arc (ID: 1234567890abcdef)
  - State: playing
  - Has now_playing: YES
  - Track: Song Title
  - Artist: Artist Name
[Tracker] ✓ Now tracking: Song Title by Artist Name in Arc
```

### When Track Finishes

```
[Tracker] Attempting to commit play: Song Title - played 45s (min: 30s)
[Tracker] ✓ Logged: Song Title by Artist Name (45s)
```

## Files to Keep vs Delete

### Keep
- `server/roon.js` - Updated with verbose logging
- `server/tracker.js` - Working correctly
- All other server files

### Can Delete (Optional)
- `server/history-poller.js` - No longer used
- `ARC-FIX-HISTORY-POLLER.md` - Outdated approach
- `ARC-FIX-DEPLOYED-FINAL.md` - Outdated approach

### Documentation
- `ARC-PROPER-DIAGNOSIS.md` - This file (current)
- `ARC-LOGGING-FIX.md` - Still relevant for tracker logging
- `RECAP-FULLSCREEN.md` - Unrelated, keep
- `RECAP-CIRCULAR-NAV.md` - Unrelated, keep

---

**The service is now ready to properly diagnose Arc zone behavior. Play something on Arc and check the logs!**

