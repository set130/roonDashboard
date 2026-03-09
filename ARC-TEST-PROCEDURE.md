# Arc Tracking Test - Step by Step

## Current Status

✅ **Ultra-verbose logging deployed**  
✅ **Service restarted**  
✅ **Ready to test**

## The Test

We need to find out if Arc appears in zone events when you're **on your home network**.

### Prerequisites

- iPhone with Roon Arc installed
- Connected to **same WiFi network** as Roon Core (192.168.0.25)
- Dashboard service running

## Step-by-Step Test Procedure

### 1. Connect to Home WiFi

**On your iPhone:**
- Settings → WiFi
- Connect to your home network (same one as 192.168.0.25)
- Verify connection

### 2. Start Log Monitoring

**On your computer:**
```bash
ssh set@192.168.0.25 'journalctl -u roon-dashboard -f'
```

This will show logs in real-time.

### 3. Restart Dashboard (to see initial zones)

**In a new terminal:**
```bash
ssh set@192.168.0.25 'sudo systemctl restart roon-dashboard'
```

**Watch the logs** - you should see:
```
[Roon] INITIAL SUBSCRIPTION - ALL ZONES:
[Roon] Total zones found: X
[Roon] Zone #1:
  - Name: ...
  - ID: ...
  - Outputs: ...
```

**Look for:**
- Any zone with "iPhone" or "Arc" in the name
- Any output with "Arc" in the name
- Note how many zones appear

### 4. Play Music on Arc

**On your iPhone:**
1. Open Roon Arc app
2. Play any song
3. Let it play for **30+ seconds**
4. **Do not pause or skip**

### 5. Watch the Logs

**Look for new log entries like:**
```
[Roon] Zone subscription event: cmd=Changed
[Roon] zones_changed (1):
  - [Zone Name] (ID: ...) [playing]
```

**Specifically look for:**
- Zone name containing "iPhone", "Arc", or your device name
- State changing to "playing"
- Track information appearing

### 6. Check Tracker Logs

**Look for:**
```
[Tracker] ===== Processing X zone(s) =====
[Tracker] Zone: [Name] (ID: ...)
  - State: playing
  - Has now_playing: YES
  - Track: [Song Name]
  - Artist: [Artist Name]
```

If you see this with Arc/iPhone, it means tracking is working!

### 7. Let Song Finish

Let the song play for **at least 30 seconds**, then:
- Either let it finish naturally
- Or skip to next track

**Look for:**
```
[Tracker] Attempting to commit play: [Song] - played Xs (min: 30s)
[Tracker] ✓ Logged: [Song] by [Artist] (Xs)
```

This means the play was logged!

### 8. Verify in Database

```bash
ssh set@192.168.0.25 "sqlite3 /opt/roonDashboard/roon-dashboard.sqlite \"SELECT zone_name, track_title, artist, played_secs, started_at FROM plays ORDER BY started_at DESC LIMIT 5;\""
```

Look for the song you just played.

## What We're Looking For

### Scenario A: Arc Appears as a Zone ✅

**Logs show:**
```
[Roon] Zone #2:
  - Name: Arc
  - ID: xxx
  - State: playing
```

**This means:** Arc works at home! We can track it normally.

### Scenario B: Arc Appears as an Output ✅

**Logs show:**
```
[Roon] Zone #1:
  - Name: iPhone
  - ID: xxx
  - Outputs: 1
    Output #1: Arc (ID: yyy)
```

**This means:** Arc works at home! Zone is "iPhone", output is "Arc".

### Scenario C: Arc Doesn't Appear ❌

**Logs show:**
- No zone with Arc/iPhone name
- No output with Arc name
- No zone events when playing

**This means:** Arc doesn't trigger zone events even at home. Only solution: Last.fm with estimated durations.

## Information to Collect

After testing, please provide:

### 1. Initial Zones

Copy/paste the "INITIAL SUBSCRIPTION" section showing all zones.

### 2. Zone Events

Copy/paste any zone events that appeared when you started playing.

### 3. Tracker Logs

Did tracker process any zone with Arc/iPhone?

### 4. Database

Was the play logged in the database?

### 5. Zone Names

What zone/output names did you see?

## Troubleshooting

### No Logs Appear

**Problem:** Terminal shows nothing when playing

**Solutions:**
1. Check service is running: `ssh set@192.168.0.25 'sudo systemctl status roon-dashboard'`
2. Restart service: `ssh set@192.168.0.25 'sudo systemctl restart roon-dashboard'`
3. Check if Core is connected: Look for "Core paired:" in logs

### Logs Are Too Fast

**Problem:** Can't read logs, scrolling too fast

**Solution:** Save to file:
```bash
ssh set@192.168.0.25 'journalctl -u roon-dashboard --no-pager -n 200' > arc-test-logs.txt
```
Then open arc-test-logs.txt and search for "Arc" or "iPhone"

### iPhone Not Connected to WiFi

**Problem:** Forgot to connect to home WiFi

**Solution:** 
1. Open Settings on iPhone
2. WiFi → Select home network
3. Wait for connection
4. Test again

## Expected Timeline

1. **Service restart**: ~3 seconds
2. **Core pairing**: ~2 seconds
3. **Initial subscription**: Immediate (shows all zones)
4. **Play on Arc**: Start song
5. **Zone event**: Should appear within 1-2 seconds
6. **Tracker processing**: Immediate
7. **Play logging**: After 30+ seconds of playback

## After the Test

### If Arc Works at Home

We'll:
1. Remove excessive verbose logging
2. Keep zone tracking as-is
3. Document: "Arc only tracked when at home"
4. You'll get accurate tracking for home use

### If Arc Doesn't Work

We'll:
1. Implement Last.fm integration
2. Poll Last.fm every 60 seconds
3. Import plays with estimated duration
4. Document the limitation

## Quick Commands Reference

**Start log monitoring:**
```bash
ssh set@192.168.0.25 'journalctl -u roon-dashboard -f'
```

**Restart service:**
```bash
ssh set@192.168.0.25 'sudo systemctl restart roon-dashboard'
```

**Check database:**
```bash
ssh set@192.168.0.25 "sqlite3 /opt/roonDashboard/roon-dashboard.sqlite \"SELECT zone_name, track_title, played_secs FROM plays ORDER BY started_at DESC LIMIT 5;\""
```

**Save logs to file:**
```bash
ssh set@192.168.0.25 'journalctl -u roon-dashboard --no-pager -n 200' > arc-logs.txt
```

**Filter logs for Arc only:**
```bash
ssh set@192.168.0.25 'journalctl -u roon-dashboard --no-pager -n 200 | grep -i "arc\|iphone"'
```

---

## Ready to Test!

1. ✅ Connect iPhone to home WiFi
2. ✅ Start log monitoring
3. ✅ Restart dashboard service
4. ✅ Play song on Arc for 30+ seconds
5. ✅ Watch the logs
6. ✅ Report what you see!

**The test will definitively show if Arc can be tracked with accurate durations.**

