#!/usr/bin/env node
/**
 * Debug script to check what zones are connected to Roon Core
 * and their current playback states
 */

require("dotenv").config();
const RoonApi = require("node-roon-api");
const RoonApiTransport = require("node-roon-api-transport");
const RoonApiImage = require("node-roon-api-image");

const ROON_CORE_IP = process.env.ROON_CORE_IP || "100.90.5.35";
const ROON_CORE_PORT = parseInt(process.env.ROON_CORE_PORT || "9100", 10);

let _core = null;
let _transport = null;
let allZones = [];

const roon = new RoonApi({
  extension_id: "com.roon-dashboard.debug",
  display_name: "Roon Dashboard Debug",
  display_version: "1.0.0",
  publisher: "Roon Dashboard",
  email: "debug@local",

  core_paired: function (core) {
    console.log("\n[DEBUG] Core paired:", core.display_name);
    _core = core;
    _transport = core.services.RoonApiTransport;

    _transport.subscribe_zones(function (cmd, data) {
      console.log("\n[DEBUG] Zone subscription event: cmd=" + cmd);

      if (cmd === "Subscribed" && data.zones) {
        console.log("[DEBUG] Initial zones received: " + data.zones.length);
        allZones = data.zones;
        printZoneDetails();

        // Exit after first subscription
        setTimeout(() => {
          console.log("\n[DEBUG] Exiting debug script...");
          process.exit(0);
        }, 2000);
      } else if (cmd === "Changed") {
        if (data.zones_changed) {
          console.log("[DEBUG] Zones changed: " + data.zones_changed.length);
          allZones = data.zones_changed;
          printZoneDetails();
        }
        if (data.zones_added) {
          console.log("[DEBUG] Zones added: " + data.zones_added.length);
          printZoneDetails(data.zones_added);
        }
        if (data.zones_removed) {
          console.log("[DEBUG] Zones removed: " + data.zones_removed.join(", "));
        }
      }
    });
  },

  core_unpaired: function (core) {
    console.log("[DEBUG] Core unpaired:", core.display_name);
    _core = null;
    _transport = null;
  },
});

roon.init_services({
  required_services: [RoonApiTransport, RoonApiImage],
});

function printZoneDetails(zones) {
  zones = zones || allZones;
  if (!zones || zones.length === 0) {
    console.log("[DEBUG] No zones to display");
    return;
  }

  zones.forEach((zone) => {
    console.log("\n[DEBUG] Zone Details:");
    console.log("  Zone ID: " + zone.zone_id);
    console.log("  Name: " + zone.display_name);
    console.log("  State: " + zone.state);
    console.log("  Outputs: " + (zone.outputs ? zone.outputs.length : 0));

    if (zone.now_playing) {
      console.log("  Now Playing:");
      console.log("    Title: " + zone.now_playing.three_line.line1);
      console.log("    Artist: " + zone.now_playing.three_line.line2);
      console.log("    Album: " + zone.now_playing.three_line.line3);
      console.log("    Duration: " + zone.now_playing.length + "s");
      console.log("    Seek: " + zone.now_playing.seek_position + "s");
    } else {
      console.log("  No track playing");
    }

    if (zone.settings) {
      console.log("  Settings:");
      console.log("    Volume: " + JSON.stringify(zone.settings.volume));
      console.log("    Loop: " + zone.settings.loop);
      console.log("    Shuffle: " + zone.settings.shuffle);
    }
  });
}

console.log("[DEBUG] Connecting to Roon Core at " + ROON_CORE_IP + ":" + ROON_CORE_PORT);
console.log("[DEBUG] (If using discovery, Core IP may differ)");

const directConnect = process.env.ROON_DIRECT_CONNECT === "true";
if (directConnect) {
  console.log("[DEBUG] Using direct connection...");
  roon.ws_connect({ host: ROON_CORE_IP, port: ROON_CORE_PORT });
} else {
  console.log("[DEBUG] Using discovery mode...");
  roon.start_discovery();
}

// Timeout after 10 seconds
setTimeout(() => {
  console.log("\n[DEBUG] Timeout - no zones received. Exiting.");
  process.exit(1);
}, 10000);

process.on("SIGINT", () => {
  console.log("\n[DEBUG] Interrupted");
  process.exit(0);
});

