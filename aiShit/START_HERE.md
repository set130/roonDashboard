# 🎵 Roon Dashboard - Start Here

Welcome! Your Roon Dashboard is **completely built and ready to deploy**.

## ⚡ Super Quick Start (Choose One)

### 🚀 Fastest: Docker
```bash
scp -r . user@server:/opt/roonDashboard/
ssh user@server && cd /opt/roonDashboard
docker-compose up -d
# Access: http://your-server-ip
```

### ⚙️ Traditional: Linux + nginx
```bash
scp -r . user@server:/opt/roonDashboard/
ssh user@server && cd /opt/roonDashboard
npm install && cd client && npm run build && cd ..
sudo systemctl start roon-dashboard
# Access: http://your-server-ip
```

### 📖 Guided: Follow a Guide
- **5 minutes?** → [QUICKSTART.md](QUICKSTART.md)
- **Full setup?** → [DEPLOYMENT.md](./DEPLOYMENT.md)
- **Docker?** → [DOCKER.md](../DOCKER.md)
- **Troubleshooting?** → [DEPLOYMENT-SUMMARY.md](./DEPLOYMENT-SUMMARY.md)

---

## 📚 Documentation Guide

| You Want To... | Read This |
|---|---|
| **Understand what you have** | [README.md](../README.md) |
| **Deploy in 5 minutes** | [QUICKSTART.md](QUICKSTART.md) |
| **Deploy the right way** | [DEPLOYMENT.md](./DEPLOYMENT.md) |
| **Use Docker** | [DOCKER.md](../DOCKER.md) |
| **Overview & troubleshoot** | [DEPLOYMENT-SUMMARY.md](./DEPLOYMENT-SUMMARY.md) |
| **Verify step-by-step** | [DEPLOYMENT-CHECKLIST.md](./DEPLOYMENT-CHECKLIST.md) |

---

## 🎯 Key Points

✅ **What's included:**
- Full-stack application (backend + frontend)
- SQLite database (auto-created)
- REST API (8 endpoints)
- Real-time Roon tracking
- Beautiful dark theme

✅ **What you need:**
- A Linux server (Ubuntu/Debian)
- Your Roon Core IP address (e.g., 100.90.5.35)
- 2GB disk space

✅ **What happens after deploy:**
1. Open dashboard at `http://your-server-ip/`
2. Shows "Disconnected" initially
3. Approve extension in Roon Settings
4. Status changes to "Connected"
5. Start playing music → data appears

---

## 🔧 Configuration

If your Roon Core is NOT at `100.90.5.35`, create `.env`:

```bash
cp .env.example .env
nano .env
# Change ROON_CORE_IP to your actual IP
```

---

## ✅ After Deploying

1. **Test the backend:**
   ```bash
   curl http://your-server/api/status
   # Should return: {"connected":false}
   ```

2. **Approve in Roon:**
   - Open Roon
   - Settings → Extensions
   - Find "Roon Dashboard"
   - Click Approve

3. **Play music & refresh dashboard**

4. **Check logs if needed:**
   ```bash
   sudo journalctl -u roon-dashboard -f
   ```

---

## 🆘 Troubleshooting

**Dashboard won't load?**
→ Check [DEPLOYMENT-SUMMARY.md](./DEPLOYMENT-SUMMARY.md#troubleshooting)

**Not connecting to Roon?**
→ Verify `ROON_CORE_IP` in `.env`

**No data showing?**
→ Play music for 30+ seconds, then refresh

**502 Bad Gateway?**
→ Run: `sudo systemctl restart roon-dashboard nginx`

---

## 📁 What's Inside

```
✅ Documentation/
  - README.md                  Full documentation
  - QUICKSTART.md              5-minute setup
  - DEPLOYMENT.md              Production guide
  - DOCKER.md                  Docker guide
  - DEPLOYMENT-SUMMARY.md      Overview
  - DEPLOYMENT-CHECKLIST.md    Verification
  
✅ Backend/
  - server/index.js            Express server
  - server/roon.js             Roon API
  - server/tracker.js          Play tracker
  - server/db.js               Database
  - server/routes/             API endpoints
  
✅ Frontend/
  - client/src/App.jsx         Main app
  - client/src/App.css         Dark theme
  - client/src/components/     React components
  
✅ Deployment/
  - Dockerfile                 Docker image
  - docker-compose.yml         Docker setup
  - deploy-setup.sh            Automated setup
  - .env.example               Configuration
  - package.json               Dependencies
```

---

## 🚢 Deployment Paths

### Path A: I want it done in 5 minutes
→ [QUICKSTART.md](QUICKSTART.md)

### Path B: I want to understand everything
→ [DEPLOYMENT.md](./DEPLOYMENT.md)

### Path C: I want to use Docker
→ [DOCKER.md](../DOCKER.md)

### Path D: I want step-by-step verification
→ [DEPLOYMENT-CHECKLIST.md](./DEPLOYMENT-CHECKLIST.md)

---

## 💡 Pro Tips

- **Monitor logs:** `sudo journalctl -u roon-dashboard -f`
- **Check status:** `sudo systemctl status roon-dashboard`
- **Database location:** `/opt/roonDashboard/roon-dashboard.sqlite`
- **Reset database:** `rm roon-dashboard.sqlite* && sudo systemctl restart roon-dashboard`
- **Check disk:** `df -h /opt/roonDashboard`

---

## 🎵 You're Ready!

Everything is built, configured, and documented. 

**Pick your deployment method above and follow the guide. You'll be up and running in minutes!**

**Questions?** Check the relevant documentation file above.

**Happy listening! 🎵**

