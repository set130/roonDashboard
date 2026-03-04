// Test the artist splitting logic
function splitArtists(artistString) {
  if (!artistString || typeof artistString !== 'string') return [artistString];
  return artistString.split(' / ').map(a => a.trim()).filter(a => a);
}

// Test cases
const testCases = [
  "Sergei Rachmaninoff",
  "Vladimir Horowitz",
  "Vladimir Horowitz / Domenico Scarlatti",
  "Sviatoslav Richter / Wolfgang Amadeus Mozart"
];

console.log("=== Artist Splitting Test ===\n");

testCases.forEach(artist => {
  const split = splitArtists(artist);
  console.log(`Input:  "${artist}"`);
  console.log(`Output: ${JSON.stringify(split)}`);
  console.log(`Count:  ${split.length} artists\n`);
});

// Simulate play counting
console.log("=== Simulated Top Artists (with splitting) ===\n");

const mockPlays = [
  { artist: "Sergei Rachmaninoff", played_secs: 1320 },  // 22m - 19 plays
  { artist: "Sergei Rachmaninoff", played_secs: 1320 },
  { artist: "Sergei Rachmaninoff", played_secs: 1320 },
  { artist: "Sergei Rachmaninoff", played_secs: 1320 },
  { artist: "Sergei Rachmaninoff", played_secs: 1320 },
  { artist: "Sergei Rachmaninoff", played_secs: 1320 },
  { artist: "Sergei Rachmaninoff", played_secs: 1320 },
  { artist: "Sergei Rachmaninoff", played_secs: 1320 },
  { artist: "Sergei Rachmaninoff", played_secs: 1320 },
  { artist: "Sergei Rachmaninoff", played_secs: 1320 },
  { artist: "Sergei Rachmaninoff", played_secs: 1320 },
  { artist: "Sergei Rachmaninoff", played_secs: 1320 },
  { artist: "Sergei Rachmaninoff", played_secs: 1320 },
  { artist: "Sergei Rachmaninoff", played_secs: 1320 },
  { artist: "Sergei Rachmaninoff", played_secs: 1320 },
  { artist: "Sergei Rachmaninoff", played_secs: 1320 },
  { artist: "Sergei Rachmaninoff", played_secs: 1320 },
  { artist: "Sergei Rachmaninoff", played_secs: 1320 },
  { artist: "Sergei Rachmaninoff", played_secs: 1320 },

  { artist: "Vladimir Horowitz", played_secs: 1320 },  // 22m - 8 plays
  { artist: "Vladimir Horowitz", played_secs: 1320 },
  { artist: "Vladimir Horowitz", played_secs: 1320 },
  { artist: "Vladimir Horowitz", played_secs: 1320 },
  { artist: "Vladimir Horowitz", played_secs: 1320 },
  { artist: "Vladimir Horowitz", played_secs: 1320 },
  { artist: "Vladimir Horowitz", played_secs: 1320 },
  { artist: "Vladimir Horowitz", played_secs: 1320 },

  { artist: "Vladimir Horowitz / Domenico Scarlatti", played_secs: 720 },  // 12m - 6 plays
  { artist: "Vladimir Horowitz / Domenico Scarlatti", played_secs: 720 },
  { artist: "Vladimir Horowitz / Domenico Scarlatti", played_secs: 720 },
  { artist: "Vladimir Horowitz / Domenico Scarlatti", played_secs: 720 },
  { artist: "Vladimir Horowitz / Domenico Scarlatti", played_secs: 720 },
  { artist: "Vladimir Horowitz / Domenico Scarlatti", played_secs: 720 },

  { artist: "Sviatoslav Richter / Wolfgang Amadeus Mozart", played_secs: 1020 },  // 17m - 3 plays
  { artist: "Sviatoslav Richter / Wolfgang Amadeus Mozart", played_secs: 1020 },
  { artist: "Sviatoslav Richter / Wolfgang Amadeus Mozart", played_secs: 1020 },
];

// Calculate stats
const artistStats = {};
let totalPlays = 0;
let totalSecs = 0;

for (const play of mockPlays) {
  totalPlays += 1;
  totalSecs += play.played_secs;

  const artists = splitArtists(play.artist);
  for (const artist of artists) {
    if (!artistStats[artist]) {
      artistStats[artist] = { artist, play_count: 0, total_secs: 0 };
    }
    artistStats[artist].play_count += 1;
    artistStats[artist].total_secs += play.played_secs || 0;
  }
}

const topArtists = Object.values(artistStats)
  .sort((a, b) => b.play_count - a.play_count)
  .slice(0, 10);

topArtists.forEach((a, i) => {
  const mins = Math.round(a.total_secs / 60);
  console.log(`#${i+1} ${a.artist}`);
  console.log(`   ${a.play_count} plays · ${mins}m`);
});

console.log(`\n=== Totals (should NOT be doubled) ===`);
console.log(`Total Plays: ${totalPlays}`);
console.log(`Total Time: ${Math.round(totalSecs / 60)}m (${(totalSecs / 3600).toFixed(1)}h)`);

console.log(`\n=== Expected Results ===`);
console.log(`Vladimir Horowitz should have: 14 plays (8 solo + 6 split)`);
console.log(`Domenico Scarlatti should have: 6 plays (from split)`);
console.log(`Total plays should remain: ${totalPlays} (not doubled)`);

