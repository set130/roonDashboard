# Arc Tracking - The Real Issue and Solution

## The Core Problem

**Arc plays DON'T appear in zone events when playing remotely (cellular/away from home) because Arc doesn't connect directly to your Roon Core in that scenario.**

### How Arc Works

1. **At Home (Same Network as Core)**
   - Arc → Roon Core → Zone Events → Dashboard ✅
   - Should be tracked normally

2. **Away from Home (Cellular/Remote)**
   - Arc → Roon Cloud → (Your Core might not know) → No Zone Events ❌
   - Dashboard cannot track these plays

## Why Your iPhone Works But Arc Doesn't

- **iPhone with Regular Roon App**: Connects directly to Core on local network → Zone events fire → Tracked ✅
- **Arc Remote Play**: Streams through Roon's cloud service → No direct Core connection → No zone events → Not tracked ❌

## The Hard Truth

There is **NO WAY** to get precise Arc remote play data (with accurate durations) through the Roon API when Arc is playing remotely. This is a fundamental limitation of how Arc works.

### Why Last.fm Doesn't Work for You

You're correct - Last.fm only scrobbles that a track was played, not how long it was played. Last.fm scrobbles when you've listened to >50% of a track or 4+ minutes, whichever comes first. It doesn't track exact play durations.

## What We CAN Do

### Solution 1: Track Arc When At Home

Arc **should** appear in zone events when your iPhone is on the same network as your Roon Core.

**Test this:**
1. Connect your iPhone to your home WiFi (same network as Roon Core)
2. Open Arc and play a song for 30+ seconds
3. Check the logs:
   ```bash
   ssh set@192.168.0.25 'journalctl -u roon-dashboard -f'
   ```
4. Look for Arc in the zone list

**I've deployed enhanced logging that will show:**
- All zones at startup with their outputs
- Complete zone structure
- Whether Arc appears and how

### Solution 2: Accept the Limitation

If you primarily use Arc while away from home, there's no way to get precise tracking. You have two choices:

**Option A: Track Arc plays without duration**
- Use Last.fm scrobbling
- Log plays as "played" but with estimated/minimum duration
- Better than nothing

**Option B: Only track local plays**
- Accept that remote Arc plays won't be tracked
- Dashboard shows accurate data for home listening only

## Testing Arc On Home Network

### Step 1: Restart the Dashboard Service (Already Done)

The service has been restarted with ultra-verbose logging.

### Step 2: Connect iPhone to Home WiFi

Make sure your iPhone is on the **same network** as your Roon Core.

### Step 3: Play on Arc

Open Arc on your iPhone and play a song for 30+ seconds.

### Step 4: Check Logs

```bash
ssh set@192.168.0.25 'journalctl -u roon-dashboard -f'
```

### What to Look For

**At Service Start:**
```
[Roon] INITIAL SUBSCRIPTION - ALL ZONES:
[Roon] Total zones found: 2
[Roon] Zone #1:
  - Name: Premium
  - ID: abc123
  - State: stopped
  - Outputs: 1
    Output #1: Living Room (ID: xyz789)
[Roon] Zone #2:
  - Name: iPhone
  - ID: def456
  - State: playing
  - Outputs: 1
    Output #1: Arc (ID: ghi012)  <-- Look for this!
```

**When Playing:**
```
[Roon] zones_changed (1):
  - iPhone (ID: def456) [playing]
[Tracker] ✓ Now tracking: Song by Artist in iPhone
```

## Expected Results

### If Arc Appears as a Zone
✅ **Arc at home works!**
- You'll see zone events
- Plays will be tracked with accurate duration
- Works exactly like regular Roon app

### If Arc Appears as an Output
✅ **Arc at home works!**
- Zone will have display_name like "iPhone"
- Output will show "Arc"
- Plays still tracked normally

### If Arc Doesn't Appear At All
❌ **Arc at home doesn't work**
- Even on local network, Arc doesn't fire zone events
- This would be a Roon API limitation
- Only solution: Last.fm with estimated durations

## The Enhanced Logging

I've deployed logging that shows:

1. **Complete zone structure** at startup
2. **All outputs** for each zone
3. **Detailed zone changes** with state info
4. **Full RAW EVENT DATA** in JSON format
5. **Timestamps** for all events

This will definitively show whether Arc appears in any form.

## After Testing

Once you've tested and we know whether Arc appears on home network, we can:

### If Arc Works at Home
- Remove verbose logging
- Keep zone tracking as-is
- Document that Arc only tracks when at home

### If Arc Doesn't Work at Home
- Implement Last.fm poller
- Log Arc plays with estimated duration (30-60s)
- Better than no tracking at all

## Current Status

✅ **Enhanced logging deployed**  
✅ **Service restarted**  
✅ **Ready to test**  

## Next Steps

1. **Connect iPhone to home WiFi** (same network as Roon Core at 192.168.0.25)
2. **Open Arc and play a track** for 30+ seconds
3. **Check the logs** - they will be very verbose now
4. **Look for Arc** in zone/output names
5. **Report back what you see**

## The Bottom Line

**Arc remote plays (away from home) cannot be precisely tracked via Roon API.** This is a fundamental architectural limitation of how Arc works with Roon's cloud service.

**Arc local plays (at home) might work** - we need to test to confirm. The enhanced logging will tell us definitively.

If Arc local doesn't work either, Last.fm is the only option, but you'll lose play duration accuracy.

---

**Please test Arc while connected to your home WiFi and share what the logs show!**

