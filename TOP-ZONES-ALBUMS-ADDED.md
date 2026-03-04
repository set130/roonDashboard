# Top Zones and Top Albums Feature Addition

## Date: March 4, 2026

## What Was Added

Added two new dashboard cards to display top listening zones and top albums:
- **Top Zones** - Shows which zones (rooms/devices) you listen in most
- **Top Albums** - Shows your most-played albums

## Changes Made

### Backend (Server)

#### 1. Database Functions (`server/db.js`)

**Added `getTopZones()` function:**
- Queries plays by zone_name
- Groups and sorts by total listening time
- Returns zone name, play count, and total seconds

**Added `getTopAlbums()` function:**
- Queries plays by album and artist
- Groups and sorts by total listening time
- Returns album, artist, image_key, play count, and total seconds

**Updated exports:**
- Added `getTopZones` and `getTopAlbums` to module.exports

#### 2. API Routes (`server/routes/stats.js`)

**Added `/api/stats/top-zones` endpoint:**
- Accepts date range parameters (from, to)
- Accepts limit parameter (default: 50)
- Returns JSON array of top zones

**Added `/api/stats/top-albums` endpoint:**
- Accepts date range parameters (from, to)
- Accepts limit parameter (default: 50)
- Returns JSON array of top albums

### Frontend (Client)

#### 3. API Client (`client/src/api/roon.js`)

**Added API functions:**
- `getTopZones(params)` - Fetches top zones data
- `getTopAlbums(params)` - Fetches top albums data

#### 4. Components

**Created `TopZones.jsx`:**
- Displays bar chart of top 10 zones
- Shows zone name, play count, and listening time
- Uses purple color (#6c5ce7) for bars
- Matches styling of other chart components

**Created `TopAlbums.jsx`:**
- Displays bar chart of top 10 albums
- Shows album art, album name, artist, play count, and time
- Uses yellow color (#fdcb6e) for bars
- Includes album artwork in the ranked list

#### 5. Dashboard (`client/src/components/Dashboard.jsx`)

**Updated to include new components:**
- Imported TopZones and TopAlbums
- Added both to the dashboard grid
- Now displays 6 cards total

## Features

### Top Zones
✅ Shows zones ranked by total listening time  
✅ Bar chart with purple bars  
✅ Displays play count and minutes for each zone  
✅ Top 10 zones shown  
✅ White text on dark background  

### Top Albums
✅ Shows albums ranked by total listening time  
✅ Bar chart with yellow bars  
✅ Displays album artwork (when available)  
✅ Shows artist name under album  
✅ Displays play count and minutes  
✅ Top 10 albums shown  

## Dashboard Layout

The dashboard now displays (in order):
1. **Now Playing** - Current playback status
2. **Listening Time** - Total stats
3. **Top Artists** - Most-listened artists
4. **Top Tracks** - Most-played tracks
5. **Top Zones** ⭐ NEW - Most-used zones
6. **Top Albums** ⭐ NEW - Most-played albums

## Color Scheme

- **Top Artists:** Orange (#e17055)
- **Top Tracks:** Cyan (#00cec9)
- **Top Zones:** Purple (#6c5ce7) ⭐ NEW
- **Top Albums:** Yellow (#fdcb6e) ⭐ NEW

## Data Display

All cards now consistently show:
- Bar chart with listening time in minutes
- Ranked list with:
  - Position number (#1, #2, etc.)
  - Item name
  - Play count and time in minutes
  - Album/track art (where applicable)

## How to Use

1. **Refresh your browser** to see the new cards
2. **Top Zones** shows which rooms/devices you use most
3. **Top Albums** shows your most-played albums
4. All cards respect the date range filter

## API Endpoints

### Top Zones
```
GET /api/stats/top-zones?range=weekly&limit=10
GET /api/stats/top-zones?from=2026-01-01&to=2026-03-04
```

### Top Albums
```
GET /api/stats/top-albums?range=weekly&limit=10
GET /api/stats/top-albums?from=2026-01-01&to=2026-03-04
```

## Notes

- Both features use the same time-based ranking as artists and tracks
- Album grouping is by album + artist combination
- Zone data comes from Roon's zone_name field
- Charts use MUI X Charts for consistent styling
- All text is white for visibility on dark background
- Responsive design works on all screen sizes

