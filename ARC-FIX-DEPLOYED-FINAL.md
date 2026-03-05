# Arc Plays Fix - DEPLOYED ✅

## Status: Successfully Deployed
**Solution**: History Poller  
**Date**: March 5, 2026

## What Was Done

### The Problem
- Arc plays appear in Roon's official History
- Arc plays do NOT appear in your dashboard
- Arc doesn't trigger zone subscription events reliably

### The Solution
Created a **History Poller** that polls Roon's playback history every 30 seconds to capture Arc plays.

### How It Works
```
Roon Core
    ├─→ Zone Events → tracker.js → Database (local zones, real-time)
    └─→ History API → history-poller.js → Database (Arc + all plays, every 30s)
```

## Files Deployed

✅ `package.json` - Added node-roon-api-browse  
✅ `server/roon.js` - Integrated history poller  
✅ `server/history-poller.js` - NEW: Polls history every 30s  
✅ Dependencies installed on server  
✅ Service restarted  
✅ Backups created

## Test It Now!

### 1. Play a Track on Arc
Play any track on your Roon Arc device for **30+ seconds**

### 2. Wait 30 Seconds
The history poller runs every 30 seconds

### 3. Check the Logs
```bash
ssh set@192.168.0.25 'journalctl -u roon-dashboard -f | grep HistoryPoller'
```

### 4. Look For Success Messages
```
[HistoryPoller] Initialized with Browse API
[HistoryPoller] Polling Roon history...
[HistoryPoller] Found 10 history items
[HistoryPoller] ✓ Logged from history: Your Song by Artist (30s) in Arc
[HistoryPoller] Logged 1 new plays from history
```

### 5. Check Your Dashboard
- Go to **History** tab
- Look for Arc plays
- Check **Top Zones** - Arc should appear

## Quick Commands

### Monitor History Poller
```bash
ssh set@192.168.0.25 'journalctl -u roon-dashboard -f | grep HistoryPoller'
```

### Check for Arc Plays
```bash
ssh set@192.168.0.25 "sqlite3 /opt/roonDashboard/roon-dashboard.sqlite \"SELECT zone_name, track_title, artist, played_secs FROM plays WHERE zone_name LIKE '%Arc%' ORDER BY started_at DESC LIMIT 5;\""
```

### Restart Service (triggers immediate poll)
```bash
ssh set@192.168.0.25 'sudo systemctl restart roon-dashboard'
```

### View Full Logs
```bash
ssh set@192.168.0.25 'journalctl -u roon-dashboard --no-pager -n 100'
```

## What to Expect

### Good Signs ✅
- `[HistoryPoller] Initialized with Browse API`
- `[HistoryPoller] Polling Roon history...` (every 30 seconds)
- `[HistoryPoller] Found X history items`
- `[HistoryPoller] ✓ Logged from history: ... in Arc`
- Arc plays appear in dashboard History

### Warning Signs ⚠️
- `[HistoryPoller] Browse API not available` → Missing dependency
- `[HistoryPoller] No history items found` → Empty history or API issue
- `[HistoryPoller] History item not found in browse` → API structure changed

## Troubleshooting

### If History Poller Doesn't Start
```bash
# Check service status
ssh set@192.168.0.25 'sudo systemctl status roon-dashboard'

# Restart service
ssh set@192.168.0.25 'sudo systemctl restart roon-dashboard'

# Check logs for errors
ssh set@192.168.0.25 'journalctl -u roon-dashboard --no-pager -n 50 | grep -E "(ERROR|HistoryPoller)"'
```

### If Arc Plays Still Don't Appear
1. **Check play duration**: Must be 30+ seconds
2. **Wait for poll**: Up to 30 seconds after track finishes
3. **Check logs**: Look for "Logged from history" messages
4. **Check zone name**: Might be logged with different name

## Configuration

### Change Poll Interval
Edit `/opt/roonDashboard/server/history-poller.js`:
```javascript
const POLL_INTERVAL_MS = 30000; // 30 seconds (change as needed)
```

### Change Minimum Play Time
Edit `/opt/roonDashboard/server/history-poller.js`:
```javascript
const MIN_PLAY_SECS = 30; // 30 seconds (change as needed)
```

## Revert if Needed

```bash
ssh set@192.168.0.25
sudo cp /opt/roonDashboard/package.json.bak /opt/roonDashboard/package.json
sudo cp /opt/roonDashboard/server/roon.js.bak /opt/roonDashboard/server/roon.js
sudo rm /opt/roonDashboard/server/history-poller.js
cd /opt/roonDashboard
sudo npm install
sudo systemctl restart roon-dashboard
```

## Documentation

- `ARC-FIX-HISTORY-POLLER.md` - Complete technical documentation
- `deploy-arc-fix.ps1` - Deployment script
- `ARC-FIX-DEPLOYED-FINAL.md` - This file

---

## Next Steps

1. **Play music on Arc** for 30+ seconds
2. **Wait 30 seconds** for the poll
3. **Check logs** for success messages
4. **View dashboard** to see Arc plays
5. **Report back** what you see!

The fix is deployed and ready to capture your Arc plays! 🎵

