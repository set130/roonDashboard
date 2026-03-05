const { insertPlay } = require("./db");

// Track the last play we've seen to avoid duplicates
let lastSeenPlayId = null;
let lastPollTime = new Date();
let _browse = null;
let pollInterval = null;

const POLL_INTERVAL_MS = 30000; // Poll every 30 seconds
const MIN_PLAY_SECS = 30; // Minimum play duration to log

function init(core) {
  if (!core || !core.services || !core.services.RoonApiBrowse) {
    console.log("[HistoryPoller] Browse API not available");
    return;
  }

  _browse = core.services.RoonApiBrowse;
  console.log("[HistoryPoller] Initialized with Browse API");

  // Start polling
  startPolling();
}

function startPolling() {
  if (pollInterval) {
    clearInterval(pollInterval);
  }

  console.log("[HistoryPoller] Starting history polling every " + (POLL_INTERVAL_MS / 1000) + " seconds");

  // Poll immediately, then on interval
  pollHistory();
  pollInterval = setInterval(pollHistory, POLL_INTERVAL_MS);
}

function stopPolling() {
  if (pollInterval) {
    clearInterval(pollInterval);
    pollInterval = null;
    console.log("[HistoryPoller] Stopped polling");
  }
}

function pollHistory() {
  if (!_browse) {
    console.log("[HistoryPoller] Browse API not available, skipping poll");
    return;
  }

  const opts = {
    hierarchy: "browse",
    zone_or_output_id: null,
  };

  console.log("[HistoryPoller] Polling Roon history...");

  _browse.browse(opts, function(err, r) {
    if (err) {
      console.error("[HistoryPoller] Error browsing:", err);
      return;
    }

    if (!r || !r.items) {
      console.log("[HistoryPoller] No items in browse response");
      return;
    }

    // Look for "History" in the browse items
    const historyItem = r.items.find(item =>
      item.title === "History" ||
      item.title === "Playback History" ||
      (item.subtitle && item.subtitle.includes("History"))
    );

    if (!historyItem) {
      console.log("[HistoryPoller] History item not found in browse");
      console.log("[HistoryPoller] Available items:", r.items.map(i => i.title).join(", "));
      return;
    }

    // Load the history
    loadHistoryItems(historyItem);
  });
}

function loadHistoryItems(historyItem) {
  const opts = {
    hierarchy: "browse",
    item_key: historyItem.item_key,
  };

  _browse.load(opts, function(err, r) {
    if (err) {
      console.error("[HistoryPoller] Error loading history:", err);
      return;
    }

    if (!r || !r.items) {
      console.log("[HistoryPoller] No history items found");
      return;
    }

    console.log("[HistoryPoller] Found " + r.items.length + " history items");
    processHistoryItems(r.items);
  });
}

function processHistoryItems(items) {
  let newPlaysFound = 0;
  const now = new Date();

  for (let i = 0; i < items.length; i++) {
    const item = items[i];

    // Each history item should have track info
    if (!item.title) continue;

    // Create a unique ID for this play based on track + timestamp
    const playId = item.title + "|" + (item.subtitle || "") + "|" + (item.image_key || "");

    // If we've seen this play before, skip the rest
    if (lastSeenPlayId && playId === lastSeenPlayId) {
      break;
    }

    // This is a new play - try to extract info and log it
    const play = extractPlayFromHistoryItem(item);

    if (play && play.played_secs >= MIN_PLAY_SECS) {
      try {
        insertPlay(play);
        newPlaysFound++;
        console.log("[HistoryPoller] ✓ Logged from history: " + play.track_title + " by " + play.artist + " (" + play.played_secs + "s) in " + play.zone_name);
      } catch (err) {
        console.error("[HistoryPoller] Failed to insert play:", err);
      }
    }

    // Update the last seen play ID (only for the first/most recent item)
    if (i === 0) {
      lastSeenPlayId = playId;
    }
  }

  if (newPlaysFound > 0) {
    console.log("[HistoryPoller] Logged " + newPlaysFound + " new plays from history");
  } else {
    console.log("[HistoryPoller] No new plays found");
  }

  lastPollTime = now;
}

function extractPlayFromHistoryItem(item) {
  // History items typically have:
  // - title: track name
  // - subtitle: artist - album
  // - image_key: album art
  // - hint: might contain zone info or duration

  const track_title = item.title || "Unknown Track";
  let artist = "Unknown Artist";
  let album = "Unknown Album";
  let zone_name = "Unknown Zone";

  // Parse subtitle (usually "Artist - Album" or just "Artist")
  if (item.subtitle) {
    const parts = item.subtitle.split(" - ");
    if (parts.length >= 2) {
      artist = parts[0].trim();
      album = parts.slice(1).join(" - ").trim();
    } else {
      artist = item.subtitle.trim();
    }
  }

  // Try to extract zone from hint
  if (item.hint) {
    // Hint might be like "Arc • 3:45" or "Living Room • 5:20"
    const hintMatch = item.hint.match(/^([^•]+)/);
    if (hintMatch) {
      zone_name = hintMatch[1].trim();
    }
  }

  // Estimate duration (we don't have exact played time from history)
  // Default to the minimum play time since we know it was logged
  const played_secs = MIN_PLAY_SECS;

  const now = new Date();
  const started_at = new Date(now.getTime() - (played_secs * 1000));

  return {
    zone_id: "history_" + zone_name.toLowerCase().replace(/\s+/g, "_"),
    zone_name: zone_name,
    track_title: track_title,
    artist: artist,
    album: album,
    duration_secs: played_secs,
    played_secs: played_secs,
    started_at: started_at.toISOString(),
    ended_at: now.toISOString(),
    image_key: item.image_key || null,
  };
}

function cleanup() {
  stopPolling();
  _browse = null;
  lastSeenPlayId = null;
}

module.exports = {
  init,
  startPolling,
  stopPolling,
  cleanup,
};

