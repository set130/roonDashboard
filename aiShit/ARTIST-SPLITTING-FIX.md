# Artist Splitting Fix - Implementation Summary

## Problem
Classical music tracks were showing duplicate artists in Top Artists:
- `Vladimir Horowitz` (8 plays, 22m)
- `Vladimir Horowitz / Domenico Scarlatti` (6 plays, 12m)
- `Sviatoslav Richter / Wolfgang Amadeus Mozart` (3 plays, 17m)

This mixed performer/composer data was creating separate entries instead of crediting each artist properly.

## Solution
**Split composite artist strings and credit each artist separately WITHOUT double-counting plays/time in totals.**

### Example Behavior
When you play `Vladimir Horowitz / Domenico Scarlatti` for 10 minutes:
- ✅ Vladimir Horowitz gets: +1 play, +10 minutes
- ✅ Domenico Scarlatti gets: +1 play, +10 minutes
- ✅ Total listening time: 10 minutes (not 20!)
- ✅ Total plays: 1 (not 2!)

## Changes Made

### File: `server/db.js`

#### 1. Added `splitArtists()` helper function
```javascript
function splitArtists(artistString) {
  if (!artistString || typeof artistString !== 'string') return [artistString];
  return artistString.split(' / ').map(a => a.trim()).filter(a => a);
}
```

#### 2. Modified `getTopArtists()` to split artists in-memory
- Fetches all plays from DB
- Splits composite artist strings
- Counts each artist separately
- Sorts and returns top N

#### 3. Modified `getRecap()` to split artists
- `top_artist`: Now expands splits to find the true top artist
- `unique_artists`: Counts unique artists after splitting

### No Database Schema Changes Required
- ✅ Existing `plays.artist` column unchanged
- ✅ Works with existing data immediately
- ✅ All historical data remains intact
- ✅ Roon metadata stored as-is (original format preserved)

## Expected Results

### Before Fix
```
#1  Sergei Rachmaninoff     19 plays · 22m
#2  Vladimir Horowitz        8 plays · 22m
#3  Vladimir Horowitz / Domenico Scarlatti  6 plays · 12m
#4  Sviatoslav Richter / Wolfgang Amadeus Mozart  3 plays · 17m
```

### After Fix
```
#1  Sergei Rachmaninoff     19 plays · 22m
#2  Vladimir Horowitz       14 plays · 34m  (8 solo + 6 from split)
#3  Domenico Scarlatti       6 plays · 12m  (from split)
#4  Sviatoslav Richter       3 plays · 17m  (from split)
#5  Wolfgang Amadeus Mozart  3 plays · 17m  (from split)
```

### Totals Verification
- If database has 36 total plays at 72 minutes total listening time
- After splitting: **still 36 plays, still 72 minutes**
- Individual artist stats sum to MORE than totals (because splits are credited to multiple artists)
- This is correct! It matches how Spotify/Apple Music handle features/collaborations.

## How It Works

1. **Data Storage**: Roon sends `"Vladimir Horowitz / Domenico Scarlatti"` → stored as-is in DB
2. **Query Time**: When computing stats:
   - Split string → `["Vladimir Horowitz", "Domenico Scarlatti"]`
   - Credit both artists with the full play
3. **Totals**: Always computed from raw DB rows (no doubling)
4. **UI Display**: Shows individual artist stats (which may sum > totals due to splits)

## Testing

Run the included test script to verify logic:
```powershell
node test-artist-split.js
```

Or restart your dashboard and check the Top Artists view - duplicates should now be consolidated.

## Future Enhancements (Optional)

If you want to:
1. **Permanently clean existing data**: Run a one-time UPDATE to split stored values into separate rows
2. **Toggle behavior**: Add a UI setting to switch between "split" and "combined" artist grouping
3. **Display original credits**: Show `(with Domenico Scarlatti)` in the UI while still splitting for stats

Let me know if you want any of these!

