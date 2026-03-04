# Chart Height Adjustments - Fix Collapsed Display

## Date: March 4, 2026

## Problem
The Top Tracks and Top Artists charts were showing bars that were too compressed/collapsed, making track names hard to read. With 10-20 bars in a fixed 300px height, each bar had very little vertical space.

## Solution
Increased chart heights to provide better spacing and readability:
- **Top Tracks** (10 items): 300px → 500px (50px per bar)
- **Top Artists** (20 items): 300px → 600px (30px per bar)

## Changes Made

### File: `client/src/components/TopTracks.jsx`

**Line 48 - Increased chart height:**

**Before:**
```jsx
<ResponsiveContainer width="100%" height={300}>
```

**After:**
```jsx
<ResponsiveContainer width="100%" height={500}>
```

### File: `client/src/components/TopArtists.jsx`

**Line 49 - Increased chart height:**

**Before:**
```jsx
<ResponsiveContainer width="100%" height={300}>
```

**After:**
```jsx
<ResponsiveContainer width="100%" height={600}>
```

## Impact

### Top Tracks (10 bars)
- **Before:** 300px ÷ 10 = ~30px per bar ❌ Too compressed
- **After:** 500px ÷ 10 = ~50px per bar ✅ Much better spacing

### Top Artists (20 bars)
- **Before:** 300px ÷ 20 = ~15px per bar ❌ Very compressed
- **After:** 600px ÷ 20 = ~30px per bar ✅ Better spacing

## Visual Improvements

✅ Track/artist names are now fully visible and readable  
✅ Bars have proper spacing between them  
✅ Chart is no longer collapsed  
✅ Better user experience and readability  
✅ Tooltip hover areas are easier to target

## Testing

1. Refresh the dashboard
2. Check **Top Tracks** - Should see 10 well-spaced bars
3. Check **Top Artists** - Should see 20 well-spaced bars
4. All track/artist names should be clearly readable

## Notes

- Height values can be adjusted further if needed
- Current ratio: ~50px per item for tracks, ~30px per item for artists
- These are good starting points for readability
- Charts use responsive containers, so they scale with viewport width

## Future Adjustments

If you want to change the heights:
- **Top Tracks:** Edit line 48 in `TopTracks.jsx`
- **Top Artists:** Edit line 49 in `TopArtists.jsx`

General rule of thumb: **30-50px per bar** for good readability

