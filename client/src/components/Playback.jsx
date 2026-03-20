import { useState, useEffect } from 'react';
import { getNowPlaying, controlZone, imageUrl, browse, load } from '../api/roon';

function formatTime(secs) {
  if (!secs) return '0:00';
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function Playback() {
    const [data, setData] = useState({ connected: false, zones: [] });
    const [localElapsed, setLocalElapsed] = useState({});
    const [selectedZoneId, setSelectedZoneId] = useState('');
    
    // Browse state
    const [browseItems, setBrowseItems] = useState([]);
    const [browseLevel, setBrowseLevel] = useState(0);

    useEffect(() => {
        let active = true;
        const poll = () => {
          getNowPlaying()
            .then((d) => {
              if (active) {
                setData(d);
                if (d.zones.length > 0 && !selectedZoneId) {
                    setSelectedZoneId(d.zones[0].zone_id);
                }
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
        const pollId = setInterval(poll, 1000); // Poll more frequently for playback

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
    }, [selectedZoneId]);

    useEffect(() => {
        // Initial browse load
        loadBrowse({ hierarchy: "browse", pop_all: true });
    }, []);

    const loadBrowse = async (opts) => {
        try {
            const res = await browse(opts);
            if (res.action === "list") {
                const listRes = await load({ hierarchy: "browse", offset: 0, set_display_offset: 0 });
                setBrowseItems(listRes.items || []);
            }
        } catch (e) {
            console.error("Browse error", e);
        }
    };

    const handleBrowseClick = (itemKey) => {
        loadBrowse({ hierarchy: "browse", item_key: itemKey, zone_or_output_id: selectedZoneId });
    };

    const handleAction = async (cmd) => {
        if (!selectedZoneId) return;
        try {
            await controlZone(selectedZoneId, cmd);
            // instantly update local state for snappiness
            setData(prev => {
                const newZones = prev.zones.map(z => {
                    if (z.zone_id === selectedZoneId) {
                        if (cmd === 'playpause') z.state = z.state === 'playing' ? 'paused' : 'playing';
                        if (cmd === 'play') z.state = 'playing';
                        if (cmd === 'pause') z.state = 'paused';
                    }
                    return z;
                });
                return { ...prev, zones: newZones };
            });
        } catch (e) {
            console.error("Control error", e);
        }
    };

    const activeZone = data.zones.find(z => z.zone_id === selectedZoneId) || data.zones[0];
    const isPlaying = activeZone?.state === 'playing';
    const elapsed = activeZone ? (localElapsed[activeZone.zone_id] || activeZone.elapsed_secs || 0) : 0;

    return (
        <div className="playback-container" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '30px' }}>
            <h2>Playback Controls</h2>
            
            <div className="card now-playing-card">
                <h3>Now Playing on {activeZone?.zone_name || '...'}</h3>
                
                <div style={{ marginBottom: '20px' }}>
                    <select 
                        id="zone-select" 
                        value={selectedZoneId} 
                        onChange={(e) => setSelectedZoneId(e.target.value)}
                        style={{ padding: '8px', borderRadius: '4px', border: '1px solid #444', backgroundColor: 'var(--surface-light, #2d2d2d)', color: 'var(--text, #fff)', width: '100%', maxWidth: '300px' }}
                    >
                        {data.zones.length === 0 && <option value="">No zones found</option>}
                        {data.zones.map(z => <option key={z.zone_id} value={z.zone_id}>{z.zone_name}</option>)}
                    </select>
                </div>

                {!activeZone ? (
                     <p className="empty-state">Nothing playing right now</p>
                ) : (
                    <div className="now-playing-zone">
                      <div className="np-artwork">
                        {activeZone.image_key ? (
                          <img src={imageUrl(activeZone.image_key, 200, 200)} alt={activeZone.album} />
                        ) : (
                          <div className="np-artwork-placeholder">♪</div>
                        )}
                      </div>
                      <div className="np-info">
                        <div className="np-track">{activeZone.track_title || 'No Track'}</div>
                        <div className="np-artist">{activeZone.artist || 'No Artist'}</div>
                        <div className="np-album">{activeZone.album || 'No Album'}</div>
                        <div className="np-zone-name">{activeZone.zone_name}</div>
                        <div className="np-progress">
                          <div className="np-progress-bar">
                            <div
                              className="np-progress-fill"
                              style={{ width: `${activeZone.duration_secs ? Math.min((elapsed / activeZone.duration_secs) * 100, 100) : 0}%` }}
                            />
                          </div>
                          <span className="np-time">
                            {formatTime(elapsed)} / {formatTime(activeZone.duration_secs)}
                          </span>
                        </div>

                        <div className="controls" style={{ display: 'flex', gap: '20px', alignItems: 'center', marginTop: '20px' }}>
                            <button onClick={() => handleAction('previous')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '24px', color: 'inherit' }} title="Previous">⏮</button>
                            <button 
                                onClick={() => handleAction('playpause')}
                                style={{ 
                                    background: 'var(--primary, #d9822b)', 
                                    border: 'none', 
                                    borderRadius: '50%', 
                                    width: '60px', 
                                    height: '60px', 
                                    cursor: 'pointer', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center',
                                    color: '#fff',
                                    fontSize: '24px'
                                }} 
                                title={isPlaying ? "Pause" : "Play"}
                            >
                                {isPlaying ? "⏸" : "▶"}
                            </button>
                            <button onClick={() => handleAction('next')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '24px', color: 'inherit' }} title="Next">⏭</button>
                        </div>
                      </div>
                    </div>
                )}
            </div>

            <div className="card browse-albums-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3>Library Browser</h3>
                    <button 
                        onClick={() => loadBrowse({ hierarchy: "browse", pop_all: true })}
                        style={{ background: 'none', border: '1px solid #444', color: '#fff', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}
                    >
                        Home
                    </button>
                </div>
                <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', 
                    gap: '20px', 
                    marginTop: '20px' 
                }}>
                    {browseItems.length === 0 && <p style={{ color: '#888' }}>Loading or empty...</p>}
                    {browseItems.map(item => (
                        <div key={item.item_key} className="album-item" style={{
                            backgroundColor: 'var(--surface-light, #2d2d2d)',
                            padding: '10px',
                            borderRadius: '8px',
                            textAlign: 'center',
                            cursor: 'pointer',
                            transition: 'transform 0.2s',
                            border: '1px solid var(--border, #444)'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                        onClick={() => handleBrowseClick(item.item_key)}
                        >
                            <div style={{
                                width: '100%',
                                aspectRatio: '1/1',
                                backgroundColor: '#444',
                                borderRadius: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginBottom: '10px',
                                fontSize: '32px',
                                color: '#888',
                                overflow: 'hidden'
                            }}>
                                {item.image_key ? <img src={imageUrl(item.image_key, 150, 150)} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '📁'}
                            </div>
                            <div style={{ fontWeight: 'bold', fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.title}</div>
                            <div style={{ fontSize: '12px', color: '#aaa', marginTop: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.subtitle || 'Folder'}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
