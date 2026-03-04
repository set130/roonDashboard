# Chart Legend Text Color Fix

## Date: March 4, 2026

## Problem
The legend text "Minutes" at the top of the charts was still appearing in black, making it hard to read against the dark background.

## Solution
Added more comprehensive CSS selectors to ensure the MUI Charts legend text is styled white.

## Changes Made

### Files Updated
- `client/src/components/TopArtists.jsx`
- `client/src/components/TopTracks.jsx`

### Styling Added
```jsx
sx={{
  // ...existing axis styling...
  '& .MuiChartsLegend-root': {
    '& .MuiChartsLegend-series': {
      '& text': {
        fill: '#ffffff !important'
      }
    }
  },
  '& .MuiChartsLegend-label': {
    fill: '#ffffff !important'
  }
}}
```

## What Was Fixed

✅ Legend text ("Minutes") now displays in white  
✅ Better targeting of MUI's nested legend components  
✅ More specific CSS selectors for reliable styling  
✅ Consistent with other chart text colors

## How to See the Fix

**Refresh your browser** - the "Minutes" legend text should now be white instead of black.

## Notes

- Used nested selectors to target MUI's internal legend structure
- Added `!important` to override MUI's default styles
- Applied to both TopArtists and TopTracks components
- Consistent with the white text theme used throughout the charts

