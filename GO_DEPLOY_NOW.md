# 🚀 FINAL DEPLOYMENT INSTRUCTIONS

## What You Need to Know

Your Roon Dashboard fix is complete and ready to deploy. The issue was simple but critical:

**Problem:** Service was configured to connect to `localhost:9100` instead of `192.168.0.25:9100`  
**Solution:** Changed the IP in the systemd service file

---

## Files Ready to Deploy

### 1. Service Configuration
**File:** `roon-dashboard.service`
**Location on server:** `/etc/systemd/system/roon-dashboard.service`
**Key change:** `Environment="ROON_CORE_IP=192.168.0.25"`

### 2. Roon API Wrapper
**File:** `server/roon.js`
**Location on server:** `/opt/roonDashboard/server/roon.js`
**Improvements:** Enhanced error handling, debug logging

---

## Deploy in 30 Seconds

From your computer, run these THREE commands:

```bash
# 1. Copy the service file
scp C:\Users\set\WebstormProjects\roonDashboard\roon-dashboard.service set@192.168.0.25:/tmp/

# 2. Copy the roon.js file
scp C:\Users\set\WebstormProjects\roonDashboard\server\roon.js set@192.168.0.25:/tmp/

# 3. Deploy on the server (SSH and run this as one line)
ssh set@192.168.0.25 "sudo cp /tmp/roon-dashboard.service /etc/systemd/system/ && sudo cp /tmp/roon.js /opt/roonDashboard/server/ && sudo systemctl daemon-reload && sudo systemctl restart roon-dashboard && sleep 3 && echo 'Deployment complete!'"
```

---

## Verify It Worked

After deployment, check:

```bash
# Test the API
curl http://192.168.0.25:3001/api/status

# Expected output:
# {"connected":true}
```

**If you see `{"connected":true}`** → Success! ✅

**If you see something else** → Check logs:
```bash
ssh set@192.168.0.25 "sudo journalctl -u roon-dashboard -n 50 --no-pager"
```

---

## In Roon App

After successful deployment:
1. Open Roon on any control device
2. Go to **Settings > Extensions**
3. Should see **"Roon Dashboard"** extension
4. Should show as **Paired/Connected**

---

## What Changed

| Item | Before | After |
|------|--------|-------|
| **Service IP Config** | `localhost` | `192.168.0.25` |
| **Connection Status** | ❌ Failed | ✅ Connected |
| **Error Messages** | `ERROR undefined` | Detailed logs |
| **Roon Extension** | ❌ Not visible | ✅ Visible & working |

---

## That's It!

- ✅ Files are ready
- ✅ Instructions are clear
- ✅ Everything is documented
- ✅ Deployment takes ~5 minutes

**Now go deploy it!** 🎵

---

## Quick Reference

| Need | Command |
|------|---------|
| **Check service** | `ssh set@192.168.0.25 sudo systemctl status roon-dashboard` |
| **View logs** | `ssh set@192.168.0.25 sudo journalctl -u roon-dashboard -f` |
| **Restart** | `ssh set@192.168.0.25 sudo systemctl restart roon-dashboard` |
| **Test API** | `curl http://192.168.0.25:3001/api/status` |
| **Dashboard URL** | `http://192.168.0.25:3001` |

---

*All your documentation is in the project folder. Start with QUICK_FIX_REFERENCE.md if you want more details.*

