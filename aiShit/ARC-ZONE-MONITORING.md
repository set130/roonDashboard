# Arc Zone Logging - Monitoring & Troubleshooting

## Quick Check: Are Arc plays being logged?

### Option 1: Check the database directly
```bash
sqlite3 /opt/roonDashboard/roon-dashboard.sqlite "SELECT DISTINCT zone_name FROM plays ORDER BY zone_name;"
```

Expected output should include "Arc" zone.

### Option 2: Check current service logs
```bash
sudo journalctl -u roon-dashboard --no-pager | tail -50
```

Look for:
- `[Roon] Initial zones:` - Shows all detected zones
- `[Tracker] Now playing:` - Shows when Arc starts playing
- `✓ Logged:` - Confirms play was recorded
- Any error messages

### Option 3: Stream live logs while playing
```bash
sudo journalctl -u roon-dashboard -f
```

Play something on Arc and watch for:
```
[Tracker] Zones received: premium (zone-xxx) [stopped], Arc (zone-yyy) [playing]
[Tracker] Now playing: Song Title by Artist in Arc
[Tracker] Attempting to commit play: Song Title - played 45s (min: 30s)
[Tracker] ✓ Logged: Song Title by Artist (45s) in zone Arc
```

## Troubleshooting

### Arc zone not detected at all
**Symptom:** No "Arc" in the zones list
**Solution:**
1. Check Roon Core can see Arc zone (in Roon UI)
2. Verify Arc is powered on and connected
3. Restart roon-dashboard service
4. Run debug script: `node debug-zones.js`

### Arc plays are not being logged (but zone is detected)
**Symptom:** Zone appears in logs but no play records
**Possible causes:**
1. **Too short:** Play less than 30 seconds (check MIN_PLAY_SECS in tracker.js)
2. **Database error:** Check error messages in logs like:
   ```
   [Tracker] ✗ Failed to insert play for '...' in zone Arc: ...
   ```
3. **Zone state issue:** Arc might be in "paused" state
   - Service waits 60 seconds before logging paused tracks
   - Check "Pause timeout reached" messages

### See database is being updated
```bash
# Check play count by zone
sqlite3 /opt/roonDashboard/roon-dashboard.sqlite "SELECT zone_name, COUNT(*) as plays FROM plays GROUP BY zone_name;"

# Check recent Arc plays
sqlite3 /opt/roonDashboard/roon-dashboard.sqlite "SELECT started_at, track_title, artist, played_secs FROM plays WHERE zone_name='Arc' ORDER BY started_at DESC LIMIT 10;"
```

## Service Management

### Check service status
```bash
sudo systemctl status roon-dashboard
```

### Restart service
```bash
sudo systemctl restart roon-dashboard
```

### View last 100 lines of logs
```bash
sudo journalctl -u roon-dashboard -n 100 --no-pager
```

### View logs from specific time
```bash
# Last hour
sudo journalctl -u roon-dashboard --since "1 hour ago" --no-pager

# Since specific date
sudo journalctl -u roon-dashboard --since "2026-03-05 10:00:00" --no-pager
```

## Key Log Patterns

### Healthy startup
```
[Roon] Discovery mode - searching for Roon Core on local network...
[Roon] Core paired: setsrv
[Roon] Initial zones: premium (xxx) [stopped], Arc (yyy) [stopped]
```

### Successful play logging
```
[Tracker] Zones received: Arc (xxx) [playing]
[Tracker] Now playing: Track Title by Artist in Arc
[Tracker] Attempting to commit play: Track Title - played 45s (min: 30s)
[Tracker] ✓ Logged: Track Title by Artist (45s) in zone Arc
```

### Pause handling
```
[Tracker] Track paused: Track Title - will commit if paused for 60s
[Tracker] Pause timeout reached for: Track Title
[Tracker] ✓ Logged: Track Title by Artist (61s) in zone Arc
```

### Error cases
```
[Tracker] Warning: No track info available for zone Arc
[Tracker] ✗ Failed to insert play for 'Track Title' in zone Arc: database disk image is malformed
```

## Files involved in Arc logging
- `/opt/roonDashboard/server/tracker.js` - Handles zone events and play logging
- `/opt/roonDashboard/server/roon.js` - Connects to Roon Core and subscribes to zones
- `/opt/roonDashboard/roon-dashboard.sqlite` - Database where plays are stored

