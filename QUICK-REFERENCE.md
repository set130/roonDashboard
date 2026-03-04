# Roon Dashboard - Quick Reference

## 🚀 Deploy in 3 Commands (Docker)

```bash
# 1. Copy to server
scp -r . user@server:/opt/roonDashboard/

# 2. Start
ssh user@server && cd /opt/roonDashboard && docker-compose up -d

# 3. Access
http://your-server-ip/
```

## ⚙️ Configure (if needed)

```bash
# Update Roon Core IP
cp .env.example .env
nano .env
# Change: ROON_CORE_IP=100.90.5.35 → your-actual-ip
```

## ✅ Verify It Works

```bash
# Check backend
curl http://your-server/api/status
# Returns: {"connected":false}

# Check frontend
curl http://your-server/
# Returns: HTML (no error)
```

## 🎵 Approve in Roon

1. Open **Roon**
2. **Settings → Extensions**
3. Find **"Roon Dashboard"**
4. Click **Approve**
5. Wait 5 seconds
6. Status changes to `{"connected":true}`

## 📚 Documentation

| Need | File |
|------|------|
| Start | [START_HERE.md](./START_HERE.md) |
| 5-min setup | [QUICKSTART.md](./QUICKSTART.md) |
| Detailed | [DEPLOYMENT.md](./DEPLOYMENT.md) |
| Docker | [DOCKER.md](./DOCKER.md) |
| Help | [DEPLOYMENT-SUMMARY.md](./DEPLOYMENT-SUMMARY.md) |
| Checklist | [DEPLOYMENT-CHECKLIST.md](./DEPLOYMENT-CHECKLIST.md) |

## 🛠️ Common Commands

```bash
# Check service
sudo systemctl status roon-dashboard

# View logs
sudo journalctl -u roon-dashboard -f

# Restart
sudo systemctl restart roon-dashboard

# Reset database
rm roon-dashboard.sqlite* && sudo systemctl restart roon-dashboard

# Check disk usage
du -h roon-dashboard.sqlite*
```

## 📊 API Endpoints

```bash
# Status
GET /api/status

# Current playing
GET /api/now-playing

# Stats
GET /api/stats/playtime?range=weekly
GET /api/stats/top-artists?range=monthly&limit=10
GET /api/stats/top-tracks?range=all

# History
GET /api/history?page=1&limit=50

# Recap
GET /api/recap?range=yearly

# Images
GET /api/image/[image_key]
```

## ⏰ Time Ranges

```
?range=daily          Today
?range=weekly         This week
?range=4weeks         Last 4 weeks
?range=monthly        This month
?range=yearly         This year
?range=all            All time
?from=...&to=...      Custom dates
```

## 🆘 Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| Won't load | Check `docker-compose ps` |
| Not connecting | Verify `ROON_CORE_IP` in `.env` |
| No data | Approve in Roon, play music 30+ sec |
| 502 error | `sudo systemctl restart roon-dashboard` |
| Slow | Check disk: `df -h` |

## 📁 Key Locations

```
/opt/roonDashboard/              # App root
  ├── roon-dashboard.sqlite       # Database
  ├── server/                     # Backend
  ├── client/dist/                # Frontend (built)
  └── .env                        # Configuration
```

## 🎯 Features

✅ Real-time now playing
✅ Listening statistics
✅ Top artists & tracks
✅ Play history
✅ Spotify Wrapped-style recap
✅ Custom date ranges
✅ Dark theme
✅ Responsive design

## 📞 Need Help?

1. Check [START_HERE.md](./START_HERE.md)
2. Read [DEPLOYMENT-SUMMARY.md](./DEPLOYMENT-SUMMARY.md#troubleshooting)
3. View logs: `sudo journalctl -u roon-dashboard -f`
4. Check [DEPLOYMENT-CHECKLIST.md](./DEPLOYMENT-CHECKLIST.md)

---

**Deploy now → Approve in Roon → Enjoy! 🎵**

