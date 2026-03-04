const Database = require("better-sqlite3");
const path = require("path");

const DB_PATH = path.join(__dirname, "..", "roon-dashboard.sqlite");
const db = new Database(DB_PATH);

// Enable WAL mode for better concurrent read/write
db.pragma("journal_mode = WAL");

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS plays (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    zone_id       TEXT,
    zone_name     TEXT,
    track_title   TEXT NOT NULL,
    artist        TEXT NOT NULL,
    album         TEXT,
    duration_secs INTEGER,
    played_secs   INTEGER,
    started_at    TEXT NOT NULL,
    ended_at      TEXT,
    image_key     TEXT
  );

  CREATE INDEX IF NOT EXISTS idx_plays_started_at ON plays(started_at);
  CREATE INDEX IF NOT EXISTS idx_plays_artist ON plays(artist);
  CREATE INDEX IF NOT EXISTS idx_plays_track_artist ON plays(track_title, artist);
`);

// ---------- Insert ----------
const insertPlayStmt = db.prepare(`
  INSERT INTO plays (zone_id, zone_name, track_title, artist, album, duration_secs, played_secs, started_at, ended_at, image_key)
  VALUES (@zone_id, @zone_name, @track_title, @artist, @album, @duration_secs, @played_secs, @started_at, @ended_at, @image_key)
`);

function insertPlay(play) {
  return insertPlayStmt.run(play);
}

// ---------- Helper: date range WHERE clause ----------
function dateFilter(from, to) {
  if (from && to) {
    return { clause: "AND started_at >= @from AND started_at <= @to", params: { from, to } };
  }
  return { clause: "", params: {} };
}

// Split composite artist strings ("A / B" -> ["A", "B"]) for classical music.
// Each artist gets credit for the full play without double-counting in totals.
function splitArtists(artistString) {
  if (!artistString || typeof artistString !== 'string') return [artistString];
  return artistString.split(' / ').map(a => a.trim()).filter(a => a);
}

// ---------- Top Artists ----------
function getTopArtists(from, to, limit = 50) {
  const { clause, params } = dateFilter(from, to);

  // Get all plays and expand artists
  const playsStmt = db.prepare(`
    SELECT artist, played_secs
    FROM plays
    WHERE 1=1 ${clause}
  `);
  const plays = playsStmt.all(params);

  // Count plays and time per artist (splitting composite credits)
  const artistStats = {};
  for (const play of plays) {
    const artists = splitArtists(play.artist);
    for (const artist of artists) {
      if (!artistStats[artist]) {
        artistStats[artist] = { artist, play_count: 0, total_secs: 0 };
      }
      artistStats[artist].play_count += 1;
      artistStats[artist].total_secs += play.played_secs || 0;
    }
  }

  // Sort and limit (by total listening time, not play count)
  return Object.values(artistStats)
    .sort((a, b) => b.total_secs - a.total_secs)
    .slice(0, limit);
}

// ---------- Top Tracks ----------
function getTopTracks(from, to, limit = 50) {
  const { clause, params } = dateFilter(from, to);
  const stmt = db.prepare(`
    SELECT track_title, artist, album, image_key,
           COUNT(*) as play_count,
           SUM(played_secs) as total_secs
    FROM plays
    WHERE 1=1 ${clause}
    GROUP BY track_title, artist
    ORDER BY total_secs DESC
    LIMIT @limit
  `);
  return stmt.all({ ...params, limit });
}

// ---------- Top Zones ----------
function getTopZones(from, to, limit = 50) {
  const { clause, params } = dateFilter(from, to);
  const stmt = db.prepare(`
    SELECT zone_name,
           COUNT(*) as play_count,
           SUM(played_secs) as total_secs
    FROM plays
    WHERE 1=1 ${clause}
    GROUP BY zone_name
    ORDER BY total_secs DESC
    LIMIT @limit
  `);
  return stmt.all({ ...params, limit });
}

// ---------- Top Albums ----------
function getTopAlbums(from, to, limit = 50) {
  const { clause, params } = dateFilter(from, to);
  const stmt = db.prepare(`
    SELECT album, artist, image_key,
           COUNT(*) as play_count,
           SUM(played_secs) as total_secs
    FROM plays
    WHERE 1=1 ${clause}
    GROUP BY album, artist
    ORDER BY total_secs DESC
    LIMIT @limit
  `);
  return stmt.all({ ...params, limit });
}

// ---------- Play Time ----------
function getPlayTime(from, to) {
  const { clause, params } = dateFilter(from, to);

  const totalStmt = db.prepare(`
    SELECT COALESCE(SUM(played_secs), 0) as total_secs,
           COUNT(*) as total_plays
    FROM plays
    WHERE 1=1 ${clause}
  `);
  const total = totalStmt.get(params);

  const byDayStmt = db.prepare(`
    SELECT DATE(started_at) as date,
           SUM(played_secs) as secs,
           COUNT(*) as plays
    FROM plays
    WHERE 1=1 ${clause}
    GROUP BY DATE(started_at)
    ORDER BY date
  `);
  const by_day = byDayStmt.all(params);

  return { ...total, by_day };
}

// ---------- History ----------
function getHistory(from, to, page = 1, limit = 50) {
  const { clause, params } = dateFilter(from, to);
  const offset = (page - 1) * limit;

  const countStmt = db.prepare(`SELECT COUNT(*) as total FROM plays WHERE 1=1 ${clause}`);
  const { total } = countStmt.get(params);

  const stmt = db.prepare(`
    SELECT * FROM plays
    WHERE 1=1 ${clause}
    ORDER BY started_at DESC
    LIMIT @limit OFFSET @offset
  `);
  const rows = stmt.all({ ...params, limit, offset });

  return { total, page, limit, rows };
}

// ---------- Recap (Wrapped-style) ----------
function getRecap(from, to) {
  const { clause, params } = dateFilter(from, to);

  // Total listening
  const totalStmt = db.prepare(`
    SELECT COALESCE(SUM(played_secs), 0) as total_secs,
           COUNT(*) as total_plays
    FROM plays WHERE 1=1 ${clause}
  `);
  const totals = totalStmt.get(params);

  // Top artist (expand composite artists in-memory)
  const artistPlaysStmt = db.prepare(`
    SELECT artist, COUNT(*) as play_count, SUM(played_secs) as total_secs
    FROM plays WHERE 1=1 ${clause}
    GROUP BY artist
  `);
  const artistPlays = artistPlaysStmt.all(params);

  const artistStats = {};
  for (const row of artistPlays) {
    const artists = splitArtists(row.artist);
    for (const artist of artists) {
      if (!artistStats[artist]) {
        artistStats[artist] = { artist, play_count: 0, total_secs: 0 };
      }
      artistStats[artist].play_count += row.play_count;
      artistStats[artist].total_secs += row.total_secs || 0;
    }
  }

  const topArtists = Object.values(artistStats).sort((a, b) => b.total_secs - a.total_secs);
  const top_artist = topArtists[0] || null;

  // Top track
  const topTrackStmt = db.prepare(`
    SELECT track_title, artist, album, image_key, COUNT(*) as play_count, SUM(played_secs) as total_secs
    FROM plays WHERE 1=1 ${clause}
    GROUP BY track_title, artist ORDER BY total_secs DESC LIMIT 1
  `);
  const top_track = topTrackStmt.get(params) || null;

  // Busiest day of week
  const busiestDayStmt = db.prepare(`
    SELECT CASE CAST(strftime('%w', started_at) AS INTEGER)
      WHEN 0 THEN 'Sunday' WHEN 1 THEN 'Monday' WHEN 2 THEN 'Tuesday'
      WHEN 3 THEN 'Wednesday' WHEN 4 THEN 'Thursday'
      WHEN 5 THEN 'Friday' WHEN 6 THEN 'Saturday' END as day_name,
      COUNT(*) as plays
    FROM plays WHERE 1=1 ${clause}
    GROUP BY strftime('%w', started_at)
    ORDER BY plays DESC LIMIT 1
  `);
  const busiest_day = busiestDayStmt.get(params) || null;

  // Unique artists count (expand splits)
  const allArtistsStmt = db.prepare(`
    SELECT DISTINCT artist FROM plays WHERE 1=1 ${clause}
  `);
  const allArtists = allArtistsStmt.all(params);
  const uniqueArtistSet = new Set();
  for (const row of allArtists) {
    const artists = splitArtists(row.artist);
    artists.forEach(a => uniqueArtistSet.add(a));
  }
  const unique_artists = uniqueArtistSet.size;

  // Unique tracks count
  const uniqueTracksStmt = db.prepare(`
    SELECT COUNT(DISTINCT track_title || '|||' || artist) as count FROM plays WHERE 1=1 ${clause}
  `);
  const unique_tracks = uniqueTracksStmt.get(params).count;

  // Listening streaks (consecutive days)
  const streakStmt = db.prepare(`
    SELECT DISTINCT DATE(started_at) as d FROM plays WHERE 1=1 ${clause} ORDER BY d
  `);
  const days = streakStmt.all(params).map((r) => r.d);
  let longest_streak = 0;
  let current_streak = 0;
  for (let i = 0; i < days.length; i++) {
    if (i === 0) {
      current_streak = 1;
    } else {
      const prev = new Date(days[i - 1]);
      const curr = new Date(days[i]);
      const diffDays = (curr - prev) / (1000 * 60 * 60 * 24);
      current_streak = diffDays === 1 ? current_streak + 1 : 1;
    }
    longest_streak = Math.max(longest_streak, current_streak);
  }

  return {
    total_secs: totals.total_secs,
    total_plays: totals.total_plays,
    total_hours: Math.round((totals.total_secs / 3600) * 10) / 10,
    unique_artists,
    unique_tracks,
    top_artist,
    top_track,
    busiest_day,
    longest_streak,
  };
}

module.exports = { db, insertPlay, getTopArtists, getTopTracks, getTopZones, getTopAlbums, getPlayTime, getHistory, getRecap };

