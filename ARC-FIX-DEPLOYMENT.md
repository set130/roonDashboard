# ARC Zone Tracking Fix - Deployment Guide

## What Was Fixed

### Critical Bug
- **Null pointer exception** when updating `seek_position` for zones that don't have `now_playing` data
- This was causing the tracker to crash when processing ARC zones, preventing them from being logged

### Enhanced Logging
- Added comprehensive logging to see exactly what's happening with each zone
- Track processing steps are now visible in logs
- Easy to diagnose if ARC zones are being received but not tracked

## Deploy to Server

### Step 1: Pull Latest Changes
```bash
cd /opt/roonDashboard
sudo git pull origin master
```

### Step 2: Restart the Service
```bash
sudo systemctl restart roon-dashboard
```

### Step 3: Watch the Logs
```bash
sudo journalctl -u roon-dashboard -f
```

## What to Look For in Logs

When you play a track on ARC, you should see:

```
[Tracker] ===== Processing 1 zone(s) =====
[Tracker] Zone: Arc (ID: 1234567890abcdef)
  - State: playing
  - Has now_playing: YES
  - Track: Your Track Name
  - Artist: Artist Name
  - Seek position: 0
[Tracker] Processing zone: Arc | State: playing | Has prev state: NO
[Tracker] Track changed in zone: Arc
[Tracker] Extracted track info: Your Track Name
[Tracker] ✓ Now tracking: Your Track Name by Artist Name in Arc
[Tracker] ===== Zone processing complete =====
```

When the track finishes or you skip it:

```
[Tracker] Attempting to commit play: Your Track Name - played 45s (min: 30s)
[Tracker] ✓ Logged: Your Track Name by Artist Name (45s) in zone Arc
```

## Testing

1. **Start playing a track on ARC** (play for at least 30 seconds)
2. **Check the logs** - you should see the track being tracked
3. **Skip or finish the track** - you should see it being committed
4. **Check the dashboard** - the track should appear in History

## Troubleshooting

### If ARC zone isn't showing up in logs at all:
- Make sure Roon Core can see the ARC connection
- Check that the dashboard is connected to Roon Core: `curl http://localhost:3001/api/status`
- Restart Roon Core if needed

### If zone shows up but track info is NULL:
- This is a Roon API issue - the zone exists but doesn't have track metadata
- Usually resolves itself after a few seconds
- Try skipping to the next track

### If plays are still not being logged:
- Check the full logs for error messages
- Verify database permissions: `ls -la /opt/roonDashboard/roon-dashboard.sqlite*`
- Check disk space: `df -h`

## What Changed in the Code

### tracker.js
```javascript
// BEFORE (would crash on ARC zones without now_playing)
prevState.seek_position = zone.now_playing.seek_position;

// AFTER (defensive null checking)
prevState.seek_position = zone.now_playing ? zone.now_playing.seek_position : 0;
```

### Added comprehensive logging throughout:
- Zone details (name, ID, state, has_now_playing)
- Track extraction results
- Processing steps (new track, same track, stopped)
- Success/failure indicators

## Expected Behavior After Fix

✅ ARC plays should appear in "Now Playing" tab
✅ ARC plays should be logged to History after 30+ seconds
✅ Detailed logs show exactly what's happening with each zone
✅ No more silent failures or crashes when processing zones

