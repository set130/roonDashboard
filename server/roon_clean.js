const RoonApi = require("node-roon-api");
const RoonApiTransport = require("node-roon-api-transport");
const RoonApiImage = require("node-roon-api-image");
const RoonApiStatus = require("node-roon-api-status");
const { handleZonesChanged, handleZonesRemoved } = require("./tracker");

// Configuration from environment variables
const ROON_CORE_IP = process.env.ROON_CORE_IP || "100.90.5.35";
const ROON_CORE_PORT = parseInt(process.env.ROON_CORE_PORT || "9100", 10);

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

  core_paired: function (core) {
    console.log("[Roon] Core paired:", core.display_name);
    _core = core;
    _transport = core.services.RoonApiTransport;
    _image = core.services.RoonApiImage;

    _transport.subscribe_zones(function (cmd, data) {
      if (cmd === "Subscribed" && data.zones) {
        handleZonesChanged(data.zones);
      } else if (cmd === "Changed") {
        if (data.zones_changed) handleZonesChanged(data.zones_changed);
        if (data.zones_removed) handleZonesRemoved(data.zones_removed);
        if (data.zones_added) handleZonesChanged(data.zones_added);
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

// Connect to the Roon Core at the specified IP
function startRoon() {
  console.log(`[Roon] Connecting to core at ${ROON_CORE_IP}:${ROON_CORE_PORT}...`);
  roon.ws_connect({ host: ROON_CORE_IP, port: ROON_CORE_PORT });
}

function getImage(image_key, opts, cb) {
  if (!_image) return cb(new Error("Not connected to Roon core"));
  _image.get_image(image_key, opts, cb);
}

function isConnected() {
  return _core !== null;
}

module.exports = { startRoon, getImage, isConnected, roon };

