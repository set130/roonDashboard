#!/bin/bash

# Roon Dashboard - Quick Setup Script
# Run this on your server to set everything up automatically

set -e

echo "=== Roon Dashboard Auto-Setup ==="
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then
  echo "Please run this script with sudo"
  exit 1
fi

# Get the user to run as
read -p "Enter the Linux username to run Roon Dashboard as: " APP_USER

# Check user exists
if ! id "$APP_USER" &>/dev/null; then
  echo "User $APP_USER does not exist. Creating..."
  useradd -m -s /bin/bash "$APP_USER"
fi

echo "Step 1: Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

echo "Step 2: Creating application directory..."
mkdir -p /opt/roon-dashboard
chown "$APP_USER:$APP_USER" /opt/roon-dashboard

echo "Step 3: Asking for configuration..."
read -p "Enter your Roon Core IP address [100.90.5.35]: " ROON_CORE_IP
ROON_CORE_IP=${ROON_CORE_IP:-100.90.5.35}

read -p "Enter the port for the backend [3001]: " BACKEND_PORT
BACKEND_PORT=${BACKEND_PORT:-3001}

echo "Step 4: Setting up systemd service..."
cat > /etc/systemd/system/roon-dashboard.service <<EOF
[Unit]
Description=Roon Dashboard Backend
After=network.target

[Service]
Type=simple
User=$APP_USER
WorkingDirectory=/opt/roon-dashboard
ExecStart=/usr/bin/node server/index.js
Restart=always
RestartSec=10
Environment="PORT=$BACKEND_PORT"
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

echo "Step 5: Installing nginx..."
apt-get install -y nginx

echo "Step 6: Configuring nginx..."
cat > /etc/nginx/sites-available/roon-dashboard <<EOF
server {
    listen 80;
    server_name _;

    location / {
        root /opt/roon-dashboard/client/dist;
        try_files \$uri \$uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://localhost:$BACKEND_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    }
}
EOF

ln -sf /etc/nginx/sites-available/roon-dashboard /etc/nginx/sites-enabled/roon-dashboard
rm -f /etc/nginx/sites-enabled/default

echo "Step 7: Enabling and starting services..."
systemctl daemon-reload
systemctl enable roon-dashboard
systemctl enable nginx
systemctl start roon-dashboard
systemctl restart nginx

echo ""
echo "=== Setup Complete! ==="
echo ""
echo "Next steps:"
echo "1. Copy your project files to /opt/roonDashboard/"
echo "   scp -r . $APP_USER@your-server:/opt/roonDashboard/"
echo ""
echo "2. Install dependencies on the server:"
echo "   ssh $APP_USER@your-server"
echo "   cd /opt/roonDashboard"
echo "   npm install"
echo "   cd client && npm run build && cd .."
echo ""
echo "3. Approve the extension in Roon:"
echo "   Settings → Extensions → Approve 'Roon Dashboard'"
echo ""
echo "4. Access the dashboard at:"
echo "   http://your-server-ip"
echo ""
echo "To view logs: sudo journalctl -u roon-dashboard -f"
echo "To check status: sudo systemctl status roon-dashboard"

