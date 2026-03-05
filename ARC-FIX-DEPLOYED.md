# Arc Plays Logging Fix - DEPLOYED ✅

## Deployment Complete
**Date**: March 5, 2026
**Status**: ✅ Successfully deployed

## What Was Deployed
- Enhanced `server/tracker.js` with comprehensive logging
- Backup created at `/opt/roonDashboard/server/tracker.js.bak`
- Service restarted successfully

## What This Fix Does

### Enhanced Logging
The tracker now logs detailed information about every zone change:
- Zone name and ID
- Current state (playing, paused, stopped, loading)
- Track and artist information
- State transitions
- Success/failure of play logging

### Safety Improvements
- Added null checks for `zone.now_playing` to prevent crashes
- Better error handling and reporting
- Warns about unexpected zone states

## How to Test

### 1. Play a Track on Arc
Play any track on your Roon Arc device for **30+ seconds** (minimum play time required)

### 2. Monitor the Logs
Watch what's happening in real-time:
```bash
ssh set@192.168.0.25 'journalctl -u roon-dashboard -f'
```

### 3. What to Look For

**When Arc starts playing:**
```
[Tracker] ===== Processing 1 zone(s) =====
[Tracker] Zone: Arc (ID: ...)
  - State: playing
  - Has now_playing: YES
  - Track: Your Song Name
  - Artist: Artist Name
[Tracker] ✓ Now tracking: Your Song Name by Artist Name in Arc
```

**When the track ends or changes:**
```
[Tracker] Attempting to commit play: Your Song Name - played 45s (min: 30s)
[Tracker] ✓ Logged: Your Song Name by Artist Name (45s)
```

### 4. Verify in Database
Check if Arc plays are being saved:
```bash
ssh set@192.168.0.25 "sqlite3 /opt/roonDashboard/roon-dashboard.sqlite \"SELECT zone_name, track_title, artist, played_secs FROM plays WHERE zone_name LIKE '%Arc%' ORDER BY ended_at DESC LIMIT 10;\""
```

## Troubleshooting

### If Arc Plays Still Don't Log

1. **Check logs for Arc zone detection**:
   - Look for "Zone: Arc" messages
   - If not present → Arc not connected to Roon Core

2. **Check the state value**:
   - Look for "State: ..." in Arc zone logs
   - Should be "playing", "paused", "stopped", or "loading"
   - Look for "⚠ Unexpected state" warnings

3. **Check play duration**:
   - Plays must be 30+ seconds
   - Look for "Skipping - too short" messages

4. **Check track extraction**:
   - Look for "✓ Now tracking: ..." messages
   - If you see "✗ Failed to extract track info" → Issue with Roon's data structure

## What to Report Back

Please share:
1. **Does Arc zone appear in logs?** (search for "Zone: Arc")
2. **What state does Arc show?** (playing, paused, stopped, etc.)
3. **Do you see "✓ Now tracking: ... in Arc"?**
4. **Do you see "✓ Logged: ..." when tracks end?**
5. **Any error messages or warnings?**

This information will help us identify the exact issue if Arc plays still don't log.

## Next Steps

Based on what the logs show:
- **If Arc plays are now logging**: Success! We can reduce the logging verbosity
- **If Arc zone doesn't appear**: Arc connection issue with Roon Core
- **If Arc appears but doesn't log**: We'll analyze the specific state/data issues from the logs
- **If unexpected state warnings**: We need to handle Arc-specific states

## Reverting (if needed)

If something goes wrong:
```bash
ssh set@192.168.0.25 "sudo cp /opt/roonDashboard/server/tracker.js.bak /opt/roonDashboard/server/tracker.js; sudo systemctl restart roon-dashboard"
```

## Files Modified
- `server/tracker.js` - Enhanced logging and safety checks
- Backup: `/opt/roonDashboard/server/tracker.js.bak`

## Documentation
- `ARC-LOGGING-FIX.md` - Detailed technical documentation
- `deploy-tracker-fix.ps1` - Deployment script for future use

