# Updating Roon Dashboard on Ubuntu Server

## Quick Update (Recommended)

When you've pushed changes to GitHub, update your Ubuntu server with:

```bash
cd /opt/roonDashboard
sudo bash update.sh
```

**That's it!** The script will:
- ✅ Pull latest changes from GitHub
- ✅ Backup your database (with all play history)
- ✅ Update dependencies if needed
- ✅ Rebuild the client
- ✅ Restart the roon-dashboard service
- ✅ Show you the status

---

## Manual Update Steps

If you prefer to do it step by step:

```bash
# 1. Navigate to project directory
cd /opt/roonDashboard

# 2. Pull latest changes
git pull origin main

# 3. Update server dependencies (if package.json changed)
npm install

# 4. Rebuild client
cd client
npm install
npm run build
cd ..

# 5. Restart service
sudo systemctl restart roon-dashboard

# 6. Check status
sudo systemctl status roon-dashboard
```

---

## Important: Your Database is Safe

- 🔒 **Your database files are NOT tracked in git**
- 🔒 **`git pull` will never overwrite your database**
- 🔒 **All your play history is preserved**
- 💾 **The update script creates backups anyway**

Database files that are protected:
- `roon-dashboard.sqlite`
- `roon-dashboard.sqlite-wal`
- `roon-dashboard.sqlite-shm`

---

## Service Management Commands

```bash
# Check if service is running
sudo systemctl status roon-dashboard

# View live logs
sudo journalctl -u roon-dashboard -f

# View recent logs (last 50 lines)
sudo journalctl -u roon-dashboard -n 50

# Stop service
sudo systemctl stop roon-dashboard

# Start service
sudo systemctl start roon-dashboard

# Restart service
sudo systemctl restart roon-dashboard

# Enable service to start on boot
sudo systemctl enable roon-dashboard
```

---

## Typical Workflow

### On Your Windows Development Machine:

```powershell
# 1. Make your changes
# 2. Test locally with: npm run dev

# 3. Commit and push to GitHub
git add .
git commit -m "Your change description"
git push origin main
```

### On Your Ubuntu Server:

```bash
# 4. Pull and deploy the changes
cd /opt/roonDashboard
sudo bash update.sh
```

---

## Troubleshooting

### Service won't start:
```bash
# Check detailed logs
sudo journalctl -u roon-dashboard -n 100 --no-pager

# Check if port 3001 is in use
sudo lsof -i :3001
```

### Database permissions issue:
```bash
cd /opt/roonDashboard
sudo chown set:set roon-dashboard.sqlite*
sudo chmod 644 roon-dashboard.sqlite*
```

### Client not updating in browser:
- Hard refresh: `Ctrl + Shift + R` (or `Cmd + Shift + R` on Mac)
- Clear browser cache
- Verify client was rebuilt: `ls -la client/dist/`

### Git conflicts:
```bash
# If you have local changes on the server
git stash              # Save local changes
git pull origin master # Pull updates
git stash pop          # Reapply local changes
```

---

## File Locations

- **Project:** `/opt/roonDashboard/`
- **Service:** `/etc/systemd/system/roon-dashboard.service`
- **Database:** `/opt/roonDashboard/roon-dashboard.sqlite`
- **Logs:** `sudo journalctl -u roon-dashboard`
- **Client build:** `/opt/roonDashboard/client/dist/`

---

## Need Help?

Check the logs first:
```bash
sudo journalctl -u roon-dashboard -f
```

The logs will show:
- ✓ Roon connection status
- ✓ Database queries
- ✓ API requests
- ✗ Any errors

