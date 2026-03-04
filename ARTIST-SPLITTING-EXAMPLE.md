## Artist Splitting - Data Flow Example

### Input Data (Database State)
```
plays table:
+----+------------------------------------------+-------------+
| id | artist                                   | played_secs |
+----+------------------------------------------+-------------+
| 1  | Sergei Rachmaninoff                      | 1320        |
| 2  | Vladimir Horowitz                        | 1320        |
| 3  | Vladimir Horowitz / Domenico Scarlatti   | 720         |
| 4  | Vladimir Horowitz                        | 1320        |
| 5  | Vladimir Horowitz / Domenico Scarlatti   | 720         |
+----+------------------------------------------+-------------+

Total rows: 5 plays
Total time: 5400 seconds (90 minutes)
```

### Processing Step 1: splitArtists()
```javascript
// Row 1
splitArtists("Sergei Rachmaninoff")
→ ["Sergei Rachmaninoff"]

// Row 2
splitArtists("Vladimir Horowitz")
→ ["Vladimir Horowitz"]

// Row 3 (SPLIT!)
splitArtists("Vladimir Horowitz / Domenico Scarlatti")
→ ["Vladimir Horowitz", "Domenico Scarlatti"]

// Row 4
splitArtists("Vladimir Horowitz")
→ ["Vladimir Horowitz"]

// Row 5 (SPLIT!)
splitArtists("Vladimir Horowitz / Domenico Scarlatti")
→ ["Vladimir Horowitz", "Domenico Scarlatti"]
```

### Processing Step 2: Aggregate Stats
```javascript
artistStats = {
  "Sergei Rachmaninoff": {
    artist: "Sergei Rachmaninoff",
    play_count: 1,        // from row 1
    total_secs: 1320
  },
  
  "Vladimir Horowitz": {
    artist: "Vladimir Horowitz",
    play_count: 4,        // rows 2, 3, 4, 5
    total_secs: 4080      // 1320 + 720 + 1320 + 720
  },
  
  "Domenico Scarlatti": {
    artist: "Domenico Scarlatti",
    play_count: 2,        // rows 3, 5
    total_secs: 1440      // 720 + 720
  }
}
```

### Output: Top Artists
```json
[
  {
    "artist": "Vladimir Horowitz",
    "play_count": 4,
    "total_secs": 4080
  },
  {
    "artist": "Domenico Scarlatti",
    "play_count": 2,
    "total_secs": 1440
  },
  {
    "artist": "Sergei Rachmaninoff",
    "play_count": 1,
    "total_secs": 1320
  }
]
```

### Totals Verification ✅
```
Sum of artist play_counts: 4 + 2 + 1 = 7
Actual database plays: 5 ✓ (splits credited both artists)

Sum of artist total_secs: 4080 + 1440 + 1320 = 6840
Actual database total_secs: 5400 ✓ (splits credited both artists)

This is CORRECT behavior!
- Vladimir Horowitz gets credit for all 4 appearances (2 solo + 2 splits)
- Domenico Scarlatti gets credit for 2 appearances (both from splits)
- User's total listening time remains 5400 seconds (90 minutes)
```

### UI Display
```
Top Artists
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#1  Vladimir Horowitz       4 plays · 68m
#2  Domenico Scarlatti      2 plays · 24m
#3  Sergei Rachmaninoff     1 play  · 22m

Your Stats
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total Listening Time: 90 minutes  ← NOT 114 minutes!
Total Plays: 5                     ← NOT 7!
```

### Key Points
1. **Splits credit both artists** with the full play time
2. **Totals are computed from raw DB rows** (no double-counting)
3. **Individual artist totals may exceed global totals** (this is expected and correct)
4. **Same behavior as Spotify** (features/collaborations work this way)

### Real-World Analogy
If you play "Daft Punk feat. Pharrell Williams" for 5 minutes:
- Daft Punk: +1 play, +5 minutes
- Pharrell Williams: +1 play, +5 minutes
- Your total listening: 5 minutes (not 10!)

