const { insertPlay } = require("./db");

const MIN_PLAY_SECS = 30;
const PAUSE_TIMEOUT_SECS = 60; // Commit play after 60 seconds of pause
const zoneStates = {};

function trackKey(nowPlaying) {
  if (!nowPlaying) return null;
  var l = nowPlaying.three_line;
  return l.line1 + "|||" + l.line2 + "|||" + l.line3;
}

function extractTrackInfo(zone) {
  var np = zone.now_playing;
  if (!np) return null;
  var l = np.three_line;
  return {
    track_title: l.line1 || "Unknown",
    artist: l.line2 || "Unknown",
    album: l.line3 || "Unknown",
    duration_secs: np.length || 0,
    image_key: np.image_key || null,
  };
}

function commitPlay(zoneState) {
  if (!zoneState || !zoneState.track) return;
  var now = new Date();
  var playedSecs = Math.round((now - zoneState.startedAt) / 1000);
  console.log("[Tracker] Attempting to commit play: " + zoneState.track.track_title + " - played " + playedSecs + "s (min: " + MIN_PLAY_SECS + "s)");
  if (playedSecs < MIN_PLAY_SECS) {
    console.log("[Tracker] Skipping - too short");
    return;
  }
  var play = {
    zone_id: zoneState.zone_id,
    zone_name: zoneState.zone_name,
    track_title: zoneState.track.track_title,
    artist: zoneState.track.artist,
    album: zoneState.track.album,
    duration_secs: zoneState.track.duration_secs,
    played_secs: Math.min(playedSecs, zoneState.track.duration_secs || playedSecs),
    started_at: zoneState.startedAt.toISOString(),
    ended_at: now.toISOString(),
    image_key: zoneState.track.image_key,
  };
  try {
    insertPlay(play);
    console.log("[Tracker] ✓ Logged: " + play.track_title + " by " + play.artist + " (" + play.played_secs + "s)");
  } catch (err) {
    console.error("[Tracker] Failed to insert play:", err);
  }
}

function handleZonesChanged(zones) {
  if (!zones) return;
  console.log("[Tracker] ===== Processing " + zones.length + " zone(s) =====");
  for (var i = 0; i < zones.length; i++) {
    var zone = zones[i];
    console.log("[Tracker] Zone: " + zone.display_name + " (ID: " + zone.zone_id + ")");
    console.log("  - State: " + zone.state);
    console.log("  - Has now_playing: " + (zone.now_playing ? "YES" : "NO"));
    if (zone.now_playing && zone.now_playing.three_line) {
      console.log("  - Track: " + zone.now_playing.three_line.line1);
      console.log("  - Artist: " + zone.now_playing.three_line.line2);
    }

    var key = trackKey(zone.now_playing);
    var prevState = zoneStates[zone.zone_id];

    // Handle stopped or no content - commit and clean up
    if (zone.state === "stopped" || !zone.now_playing) {
      console.log("[Tracker] Processing zone: " + zone.display_name + " | State: " + zone.state + " | Has prev state: " + (prevState ? "YES" : "NO"));
      if (prevState && prevState.track) {
        console.log("[Tracker] Committing play on stopped/no-content for zone: " + zone.display_name);
        // Clear any pending pause timeout
        if (prevState.pauseTimeout) {
          clearTimeout(prevState.pauseTimeout);
        }
        commitPlay(prevState);
        delete zoneStates[zone.zone_id];
      }
      continue;
    }

    // Handle paused state - don't commit immediately, set a timeout
    if (zone.state === "paused") {
      console.log("[Tracker] Processing paused zone: " + zone.display_name + " | Has prev state: " + (prevState ? "YES" : "NO"));
      if (prevState && prevState.track && !prevState.pausedAt) {
        // Track just paused
        prevState.pausedAt = new Date();
        prevState.state = "paused";
        console.log("[Tracker] Track paused: " + prevState.track.track_title + " - will commit if paused for " + PAUSE_TIMEOUT_SECS + "s");

        // Set timeout to commit if paused for too long
        // Capture zone_id in closure
        var capturedZoneId = zone.zone_id;
        prevState.pauseTimeout = setTimeout(function() {
          var state = zoneStates[capturedZoneId];
          if (state && state.track) {
            console.log("[Tracker] Pause timeout reached for: " + state.track.track_title);
            commitPlay(state);
            delete zoneStates[capturedZoneId];
          }
        }, PAUSE_TIMEOUT_SECS * 1000);
      }
      continue;
    }

    // Handle playing/loading state
    console.log("[Tracker] Processing zone: " + zone.display_name + " | State: " + zone.state + " | Has prev state: " + (prevState ? "YES" : "NO"));

    // Log unexpected states
    if (zone.state !== "playing" && zone.state !== "loading") {
      console.log("[Tracker] ⚠ Unexpected state '" + zone.state + "' for zone with now_playing data: " + zone.display_name);
    }

    var prevKey = null;
    if (prevState && prevState.track) {
      prevKey = prevState.track.track_title + "|||" + prevState.track.artist + "|||" + prevState.track.album;
    }

    // Check if this is a resume from pause
    if (prevState && prevState.pausedAt && key === prevKey) {
      // Resuming the same track after pause
      var pauseDuration = Math.round((new Date() - prevState.pausedAt) / 1000);
      console.log("[Tracker] Track resumed after " + pauseDuration + "s pause: " + prevState.track.track_title);

      // Clear the pause timeout
      if (prevState.pauseTimeout) {
        clearTimeout(prevState.pauseTimeout);
      }

      // Add pause duration to start time to maintain accurate play time
      prevState.startedAt = new Date(prevState.startedAt.getTime() + (pauseDuration * 1000));
      prevState.pausedAt = null;
      prevState.pauseTimeout = null;
      prevState.state = zone.state;
      prevState.seek_position = zone.now_playing ? zone.now_playing.seek_position : 0;
      continue;
    }

    // Different track - commit previous and start new
    if (key !== prevKey) {
      console.log("[Tracker] Track changed in zone: " + zone.display_name);
      if (prevState && prevState.track) {
        // Clear any pending pause timeout
        if (prevState.pauseTimeout) {
          clearTimeout(prevState.pauseTimeout);
        }
        commitPlay(prevState);
      }
      var trackInfo = extractTrackInfo(zone);
      if (!trackInfo) {
        console.log("[Tracker] ✗ Failed to extract track info for zone: " + zone.display_name);
        continue;
      }
      console.log("[Tracker] Extracted track info: " + trackInfo.track_title);
      zoneStates[zone.zone_id] = {
        zone_id: zone.zone_id,
        zone_name: zone.display_name,
        track: trackInfo,
        startedAt: new Date(),
        state: zone.state,
        seek_position: zone.now_playing ? zone.now_playing.seek_position : 0,
        pausedAt: null,
        pauseTimeout: null,
      };
      console.log("[Tracker] ✓ Now tracking: " + trackInfo.track_title + " by " + trackInfo.artist + " in " + zone.display_name);
    } else if (prevState) {
      // Same track, just update state
      console.log("[Tracker] Same track continuing in zone: " + zone.display_name);
      prevState.state = zone.state;
      prevState.seek_position = zone.now_playing ? zone.now_playing.seek_position : 0;
    }
  }
  console.log("[Tracker] ===== Zone processing complete =====");
}

function handleZonesRemoved(zone_ids) {
  if (!zone_ids) return;
  for (var i = 0; i < zone_ids.length; i++) {
    var id = zone_ids[i];
    if (zoneStates[id]) {
      // Clear any pending pause timeout
      if (zoneStates[id].pauseTimeout) {
        clearTimeout(zoneStates[id].pauseTimeout);
      }
      commitPlay(zoneStates[id]);
      delete zoneStates[id];
    }
  }
}

function getNowPlaying() {
  var result = [];
  var keys = Object.keys(zoneStates);
  for (var i = 0; i < keys.length; i++) {
    var zoneId = keys[i];
    var state = zoneStates[zoneId];
    // Only include zones that are actively playing
    if (state.track && state.state === "playing") {
      // Calculate elapsed time from startedAt
      var calculatedElapsed = Math.round((Date.now() - state.startedAt.getTime()) / 1000);

      // Use seek_position if it seems reliable (not 0 and defined), otherwise use calculated
      var elapsedSecs = (state.seek_position !== undefined && state.seek_position > 0)
        ? state.seek_position
        : calculatedElapsed;

      result.push({
        zone_id: zoneId,
        zone_name: state.zone_name,
        track_title: state.track.track_title,
        artist: state.track.artist,
        album: state.track.album,
        duration_secs: state.track.duration_secs,
        elapsed_secs: elapsedSecs,
        image_key: state.track.image_key,
        state: state.state,
      });
    }
  }
  return result;
}

function flushAll() {
  console.log("[Tracker] Flushing all in-progress plays...");
  var keys = Object.keys(zoneStates);
  for (var i = 0; i < keys.length; i++) {
    var state = zoneStates[keys[i]];
    // Clear any pending pause timeout
    if (state.pauseTimeout) {
      clearTimeout(state.pauseTimeout);
    }
    commitPlay(state);
    delete zoneStates[keys[i]];
  }
}

module.exports = { handleZonesChanged: handleZonesChanged, handleZonesRemoved: handleZonesRemoved, getNowPlaying: getNowPlaying, flushAll: flushAll };