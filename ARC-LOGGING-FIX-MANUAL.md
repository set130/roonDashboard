# Arc Logging Not Working - Manual Fix

## Problem
The logs are not showing up when running `journalctl -u roon-dashboard -f`

## Possible Causes

1. **Service not running** - The service failed to start
2. **Syntax error in roon.js** - JavaScript error preventing startup
3. **Missing dependencies** - node-roon-api-browse not installed
4. **Permission issues** - Service can't write to logs

## Manual Diagnostic Steps

### Step 1: Check Service Status

```bash
ssh set@192.168.0.25
sudo systemctl status roon-dashboard
```

**Look for:**
- "active (running)" = Good ✅
- "failed" or "inactive" = Problem ❌

### Step 2: View Recent Logs

```bash
sudo journalctl -u roon-dashboard -n 50 --no-pager
```

**Look for:**
- Startup messages
- Error messages
- "Core paired" message
- Any JavaScript errors

### Step 3: Check for Errors

```bash
sudo journalctl -u roon-dashboard -n 100 --no-pager | grep -i "error"
```

### Step 4: Test roon.js Syntax

```bash
cd /opt/roonDashboard
node -c server/roon.js
```

If it says nothing, syntax is OK ✅  
If it shows error, there's a syntax problem ❌

### Step 5: Check Node Modules

```bash
cd /opt/roonDashboard
ls -la node_modules | grep roon
```

**Should see:**
- node-roon-api
- node-roon-api-browse
- node-roon-api-image
- node-roon-api-status
- node-roon-api-transport

### Step 6: Manually Restart Service

```bash
sudo systemctl restart roon-dashboard
sleep 3
sudo systemctl status roon-dashboard
```

## Common Fixes

### Fix 1: Service Failed to Start

**If status shows "failed":**

```bash
# Check what the error is
sudo journalctl -u roon-dashboard -n 50 --no-pager

# Try manual start to see error
cd /opt/roonDashboard
node server/index.js
```

This will show the actual error.

### Fix 2: Missing Dependencies

**If you see "Cannot find module 'node-roon-api-browse'":**

```bash
cd /opt/roonDashboard
sudo npm install
sudo systemctl restart roon-dashboard
```

### Fix 3: Syntax Error in roon.js

**If node -c shows syntax error:**

The latest roon.js might have an issue. Restore backup:

```bash
sudo cp /opt/roonDashboard/server/roon.js.bak /opt/roonDashboard/server/roon.js
sudo systemctl restart roon-dashboard
```

Then we'll need to fix the verbose logging code.

### Fix 4: Permissions Issue

```bash
sudo chown -R roon-dashboard:roon-dashboard /opt/roonDashboard
sudo systemctl restart roon-dashboard
```

(Replace roon-dashboard with actual user if different)

## Simplified roon.js (If Current One Has Issues)

If the verbose logging version has problems, here's a simpler version with just basic Arc detection:

**Save this to a file locally as `roon-simple.js`:**

```javascript
const RoonApi = require("node-roon-api");
const RoonApiTransport = require("node-roon-api-transport");
const RoonApiImage = require("node-roon-api-image");
const RoonApiStatus = require("node-roon-api-status");
const { handleZonesChanged, handleZonesRemoved } = require("./tracker");

const ROON_CORE_IP = process.env.ROON_CORE_IP || "100.90.5.35";
const ROON_CORE_PORT = parseInt(process.env.ROON_CORE_PORT || "9100", 10);
const ROON_LOG_LEVEL = process.env.ROON_LOG_LEVEL || "none";

let _core = null;
let _transport = null;
let _image = null;

const roon = new RoonApi({
  extension_id: "com.roon-dashboard.stats",
  display_name: "Roon Dashboard",
  display_version: "1.0.0",
  publisher: "Roon Dashboard",
  email: "dashboard@local",
  website: "",
  log_level: ROON_LOG_LEVEL,

  core_paired: function (core) {
    console.log("[Roon] ============ CORE PAIRED ============");
    console.log("[Roon] Core:", core.display_name);
    _core = core;
    _transport = core.services.RoonApiTransport;
    _image = core.services.RoonApiImage;

    _transport.subscribe_zones(function (cmd, data) {
      console.log("[Roon] Event:", cmd, "at", new Date().toISOString());
      
      if (cmd === "Subscribed" && data.zones) {
        console.log("[Roon] ZONES AT STARTUP:");
        data.zones.forEach(function(z) {
          console.log("  - " + z.display_name + " (ID:" + z.zone_id + ") [" + z.state + "]");
        });
        handleZonesChanged(data.zones);
      } else if (cmd === "Changed") {
        if (data.zones_added) {
          console.log("[Roon] ZONES ADDED:");
          data.zones_added.forEach(function(z) {
            console.log("  + " + z.display_name + " (ID:" + z.zone_id + ")");
          });
          handleZonesChanged(data.zones_added);
        }
        if (data.zones_changed) {
          console.log("[Roon] ZONES CHANGED:");
          data.zones_changed.forEach(function(z) {
            console.log("  ~ " + z.display_name + " [" + z.state + "]");
          });
          handleZonesChanged(data.zones_changed);
        }
        if (data.zones_removed) {
          console.log("[Roon] ZONES REMOVED:", data.zones_removed);
          handleZonesRemoved(data.zones_removed);
        }
      }
    });

    svcStatus.set_status("Connected to " + core.display_name, false);
  },

  core_unpaired: function (core) {
    console.log("[Roon] Core unpaired:", core.display_name);
    _core = null;
    _transport = null;
    _image = null;
    svcStatus.set_status("Disconnected", true);
  },
});

const svcStatus = new RoonApiStatus(roon);

roon.init_services({
  required_services: [RoonApiTransport, RoonApiImage],
  provided_services: [svcStatus],
});

function startRoon() {
  console.log("[Roon] Starting Roon connection...");
  const directConnect = process.env.ROON_DIRECT_CONNECT === "true";

  if (directConnect) {
    console.log("[Roon] Direct mode - IP:" + ROON_CORE_IP + " Port:" + ROON_CORE_PORT);
    roon.ws_connect({ host: ROON_CORE_IP, port: ROON_CORE_PORT });
  } else {
    console.log("[Roon] Discovery mode - searching for Roon Core...");
    roon.start_discovery();
  }
}

function getImage(image_key, opts, cb) {
  if (!_image) return cb(new Error("Not connected to Roon core"));
  _image.get_image(image_key, opts, cb);
}

function isConnected() {
  return _core !== null;
}

module.exports = { startRoon, getImage, isConnected, roon };
```

**Deploy the simple version:**

```bash
# On your local machine
scp roon-simple.js set@192.168.0.25:/tmp/roon-simple.js

# On the server
ssh set@192.168.0.25
sudo cp /tmp/roon-simple.js /opt/roonDashboard/server/roon.js
sudo systemctl restart roon-dashboard

# Check if it starts
sudo systemctl status roon-dashboard

# Watch logs
journalctl -u roon-dashboard -f
```

## What to Report

Please run the diagnostic steps above and share:

1. **Service status** - Is it active or failed?
2. **Error messages** - Any errors in the logs?
3. **Syntax check** - Does `node -c server/roon.js` pass?
4. **Manual start** - What happens when you run `node server/index.js`?

This will help us identify exactly what's wrong.

## Quick Test

Simplest test to see if service works AT ALL:

```bash
ssh set@192.168.0.25
sudo systemctl stop roon-dashboard
cd /opt/roonDashboard
node server/index.js
```

This runs it in foreground - you'll see all output directly. Press Ctrl+C to stop.

If this works but systemctl doesn't, it's a service configuration issue.
If this doesn't work, you'll see the exact error message.

