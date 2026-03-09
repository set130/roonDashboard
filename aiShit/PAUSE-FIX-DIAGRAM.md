# Pause/Resume Logic Flow

## OLD BEHAVIOR (Bug) ❌

```
Timeline:
0s ────▶ 30s ────▶ 35s ────▶ 50s
     PLAY    PAUSE    RESUME   STOP

Track State:
├─ 0s:  Start playing "Song A"
├─ 30s: PAUSE → commitPlay() → DB INSERT (30s)  ❌ First play logged
├─ 35s: Resume → Start NEW play for "Song A"
└─ 50s: STOP → commitPlay() → DB INSERT (15s)   ❌ Second play logged

Result: 2 plays in database (30s + 15s) ❌ WRONG
```

## NEW BEHAVIOR (Fixed) ✅

### Scenario 1: Short Pause (< 60 seconds)

```
Timeline:
0s ────▶ 30s ────▶ 35s ────▶ 50s
     PLAY    PAUSE    RESUME   STOP

Track State:
├─ 0s:  Start playing "Song A"
│       startedAt = 0s
├─ 30s: PAUSE
│       pausedAt = 30s
│       Set 60s timeout timer
├─ 35s: RESUME (5s pause)
│       Clear timeout timer
│       startedAt = 0s + 5s = 5s (adjust for pause)
│       pausedAt = null
└─ 50s: STOP
        playedSecs = 50s - 5s = 45s
        DB INSERT (45s) ✅ One play logged

Result: 1 play in database (45s actual listening) ✅ CORRECT
```

### Scenario 2: Long Pause (> 60 seconds)

```
Timeline:
0s ────▶ 30s ────▶ 90s ────▶ 100s
     PLAY    PAUSE    (60s)    RESUME

Track State:
├─ 0s:  Start playing "Song A"
│       startedAt = 0s
├─ 30s: PAUSE
│       pausedAt = 30s
│       Set 60s timeout timer
├─ 90s: TIMEOUT FIRES (60s elapsed)
│       playedSecs = 30s
│       DB INSERT (30s) ✅ Play logged
│       Delete zone state
└─ 100s: RESUME
         Start NEW play for "Song A" ✅ New session

Result: 1 play logged (30s), new session starts if resumed
```

### Scenario 3: Stop While Paused

```
Timeline:
0s ────▶ 30s ────▶ 35s
     PLAY    PAUSE    STOP

Track State:
├─ 0s:  Start playing "Song A"
│       startedAt = 0s
├─ 30s: PAUSE
│       pausedAt = 30s
│       Set 60s timeout timer
└─ 35s: STOP
        Clear timeout timer
        playedSecs = 30s
        DB INSERT (30s) ✅ One play logged

Result: 1 play in database (30s) ✅ CORRECT
```

## Key Implementation Details

### Zone State Object Structure
```javascript
zoneStates[zone_id] = {
  zone_id: "...",
  zone_name: "...",
  track: { ... },
  startedAt: Date,          // When track started
  state: "playing/paused",  // Current state
  seek_position: Number,    // Current position
  pausedAt: Date | null,    // When track was paused (null if not paused)
  pauseTimeout: Timer | null // Timeout handle (null if not paused)
}
```

### State Transitions

```
PLAYING → PAUSED:
  - Record pausedAt timestamp
  - Start 60s timeout timer
  - Keep zone state in memory

PAUSED → PLAYING (resume):
  - Calculate pause duration
  - Clear timeout timer
  - Adjust startedAt by adding pause duration
  - Clear pausedAt
  - Continue same play session

PAUSED → STOPPED:
  - Clear timeout timer
  - Commit play
  - Delete zone state

TIMEOUT FIRES:
  - Commit play
  - Delete zone state
  - Next resume = new play
```

## Benefits

1. ✅ No more double-play logging
2. ✅ Accurate play time (excludes pause duration)
3. ✅ Handles quick pause/resume (buttons, buffering)
4. ✅ Handles long pauses (user walked away)
5. ✅ Memory cleanup (prevents leak from orphaned timers)

