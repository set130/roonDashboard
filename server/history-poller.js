const { insertPlay } = require("./db");

// ── Configuration ──────────────────────────────────────────────
const POLL_INTERVAL_MS = 60000;   // Poll every 60 seconds
const MIN_PLAY_SECS    = 30;      // Minimum play duration to log
const MAX_ITEMS        = 100;     // Max history items to fetch per poll

// ── State ──────────────────────────────────────────────────────
let _browse       = null;
let pollInterval  = null;
let seenKeys      = new Set();    // item_keys we've already processed
let diagnosticLog = [];           // stores raw responses for diagnosis
let diagEnabled   = true;         // first poll always dumps diagnostics

// ────────────────────────────────────────────────────────────────
//  Public API
// ────────────────────────────────────────────────────────────────

function init(core) {
  if (!core || !core.services || !core.services.RoonApiBrowse) {
    console.log("[HistoryPoller] Browse API not available");
    return;
  }
  _browse = core.services.RoonApiBrowse;
  console.log("[HistoryPoller] Initialized with Browse API");
  startPolling();
}

function startPolling() {
  if (pollInterval) clearInterval(pollInterval);
  console.log("[HistoryPoller] Starting history polling every " + (POLL_INTERVAL_MS / 1000) + "s");
  pollHistory();                                      // immediate first poll
  pollInterval = setInterval(pollHistory, POLL_INTERVAL_MS);
}

function stopPolling() {
  if (pollInterval) { clearInterval(pollInterval); pollInterval = null; }
  console.log("[HistoryPoller] Stopped polling");
}

function cleanup() {
  stopPolling();
  _browse = null;
  seenKeys.clear();
}

/** Return the diagnostic log collected so far (for the /api/debug/browse endpoint). */
function getDiagnosticLog() {
  return diagnosticLog;
}

/** Force a one-off diagnostic dump on the next poll. */
function triggerDiagnostic() {
  diagEnabled = true;
  diagnosticLog = [];
  pollHistory();
}

// ────────────────────────────────────────────────────────────────
//  Core polling logic
// ────────────────────────────────────────────────────────────────

function pollHistory() {
  if (!_browse) {
    console.log("[HistoryPoller] Browse API not available, skipping poll");
    return;
  }

  console.log("[HistoryPoller] Polling Roon history…");

  // Step 1: pop to root of browse hierarchy
  _browse.browse({ hierarchy: "browse", pop_all: true }, function (err, rootResp) {
    if (err) { console.error("[HistoryPoller] browse root error:", err); return; }

    logDiag("ROOT_BROWSE", rootResp);

    if (!rootResp || !rootResp.list) {
      console.log("[HistoryPoller] No list in root browse response");
      return;
    }

    // Step 2: load the root-level items so we can find "History" / "My Live Radio" etc.
    _browse.load(
      { hierarchy: "browse", offset: 0, count: 100 },
      function (err, loadResp) {
        if (err) { console.error("[HistoryPoller] load root error:", err); return; }

        logDiag("ROOT_LOAD", loadResp);

        if (!loadResp || !loadResp.items || loadResp.items.length === 0) {
          console.log("[HistoryPoller] No items in root load response");
          return;
        }

        console.log("[HistoryPoller] Root items: " +
          loadResp.items.map(function(i) { return '"' + i.title + '"'; }).join(", "));

        // Look for the History entry (Roon uses "History" in its browse menu)
        var historyItem = loadResp.items.find(function(i) {
          return /^history$/i.test(i.title) ||
            /^recently played$/i.test(i.title) ||
            /^play history$/i.test(i.title);
        });

        if (!historyItem) {
          console.log("[HistoryPoller] 'History' not found among root items");
          // Try one level deeper – some Roon setups nest History under "Library"
          var libraryItem = loadResp.items.find(function(i) {
            return /^(my )?library$/i.test(i.title);
          });
          if (libraryItem) {
            browseIntoItem(libraryItem, "Library", function (items) {
              var hItem = items.find(function(i) { return /^history$/i.test(i.title); });
              if (hItem) {
                browseIntoHistory(hItem);
              } else {
                console.log("[HistoryPoller] History not found inside Library either");
                console.log("[HistoryPoller] Library sub-items: " +
                  items.map(function(i) { return '"' + i.title + '"'; }).join(", "));
              }
            });
          }
          return;
        }

        browseIntoHistory(historyItem);
      }
    );
  });
}

/**
 * Browse INTO a menu item (not load — browse navigates, load reads the list).
 * Calls back with the loaded items array.
 */
function browseIntoItem(item, label, cb) {
  _browse.browse(
    { hierarchy: "browse", item_key: item.item_key },
    function (err, browseResp) {
      if (err) { console.error("[HistoryPoller] browse " + label + " error:", err); return; }

      logDiag(label + "_BROWSE", browseResp);

      _browse.load(
        { hierarchy: "browse", offset: 0, count: MAX_ITEMS },
        function (err, loadResp) {
          if (err) { console.error("[HistoryPoller] load " + label + " error:", err); return; }

          logDiag(label + "_LOAD", loadResp);

          cb((loadResp && loadResp.items) || []);
        }
      );
    }
  );
}

/**
 * Navigate into the History item, load its entries, and process them.
 */
function browseIntoHistory(historyItem) {
  console.log("[HistoryPoller] Found history item: " + historyItem.title +
    " (key: " + historyItem.item_key + ")");

  _browse.browse(
    { hierarchy: "browse", item_key: historyItem.item_key },
    function (err, browseResp) {
      if (err) { console.error("[HistoryPoller] browse History error:", err); return; }

      logDiag("HISTORY_BROWSE", browseResp);

      var totalItems = (browseResp && browseResp.list && browseResp.list.count) || MAX_ITEMS;
      var fetchCount = Math.min(totalItems, MAX_ITEMS);

      _browse.load(
        { hierarchy: "browse", offset: 0, count: fetchCount },
        function (err, loadResp) {
          if (err) { console.error("[HistoryPoller] load History error:", err); return; }

          logDiag("HISTORY_LOAD", loadResp);

          if (!loadResp || !loadResp.items || loadResp.items.length === 0) {
            console.log("[HistoryPoller] History list is empty");
            return;
          }

          console.log("[HistoryPoller] Fetched " + loadResp.items.length + " history items");

          // Log first 3 raw items for ongoing diagnostics
          loadResp.items.slice(0, 3).forEach(function (item, idx) {
            console.log("[HistoryPoller] Sample item #" + idx + ": " +
              JSON.stringify(item));
          });

          processHistoryItems(loadResp.items, loadResp.list);

          // Disable diagnostic dump after the first successful poll
          if (diagEnabled) {
            diagEnabled = false;
            console.log("[HistoryPoller] Diagnostic dump captured — " +
              diagnosticLog.length + " entries. GET /api/debug/browse to view.");
          }
        }
      );
    }
  );
}

// ────────────────────────────────────────────────────────────────
//  Processing history items
// ────────────────────────────────────────────────────────────────

function processHistoryItems(items, listInfo) {
  var newCount = 0;

  for (var i = 0; i < items.length; i++) {
    var item = items[i];
    if (!item.title) continue;

    // ── De-duplicate by item_key (stable across polls) ──
    var dedupKey = item.item_key || (item.title + "|" + (item.subtitle || ""));

    if (seenKeys.has(dedupKey)) continue;  // already processed

    var play = extractPlay(item);
    if (!play) continue;
    if (play.played_secs < MIN_PLAY_SECS) continue;

    try {
      insertPlay(play);
      seenKeys.add(dedupKey);
      newCount++;
      console.log("[HistoryPoller] ✓ " + play.track_title + " by " + play.artist +
        " (" + play.played_secs + "s) [" + play.zone_name + "]");
    } catch (err) {
      // Likely a duplicate from a previous run — harmless
      console.error("[HistoryPoller] insert error:", err.message);
    }
  }

  if (newCount > 0) {
    console.log("[HistoryPoller] Logged " + newCount + " new plays");
  } else {
    console.log("[HistoryPoller] No new plays");
  }
}

/**
 * Extract a play record from a Roon history browse item.
 *
 * We intentionally log the raw item structure on the first poll so we can
 * refine parsing once we see the real data coming from YOUR Roon core.
 *
 * Expected item shape (may vary by Roon version):
 *   title    – track name
 *   subtitle – "Artist" or "Artist - Album"
 *   hint     – may hold zone, duration, or timestamp info
 *   image_key – album art key
 *   item_key – stable identifier
 */
function extractPlay(item) {
  var track_title = item.title || "Unknown Track";
  var artist  = "Unknown Artist";
  var album   = "Unknown Album";
  var zone_name = "Unknown Zone";
  var played_secs = 0;

  // ── Subtitle: "Artist – Album" or just "Artist" ──
  if (item.subtitle) {
    // Roon sometimes uses " - " or " – " (en-dash)
    var parts = item.subtitle.split(/\s[-\u2013]\s/);
    artist = parts[0].trim();
    if (parts.length >= 2) {
      album = parts.slice(1).join(" - ").trim();
    }
  }

  // ── Hint: could be zone, timestamp, or "3:45" duration ──
  if (item.hint) {
    // Try "Zone • M:SS" pattern first
    var zoneAndDur = item.hint.match(/^(.+?)\s*[\u2022\u00B7]\s*(\d+):(\d+)/);
    if (zoneAndDur) {
      zone_name   = zoneAndDur[1].trim();
      played_secs = parseInt(zoneAndDur[2], 10) * 60 + parseInt(zoneAndDur[3], 10);
    } else {
      // Standalone duration "M:SS"
      var durOnly = item.hint.match(/^(\d+):(\d+)$/);
      if (durOnly) {
        played_secs = parseInt(durOnly[1], 10) * 60 + parseInt(durOnly[2], 10);
      } else {
        // Treat the whole hint as zone or descriptive text
        zone_name = item.hint.trim();
      }
    }
  }

  // If we still have no duration, fall back to minimum so it at least gets recorded
  if (played_secs === 0) {
    played_secs = MIN_PLAY_SECS;
  }

  var now = new Date();
  var started_at = new Date(now.getTime() - played_secs * 1000);

  return {
    zone_id:       "history_" + zone_name.toLowerCase().replace(/\s+/g, "_"),
    zone_name:     zone_name,
    track_title:   track_title,
    artist:        artist,
    album:         album,
    duration_secs: played_secs,
    played_secs:   played_secs,
    started_at:    started_at.toISOString(),
    ended_at:      now.toISOString(),
    image_key:     item.image_key || null,
  };
}

// ────────────────────────────────────────────────────────────────
//  Diagnostic helpers
// ────────────────────────────────────────────────────────────────

function logDiag(label, data) {
  if (!diagEnabled) return;
  var entry = {
    label:     label,
    timestamp: new Date().toISOString(),
    data:      data,
  };
  diagnosticLog.push(entry);
  console.log("[HistoryPoller][DIAG] " + label + ": " + JSON.stringify(data, null, 2));
}

module.exports = {
  init,
  startPolling,
  stopPolling,
  cleanup,
  getDiagnosticLog,
  triggerDiagnostic,
};
