# Arc Issue Fix - DEPLOYED ✅

## Status: Verbose Logging Enabled

Following Claude's advice, I've:
1. ✅ **Removed the broken history poller** (it was using the wrong API)
2. ✅ **Added verbose zone logging** to see raw Arc zone events
3. ✅ **Deployed to server** and restarted service

## What Was Wrong

The history poller was fundamentally broken:
- ❌ Used RoonApiBrowse API (for browsing music library, not history)
- ❌ No playback history exists in Browse API
- ❌ Broken deduplication logic
- ❌ Hardcoded all plays to 30 seconds
- ❌ Never actually worked

## The Real Solution

Arc plays **should** appear through the zone subscription we already have. The verbose logging will show us:
- Whether Arc zone events are firing
- What the Arc zone data looks like
- If tracker is processing it correctly

## Test It Now

**1. Play something on Arc** for 30+ seconds

**2. Watch the logs:**
```bash
ssh set@192.168.0.25 'journalctl -u roon-dashboard -f'
```

**3. Look for:**
```
[Roon] RAW EVENT DATA: {
  "zones_changed": [
    {
      "zone_id": "...",
      "display_name": "Arc",
      "state": "playing",
      ...
    }
  ]
}
```

**4. Then look for tracker logs:**
```
[Tracker] Zone: Arc (ID: ...)
[Tracker] ✓ Now tracking: Song by Artist in Arc
[Tracker] ✓ Logged: Song by Artist (45s)
```

## Possible Outcomes

### ✅ If Arc appears in logs and plays are logged
**Arc is working!** Remove verbose logging to reduce noise.

### ⚠️ If Arc appears but plays aren't logged
**Check tracker logs** for why it's being skipped (duration < 30s, paused, etc.)

### ❌ If Arc doesn't appear in logs at all
**Arc plays while offline/cellular** don't fire zone events. Solution: Enable Last.fm scrobbling in Roon and create a Last.fm poller.

## What to Report

After testing, please share:
1. Does Arc appear in the RAW EVENT DATA?
2. What does the Arc zone object look like?
3. Do you see tracker logs for Arc?
4. Are plays being logged to database?

This will tell us exactly what's happening with Arc zones.

## Files Modified

- `server/roon.js` - Added verbose logging, removed history poller
- Backup: `/opt/roonDashboard/server/roon.js.bak`

## Documentation

- **ARC-PROPER-DIAGNOSIS.md** - Complete diagnostic guide
- **ARC-LOGGING-FIX.md** - Tracker verbose logging (still relevant)

---

**Play something on Arc and check the logs to see what's happening!** 🎵

