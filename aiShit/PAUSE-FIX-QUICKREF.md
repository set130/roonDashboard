# Quick Reference: Pause/Resume Fix

## What Changed
Fixed the double-play logging bug that occurred when pausing and resuming tracks.

## How It Works Now

### Pause Behavior
- When you pause: Track stays in memory, 60-second timer starts
- If you resume within 60 seconds: Continues as same play
- If paused for 60+ seconds: Play is logged, next resume starts new play

### Play Time Calculation
- Pause time is EXCLUDED from play duration
- Only actual listening time is counted
- Example: Play 30s → Pause 10s → Resume → Play 20s = 50s total

## Configuration
Located in `server/tracker.js`:
```javascript
const PAUSE_TIMEOUT_SECS = 60; // Change this to adjust timeout
```

## What You'll See in Logs

### Normal Pause/Resume (< 60s):
```
[Tracker] Track paused: Song Name - will commit if paused for 60s
[Tracker] Track resumed after 5s pause: Song Name
[Tracker] ✓ Logged: Song Name by Artist (120s)
```

### Long Pause (> 60s):
```
[Tracker] Track paused: Song Name - will commit if paused for 60s
[Tracker] Pause timeout reached for: Song Name
[Tracker] ✓ Logged: Song Name by Artist (45s)
```

## Testing Your Changes

1. **Deploy to server** (if needed):
   ```bash
   # Copy the updated tracker.js to server
   # Restart the service
   ```

2. **Test short pause**:
   - Play a track
   - Pause after 30 seconds
   - Resume after 5 seconds  
   - Stop the track
   - Check database → Should see 1 play

3. **Test long pause** (optional):
   - Play a track
   - Pause it
   - Wait 65+ seconds
   - Check logs → Should see play logged at 60s mark

## Reverting (if needed)
If you need to revert to old behavior, change line 77 in tracker.js:
```javascript
// Old behavior (immediate commit):
if (zone.state === "paused") {
  if (prevState && prevState.track) {
    commitPlay(prevState);
    delete zoneStates[zone.zone_id];
  }
  continue;
}
```

