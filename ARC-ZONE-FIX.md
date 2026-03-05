# Arc Zone Logging Issue - Root Cause & Fix

## Problem
Arc zone plays were not being logged, while the premium zone plays were being logged successfully. The service status showed the last Arc activity was from yesterday, with no "Now playing" events being recorded for Arc today.

## Root Cause Analysis

### Issue 1: Null Pointer Exception (CRITICAL)
**Location:** `server/tracker.js`, lines 133-144

When processing zone changes, the code attempted to access `zone.now_playing.seek_position` **after** checking if the zone had no content:

```javascript
// BUGGY CODE
var trackInfo = extractTrackInfo(zone);  // Returns null if now_playing is null
zoneStates[zone.zone_id] = {
  // ...
  seek_position: zone.now_playing.seek_position,  // ❌ CRASH! now_playing is null
  // ...
};
```

**Impact:** If a zone (like Arc) has `now_playing === null`, this would cause:
1. JavaScript exception
2. Silent failure in the zone subscription handler
3. Zone is never tracked
4. No plays are ever logged for that zone

### Issue 2: Silent Logging Errors
**Location:** `server/tracker.js`, lines 53-56

Database insertion errors were logged minimally, making it hard to diagnose why plays weren't being saved:

```javascript
// Limited error info
catch (err) {
  console.error("[Tracker] Failed to insert play:", err);
}
```

This made it unclear WHY a specific play failed (database locked, disk full, permission issue, etc.).

### Issue 3: Insufficient Zone Subscription Logging
**Location:** `server/roon.js`, lines 35-43

The zone subscription handler didn't log details about which zones were received or when events occurred, making it impossible to see if Arc was being reported at all.

## Solutions Implemented

### Fix 1: Defensive null checking
```javascript
var trackInfo = extractTrackInfo(zone);
if (trackInfo) {
  zoneStates[zone.zone_id] = {
    zone_id: zone.zone_id,
    zone_name: zone.display_name,
    track: trackInfo,
    startedAt: new Date(),
    state: zone.state,
    seek_position: zone.now_playing ? zone.now_playing.seek_position : 0,  // ✓ Safe
    pausedAt: null,
    pauseTimeout: null,
  };
  console.log("[Tracker] Now playing: " + trackInfo.track_title + " by " + trackInfo.artist + " in " + zone.display_name);
} else {
  console.log("[Tracker] Warning: No track info available for zone " + zone.display_name);
}
```

### Fix 2: Enhanced error logging
```javascript
catch (err) {
  console.error("[Tracker] ✗ Failed to insert play for '" + play.track_title + "' in zone " + play.zone_name + ": " + err.message);
}
```

### Fix 3: Enhanced zone event logging
```javascript
_transport.subscribe_zones(function (cmd, data) {
  console.log("[Roon] Zone subscription event: cmd=" + cmd);
  if (cmd === "Subscribed" && data.zones) {
    console.log("[Roon] Initial zones: " + data.zones.map(z => z.display_name).join(", "));
    handleZonesChanged(data.zones);
  } else if (cmd === "Changed") {
    if (data.zones_changed) {
      console.log("[Roon] zones_changed: " + data.zones_changed.map(z => z.display_name).join(", "));
      handleZonesChanged(data.zones_changed);
    }
    // ... etc
  }
});
```

### Fix 4: Zone processing logging
```javascript
console.log("[Tracker] Zones received: " + zones.map(z => z.display_name + " (" + z.zone_id + ") [" + z.state + "]").join(", "));
```

## Modified Files
- `server/tracker.js` - Defensive null checking, enhanced error logging
- `server/roon.js` - Enhanced zone subscription event logging

## Verification Steps
After deployment, monitor the logs to confirm:

1. **Arc zone is being detected:**
   ```
   [Roon] Initial zones: premium, Arc
   [Tracker] Zones received: premium (zone-1) [playing], Arc (zone-2) [stopped]
   ```

2. **Plays are being logged for Arc:**
   ```
   [Tracker] Now playing: Song Title by Artist in Arc
   [Tracker] ✓ Logged: Song Title by Artist (120s) in zone Arc
   ```

3. **No null pointer errors:**
   - Look for any exceptions in the logs
   - No silent failures when Arc zone has no content

## Testing
To manually test Arc zone detection:

```bash
node /home/set/IdeaProjects/roonDashboard/debug-zones.js
```

This will connect directly to the Roon Core and display all zones with their current states.

## Expected Behavior After Fix
1. All zones (premium, Arc, etc.) will be logged when discovered
2. Plays will be recorded for any zone that has track playback ≥ 30 seconds
3. Database insertion errors will be clearly visible in logs
4. Zone subscription events will be fully transparent

