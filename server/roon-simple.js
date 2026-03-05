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

