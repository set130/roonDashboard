# Roon Dashboard Deployment Fix

## Problem
The service was connecting to `localhost:9100` instead of `192.168.0.25:9100`, causing connection failures.

## Root Cause
The `roon-dashboard.service` file had `Environment="ROON_CORE_IP=localhost"` instead of the server's actual IP.

## Solution Applied

### 1. Service File Configuration
**File:** `/etc/systemd/system/roon-dashboard.service`
**Change:** 
- FROM: `Environment="ROON_CORE_IP=localhost"`
- TO: `Environment="ROON_CORE_IP=192.168.0.25"`

### 2. Enhanced Error Handling
**File:** `/opt/roonDashboard/server/roon.js`
**Changes:**
- Added unhandledRejection handler
- Added uncaughtException handler  
- Added debug logging for configuration
- Wrapped ws_connect in try-catch

### 3. Server Error Handlers
**File:** `/opt/roonDashboard/server/index.js`
- Already has proper error handlers
- Calls `startRoon()` on server initialization

## Files to Deploy

1. **roon-dashboard.service** → `/etc/systemd/system/roon-dashboard.service`
2. **server/roon.js** → `/opt/roonDashboard/server/roon.js`

## Deployment Steps

```bash
# On the server as root/with sudo:

# 1. Copy and deploy the service file
sudo cp /tmp/roon-dashboard.service /etc/systemd/system/roon-dashboard.service

# 2. Copy the updated roon.js
sudo cp /tmp/roon.js /opt/roonDashboard/server/roon.js

# 3. Reload systemd configuration
sudo systemctl daemon-reload

# 4. Restart the service
sudo systemctl restart roon-dashboard

# 5. Check status
sudo systemctl status roon-dashboard

# 6. View recent logs
sudo journalctl -u roon-dashboard -n 50 --no-pager
```

## Expected Behavior After Fix

You should see in the logs:
```
[Server] API running on http://localhost:3001
[Roon] Configuration - IP: 192.168.0.25, Port: 9100
[Roon] Connecting to core at 192.168.0.25:9100...
[Roon] Core paired: <your Roon core name>
```

## Verification

1. **API Status:** `curl http://192.168.0.25:3001/api/status`
   - Should return: `{"connected":true}`

2. **Now Playing:** `curl http://192.168.0.25:3001/api/now-playing`
   - Should return zone information

3. **Extension in Roon:** Check Extensions section in Roon app
   - Should show "Roon Dashboard" extension as paired


