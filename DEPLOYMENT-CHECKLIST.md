# Deployment Checklist

## Pre-Deployment (on your laptop)

- [ ] Verify all code builds locally: `npm run dev`
- [ ] Verify client builds: `cd client && npm run build`
- [ ] Test API endpoints work locally
- [ ] Roon extension appears in Extensions list
- [ ] Note your Roon Core IP address (e.g., 100.90.5.35)
- [ ] Note the server IP/domain where you'll deploy

## Server Preparation

### Option A: Traditional Linux (nginx + systemd)

- [ ] SSH access to your server
- [ ] Server has Ubuntu 20.04+ or Debian 11+
- [ ] At least 2GB free disk space
- [ ] Can run sudo commands

**Do this once:**
```bash
curl https://raw.github.../deploy-setup.sh | sudo bash
```

- [ ] setup script completes successfully
- [ ] nginx installed and running
- [ ] systemd unit file created

### Option B: Docker

- [ ] Docker installed on server
- [ ] Docker Compose installed
- [ ] At least 1GB free disk space

## Deployment

### Step 1: Copy Files

```bash
scp -r . user@server-ip:/opt/roonDashboard/
```

- [ ] All files copied successfully

### Step 2: Install Dependencies

```bash
ssh user@server-ip
cd /opt/roonDashboard
npm install
npm install
cd client && npm install && npm run build && cd ..
```

- [ ] `npm install` completes without errors
- [ ] `npm run build` completes without errors
- [ ] No missing dependencies

### Step 3: Configure

```bash
# Create .env with your settings
cp .env.example .env
nano .env
```

- [ ] `ROON_CORE_IP` is set correctly
- [ ] `PORT` is set (default: 3001)
- [ ] Save file

### Step 4a: Start (Traditional Linux)

```bash
sudo systemctl start roon-dashboard
sudo systemctl status roon-dashboard
```

- [ ] Service starts without errors
- [ ] Status shows "active (running)"
- [ ] No errors in logs: `sudo journalctl -u roon-dashboard`

### Step 4b: Start (Docker)

```bash
docker-compose up -d
docker-compose ps
```

- [ ] All containers start successfully
- [ ] `docker-compose logs roon-dashboard` shows startup messages
- [ ] No errors in logs

## Post-Deployment Verification

### Test Backend

```bash
curl http://your-server-ip/api/status
```

- [ ] Returns: `{"connected":false}` (until approved in Roon)
- [ ] No connection errors

### Test Frontend

```bash
curl http://your-server-ip/ | head -1
```

- [ ] Returns HTML with `<!doctype html>`
- [ ] No 502/503 errors

### Browser Test

Open in web browser:
```
http://your-server-ip/
```

- [ ] Page loads (may show "Disconnected" initially)
- [ ] No 404 or 502 errors
- [ ] Sidebar visible with Dashboard, History, Recap
- [ ] Date range buttons visible
- [ ] Now Playing card shows "Disconnected"

## Roon Approval

1. Open **Roon** application
2. Navigate to **Settings → Extensions**
3. Find **"Roon Dashboard"** in pending list
   - [ ] Extension appears (may take 30-60 seconds)
   - [ ] Status shows "Pending approval"
4. Click **Approve**
   - [ ] Status changes to approved
   - [ ] Wait 5-10 seconds for connection
5. Check browser
   - [ ] Now Playing card shows "Connected"
   - [ ] Blue/green status indicator

## Data Verification

### Play Some Music

- [ ] Start playing a track in any Roon zone
- [ ] Let it play for at least 30 seconds
- [ ] Refresh dashboard page

### Check Dashboard

- [ ] **Now Playing** shows the current track
- [ ] **Listening Time** shows data (not 0)
- [ ] **Top Artists** shows something (if you've played multiple artists)
- [ ] **Top Tracks** shows something

### Check Database

```bash
ls -lh /opt/roonDashboard/roon-dashboard.sqlite*
```

- [ ] `.sqlite` file exists and grows over time
- [ ] Size > 0 bytes

## Monitoring

### Check Logs Daily

```bash
sudo journalctl -u roon-dashboard -f
```

- [ ] No error messages
- [ ] Zone changes are logged
- [ ] Track plays are logged

### Disk Space

```bash
df -h /opt/roonDashboard
```

- [ ] At least 10GB free (database can grow)

### Service Health

```bash
sudo systemctl status roon-dashboard
```

- [ ] Status is "active (running)"
- [ ] Process is not restarting repeatedly

## Optional: Production Hardening

- [ ] Enable HTTPS with Let's Encrypt
- [ ] Set up log rotation
- [ ] Configure firewall rules
- [ ] Set up monitoring/alerting
- [ ] Configure automatic backups of `.sqlite` file
- [ ] Set up fail2ban or equivalent

## Troubleshooting Checklist

If something doesn't work, verify:

- [ ] `sudo systemctl status roon-dashboard` shows running
- [ ] `curl http://localhost:3001/api/status` works
- [ ] Roon Core IP in `.env` matches actual IP
- [ ] Extension approved in Roon Settings
- [ ] Roon Core is reachable: `ping [core-ip]`
- [ ] Port 9100 isn't blocked: `nc -zv [core-ip] 9100`
- [ ] Nginx is running: `sudo systemctl status nginx`
- [ ] Check logs: `sudo journalctl -u roon-dashboard -f`

## Rollback Plan

If something breaks:

```bash
# Stop the service
sudo systemctl stop roon-dashboard

# Reset database
rm /opt/roon-dashboard/roon-dashboard.sqlite*

# Restart
sudo systemctl start roon-dashboard

# Check logs
sudo journalctl -u roon-dashboard -f
```

## Success Criteria

✅ Dashboard loads at `http://your-server-ip/`
✅ API responds: `curl http://your-server-ip/api/status`
✅ Roon shows "Connected" in Now Playing
✅ Statistics display after playing music
✅ Database grows over time
✅ No errors in logs

---

**Deployment Status: READY ✅**

You have everything needed to deploy! Choose your method and follow the steps above.

Need help? See [DEPLOYMENT-SUMMARY.md](./DEPLOYMENT-SUMMARY.md) or [QUICKSTART.md](./QUICKSTART.md)

