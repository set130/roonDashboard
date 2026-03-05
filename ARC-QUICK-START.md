# Arc Tracking Test - QUICK START

## TL;DR

Arc remote plays (cellular/away) **CANNOT** be tracked with accurate durations via Roon API.  
Arc at-home plays (same WiFi as Core) **MIGHT** work - we need to test!

## Test This NOW

### 1. Connect iPhone to Home WiFi
Same network as your Roon Core (192.168.0.25)

### 2. Watch Logs
```bash
ssh set@192.168.0.25 'journalctl -u roon-dashboard -f'
```

### 3. Restart Service
```bash
ssh set@192.168.0.25 'sudo systemctl restart roon-dashboard'
```

Look for:
```
[Roon] INITIAL SUBSCRIPTION - ALL ZONES:
[Roon] Zone #1: ...
[Roon] Zone #2: ...
```

Does any zone/output show "Arc" or "iPhone"?

### 4. Play on Arc
- Open Arc on iPhone
- Play any song
- Let it play for 30+ seconds

### 5. Check Logs
Look for:
```
[Roon] zones_changed:
  - [Something] (ID: ...) [playing]
[Tracker] ✓ Now tracking: ... in [Zone]
[Tracker] ✓ Logged: ...
```

### 6. Report Results

**If you see Arc/iPhone in zones and tracker logs it:**
✅ Arc works at home! (Accurate tracking when on WiFi)

**If you see nothing about Arc:**
❌ Arc doesn't work even at home (No solution for accurate durations)

## Why This Matters

**Arc remote (cellular):**
- Streams through Roon Cloud
- Core doesn't see playback events
- No way to track with accurate durations
- This is fundamental - cannot be fixed

**Arc at home (WiFi):**
- Connects directly to Core
- Might fire zone events
- Could track with accurate durations
- **THIS IS WHAT WE'RE TESTING**

## Your Options

### If Arc Works at Home ✅
- Use Arc at home: Tracked accurately
- Use Arc remote: Not tracked
- Trade-off: Accuracy vs mobility

### If Arc Doesn't Work ❌
1. **Accept it** - Use regular Roon app for tracking
2. **Last.fm** - Estimated durations (all 30s)
3. **Ignore Arc** - Only track regular app

## The Bottom Line

**There is no way to track Arc remote plays with accurate durations.**

Arc when streaming over cellular/away from home doesn't connect directly to your Roon Core, so there are no zone events to capture. This is how Roon Arc is architected - it's not a bug or missing feature in the dashboard.

**The test will show if Arc at-home can work** - that's the only remaining question.

---

## What I've Deployed

✅ Ultra-verbose logging - shows ALL zones and outputs  
✅ Complete zone structure at startup  
✅ Full zone event logging  
✅ Service restarted and ready  

## Full Documentation

- **ARC-TEST-PROCEDURE.md** - Detailed step-by-step test
- **ARC-REAL-ISSUE.md** - Why Arc remote can't work
- **ARC-COMPLETE-SUMMARY.md** - Everything explained

---

**Test now and report what you see in the logs!**

