import { useState } from 'react';

export default function Playback() {
    const [selectedZone, setSelectedZone] = useState('Zone 1');
    const [isPlaying, setIsPlaying] = useState(false);

    // Mock data for zones and albums
    const zones = ['Zone 1', 'Living Room', 'Office', 'Bedroom'];
    const albums = [
        { id: 1, title: 'Dark Side of the Moon', artist: 'Pink Floyd' },
        { id: 2, title: 'Abbey Road', artist: 'The Beatles' },
        { id: 3, title: 'Rumours', artist: 'Fleetwood Mac' },
        { id: 4, title: 'Thriller', artist: 'Michael Jackson' },
        { id: 5, title: 'The Wall', artist: 'Pink Floyd' },
        { id: 6, title: 'Hotel California', artist: 'Eagles' }
    ];

    const togglePlay = () => setIsPlaying(!isPlaying);

    return (
        <div className="playback-container" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '30px' }}>
            <h2>Playback Controls</h2>
            
            <div className="card playback-controls-card">
                <h3>Now Playing on {selectedZone}</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '15px' }}>
                    <div className="zone-selector" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <label htmlFor="zone-select" style={{ fontWeight: 'bold' }}>Active Zone:</label>
                        <select 
                            id="zone-select" 
                            value={selectedZone} 
                            onChange={(e) => setSelectedZone(e.target.value)}
                            style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc', backgroundColor: 'var(--surface, #1e1e1e)', color: 'var(--text, #fff)' }}
                        >
                            {zones.map(z => <option key={z} value={z}>{z}</option>)}
                        </select>
                    </div>

                    <div className="controls" style={{ display: 'flex', gap: '20px', alignItems: 'center', justifyContent: 'center', margin: '20px 0' }}>
                        <button style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '24px', color: 'inherit' }} title="Previous">⏮</button>
                        <button 
                            onClick={togglePlay}
                            style={{ 
                                background: 'var(--primary, #007bff)', 
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
                        <button style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '24px', color: 'inherit' }} title="Next">⏭</button>
                    </div>
                </div>
            </div>

            <div className="card browse-albums-card">
                <h3>Browse Albums</h3>
                <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', 
                    gap: '20px', 
                    marginTop: '20px' 
                }}>
                    {albums.map(album => (
                        <div key={album.id} className="album-item" style={{
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
                                color: '#888'
                            }}>
                                ♪
                            </div>
                            <div style={{ fontWeight: 'bold', fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{album.title}</div>
                            <div style={{ fontSize: '12px', color: '#aaa', marginTop: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{album.artist}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
