# Arc Plays Logging Fix - Enhanced Logging

## Issue
Arc plays were not being logged to the database. The problem was difficult to diagnose because there was insufficient logging to understand what was happening with Arc zones.

## Solution
Added comprehensive logging throughout `tracker.js` to:
1. Track every zone change event
2. Show zone details (name, ID, state, has_now_playing)
3. Show track details when available
4. Log all state transitions (stopped, paused, playing, loading, etc.)
5. Show success/failure for track extraction and logging
6. Warn about unexpected zone states

## Files Modified
- `server/tracker.js` - Enhanced with detailed logging

## What Changed

### 1. Zone Processing Start Logging
```javascript
console.log("[Tracker] ===== Processing " + zones.length + " zone(s) =====");
```

### 2. Per-Zone Details
For each zone, we now log:
- Zone name and ID
- State (playing, paused, stopped, loading, etc.)
- Whether now_playing data exists
- Track and artist information (if available)

### 3. State Transition Logging
- **Stopped/No Content**: Logs when committing on stop
- **Paused**: Logs when pause detected and timeout set
- **Playing/Loading**: Logs track changes and same-track continuation
- **Unexpected States**: Warns if a zone has an unknown state

### 4. Track Change Detection
- Logs when a new track starts
- Logs when the same track continues (resume from pause)
- Logs when track extraction succeeds or fails

### 5. Safety Improvements
Added null checks for `zone.now_playing`:
```javascript
prevState.seek_position = zone.now_playing ? zone.now_playing.seek_position : 0;
```

This prevents crashes when Arc zones transition states without now_playing data.

## Expected Log Output

### When Arc Zone Plays a Track
```
[Tracker] ===== Processing 1 zone(s) =====
[Tracker] Zone: Arc (ID: abc123...)
  - State: playing
  - Has now_playing: YES
  - Track: Your Song Name
  - Artist: Artist Name
[Tracker] Processing zone: Arc | State: playing | Has prev state: NO
[Tracker] Track changed in zone: Arc
[Tracker] Extracted track info: Your Song Name
[Tracker] ✓ Now tracking: Your Song Name by Artist Name in Arc
[Tracker] ===== Zone processing complete =====
```

### When Track Finishes or Changes
```
[Tracker] Track changed in zone: Arc
[Tracker] Attempting to commit play: Your Song Name - played 45s (min: 30s)
[Tracker] ✓ Logged: Your Song Name by Artist Name (45s)
[Tracker] Extracted track info: Next Song Name
[Tracker] ✓ Now tracking: Next Song Name by Next Artist in Arc
```

### When Paused and Resumed (< 60s)
```
[Tracker] Processing paused zone: Arc | Has prev state: YES
[Tracker] Track paused: Your Song Name - will commit if paused for 60s
[Tracker] Track resumed after 5s pause: Your Song Name
```

## Deployment

Run the deployment script:
```powershell
.\deploy-tracker-fix.ps1
```

Or manually:
```bash
# Copy to server
scp server/tracker.js set@192.168.0.25:/tmp/tracker.js

# Deploy on server
ssh set@192.168.0.25
sudo cp /opt/roonDashboard/server/tracker.js /opt/roonDashboard/server/tracker.js.bak
sudo cp /tmp/tracker.js /opt/roonDashboard/server/tracker.js
sudo systemctl restart roon-dashboard
```

## Testing

1. **Deploy the fix** using the script above

2. **Play a track on Arc** for 30+ seconds

3. **Monitor the logs**:
   ```bash
   ssh set@192.168.0.25 'journalctl -u roon-dashboard -f'
   ```

4. **Look for Arc zone detection**:
   - Should see "Zone: Arc (ID: ...)"
   - Should see "Now tracking: ... in Arc"
   - Should see "✓ Logged: ... " when track ends/changes

5. **Check database**:
   ```bash
   ssh set@192.168.0.25
   sqlite3 /opt/roonDashboard/roon-dashboard.sqlite \
     "SELECT zone_name, track_title, artist, played_secs FROM plays WHERE zone_name LIKE '%Arc%' ORDER BY ended_at DESC LIMIT 10;"
   ```

## Debugging

### If Arc plays still don't log:

1. **Check if Arc zone is detected at all**:
   - Look for "Zone: Arc" in logs
   - If not present, Arc might not be connected to Roon Core

2. **Check the state value**:
   - Look for "State: ..." in the Arc zone logs
   - If it's not "playing", "paused", "stopped", or "loading", that's unusual
   - Look for "⚠ Unexpected state" warnings

3. **Check if now_playing data exists**:
   - Look for "Has now_playing: YES/NO"
   - If NO when playing, there's an issue with Roon's data for Arc

4. **Check track extraction**:
   - Look for "Extracted track info: ..."
   - If you see "✗ Failed to extract track info", the now_playing structure is missing data

5. **Check play duration**:
   - Plays must be 30+ seconds (see MIN_PLAY_SECS)
   - Look for "Attempting to commit play: ... - played Xs (min: 30s)"
   - If "Skipping - too short", the play was under 30 seconds

## Common Issues

### Arc zone shows up but tracks don't log
**Symptom**: See "Zone: Arc" but no "Now tracking" or "Logged" messages
**Causes**:
- Play time < 30 seconds
- Track gets paused indefinitely (check for pause timeout messages)
- State is not "playing" (check the "State: ..." logs)

### Arc zone doesn't show up at all
**Symptom**: No "Zone: Arc" in logs
**Causes**:
- Arc not connected to Roon Core
- Arc device is offline
- Service needs restart

### Unexpected state warnings
**Symptom**: See "⚠ Unexpected state 'XXX' for zone with now_playing data"
**Action**: Report this - Arc might use a different state value we need to handle

## Reverting

If you need to revert to the previous version:
```bash
ssh set@192.168.0.25
sudo cp /opt/roonDashboard/server/tracker.js.bak /opt/roonDashboard/server/tracker.js
sudo systemctl restart roon-dashboard
```

## Next Steps

Once you confirm Arc plays are being logged (or identify the specific issue from the logs), we can:
1. Remove excessive logging if desired (keep only errors/warnings)
2. Add specific handling for Arc zone quirks if needed
3. Optimize the logging for production use

