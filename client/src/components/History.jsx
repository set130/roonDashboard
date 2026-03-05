import {useState, useEffect, useRef} from 'react';
import {getHistory, imageUrl} from '../api/roon';

export default function History({dateParams}) {
    const [allRows, setAllRows] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const observerTarget = useRef(null);

    // Reset when date params change
    useEffect(() => {
        setAllRows([]);
        setPage(1);
        setHasMore(true);
        setTotal(0);
    }, [dateParams.range, dateParams.from, dateParams.to]);

    // Load data when page changes
    useEffect(() => {
        if (!hasMore || loading) return;

        setLoading(true);
        getHistory({...dateParams, page, limit: 100})
            .then((data) => {
                setTotal(data.total);
                setAllRows(prev => {
                    // Avoid duplicates when page=1
                    if (page === 1) return data.rows;
                    return [...prev, ...data.rows];
                });
                // Check if we have more data
                setHasMore(data.rows.length === 100 && (page * 100) < data.total);
                setLoading(false);
            })
            .catch((err) => {
                console.error(err);
                setLoading(false);
            });
    }, [dateParams, page, hasMore, loading]);

    // Infinite scroll observer
    useEffect(() => {
        const observer = new IntersectionObserver(
            entries => {
                if (entries[0].isIntersecting && hasMore && !loading) {
                    setPage(prev => prev + 1);
                }
            },
            { threshold: 0.1 }
        );

        if (observerTarget.current) {
            observer.observe(observerTarget.current);
        }

        return () => {
            if (observerTarget.current) {
                observer.unobserve(observerTarget.current);
            }
        };
    }, [hasMore, loading]);

    return (
        <div className="card history-card">
            <h3>Play History</h3>
            <div className="history-count">
                {total > 0 && `${allRows.length} of ${total} total plays`}
                {total === 0 && 'No plays recorded yet'}
            </div>
            {allRows.length === 0 && !loading ? (
                <p className="empty-state">No plays recorded yet</p>
            ) : (
                <>
                    <div className="history-table">
                        <div className="history-header">
                            <span className="h-col h-art"></span>
                            <span className="h-col h-track">Track</span>
                            <span className="h-col h-artist">Artist</span>
                            <span className="h-col h-album">Album</span>
                            <span className="h-col h-duration">Duration</span>
                            <span className="h-col h-date">Date</span>
                            <span className="h-col h-zone">Zone</span>
                        </div>
                        {allRows.map((row) => (
                            <div key={row.id} className="history-row">
                <span className="h-col h-art">
                  {row.image_key ? (
                      <img src={imageUrl(row.image_key, 36, 36)} alt=""/>
                  ) : (
                      <span className="art-placeholder">♪</span>
                  )}
                </span>
                                <span className="h-col h-track">{row.track_title}</span>
                                <span className="h-col h-artist">{row.artist}</span>
                                <span className="h-col h-album">{row.album}</span>
                                <span className="h-col h-duration">{formatDuration(row.played_secs)}</span>
                                <span className="h-col h-date">{formatDate(row.started_at)}</span>
                                <span className="h-col h-zone">{row.zone_name}</span>
                            </div>
                        ))}
                    </div>
                    {hasMore && (
                        <div ref={observerTarget} className="load-more-trigger">
                            {loading && <p className="loading-text">Loading more...</p>}
                        </div>
                    )}
                    {!hasMore && allRows.length > 0 && (
                        <p className="end-of-list">End of history</p>
                    )}
                </>
            )}
        </div>
    );
}

function formatDuration(secs) {
    if (!secs) return '-';
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
}

function formatDate(iso) {
    if (!iso) return '-';
    const d = new Date(iso);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});
}

