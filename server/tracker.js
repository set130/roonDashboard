const { insertPlay } = require("./db");

const MIN_PLAY_SECS = 30;
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
  if (playedSecs < MIN_PLAY_SECS) return;
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
    console.log("[Tracker] Logged: " + play.track_title + " by " + play.artist + " (" + play.played_secs + "s)");
  } catch (err) {
    console.error("[Tracker] Failed to insert play:", err);
  }
}

function handleZonesChanged(zones) {
  if (!zones) return;
  for (var i = 0; i < zones.length; i++) {
    var zone = zones[i];
    var key = trackKey(zone.now_playing);
    var prevState = zoneStates[zone.zone_id];
    if (zone.state === "stopped" || !zone.now_playing) {
      if (prevState && prevState.track) {
        commitPlay(prevState);
        delete zoneStates[zone.zone_id];
      }
      continue;
    }
    var prevKey = null;
    if (prevState && prevState.track) {
      prevKey = prevState.track.track_title + "|||" + prevState.track.artist + "|||" + prevState.track.album;
    }
    if (key !== prevKey) {
      if (prevState && prevState.track) commitPlay(prevState);
      var trackInfo = extractTrackInfo(zone);
      zoneStates[zone.zone_id] = {
        zone_id: zone.zone_id,
        zone_name: zone.display_name,
        track: trackInfo,
        startedAt: new Date(),
        state: zone.state,
      };
      console.log("[Tracker] Now playing: " + trackInfo.track_title + " by " + trackInfo.artist + " in " + zone.display_name);
    } else if (prevState) {
      prevState.state = zone.state;
    }
  }
}

function handleZonesRemoved(zone_ids) {
  if (!zone_ids) return;
  for (var i = 0; i < zone_ids.length; i++) {
    var id = zone_ids[i];
    if (zoneStates[id]) {
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
    if (state.track) {
      result.push({
        zone_id: zoneId,
        zone_name: state.zone_name,
        track_title: state.track.track_title,
        artist: state.track.artist,
        album: state.track.album,
        duration_secs: state.track.duration_secs,
        elapsed_secs: Math.round((Date.now() - state.startedAt.getTime()) / 1000),
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
    commitPlay(zoneStates[keys[i]]);
    delete zoneStates[keys[i]];
  }
}

module.exports = { handleZonesChanged: handleZonesChanged, handleZonesRemoved: handleZonesRemoved, getNowPlaying: getNowPlaying, flushAll: flushAll };