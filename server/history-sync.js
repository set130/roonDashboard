const { insertPlay } = require("./db");
const sqlite3 = require("better-sqlite3");
const path = require("path");

// Track what we've synced to avoid duplicates
let lastSyncTime = null;
let _browse = null;
let syncInterval = null;

const SYNC_INTERVAL_MS = 60000; // Sync every 60 seconds
const MIN_PLAY_SECS = 30; // Minimum play duration to log
const DB_PATH = process.env.DB_PATH || path.join(__dirname, "..", "roon-dashboard.sqlite");

// Create a separate tracking table for Roon history items to prevent duplicates
function initHistoryTracking() {
  const db = sqlite3(DB_PATH);
  db.exec(`
    CREATE TABLE IF NOT EXISTS roon_history_sync (
      item_key TEXT PRIMARY KEY,
      synced_at TEXT NOT NULL
    )
  `);
  db.close();
}

function isAlreadySynced(itemKey) {
  const db = sqlite3(DB_PATH);
  const row = db.prepare("SELECT 1 FROM roon_history_sync WHERE item_key = ?").get(itemKey);
  db.close();
  return !!row;
}

function markAsSynced(itemKey) {
  const db = sqlite3(DB_PATH);
  db.prepare("INSERT OR IGNORE INTO roon_history_sync (item_key, synced_at) VALUES (?, ?)").run(
    itemKey,
    new Date().toISOString()
  );
  db.close();
}

function init(core) {
  if (!core || !core.services || !core.services.RoonApiBrowse) {
    console.log("[HistorySync] Browse API not available");
    return;
  }

  _browse = core.services.RoonApiBrowse;
  console.log("[HistorySync] Initialized with Browse API");
  
  initHistoryTracking();
  
  // Start syncing
  startSync();
}

function startSync() {
  if (syncInterval) {
    clearInterval(syncInterval);
  }

  console.log("[HistorySync] Starting history sync every " + (SYNC_INTERVAL_MS / 1000) + " seconds");
  
  // Sync immediately, then on interval
  syncHistory();
  syncInterval = setInterval(syncHistory, SYNC_INTERVAL_MS);
}

function stopSync() {
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
    console.log("[HistorySync] Stopped syncing");
  }
}

function syncHistory() {
  if (!_browse) {
    console.log("[HistorySync] Browse API not available, skipping sync");
    return;
  }

  console.log("[HistorySync] Syncing Roon playback history...");

  // Browse to the library root to find history
  const opts = {
    hierarchy: "browse",
    pop_all: true
  };

  _browse.browse(opts, function(err, r) {
    if (err) {
      console.error("[HistorySync] Error browsing library:", err);
      return;
    }

    if (!r || !r.items) {
      console.log("[HistorySync] No browse items returned");
      return;
    }

    console.log("[HistorySync] Available browse items:", r.items.map(i => i.title).join(", "));

    // Look for "Plays" or "History" or similar
    const historyItem = r.items.find(item => 
      item.title === "Plays" ||
      item.title === "History" ||
      item.title === "Recent" ||
      item.title === "Recently Played" ||
      (item.hint && item.hint.toLowerCase().includes("history"))
    );

    if (historyItem) {
      console.log("[HistorySync] Found history item: " + historyItem.title);
      loadHistoryItems(historyItem);
    } else {
      // Try to find it through different browse paths
      console.log("[HistorySync] No direct history item found, trying alternative paths...");
      tryAlternativePaths(r);
    }
  });
}

function tryAlternativePaths(browseResult) {
  // Try browsing into "Library" or "My Library" if available
  const libraryItem = browseResult.items.find(item =>
    item.title === "Library" ||
    item.title === "My Library" ||
    item.title === "Music Library"
  );

  if (libraryItem && libraryItem.item_key) {
    console.log("[HistorySync] Trying to browse into: " + libraryItem.title);
    
    _browse.browse({ hierarchy: "browse", item_key: libraryItem.item_key }, function(err, r) {
      if (err) {
        console.error("[HistorySync] Error browsing library:", err);
        return;
      }

      if (r && r.items) {
        console.log("[HistorySync] Library items:", r.items.map(i => i.title).join(", "));
        
        const historyItem = r.items.find(item =>
          item.title === "Plays" ||
          item.title === "History" ||
          item.title === "Recently Played"
        );

        if (historyItem) {
          console.log("[HistorySync] Found history in library: " + historyItem.title);
          loadHistoryItems(historyItem);
        } else {
          console.log("[HistorySync] Still no history found - Arc plays may not be accessible via Browse API");
          console.log("[HistorySync] Note: Arc plays only appear in zone events when playing on local network");
        }
      }
    });
  } else {
    console.log("[HistorySync] No alternative paths found");
    console.log("[HistorySync] Arc plays are only tracked when Arc is on the same network as Roon Core");
  }
}

function loadHistoryItems(historyItem) {
  if (!historyItem.item_key) {
    console.log("[HistorySync] History item has no item_key, cannot load");
    return;
  }

  const opts = {
    hierarchy: "browse",
    item_key: historyItem.item_key,
    pop_levels: 0
  };

  _browse.load(opts, function(err, r) {
    if (err) {
      console.error("[HistorySync] Error loading history:", err);
      return;
    }

    if (!r || !r.items || r.items.length === 0) {
      console.log("[HistorySync] No history items found");
      return;
    }

    console.log("[HistorySync] Found " + r.items.length + " history items");
    processHistoryItems(r.items, r.list);
  });
}

function processHistoryItems(items, listInfo) {
  let newPlaysFound = 0;
  const now = new Date();

  console.log("[HistorySync] Processing history items...");
  console.log("[HistorySync] List info:", JSON.stringify(listInfo, null, 2));

  for (let i = 0; i < Math.min(items.length, 50); i++) { // Process up to 50 most recent
    const item = items[i];
    
    console.log("[HistorySync] Item " + i + ":", JSON.stringify(item, null, 2));

    // Create unique key for this history item
    const itemKey = item.item_key || (item.title + "|" + (item.subtitle || "") + "|" + i);
    
    // Skip if we've already synced this item
    if (isAlreadySynced(itemKey)) {
      continue;
    }

    // Try to extract play information from the item
    const play = extractPlayFromHistoryItem(item);
    
    if (play && play.played_secs >= MIN_PLAY_SECS) {
      try {
        insertPlay(play);
        markAsSynced(itemKey);
        newPlaysFound++;
        console.log("[HistorySync] ✓ Synced from history: " + play.track_title + " by " + play.artist + " (" + play.played_secs + "s) in " + play.zone_name);
      } catch (err) {
        console.error("[HistorySync] Failed to insert play:", err);
      }
    }
  }

  if (newPlaysFound > 0) {
    console.log("[HistorySync] Synced " + newPlaysFound + " new plays from Roon history");
  } else {
    console.log("[HistorySync] No new plays to sync");
  }

  lastSyncTime = now;
}

function extractPlayFromHistoryItem(item) {
  // History items structure (need to discover actual structure from logs)
  // Typical structure might be:
  // {
  //   title: "Track Name",
  //   subtitle: "Artist - Album",
  //   hint: "Zone • Duration",
  //   image_key: "...",
  //   item_key: "..."
  // }

  if (!item.title) {
    return null;
  }

  const track_title = item.title;
  let artist = "Unknown Artist";
  let album = "Unknown Album";
  let zone_name = "Unknown Zone";
  let played_secs = MIN_PLAY_SECS; // Default to minimum

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

  // Try to extract zone and duration from hint
  if (item.hint) {
    // Hint might be like "Arc • 3:45" or "Living Room • 5:20"
    const hintMatch = item.hint.match(/^([^•]+)(?:•\s*(\d+):(\d+))?/);
    if (hintMatch) {
      zone_name = hintMatch[1].trim();
      
      // Try to extract duration if present
      if (hintMatch[2] && hintMatch[3]) {
        const minutes = parseInt(hintMatch[2], 10);
        const seconds = parseInt(hintMatch[3], 10);
        played_secs = (minutes * 60) + seconds;
      }
    }
  }

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
  stopSync();
  _browse = null;
}

module.exports = {
  init,
  startSync,
  stopSync,
  cleanup,
};

