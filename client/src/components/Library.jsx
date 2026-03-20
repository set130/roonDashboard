import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { browse, load, imageUrl, getTopAlbums, getTopArtists } from '../api/roon';

const CATEGORIES = ['Albums', 'Artists', 'Playlists', 'Internet Radio', 'Genres'];

export default function Library() {
    const [currentCategory, setCurrentCategory] = useState('Albums');
    const [browseItems, setBrowseItems] = useState([]);
    const [sortBy, setSortBy] = useState('Default');
    const [topStats, setTopStats] = useState({ artists: {}, albums: {} });
    const [loading, setLoading] = useState(false);

    // Fetch stats for sorting
    useEffect(() => {
        Promise.all([
            getTopArtists({ limit: 1000 }),
            getTopAlbums({ limit: 1000 })
        ])
        .then(([artistsData, albumsData]) => {
            const artists = {};
            const albums = {};
            (artistsData || []).forEach(a => artists[a.artist] = a.play_count || 0);
            (albumsData || []).forEach(a => albums[a.album] = a.play_count || 0);
            setTopStats({ artists, albums });
        })
        .catch(err => console.error("Failed to load stats for sorting", err));
    }, []);

    // Navigate to the correct category
    useEffect(() => {
        let isMounted = true;

        const loadCategory = async () => {
            setLoading(true);
            try {
                // 1. Go to root
                await browse({ hierarchy: "browse", pop_all: true });
                let rootLoad = await load({ hierarchy: "browse", offset: 0, count: 100 });
                let rootItems = rootLoad.items || [];
                
                // 2. Find the category at root
                let targetItem = rootItems.find(i => i.title === currentCategory);
                
                // 3. If not found at root, check inside "Library"
                if (!targetItem) {
                    const libraryItem = rootItems.find(i => i.title === 'Library');
                    if (libraryItem) {
                        await browse({ hierarchy: "browse", item_key: libraryItem.item_key });
                        let libLoad = await load({ hierarchy: "browse", offset: 0, count: 100 });
                        let libItems = libLoad.items || [];
                        targetItem = libItems.find(i => i.title === currentCategory);
                    }
                }

                if (!targetItem) {
                    console.warn(`Category ${currentCategory} not found in Roon hierarchy.`);
                    if (isMounted) {
                        setBrowseItems([]);
                        setLoading(false);
                    }
                    return;
                }

                // 4. Navigate into the target category
                await browse({ hierarchy: "browse", item_key: targetItem.item_key });
                
                // 5. Load all items for this category
                let allItemsMap = new Map(); // Use Map to automatically deduplicate
                const getDedupeKey = (item) => `${item.title}|${item.subtitle || ''}`;
                let offset = 0;
                const batchSize = 100; // Reduce batch size to prevent hitting API limits/duplicates
                
                let listRes = await load({ hierarchy: "browse", offset, count: batchSize });
                let currentFetchedCount = listRes.items ? listRes.items.length : 0;
                
                if (listRes.items) {
                    listRes.items.forEach(item => allItemsMap.set(getDedupeKey(item), item));
                }
                
                const total = listRes.list?.count || currentFetchedCount;
                
                while (currentFetchedCount < total) {
                    offset += batchSize;
                    const nextRes = await load({ hierarchy: "browse", offset, count: batchSize });
                    if (nextRes.items && nextRes.items.length > 0) {
                        nextRes.items.forEach(item => allItemsMap.set(getDedupeKey(item), item));
                        currentFetchedCount += nextRes.items.length;
                        // Break if we didn't get as many as we asked for (end of list)
                        if (nextRes.items.length < batchSize) break;
                    } else {
                        break;
                    }
                }

                if (isMounted) {
                    setBrowseItems(Array.from(allItemsMap.values()));
                }
            } catch (e) {
                console.error("Failed to load category", e);
                if (isMounted) setBrowseItems([]);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        loadCategory();

        return () => {
            isMounted = false;
        };
    }, [currentCategory]);

    const handleItemClick = async (itemKey) => {
        // Just for deeper browsing right now.
        // It could trigger playback or go deeper.
        try {
            setLoading(true);
            const res = await browse({ hierarchy: "browse", item_key: itemKey });
            if (res.action === "list") {
                let allItemsMap = new Map();
                const getDedupeKey = (item) => `${item.title}|${item.subtitle || ''}`;
                let offset = 0;
                const batchSize = 100;
                let listRes = await load({ hierarchy: "browse", offset, count: batchSize });
                let currentFetchedCount = listRes.items ? listRes.items.length : 0;
                if (listRes.items) {
                    listRes.items.forEach(item => allItemsMap.set(getDedupeKey(item), item));
                }
                const total = listRes.list?.count || currentFetchedCount;
                while (currentFetchedCount < total) {
                    offset += batchSize;
                    const nextRes = await load({ hierarchy: "browse", offset, count: batchSize });
                    if (nextRes.items && nextRes.items.length > 0) {
                        nextRes.items.forEach(item => allItemsMap.set(getDedupeKey(item), item));
                        currentFetchedCount += nextRes.items.length;
                        if (nextRes.items.length < batchSize) break;
                    } else {
                        break;
                    }
                }
                setBrowseItems(Array.from(allItemsMap.values()));
            }
        } catch (e) {
            console.error("Failed to browse item", e);
        } finally {
            setLoading(false);
        }
    };

    const sortedBrowseItems = useMemo(() => {
        if (!browseItems || browseItems.length === 0) return [];
        if (sortBy === 'Default') return browseItems;
        
        return [...browseItems].sort((a, b) => {
            const titleA = a.title || '';
            const titleB = b.title || '';
            const subA = a.subtitle || '';
            const subB = b.subtitle || '';

            if (sortBy === 'Artist') {
                const cmp = subA.localeCompare(subB);
                if (cmp !== 0) return cmp;
                return titleA.localeCompare(titleB);
            }
            if (sortBy === 'Album title') {
                return titleA.localeCompare(titleB);
            }
            if (sortBy === 'Most played') {
                const scoreA = Math.max(topStats.albums[titleA] || 0, topStats.artists[titleA] || 0);
                const scoreB = Math.max(topStats.albums[titleB] || 0, topStats.artists[titleB] || 0);
                if (scoreA !== scoreB) return scoreB - scoreA;
                return titleA.localeCompare(titleB);
            }
            if (sortBy === 'Date') {
                const extractYear = (str) => {
                    const match = str.match(/\b(19|20)\d{2}\b/);
                    return match ? parseInt(match[0], 10) : 0;
                };
                const yearA = Math.max(extractYear(subA), extractYear(titleA));
                const yearB = Math.max(extractYear(subB), extractYear(titleB));
                if (yearA !== yearB) return yearB - yearA; 
                return titleA.localeCompare(titleB);
            }
            return 0;
        });
    }, [browseItems, sortBy, topStats]);

    const [topbarTarget, setTopbarTarget] = useState(null);

    useEffect(() => {
        setTopbarTarget(document.getElementById('library-topbar-portal-target'));
    }, []);

    // UI for topbar
    const topbarUI = (
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '5px', backgroundColor: 'var(--surface-light, #2d2d2d)', padding: '4px', borderRadius: '8px' }}>
                {CATEGORIES.map(cat => (
                    <button
                        key={cat}
                        onClick={() => setCurrentCategory(cat)}
                        style={{
                            background: currentCategory === cat ? 'var(--text, #fff)' : 'transparent',
                            color: currentCategory === cat ? 'var(--bg, #121212)' : 'var(--text, #fff)',
                            border: 'none',
                            padding: '6px 12px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            fontSize: '0.9rem',
                            transition: 'all 0.2s'
                        }}
                    >
                        {cat}
                    </button>
                ))}
            </div>
            
            <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={{ padding: '8px', borderRadius: '4px', border: '1px solid #444', backgroundColor: 'var(--surface-light, #2d2d2d)', color: 'var(--text, #fff)' }}
            >
                <option value="Default">Default</option>
                <option value="Artist">Artist</option>
                <option value="Most played">Most played</option>
                <option value="Date">Date</option>
                <option value="Album title">Album title</option>
            </select>
        </div>
    );

    return (
        <div className="library-container" style={{ padding: '20px' }}>
            {topbarTarget && createPortal(topbarUI, topbarTarget)}
            
            {loading && <p style={{ color: '#888' }}>Loading library items...</p>}
            
            {!loading && sortedBrowseItems.length === 0 && (
                <p className="empty-state">No items found for this category.</p>
            )}

            {!loading && sortedBrowseItems.length > 0 && (
                <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', 
                    gap: '20px'
                }}>
                    {sortedBrowseItems.map(item => (
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
                        onClick={() => handleItemClick(item.item_key)}
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
            )}
        </div>
    );
}