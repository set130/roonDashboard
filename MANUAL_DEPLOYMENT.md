# Roon Dashboard Deployment Guide

## Step 1: Create Directory on Server
```bash
ssh set@100.90.5.35 "mkdir -p /opt/roonDashboard"
```

## Step 2: Deploy Files (from your laptop)
```bash
cd /home/set/WebstormProjects/roonDashboard

# Copy all files except node_modules and .git
scp -r \
  --exclude=node_modules \
  --exclude=.git \
  --exclude="roon-dashboard.sqlite*" \
  . set@100.90.5.35:/opt/roonDashboard/
```

## Step 3: Install Dependencies on Server
```bash
ssh set@100.90.5.35 << 'EOF'
cd /opt/roonDashboard

# Install root dependencies
npm install

# Install and build frontend
cd client
npm install
npm run build
cd ..

echo "✓ Dependencies installed and frontend built"
EOF
```

## Step 4: Set Up Systemd Service
```bash
ssh set@100.90.5.35 << 'EOF'
sudo cp /opt/roonDashboard/roon-dashboard.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable roon-dashboard
sudo systemctl start roon-dashboard

# Check status
sudo systemctl status roon-dashboard
EOF
```

## Step 5: Verify Installation
```bash
# Check if service is running
ssh set@100.90.5.35 "sudo systemctl is-active roon-dashboard"

# Check logs
ssh set@100.90.5.35 "sudo journalctl -u roon-dashboard -n 20"

# Test API
curl http://100.90.5.35:3001/api/status
```

## Step 6: Access Dashboard
Open browser to: **http://100.90.5.35/**

---

## Troubleshooting

### Port 3001 already in use
```bash
ssh set@100.90.5.35 "sudo lsof -i :3001"
```

### Service failed to start
```bash
ssh set@100.90.5.35 "sudo journalctl -u roon-dashboard -e"
```

### Permission denied
```bash
ssh set@100.90.5.35 "sudo chown -R set:set /opt/roonDashboard"
```

