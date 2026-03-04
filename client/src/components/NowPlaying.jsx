import { useState, useEffect } from 'react';
import { getNowPlaying, imageUrl } from '../api/roon';

export default function NowPlaying() {
  const [data, setData] = useState({ connected: false, zones: [] });
  const [localElapsed, setLocalElapsed] = useState({});

  useEffect(() => {
    let active = true;
    const poll = () => {
      getNowPlaying()
        .then((d) => {
          if (active) {
            setData(d);
            // Sync local elapsed times with server data
            const newElapsed = {};
            d.zones.forEach(z => {
              newElapsed[z.zone_id] = z.elapsed_secs;
            });
            setLocalElapsed(newElapsed);
          }
        })
        .catch(() => {});
    };
    poll();
    const pollId = setInterval(poll, 5000);

    // Increment local elapsed time every second
    const tickId = setInterval(() => {
      setLocalElapsed(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(zoneId => {
          updated[zoneId] = (updated[zoneId] || 0) + 1;
        });
        return updated;
      });
    }, 1000);

    return () => {
      active = false;
      clearInterval(pollId);
      clearInterval(tickId);
    };
  }, []);

  return (
    <div className="card now-playing-card">
      <h3>Now Playing</h3>
      <div className={`connection-status ${data.connected ? 'connected' : 'disconnected'}`}>
        {data.connected ? '● Connected to Roon' : '○ Disconnected'}
      </div>
      {data.zones.length === 0 ? (
        <p className="empty-state">Nothing playing right now</p>
      ) : (
        data.zones.map((z) => {
          const elapsed = localElapsed[z.zone_id] || z.elapsed_secs || 0;
          return (
            <div key={z.zone_id} className="now-playing-zone">
              <div className="np-artwork">
                {z.image_key ? (
                  <img src={imageUrl(z.image_key, 120, 120)} alt={z.album} />
                ) : (
                  <div className="np-artwork-placeholder">♪</div>
                )}
              </div>
              <div className="np-info">
                <div className="np-track">{z.track_title}</div>
                <div className="np-artist">{z.artist}</div>
                <div className="np-album">{z.album}</div>
                <div className="np-zone-name">{z.zone_name}</div>
                <div className="np-progress">
                  <div className="np-progress-bar">
                    <div
                      className="np-progress-fill"
                      style={{ width: `${z.duration_secs ? Math.min((elapsed / z.duration_secs) * 100, 100) : 0}%` }}
                    />
                  </div>
                  <span className="np-time">
                    {formatTime(elapsed)} / {formatTime(z.duration_secs)}
                  </span>
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

function formatTime(secs) {
  if (!secs) return '0:00';
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

