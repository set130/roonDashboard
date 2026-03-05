# Roon Dashboard

A Roon music statistics dashboard inspired by Spotify Wrapped and Apple Music Rewind. Track your listening habits, view top artists/tracks, see play history, and get personalized listening recaps.

## Features

- **Real-time Now Playing** — See what's currently playing across all zones with album artwork
- **Listening Statistics** — Total hours, daily breakdown charts, flexible date ranges
- **Top Artists & Tracks** — Ranked lists with play counts and durations
- **Top Albums & Zones** — Genre and zone-based listening insights
- **Play History** — Track history with details and timestamps
- **Listening Recap** — Wrapped-style statistics summary
- **Flexible Date Ranges** — Daily, Weekly, 4 Weeks, Monthly, Yearly, All Time, or Custom ranges
- **Dark Theme** — Roon-inspired dark gray + amber aesthetic
- **Responsive UI** — Works on desktop and mobile
- **SQLite Database** — Self-contained, no external dependencies

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

The backend connects to Roon Core via the IP and port you specify.

Create a `.env` file in the project root:
```bash
# Backend
PORT=3001
NODE_ENV=production

# Roon Core (adjust IP and port to match your setup)
ROON_CORE_IP=100.90.5.35
ROON_CORE_PORT=9100

# Database location
DATABASE_PATH=./roon-dashboard.sqlite
```

**Or use environment variables:**
```bash
export ROON_CORE_IP=192.168.1.100
export ROON_CORE_PORT=9100
export PORT=3001
export NODE_ENV=production
npm run dev
```

See `.env.example` for all available options.

### Roon Setup

The dashboard is a **standalone server** that communicates with Roon Core via the Roon API.

1. Ensure **Roon Core** is running on your network (e.g., 100.90.5.35:9100)
2. Start the Roon Dashboard server
3. The dashboard will automatically connect to Roon Core
4. The first connection may require approval in Roon's extension settings

**Note:** The dashboard requires network connectivity to your Roon Core. Both the server and Roon Core must be on the same network or have proper routing configured.

---

## Production Deployment

### Quick Deployment (on your server)

```bash
# 1. Clone the repository
cd /opt
sudo git clone https://github.com/set130/roonDashboard.git
cd roonDashboard

# 2. Create .env file with your Roon Core IP
sudo tee .env > /dev/null << 'EOF'
ROON_CORE_IP=100.90.5.35
ROON_CORE_PORT=9100
PORT=3001
NODE_ENV=production
DATABASE_PATH=/opt/roonDashboard/roon-dashboard.sqlite
EOF

# 3. Install dependencies
npm install
cd client && npm install && cd ..

# 4. Build the frontend
cd client && npm run build && cd ..

# 5. Set up systemd service
sudo cp roon-dashboard.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable roon-dashboard
sudo systemctl start roon-dashboard

# 6. Check status
sudo systemctl status roon-dashboard
```

**Access at:** `http://your-server-ip:3001`

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions.

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
│   │   ├── App.jsx           - Main app with routing
│   │   ├── App.css           - Dark theme styles (dark gray + amber)
│   │   ├── ErrorBoundary.jsx - Error handling
│   │   ├── api/
│   │   │   └── client.js     - API client
│   │   └── components/
│   │       ├── Dashboard.jsx     - Main dashboard view
│   │       ├── History.jsx       - Play history view
│   │       ├── Recap.jsx         - Statistics recap view
│   │       ├── NowPlaying.jsx    - Currently playing info
│   │       ├── PlayTime.jsx      - Time spent listening charts
│   │       ├── TopArtists.jsx    - Top artists ranking
│   │       ├── TopTracks.jsx     - Top tracks ranking
│   │       ├── TopAlbums.jsx     - Top albums ranking
│   │       ├── TopZones.jsx      - Zone-based statistics
│   │       ├── DateRangePicker.jsx  - Date range selector
│   │       └── DatePickerCalendar.jsx - Calendar date picker
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
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

### Backend won't connect to Roon Core

```bash
# Check Roon Core is reachable
ping 100.90.5.35

# Verify ROON_CORE_IP and ROON_CORE_PORT in .env
cat .env

# Check server logs
sudo journalctl -u roon-dashboard -f
```

### "Disconnected" status

The dashboard shows "Disconnected" until you:
1. Start the Roon Dashboard server
2. Ensure Roon Core is running on the network
3. Check firewall allows port 9100 (Roon API)

It may take a few seconds to connect after startup.

### Empty statistics

Statistics accumulate from the moment the server starts tracking. If you just set it up, play some music and wait a few minutes for data to appear.

### Backend won't start

```bash
# Check for port conflicts
lsof -i :3001

# Check logs
sudo journalctl -u roon-dashboard -f
tail -f /var/log/syslog

# Verify dependencies are installed
npm install
```

### Frontend shows "Cannot connect to backend"

```bash
# Verify backend is running
curl http://localhost:3001/api/status

# Check Vite proxy configuration in client/vite.config.js
# Ensure it points to the correct backend URL
```

### Database issues

```bash
# Check database file exists and has proper permissions
ls -la roon-dashboard.sqlite*

# Monitor database size
du -h roon-dashboard.sqlite*

# Reset database (will lose play history)
rm roon-dashboard.sqlite*
sudo systemctl restart roon-dashboard
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

- Roon Core IP must be reachable from the server (same network or routable)
- Historical play data only accumulates from server startup (not retroactive)
- Play history is stored locally in SQLite; backing up the database file is recommended for data preservation
- Single Roon Core connection (multiple cores not yet supported)

---

## Future Enhancements

- Multiple Roon Core support
- Statistics export (CSV/PDF)
- Comparative listening (week-over-week, year-over-year)
- Genre/mood statistics
- Listening timeline visualization
- Integration with Roon bookmarks/favorites
- Retroactive play history import

---

## License

MIT

---

## Support & Documentation

For detailed information:
- **Setup & Deployment:** See [DEPLOYMENT.md](./DEPLOYMENT.md)
- **Quick Start:** See [QUICKSTART.md](./QUICKSTART.md)
- **Server Updates:** See [SERVER-UPDATE-GUIDE.md](./SERVER-UPDATE-GUIDE.md)
- **Server Logs:** `sudo journalctl -u roon-dashboard -f`

---

**Enjoy tracking your music!**

