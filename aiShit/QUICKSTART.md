# Quick Start: Deploying to Your Server

## TL;DR - 5 Steps

### Step 1: Prepare your server (run once)
```bash
# SSH into your server
ssh user@your-server-ip

# Download and run the setup script
```bash
curl https://raw.githubusercontent.com/youruser/roon-dashboard/master/deploy-setup.sh | sudo bash

# Follow the prompts to configure your setup
```

### Step 2: Copy your project files
```bash
# From your laptop, in the roonDashboard directory
scp -r . user@your-server-ip:/opt/roonDashboard/
```

### Step 3: Install dependencies on the server
```bash
ssh user@your-server-ip
cd /opt/roonDashboard

# Install backend dependencies
npm install

# Build the frontend
cd client
npm run build
cd ..

# Set your Roon Core IP (if not 100.90.5.35)
export ROON_CORE_IP=your-actual-ip
```

### Step 4: Start the service
```bash
sudo systemctl start roon-dashboard
sudo systemctl status roon-dashboard  # Check it's running

# View logs in real-time
sudo journalctl -u roon-dashboard -f
```

### Step 5: Approve in Roon
1. Open **Roon** on any device
2. Go to **Settings → Extensions**
3. Find **"Roon Dashboard"** 
4. Click **Approve**

---

## Access Your Dashboard

**URL:** `http://your-server-ip/`

Once approved in Roon, the dashboard will show your listening data automatically.

---

## Configuration

If you need to change the Roon Core IP or backend port:

### Option 1: Environment Variables
```bash
export ROON_CORE_IP=192.168.1.100
export PORT=3001
sudo systemctl restart roon-dashboard
```

### Option 2: Edit the systemd service
```bash
sudo nano /etc/systemd/system/roon-dashboard.service

# Add or modify the Environment line:
# Environment="ROON_CORE_IP=your-ip"
# Environment="PORT=3001"

sudo systemctl daemon-reload
sudo systemctl restart roon-dashboard
```

### Option 3: Create a .env file
```bash
cp .env.example .env
nano .env  # Edit with your values
sudo systemctl restart roon-dashboard
```

---

## Troubleshooting

**Dashboard won't connect:**
```bash
# Check backend is running
curl http://localhost:3001/api/status

# View logs
sudo journalctl -u roon-dashboard -f

# Verify Roon Core is reachable
ping 100.90.5.35
```

**Shows "Disconnected" after approval:**
- Verify Roon Core IP in environment variables
- Check firewall allows port 9100
- Restart the service: `sudo systemctl restart roon-dashboard`

**Nginx returns 502 Bad Gateway:**
```bash
# Test nginx config
sudo nginx -t

# Check backend is listening
netstat -tlnp | grep 3001

# Restart nginx
sudo systemctl restart nginx
```

**Database is empty:**
- This is normal on first run. Start playing music and the database will populate.
- Dashboard shows real-time data from your Roon zones.

---

## Updating the Dashboard

```bash
cd /opt/roonDashboard

# Pull latest changes
git pull  # Or manually update files

# Rebuild frontend
cd client
npm run build
cd ..

# Restart
sudo systemctl restart roon-dashboard
```

---

## Advanced: HTTPS with Let's Encrypt

```bash
# Install certbot
sudo apt-get install -y certbot python3-certbot-nginx

# Get a certificate
sudo certbot --nginx -d your-domain.com

# Nginx will auto-redirect HTTP to HTTPS
```

---

## System Information

- **Frontend served by:** nginx (port 80)
- **Backend running on:** localhost:3001 (proxied through nginx)
- **Database location:** /opt/roonDashboard/roon-dashboard.sqlite
- **Logs:** `sudo journalctl -u roon-dashboard -f`
- **Config:** /etc/systemd/system/roon-dashboard.service

---

**You're all set! Enjoy your Roon Dashboard! 🎵**

