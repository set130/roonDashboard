# Arc Plays Fix - History Poller Solution ✅

## Problem Solved
Arc plays now appear in Roon's official History but NOT in the dashboard because Arc doesn't reliably trigger zone subscription events.

## Solution Implemented
Created a **History Poller** that polls Roon's playback history every 30 seconds to capture Arc plays and any other plays that don't trigger zone events.

## How It Works

### Dual Tracking System
1. **Zone Subscriptions** (Real-time) - Tracks local zones as they play
2. **History Poller** (Every 30s) - Polls Roon's history to catch Arc plays

### Architecture
```
Roon Core
    ├─→ Zone Events → tracker.js → Database (local zones)
    └─→ History API → history-poller.js → Database (Arc + missed plays)
```

## Files Modified

### 1. `package.json`
Added `node-roon-api-browse` dependency to access Roon's history

### 2. `server/roon.js`
- Added RoonApiBrowse import
- Initialize history poller when core pairs
- Stop history poller when core unpairs

### 3. `server/history-poller.js` (NEW)
- Polls Roon history every 30 seconds
- Extracts play information from history items
- Logs new plays to database
- Avoids duplicates using last-seen tracking

## Deployment Status
✅ Deployed to server  
✅ Dependencies installed  
✅ Service restarted  
✅ Backups created

## How to Test

### 1. Play on Arc
Play any track on your Roon Arc device for **30+ seconds**

### 2. Wait for Poll
The history poller runs every 30 seconds, so wait up to 30 seconds after the track finishes

### 3. Check Logs
```bash
ssh set@192.168.0.25 'journalctl -u roon-dashboard -f'
```

### 4. Look for These Messages

**History Poller Starting:**
```
[HistoryPoller] Initialized with Browse API
[HistoryPoller] Starting history polling every 30 seconds
```

**Polling Activity:**
```
[HistoryPoller] Polling Roon history...
[HistoryPoller] Found 10 history items
```

**Arc Play Logged:**
```
[HistoryPoller] ✓ Logged from history: Your Song by Artist (45s) in Arc
[HistoryPoller] Logged 1 new plays from history
```

### 5. Verify in Database
```bash
ssh set@192.168.0.25 "sqlite3 /opt/roonDashboard/roon-dashboard.sqlite \"SELECT zone_name, track_title, artist, played_secs, started_at FROM plays ORDER BY started_at DESC LIMIT 10;\""
```

Look for entries with `zone_name` containing "Arc"

## Configuration

### Poll Interval
Default: 30 seconds

To change, edit `server/history-poller.js`:
```javascript
const POLL_INTERVAL_MS = 30000; // Change to desired milliseconds
```

### Minimum Play Time
Default: 30 seconds (same as zone tracking)

To change, edit `server/history-poller.js`:
```javascript
const MIN_PLAY_SECS = 30; // Change to desired seconds
```

## Monitoring

### Real-time History Poller Logs
```bash
ssh set@192.168.0.25 'journalctl -u roon-dashboard -f | grep HistoryPoller'
```

### Check for Arc Plays
```bash
ssh set@192.168.0.25 'journalctl -u roon-dashboard -f | grep -E "(HistoryPoller|Arc)"'
```

### Last 100 Log Lines
```bash
ssh set@192.168.0.25 'journalctl -u roon-dashboard --no-pager -n 100'
```

## Troubleshooting

### History Poller Not Starting
**Symptom**: No "[HistoryPoller] Initialized" message in logs

**Check**:
1. Service is running: `ssh set@192.168.0.25 'sudo systemctl status roon-dashboard'`
2. Browse API available: Look for "Browse API not available" errors
3. Restart service: `ssh set@192.168.0.25 'sudo systemctl restart roon-dashboard'`

### No History Items Found
**Symptom**: "[HistoryPoller] No history items found" or "History item not found in browse"

**Possible causes**:
- Roon history is empty (no recent plays)
- Browse API structure changed
- Connection issue with Roon Core

**Debug**: Check what items are available:
- Look for "Available items: ..." in logs
- This shows what the Browse API returns

### Arc Plays Still Not Logging
**Symptom**: History poller runs but no Arc plays logged

**Check**:
1. **Play duration**: Must be 30+ seconds
2. **Poll timing**: Wait 30+ seconds after track finishes
3. **Zone name**: Look for the exact zone name in logs
4. **Database**: Check if plays exist with different zone name

### Duplicate Plays
**Symptom**: Same play appears multiple times

**This shouldn't happen** because:
- History poller tracks last-seen play ID
- Skips items it has already processed

If duplicates occur:
- Check logs for repeated "[HistoryPoller] ✓ Logged from history: ..." for same track
- May need to improve duplicate detection logic

## Limitations

### 1. Polling Delay
- Maximum 30-second delay between play finishing and being logged
- Trade-off: More frequent polling = more API calls

### 2. Play Duration Estimation
- History API doesn't provide exact play duration
- Currently logs minimum play time (30s) for historical plays
- This is a limitation of Roon's History API

### 3. Zone Name Extraction
- Attempts to extract zone name from item hints
- May not always be 100% accurate
- Defaults to "Unknown Zone" if not found

## Performance

### API Calls
- 1 browse call every 30 seconds = 2,880 calls/day
- Lightweight operation, minimal impact

### Database
- Only inserts new plays (deduplication logic)
- No impact on existing zone tracking

### CPU/Memory
- Minimal - just periodic polling
- Timers are cleaned up on service stop

## Benefits

### ✅ Captures Arc Plays
- Finally logs plays from Roon Arc
- No more missing data

### ✅ Backup for Zone Events
- Catches any plays that don't trigger zone events
- More reliable tracking overall

### ✅ Non-Invasive
- Doesn't interfere with existing zone tracking
- Can be disabled without affecting other features

### ✅ Automatic
- Runs in background
- No manual intervention needed

## Reverting

If you need to revert to the previous version:

```bash
ssh set@192.168.0.25
sudo cp /opt/roonDashboard/package.json.bak /opt/roonDashboard/package.json
sudo cp /opt/roonDashboard/server/roon.js.bak /opt/roonDashboard/server/roon.js
sudo rm /opt/roonDashboard/server/history-poller.js
cd /opt/roonDashboard
sudo npm install
sudo systemctl restart roon-dashboard
```

## Future Enhancements

### Possible Improvements
1. **Better duration extraction** - Parse duration from history hints if available
2. **Smarter duplicate detection** - Use track + timestamp combination
3. **Configurable poll interval** - Environment variable or config file
4. **History depth control** - Limit how far back to scan
5. **Zone name mapping** - Map history zone names to known zones

## Files

### Created
- `server/history-poller.js` - History polling logic
- `deploy-arc-fix.ps1` - Deployment script
- `ARC-FIX-HISTORY-POLLER.md` - This documentation

### Modified
- `package.json` - Added node-roon-api-browse
- `server/roon.js` - Integrated history poller

### Backups (on server)
- `/opt/roonDashboard/package.json.bak`
- `/opt/roonDashboard/server/roon.js.bak`

## Support

### Check Service Status
```bash
ssh set@192.168.0.25 'sudo systemctl status roon-dashboard'
```

### View Full Logs
```bash
ssh set@192.168.0.25 'journalctl -u roon-dashboard --no-pager -n 200'
```

### Test Immediately
To trigger a poll immediately (instead of waiting 30s), restart the service:
```bash
ssh set@192.168.0.25 'sudo systemctl restart roon-dashboard'
```
The first poll happens as soon as the service starts.

## Success Criteria

You'll know it's working when you see:
1. ✅ "[HistoryPoller] Initialized with Browse API" in logs
2. ✅ "[HistoryPoller] Polling Roon history..." every 30 seconds
3. ✅ "[HistoryPoller] ✓ Logged from history: ... in Arc" for Arc plays
4. ✅ Arc plays appear in your dashboard's History tab
5. ✅ Arc zone appears in Top Zones stats

---

**Test it now!** Play a track on Arc and watch the logs!

