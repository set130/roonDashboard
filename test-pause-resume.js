// Test script to verify pause/resume behavior
// This simulates the zone state changes that happen during pause/resume

const tracker = require('./server/tracker');

console.log('=== Testing Pause/Resume Behavior ===\n');

// Simulate a track starting to play
const zone1Playing = {
  zone_id: 'test-zone-1',
  display_name: 'Living Room',
  state: 'playing',
  now_playing: {
    three_line: {
      line1: 'Test Track',
      line2: 'Test Artist',
      line3: 'Test Album'
    },
    length: 240,
    seek_position: 0,
    image_key: 'test-image'
  }
};

console.log('1. Starting playback...');
tracker.handleZonesChanged([zone1Playing]);

// Wait 5 seconds, then pause
setTimeout(() => {
  console.log('\n2. Pausing after 5 seconds...');
  const zone1Paused = { ...zone1Playing, state: 'paused' };
  tracker.handleZonesChanged([zone1Paused]);

  // Resume after 2 seconds (should NOT create a new play)
  setTimeout(() => {
    console.log('\n3. Resuming after 2 seconds (should continue same play)...');
    const zone1Resumed = { ...zone1Playing, state: 'playing' };
    tracker.handleZonesChanged([zone1Resumed]);

    // Let it play for another 3 seconds, then stop
    setTimeout(() => {
      console.log('\n4. Stopping playback (should log 1 play total)...');
      const zone1Stopped = { ...zone1Playing, state: 'stopped' };
      tracker.handleZonesChanged([zone1Stopped]);

      console.log('\n=== Test Complete ===');
      console.log('Expected: 1 play logged with ~8 seconds duration');
      console.log('(If you see 2 plays, the bug still exists)');
      process.exit(0);
    }, 3000);
  }, 2000);
}, 5000);

// Test 2: Long pause (should commit after timeout)
setTimeout(() => {
  console.log('\n\n=== Testing Long Pause (>60s) ===');
  console.log('This would take 60+ seconds. Skipping automatic test.');
  console.log('To test manually: pause a track for over 60 seconds and verify it logs.');
}, 11000);

