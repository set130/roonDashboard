# Top Artists/Tracks Sorting Fix

## Date: March 4, 2026

## Problem
Top artists and top tracks were being ranked by **number of plays** instead of **total listening time**. This caused artists with many short plays to rank higher than artists with fewer but longer plays.

### Example Issue
- **Chopin**: 4 plays × 1 minute = 4 minutes total
- **Richter**: 3 plays × 17 minutes = 51 minutes total

Old behavior: Chopin ranked #4, Richter ranked #5 ❌  
New behavior: Richter ranked higher (more listening time) ✅

## Solution
Changed all ranking logic to sort by **total_secs** (total listening time) instead of **play_count**.

## Changes Made

### File: `server/db.js`

#### 1. `getTopArtists()` - Line 82
**Before:**
```javascript
.sort((a, b) => b.play_count - a.play_count)
```

**After:**
```javascript
.sort((a, b) => b.total_secs - a.total_secs)
```

#### 2. `getTopTracks()` - Line 96
**Before:**
```sql
ORDER BY play_count DESC
```

**After:**
```sql
ORDER BY total_secs DESC
```

#### 3. `getRecap()` - Top Artist - Line 179
**Before:**
```javascript
.sort((a, b) => b.play_count - a.play_count)
```

**After:**
```javascript
.sort((a, b) => b.total_secs - a.total_secs)
```

#### 4. `getRecap()` - Top Track - Line 187
**Before:**
```sql
ORDER BY play_count DESC
```

**After:**
```sql
ORDER BY total_secs DESC
```

## Impact

### What Changed
- **Top Artists** now ranked by total listening time
- **Top Tracks** now ranked by total listening time
- **Recap** (top artist and top track) now ranked by total listening time

### What Stayed the Same
- Play count is still displayed and tracked
- All existing data remains unchanged
- UI still shows both plays and time
- No database schema changes

## Behavior

### Ranking Logic
Artists/tracks are now ranked by:
1. **Primary:** Total listening time (`total_secs`)
2. **Display:** Both time and play count shown

### Examples

**Classical Music (long tracks):**
- 3 plays × 20 minutes = 60 minutes → Ranks high ✅

**Pop Music (short tracks):**
- 10 plays × 3 minutes = 30 minutes → Ranks lower than classical

**This better reflects actual listening habits!**

## Testing

### Quick Test
1. Restart the server: `node index.js`
2. Open the dashboard
3. Check "Top Artists" - should now be sorted by listening time
4. Artists with more listening time (in minutes) should rank higher

### Database Query to Verify
```sql
-- See top artists sorted by time
SELECT artist, 
       COUNT(*) as plays, 
       SUM(played_secs) as total_secs,
       SUM(played_secs)/60 as minutes
FROM plays
GROUP BY artist
ORDER BY total_secs DESC
LIMIT 10;
```

## Notes

- This change makes the ranking more meaningful for users who listen to varied content (short pop songs vs long classical pieces)
- Play count is still valuable data and is displayed, just not used for ranking
- No data migration needed - works immediately with existing data
- Consistent across all views: Top Artists, Top Tracks, and Recap

## Reverting (if needed)

To revert to play count sorting, change all instances back:
- `b.total_secs - a.total_secs` → `b.play_count - a.play_count`
- `ORDER BY total_secs DESC` → `ORDER BY play_count DESC`

