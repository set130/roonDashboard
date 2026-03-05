const RoonApi = require("node-roon-api");
const RoonApiTransport = require("node-roon-api-transport");
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

    _transport.subscribe_zones(function (cmd, data) {
      console.log("[Roon] Zone subscription event: cmd=" + cmd);
      if (cmd === "Subscribed" && data.zones) {
        console.log("[Roon] Initial zones: " + data.zones.map(z => z.display_name).join(", "));
        handleZonesChanged(data.zones);
      } else if (cmd === "Changed") {
        if (data.zones_changed) {
          console.log("[Roon] zones_changed: " + data.zones_changed.map(z => z.display_name).join(", "));
          handleZonesChanged(data.zones_changed);
        }
        if (data.zones_removed) {
          console.log("[Roon] zones_removed: " + data.zones_removed.join(", "));
          handleZonesRemoved(data.zones_removed);
        }
        if (data.zones_added) {
          console.log("[Roon] zones_added: " + data.zones_added.map(z => z.display_name).join(", "));
          handleZonesChanged(data.zones_added);
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

module.exports = { startRoon, getImage, isConnected, roon };

