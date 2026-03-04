# Visual Guide: What Changed

## The Problem

```
┌─────────────────────────────────┐
│  Roon Dashboard Service         │
│  (on 192.168.0.25:3001)         │
└────────────┬────────────────────┘
             │
             │ tries to connect to
             ↓
        localhost:9100 ❌
        (fails - service is on same machine!)
```

## The Fix

```
┌─────────────────────────────────┐
│  Roon Dashboard Service         │
│  (on 192.168.0.25:3001)         │
└────────────┬────────────────────┘
             │
             │ now connects to
             ↓
        192.168.0.25:9100 ✅
        (Roon Core!)
             │
             │ Roon sees the extension
             ↓
        ┌──────────────────┐
        │ Roon Extension   │
        │ "Roon Dashboard" │
        │ (Paired)         │
        └──────────────────┘
```

---

## Code Changes Side-by-Side

### Service File

**BEFORE:**
```ini
[Service]
Type=simple
User=set
WorkingDirectory=/opt/roonDashboard
Environment="ROON_CORE_IP=localhost"           ← WRONG!
Environment="PORT=3001"
Environment="NODE_ENV=production"
```

**AFTER:**
```ini
[Service]
Type=simple
User=set
WorkingDirectory=/opt/roonDashboard
Environment="ROON_CORE_IP=192.168.0.25"        ← FIXED!
Environment="PORT=3001"
Environment="NODE_ENV=production"
```

---

### Logging Improvements in roon.js

**BEFORE:**
```javascript
function startRoon() {
  console.log(`[Roon] Connecting to core at ${ROON_CORE_IP}:${ROON_CORE_PORT}...`);
  roon.ws_connect({ host: ROON_CORE_IP, port: ROON_CORE_PORT });
}
// If error happens: "ERROR undefined" 😕
```

**AFTER:**
```javascript
function startRoon() {
  console.log(`[Roon] Configuration - IP: ${ROON_CORE_IP}, Port: ${ROON_CORE_PORT}`);
  console.log(`[Roon] Connecting to core at ${ROON_CORE_IP}:${ROON_CORE_PORT}...`);
  try {
    roon.ws_connect({ host: ROON_CORE_IP, port: ROON_CORE_PORT });
  } catch (error) {
    console.error("[Roon] Connection error:", error);  ← Now we see the error!
  }
}
```

---

### Error Handling Added

**NEW in roon.js:**
```javascript
// Catch RoonApi errors
roon.on("error", (err) => {
  console.error("[Roon] RoonApi Error:", err);
});

// Catch unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  console.error("[Roon] Unhandled Rejection at:", promise, "reason:", reason);
});

// Catch uncaught exceptions
process.on("uncaughtException", (error) => {
  console.error("[Roon] Uncaught Exception:", error);
});
```

---

## Log Output Comparison

### BEFORE (Broken)
```
Mar 04 17:45:41 setsrv node[2674634]: [Server] API running on http://localhost:3001
Mar 04 17:45:41 setsrv node[2674634]: [Roon] Connecting to core at localhost:9100...
Mar 04 17:45:41 setsrv node[2674634]: ERROR undefined
```
↑ What's wrong? No idea! 😕

### AFTER (Fixed)
```
Mar 04 17:55:30 setsrv node[2682180]: [Server] API running on http://localhost:3001
Mar 04 17:55:30 setsrv node[2682180]: [Roon] Configuration - IP: 192.168.0.25, Port: 9100
Mar 04 17:55:30 setsrv node[2682180]: [Roon] Connecting to core at 192.168.0.25:9100...
Mar 04 17:55:30 setsrv node[2682180]: [Roon] Core paired: My Roon Setup
```
↑ Clear configuration, successful connection! ✅

---

## The 5-Second Impact Summary

| Aspect | Before | After |
|--------|--------|-------|
| **Roon Core IP** | `localhost` | `192.168.0.25` |
| **Connection Status** | ❌ Failed | ✅ Connected |
| **Error Messages** | `ERROR undefined` | Detailed error logs |
| **Extension in Roon** | ❌ Not visible | ✅ Visible & Paired |
| **Dashboard Data** | ❌ Not working | ✅ Live tracking |
| **Debug Info** | ❌ None | ✅ Configuration logged |

---

## Network Topology

```
Your Computer (192.168.X.X)
    ↓
    └── Roon App
         ↓
         (wants extensions from)
         ↓
    Roon Core (192.168.0.25:9100) ← Must be THIS IP!
         ↑
         └── Dashboard Service (192.168.0.25:3001)
             (connects to)
```

The Dashboard and Roon Core are on the SAME machine (192.168.0.25), so they need to talk via that IP, not "localhost"!

---

## Deployment Checklist Visual

```
YOUR COMPUTER                    SERVER (192.168.0.25)
     ┌─────────┐                      ┌──────────────────┐
     │ Files   │                      │ roon-dashboard   │
     │ Ready   │                      │ .service         │
     └────┬────┘                      │ ROON_CORE_IP=    │
          │                           │ 192.168.0.25 ✅ │
          │ SCP Copy                  └──────────────────┘
          ├─────────────────────────→│
          │                          │
          │                          │ sudo systemctl
          │                          │ restart
     ┌────┴────┐                     │
     │ Deploy  │                     ↓
     │ Script  │                  ┌──────────────────┐
     └────┬────┘                  │ Service Running  │
          │                       │ Connected to     │
          │ SSH Execute           │ 192.168.0.25:9100│
          ├──────────────────────→│ ✅ SUCCESS       │
          │                       └──────────────────┘
     ✅ DONE!
```

---

Generated: March 4, 2026

