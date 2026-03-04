# Pause/Resume Fix - Implementation Summary

## Problem
When pausing and resuming a track (even for 1 second), the system was logging 2 separate plays:
1. One play when the track was paused
2. Another play when the track actually ended

This happened because the old logic immediately committed a play whenever a track entered the "paused" state.

## Solution
Implemented a smart pause/resume handler with a 60-second timeout:

### Key Changes to `server/tracker.js`:

1. **Added Pause Timeout Constant**
   - `PAUSE_TIMEOUT_SECS = 60` - Only commit a play if paused for more than 60 seconds

2. **Enhanced Zone State Tracking**
   - Added `pausedAt` field to track when a track was paused
   - Added `pauseTimeout` field to store the timeout handle

3. **Modified Pause Handling**
   - When a track is paused, we now:
     - Record the pause timestamp
     - Set a 60-second timeout to commit the play
     - Keep the zone state alive (don't delete it)

4. **Added Resume Detection**
   - When a track resumes (same track, was paused, now playing):
     - Clear the pause timeout (prevent the commit)
     - Adjust the start time by adding the pause duration
     - This ensures accurate play time tracking (excludes pause time)
     - Continue as a single play session

5. **Timeout Cleanup**
   - Clear timeouts when zones are stopped, removed, or flushed
   - Prevents memory leaks and orphaned timers

## Behavior

### Short Pause (< 60 seconds)
```
1. Track starts playing
2. User pauses after 30s
3. User resumes after 5s pause
4. Track continues until end
Result: 1 play logged with ~duration minus pause time
```

### Long Pause (> 60 seconds)
```
1. Track starts playing
2. User pauses after 30s
3. Timeout triggers after 60s of pause
Result: 1 play logged with 30s duration
4. If user resumes later, it starts as a NEW play
```

### Stop While Paused
```
1. Track starts playing
2. User pauses
3. User stops (or switches track) before 60s timeout
Result: 1 play logged with time up to pause
```

## Testing

### Quick Test (Automated)
Run: `node test-pause-resume.js`
This simulates a quick pause/resume scenario.

### Manual Testing
1. Start playing a track
2. Pause it after a few seconds
3. Resume within 60 seconds
4. Let it finish or stop it
5. Check the database - should see only 1 play entry

### Long Pause Test
1. Start playing a track
2. Pause it
3. Wait over 60 seconds (don't resume)
4. Should see a play logged after 60s
5. If you resume after that, it should start a new play

## Database Verification

Check plays:
```sql
SELECT track_title, artist, played_secs, started_at, ended_at 
FROM plays 
ORDER BY started_at DESC 
LIMIT 10;
```

## Notes

- The 60-second timeout can be adjusted by changing `PAUSE_TIMEOUT_SECS` constant
- Play time excludes pause duration (accurate listening time)
- Minimum play duration (30s) still applies
- IDE warnings about "mutable variable accessible from closure" are expected and safe (intentional design)

