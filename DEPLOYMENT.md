# Roon Dashboard Deployment Guide

## Prerequisites

- Linux server (Ubuntu/Debian recommended)
- Node.js v18+ installed
- npm installed
- Your Roon Core is running at `100.90.5.35` (configurable)
- Optional: nginx for reverse proxy

## Step 1: Prepare the Server

### 1.1 SSH into your server
```bash
ssh user@your-server-ip
```

### 1.2 Install Node.js (if not already installed)
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
node --version  # Verify installation
```

### 1.3 Create a directory for the app
```bash
sudo mkdir -p /opt/roonDashboard
sudo chown $USER:$USER /opt/roonDashboard
cd /opt/roonDashboard
```

## Step 2: Copy Project Files

### 2.1 From your laptop, copy the project to the server
```bash
# From your laptop's roonDashboard directory:
scp -r . user@your-server-ip:/opt/roonDashboard/
```

Or use git to clone:
```bash
cd /opt/roonDashboard
git clone <your-repo-url> .
```

### 2.2 Install dependencies
```bash
cd /opt/roonDashboard
npm install

# Build the client
cd client
npm run build
cd ..
```

## Step 3: Configure the Backend

### 3.1 Update Roon Core IP (if needed)

Edit `server/roon.js` and update the IP address:
```javascript
function startRoon() {
  console.log("[Roon] Connecting to core at YOUR_CORE_IP:9100...");
  roon.ws_connect({ host: "YOUR_CORE_IP", port: 9100 });
}
```

Replace `YOUR_CORE_IP` with your actual Roon Core IP (e.g., `100.90.5.35`).

### 3.2 Optionally configure the backend port

By default, the backend runs on port `3001`. To change it, set the `PORT` environment variable:
```bash
export PORT=3000
```

## Step 4: Set Up Systemd Service

### 4.1 Create a systemd service file
```bash
sudo nano /etc/systemd/system/roon-dashboard.service
```

### 4.2 Paste this content (updating paths as needed):
```ini
[Unit]
Description=Roon Dashboard Backend
After=network.target

[Service]
Type=simple
User=your-username
WorkingDirectory=/opt/roonDashboard
ExecStart=/usr/bin/node server/index.js
Restart=always
RestartSec=10
Environment="PORT=3001"

# Logging
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

### 4.3 Enable and start the service
```bash
sudo systemctl daemon-reload
sudo systemctl enable roon-dashboard
sudo systemctl start roon-dashboard

# Check status
sudo systemctl status roon-dashboard

# View logs
sudo journalctl -u roon-dashboard -f
```

## Step 5: Serve the Frontend

### Option A: Using nginx as a reverse proxy (Recommended)

#### 5.1 Install nginx
```bash
sudo apt-get install -y nginx
```

#### 5.2 Create a new nginx config
```bash
sudo nano /etc/nginx/sites-available/roon-dashboard
```

#### 5.3 Paste this configuration:
```nginx
server {
    listen 80;
    server_name your-server-ip;

    # Serve static frontend files
    location / {
        root /opt/roonDashboard/client/dist;
        try_files $uri $uri/ /index.html;
    }

    # Proxy API requests to the backend
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

#### 5.4 Enable the site
```bash
sudo ln -s /etc/nginx/sites-available/roon-dashboard /etc/nginx/sites-enabled/
sudo nginx -t  # Test configuration
sudo systemctl restart nginx
```

### Option B: Using pm2 to run frontend dev server

```bash
# Install pm2 globally
sudo npm install -g pm2

# Start the frontend dev server
cd /opt/roonDashboard/client
pm2 start "npm run dev" --name "roon-frontend"

# Make it start on boot
pm2 startup
pm2 save
```

Then access the frontend at `http://your-server-ip:5173` (or proxy it with nginx).

## Step 6: Verify Everything Works

### 6.1 Check backend is running
```bash
curl http://localhost:3001/api/status
# Should return: {"connected":false} (until Roon pairing is done)
```

### 6.2 Check frontend is served
```bash
curl http://your-server-ip/
# Should return HTML of the dashboard
```

### 6.3 Open in browser
```
http://your-server-ip/
```

## Step 7: Approve the Extension in Roon

1. Open **Roon** on your system
2. Go to **Settings → Extensions**
3. Find **"Roon Dashboard"** in the pending extensions list
4. Click **Approve**

Once approved, the dashboard should show `{"connected":true}` and data will start flowing in.

## Troubleshooting

### Dashboard shows "Disconnected"
- Check that your Roon Core IP is correct in `server/roon.js`
- Verify the Core is running
- Check firewall rules allow connections to port 9100
- View backend logs: `sudo journalctl -u roon-dashboard -f`

### API returns 502 Bad Gateway
- Ensure the backend service is running: `sudo systemctl status roon-dashboard`
- Check nginx is configured correctly: `sudo nginx -t`
- Verify backend is listening on port 3001: `netstat -tlnp | grep 3001`

### Frontend doesn't load
- Rebuild the client: `cd client && npm run build`
- Restart nginx: `sudo systemctl restart nginx`
- Check nginx logs: `sudo tail -f /var/log/nginx/error.log`

### Database file is missing
The database is auto-created on first run. If you want to reset it:
```bash
rm /opt/roon-dashboard/roon-dashboard.sqlite*
sudo systemctl restart roon-dashboard
```

## Updating the Dashboard

To update to the latest version:

```bash
cd /opt/roon-dashboard
git pull  # or manually copy new files
npm install
cd client
npm run build
cd ..
sudo systemctl restart roon-dashboard
```

## Security Notes

- Consider enabling HTTPS with Let's Encrypt/Certbot
- Restrict access to the dashboard behind a VPN or firewall
- Keep Node.js and npm packages updated
- Monitor disk space for the SQLite database

---

**Dashboard will be available at:** `http://your-server-ip/`

**Backend API:** `http://your-server-ip/api/`

**Database location:** `/opt/roon-dashboard/roon-dashboard.sqlite`

