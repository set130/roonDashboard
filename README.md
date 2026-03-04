# Roon Dashboard

A beautiful, modern music statistics dashboard for Roon — inspired by Spotify Wrapped and Apple Music Rewind. Track your listening habits, view top artists/tracks, see play history, and get personalized listening recaps.

## Features

✅ **Real-time Now Playing** — See what's currently playing with album artwork
✅ **Listening Statistics** — Total hours, daily breakdown charts
✅ **Top Artists & Tracks** — Ranked lists with play counts and durations
✅ **Play History** — Paginated history with track details and timestamps
✅ **Listening Recap** — Wrapped-style statistics (top artist, top track, streaks, variety)
✅ **Flexible Date Ranges** — Today, This Week, 4 Weeks, This Month, This Year, All Time, or Custom
✅ **Dark Theme** — Roon-inspired dark gray + amber aesthetic
✅ **Responsive UI** — Works on desktop and mobile
✅ **SQLite Database** — Self-contained, no external dependencies

## Tech Stack

**Backend:**
- Node.js + Express
- Roon API (WebSocket)
- SQLite (better-sqlite3)
- CORS-enabled REST API

**Frontend:**
- React 18 + Vite
- React Router for navigation
- Recharts for data visualization
- Dark theme CSS

## Quick Start (Development)

### Prerequisites
- Node.js v18+
- npm
- Roon Core running (on your network)

### Installation

```bash
# Clone or download the project
cd roonDashboard

# Install dependencies
npm install

# Install frontend dependencies
cd client && npm install && cd ..

# Build the frontend (optional for dev)
cd client && npm run build && cd ..
```

### Running Locally

```bash
# Start both server and client dev servers
npm run dev

# OR run them separately in different terminals:
# Terminal 1: Backend
npm run server

# Terminal 2: Frontend
npm run client
```

The dashboard will be available at:
- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3001

### Configuration

The backend connects to Roon Core at `100.90.5.35:9100` by default.

To change this, set environment variables:
```bash
export ROON_CORE_IP=192.168.1.100
export ROON_CORE_PORT=9100
export PORT=3001
```

Or create a `.env` file:
```bash
cp .env.example .env
# Edit .env with your settings
```

### Roon Setup

1. Open **Roon** on any device
2. Go to **Settings → Extensions**
3. Find **"Roon Dashboard"** in the pending extensions list
4. Click **Approve**

The dashboard will now track your listening in real-time.

---

## Production Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for full deployment guide.

### Quick Deployment (5 minutes)

```bash
# 1. On your server, run the setup script (one-time)
curl https://raw.githubusercontent.com/youruser/roon-dashboard/main/deploy-setup.sh | sudo bash

# 2. Copy your project files
scp -r . user@your-server-ip:/opt/roonDashboard/

# 3. Install and build
ssh user@your-server-ip
cd /opt/roonDashboard
npm install
cd client && npm run build && cd ..

# 4. Start the service
sudo systemctl start roon-dashboard
sudo systemctl status roon-dashboard

# 5. Approve in Roon
# Settings → Extensions → Approve "Roon Dashboard"
```

**Access at:** `http://your-server-ip/`

See [QUICKSTART.md](./QUICKSTART.md) for more details.

---

## Updating Your Server

After pushing changes to GitHub, update your production server:

```bash
cd /opt/roonDashboard
sudo bash update.sh
```

The update script will:
- ✅ Pull latest changes from GitHub
- ✅ Backup your database (all play history is preserved)
- ✅ Update dependencies if needed
- ✅ Rebuild the client
- ✅ Restart the service

**Your database is safe!** SQLite files are not tracked in git, so `git pull` will never overwrite your play history.

See [SERVER-UPDATE-GUIDE.md](./SERVER-UPDATE-GUIDE.md) for detailed update instructions.

---

## API Reference

### Endpoints

```
GET  /api/status              - Server connection status
GET  /api/now-playing         - Currently playing tracks
GET  /api/recap?range=...     - Wrapped-style statistics
GET  /api/stats/playtime      - Listening time data
GET  /api/stats/top-artists   - Top artists list
GET  /api/stats/top-tracks    - Top tracks list
GET  /api/history             - Play history
GET  /api/image/:key          - Album artwork proxy
```

### Query Parameters

```
?range=daily              - Today
?range=weekly             - This week
?range=4weeks             - Last 4 weeks
?range=monthly            - This month
?range=yearly             - This year
?range=all                - All time
?from=2026-01-01&to=...   - Custom date range
?limit=50                 - Max results
?page=1                   - Pagination
```

### Example

```bash
# Top artists this week
curl http://localhost:3001/api/stats/top-artists?range=weekly&limit=20

# Custom date range
curl http://localhost:3001/api/stats/playtime?from=2026-01-01T00:00:00Z&to=2026-03-04T23:59:59Z
```

---

## Database

The dashboard uses **SQLite** for local, self-contained storage.

**Location:** `/opt/roonDashboard/roon-dashboard.sqlite` (production) or `./roon-dashboard.sqlite` (local)

**Schema:**
- `plays` table — Tracks play history with timestamps, artists, albums, durations

**To reset the database:**
```bash
rm roon-dashboard.sqlite*
# Restart the server
sudo systemctl restart roon-dashboard
```

---

## File Structure

```
roonDashboard/
├── server/
│   ├── index.js              - Express server entry point
│   ├── roon.js               - Roon API connection
│   ├── tracker.js            - Play state machine
│   ├── db.js                 - SQLite queries
│   ├── routes/
│   │   ├── stats.js          - Statistics endpoints
│   │   ├── history.js        - History endpoint
│   │   └── recap.js          - Recap endpoint
│   └── utils/
│       └── time.js           - Date range utilities
│
├── client/
│   ├── src/
│   │   ├── App.jsx           - Main app component
│   │   ├── App.css           - Dark theme styles
│   │   ├── api/
│   │   │   └── roon.js       - API client
│   │   └── components/
│   │       ├── Dashboard.jsx - Dashboard view
│   │       ├── History.jsx   - Play history view
│   │       ├── Recap.jsx     - Recap view
│   │       ├── NowPlaying.jsx
│   │       ├── PlayTime.jsx
│   │       ├── TopArtists.jsx
│   │       ├── TopTracks.jsx
│   │       ├── DateRangePicker.jsx
│   │       └── DatePickerCalendar.jsx
│   ├── index.html
│   └── vite.config.js
│
├── DEPLOYMENT.md             - Full deployment guide
├── QUICKSTART.md             - Quick start guide
├── .env.example              - Environment variables template
├── package.json
├── deploy-setup.sh           - Automated setup script
└── README.md
```

---

## Troubleshooting

### "Disconnected" status

The dashboard shows "Disconnected" until you approve the extension in Roon:
1. Open Roon
2. Settings → Extensions
3. Find "Roon Dashboard"
4. Click **Approve**

It may take a few seconds to connect after approval.

### Empty statistics

Statistics accumulate from the moment the extension starts tracking. If you just set it up, play some music and wait a few minutes for data to appear.

### Backend won't start

```bash
# Check for port conflicts
lsof -i :3001

# Check logs
sudo journalctl -u roon-dashboard -f

# Verify Roon Core is reachable
ping 100.90.5.35
```

### Frontend returns 502 Bad Gateway

```bash
# Verify backend is running
curl http://localhost:3001/api/status

# Check nginx config (if using nginx)
sudo nginx -t
sudo systemctl restart nginx
```

---

## Development

### Add a new statistic

1. **Backend:** Add a query function in `server/db.js`
2. **Route:** Create an endpoint in `server/routes/stats.js`
3. **Frontend:** Add a component in `client/src/components/`
4. **API client:** Add fetch function in `client/src/api/roon.js`

### Customize the theme

Edit CSS variables in `client/src/App.css`:

```css
:root {
  --bg: #141414;           /* Background */
  --text: #d8d8d8;         /* Text color */
  --amber: #c48a2c;        /* Accent color */
  --border: #2e2e2e;       /* Border color */
  /* ... more variables ... */
}
```

---

## Performance Notes

- **Database:** SQLite handles millions of plays efficiently
- **Charts:** Recharts renders data responsively
- **API:** All endpoints return cached/indexed results
- **Disk:** Database grows ~100KB per 10,000 plays

Monitor database size:
```bash
du -h roon-dashboard.sqlite*
```

---

## Known Limitations

- ⚠️ Roon Core IP must be reachable from the server
- ⚠️ Historical play data only accumulates from extension startup (not retroactive)
- ⚠️ Custom date ranges support unlimited-digit years (e.g., year 23847324983274)

---

## Future Enhancements

- 🎯 Multiple Roon Core support
- 🎯 Statistics export (CSV/PDF)
- 🎯 Comparative listening (week-over-week, year-over-year)
- 🎯 Genre/mood statistics
- 🎯 Listening timeline visualization
- 🎯 Integration with Roon bookmarks/favorites

---

## License

MIT

---

## Support

For issues or questions:
1. Check [DEPLOYMENT.md](./DEPLOYMENT.md) or [QUICKSTART.md](./QUICKSTART.md)
2. Review the troubleshooting section above
3. Check server logs: `sudo journalctl -u roon-dashboard -f`

---

**Enjoy tracking your music! 🎵**

