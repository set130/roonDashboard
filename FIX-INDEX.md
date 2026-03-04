# 🎵 ROON DASHBOARD - DEPLOYMENT FIX DOCUMENTATION

## 📋 Quick Start

1. **Read this first:** [QUICK_FIX_REFERENCE.md](QUICK_FIX_REFERENCE.md)
2. **Understand the issue:** [VISUAL_GUIDE.md](VISUAL_GUIDE.md)  
3. **Deploy the fix:** [DEPLOYMENT-COMMANDS.md](DEPLOYMENT-COMMANDS.md)
4. **Verify it works:** [PRE-DEPLOYMENT-CHECKLIST.md](PRE-DEPLOYMENT-CHECKLIST.md)

---

## 🔧 What Was Wrong

The Roon Dashboard service was configured to connect to `localhost:9100` instead of the actual Roon Core IP `192.168.0.25:9100`. Since the Dashboard runs on the same machine as Roon Core, this caused connection failures.

**Files affected:**
- `roon-dashboard.service` (systemd service file)
- `server/roon.js` (Roon API wrapper)

---

## ✅ What Was Fixed

### Service Configuration
```ini
# File: /etc/systemd/system/roon-dashboard.service
Environment="ROON_CORE_IP=192.168.0.25"  ← Changed from "localhost"
```

### Enhanced Error Handling
```javascript
// File: /opt/roonDashboard/server/roon.js
- Added error handlers for better debugging
- Added configuration logging
- Added try-catch around connection
```

---

## 📚 Documentation Files

### Core Documentation
| File | Purpose |
|------|---------|
| [QUICK_FIX_REFERENCE.md](QUICK_FIX_REFERENCE.md) | One-page summary of the fix |
| [VISUAL_GUIDE.md](VISUAL_GUIDE.md) | Diagrams showing before/after |
| [DEPLOYMENT-FIX.md](DEPLOYMENT-FIX.md) | Detailed explanation |
| [COMPLETE_DEPLOYMENT_SUMMARY.md](COMPLETE_DEPLOYMENT_SUMMARY.md) | Full technical summary |

### Deployment Guides
| File | Purpose |
|------|---------|
| [DEPLOYMENT-COMMANDS.md](DEPLOYMENT-COMMANDS.md) | Step-by-step deployment instructions |
| [PRE-DEPLOYMENT-CHECKLIST.md](PRE-DEPLOYMENT-CHECKLIST.md) | Verification checklist |
| [deploy.sh](deploy.sh) | Automated deployment script |
| [verify_deployment.sh](verify_deployment.sh) | Verification script |

---

## 🚀 Deployment Steps (TL;DR)

### Step 1: Copy Files to Server
```bash
scp roon-dashboard.service set@192.168.0.25:/tmp/
scp server/roon.js set@192.168.0.25:/tmp/
```

### Step 2: Deploy on Server
```bash
ssh set@192.168.0.25
sudo cp /tmp/roon-dashboard.service /etc/systemd/system/
sudo cp /tmp/roon.js /opt/roonDashboard/server/
sudo systemctl daemon-reload
sudo systemctl restart roon-dashboard
```

### Step 3: Verify
```bash
curl http://192.168.0.25:3001/api/status
# Should return: {"connected":true}
```

---

## ✨ Expected Results

### Dashboard
- **URL:** http://192.168.0.25:3001
- **Status:** Shows "Connected" 
- **Data:** Live listening history

### Roon App
- **Extensions:** Shows "Roon Dashboard" (Paired)
- **Functionality:** Tracks your listening
- **Status:** Connected

### Service Logs
```
[Server] API running on http://localhost:3001
[Roon] Configuration - IP: 192.168.0.25, Port: 9100
[Roon] Connecting to core at 192.168.0.25:9100...
[Roon] Core paired: Your Roon Core Name
```

---

## 🐛 Troubleshooting

### Still seeing "ERROR undefined"?
→ See [PRE-DEPLOYMENT-CHECKLIST.md#troubleshooting](PRE-DEPLOYMENT-CHECKLIST.md)

### Extension doesn't appear in Roon?
→ Check logs: `sudo journalctl -u roon-dashboard -n 100 --no-pager`

### Can't connect to service?
→ Verify: `sudo systemctl status roon-dashboard`

---

## 📊 Configuration Details

### Service File: `/etc/systemd/system/roon-dashboard.service`
```ini
[Unit]
Description=Roon Dashboard
After=network.target

[Service]
Type=simple
User=set
WorkingDirectory=/opt/roonDashboard
Environment="ROON_CORE_IP=192.168.0.25"  ← KEY FIX
Environment="PORT=3001"
Environment="NODE_ENV=production"
ExecStart=/usr/bin/node /opt/roonDashboard/server/index.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

### Connection Details
| Property | Value |
|----------|-------|
| Dashboard Host | 192.168.0.25 |
| Dashboard Port | 3001 |
| Roon Core Host | 192.168.0.25 |
| Roon Core Port | 9100 |
| Service User | set |
| Node Version | 20.20.0 |

---

## 📋 Verification Checklist

- [ ] Files copied to `/tmp/` on server
- [ ] Service file deployed to `/etc/systemd/system/`
- [ ] `roon.js` deployed to `/opt/roonDashboard/server/`
- [ ] `systemctl daemon-reload` executed
- [ ] Service restarted
- [ ] API responding at `192.168.0.25:3001/api/status`
- [ ] Connection shows `{"connected":true}`
- [ ] Extension visible in Roon app
- [ ] Dashboard loads and shows data
- [ ] Logs show successful Roon pairing

---

## 🎯 Success Indicators

✅ **All Good When:**
1. Dashboard loads at http://192.168.0.25:3001
2. API status endpoint returns `{"connected":true}`
3. Roon app shows extension as "Paired"
4. Service logs show "Core paired: ..."
5. Dashboard displays listening data

❌ **Still Broken If:**
1. Still seeing "ERROR undefined"
2. API returns `{"connected":false}`
3. Extension doesn't appear in Roon
4. Dashboard shows "Disconnected"
5. Service keeps restarting

---

## 📞 Quick Reference

| Need | Command |
|------|---------|
| Check logs | `sudo journalctl -u roon-dashboard -n 50 --no-pager` |
| Check status | `sudo systemctl status roon-dashboard` |
| Restart | `sudo systemctl restart roon-dashboard` |
| Test API | `curl http://192.168.0.25:3001/api/status` |
| View env vars | `sudo systemctl show -p Environment roon-dashboard` |
| Test Roon connection | `telnet 192.168.0.25 9100` |

---

## 📅 Deployment Info

- **Issue Date:** March 4, 2026
- **Fix Type:** Configuration correction + error handling
- **Files Modified:** 2
  - `roon-dashboard.service`
  - `server/roon.js`
- **Breaking Changes:** None
- **Rollback:** Keep backup of `/etc/systemd/system/roon-dashboard.service.bak`

---

## 🎵 Now Playing

Once deployed, your Roon Dashboard will:
- ✅ Connect to Roon Core
- ✅ Appear as an extension in Roon
- ✅ Track your listening history
- ✅ Display stats and analytics
- ✅ Show now-playing information

**Enjoy your music!** 🎶

---

*All files ready for deployment. Check each documentation file for detailed information.*

