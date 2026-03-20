const RoonApi = require("node-roon-api");
const RoonApiTransport = require("node-roon-api-transport");
const RoonApiBrowse = require("node-roon-api-browse");
const RoonApiImage = require("node-roon-api-image");
const RoonApiStatus = require("node-roon-api-status");
const { handleZonesChanged, handleZonesRemoved } = require("./tracker");

// Configuration from environment variables
const ROON_CORE_IP = process.env.ROON_CORE_IP || "100.90.5.35";
const ROON_CORE_PORT = parseInt(process.env.ROON_CORE_PORT || "9100", 10);
const ROON_LOG_LEVEL = process.env.ROON_LOG_LEVEL || "none";

let _core = null;
let _transport = null;
let _image = null;
let _browse = null;

const roon = new RoonApi({
  extension_id: "com.roon-dashboard.stats",
  display_name: "Roon Dashboard",
  display_version: "1.0.0",
  publisher: "Roon Dashboard",
  email: "dashboard@local",
  website: "",
  log_level: ROON_LOG_LEVEL,
  moo_onerror: function () {
    console.error("[Roon] Transport error while talking to core (moo_onerror)");
  },

  core_paired: function (core) {
    console.log("[Roon] Core paired:", core.display_name);
    _core = core;
    _transport = core.services.RoonApiTransport;
    _image = core.services.RoonApiImage;
    _browse = core.services.RoonApiBrowse;

    _transport.subscribe_zones(function (cmd, data) {
      console.log("[Roon] ========================================");
      console.log("[Roon] Zone subscription event: cmd=" + cmd);
      console.log("[Roon] Timestamp:", new Date().toISOString());

      // Log the complete raw data
      if (data) {
        console.log("[Roon] RAW EVENT DATA:");
        console.log(JSON.stringify(data, null, 2));
      }

      if (cmd === "Subscribed") {
        console.log("[Roon] ========================================");
        console.log("[Roon] INITIAL SUBSCRIPTION - ALL ZONES:");
        console.log("[Roon] ========================================");

        if (data.zones) {
          console.log("[Roon] Total zones found: " + data.zones.length);
          data.zones.forEach(function(zone, idx) {
            console.log("[Roon] Zone #" + (idx + 1) + ":");
            console.log("  - Name: " + zone.display_name);
            console.log("  - ID: " + zone.zone_id);
            console.log("  - State: " + zone.state);
            console.log("  - Outputs: " + (zone.outputs ? zone.outputs.length : 0));
            if (zone.outputs) {
              zone.outputs.forEach(function(output, outIdx) {
                console.log("    Output #" + (outIdx + 1) + ": " + output.display_name + " (ID: " + output.output_id + ")");
              });
            }
          });
          handleZonesChanged(data.zones);
        }
        console.log("[Roon] ========================================");
      } else if (cmd === "Changed") {
        if (data.zones_changed) {
          console.log("[Roon] zones_changed (" + data.zones_changed.length + "):");
          data.zones_changed.forEach(function(zone) {
            console.log("  - " + zone.display_name + " (ID: " + zone.zone_id + ") [" + zone.state + "]");
          });
          handleZonesChanged(data.zones_changed);
        }
        if (data.zones_removed) {
          console.log("[Roon] zones_removed: " + data.zones_removed.join(", "));
          handleZonesRemoved(data.zones_removed);
        }
        if (data.zones_added) {
          console.log("[Roon] zones_added (" + data.zones_added.length + "):");
          data.zones_added.forEach(function(zone) {
            console.log("  - " + zone.display_name + " (ID: " + zone.zone_id + ") [" + zone.state + "]");
            if (zone.outputs) {
              zone.outputs.forEach(function(output) {
                console.log("    Output: " + output.display_name);
              });
            }
          });
          handleZonesChanged(data.zones_added);
        }
      }
      console.log("[Roon] ========================================");
    });


    svcStatus.set_status("Connected to " + core.display_name, false);
  },

  core_unpaired: function (core) {
    console.log("[Roon] Core unpaired:", core.display_name);
    _core = null;
    _transport = null;
    _image = null;
    _browse = null;
    svcStatus.set_status("Disconnected", true);
  },
});

const svcStatus = new RoonApiStatus(roon);

roon.init_services({
  required_services: [RoonApiTransport, RoonApiImage, RoonApiBrowse],
  provided_services: [svcStatus],
});

// node-roon-api is not guaranteed to be an EventEmitter in all versions.
if (typeof roon.on === "function") {
  roon.on("error", (err) => {
    console.error("[Roon] RoonApi Error:", err);
  });
} else {
  console.warn("[Roon] RoonApi error events are not supported by this library version.");
}

process.on("unhandledRejection", (reason, promise) => {
  console.error("[Roon] Unhandled Rejection at:", promise, "reason:", reason);
});

process.on("uncaughtException", (error) => {
  console.error("[Roon] Uncaught Exception:", error);
});

// Connect to Roon Core.
// By default use discovery because Core HTTP port is not guaranteed to be 9100.
function startRoon() {
  const directConnect = process.env.ROON_DIRECT_CONNECT === "true";

  if (directConnect) {
    console.log(`[Roon] Direct mode - IP: ${ROON_CORE_IP}, Port: ${ROON_CORE_PORT}`);
    try {
      roon.ws_connect({ host: ROON_CORE_IP, port: ROON_CORE_PORT });
    } catch (error) {
      console.error("[Roon] Direct connection error:", error);
    }
    return;
  }

  console.log("[Roon] Discovery mode - searching for Roon Core on local network...");
  try {
    roon.start_discovery();
  } catch (error) {
    console.error("[Roon] Discovery start error:", error);
  }
}

function getImage(image_key, opts, cb) {
  if (!_image) return cb(new Error("Not connected to Roon core"));
  _image.get_image(image_key, opts, cb);
}

function isConnected() {
  return _core !== null;
}

function getZones(cb) {
  if (!_transport) return cb(new Error("Not connected"));
  _core.services.RoonApiTransport.get_zones(cb);
}

function control(zone_id, command, cb) {
  if (!_transport) return cb && cb(new Error("Not connected"));
  _transport.control(zone_id, command, cb);
}

function browse(opts, cb) {
  if (!_browse) return cb(new Error("Not connected"));
  _browse.browse(opts, cb);
}

function load(opts, cb) {
  if (!_browse) return cb(new Error("Not connected"));
  _browse.load(opts, cb);
}

module.exports = { startRoon, getImage, isConnected, roon, getZones, control, browse, load };

