import {useState, useEffect, useRef} from 'react';
import {getHistory, imageUrl} from '../api/roon';

export default function History({dateParams}) {
    const [allRows, setAllRows] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const observerTarget = useRef(null);
    const isFetchingRef = useRef(false);

    // Reset when date params change
    useEffect(() => {
        isFetchingRef.current = false;
        setLoading(false);
        setAllRows([]);
        setPage(1);
        setHasMore(true);
        setTotal(0);
    }, [dateParams.range, dateParams.from, dateParams.to]);

    // Load data when page changes
    useEffect(() => {
        if (!hasMore || isFetchingRef.current) return;

        let cancelled = false;
        isFetchingRef.current = true;
        setLoading(true);

        getHistory({...dateParams, page, limit: 100})
            .then((data) => {
                if (cancelled) return;
                setTotal(data.total || 0);
                setAllRows(prev => {
                    if (page === 1) return data.rows;
                    const seen = new Set(prev.map(row => row.id));
                    const nextRows = data.rows.filter(row => !seen.has(row.id));
                    return [...prev, ...nextRows];
                });
                setHasMore((data.rows?.length || 0) === 100 && (page * 100) < (data.total || 0));
            })
            .catch((err) => {
                if (!cancelled) {
                    console.error(err);
                    setHasMore(false);
                }
            })
            .finally(() => {
                if (!cancelled) {
                    isFetchingRef.current = false;
                    setLoading(false);
                }
            });

        return () => {
            cancelled = true;
            isFetchingRef.current = false;
        };
    }, [dateParams.range, dateParams.from, dateParams.to, page, hasMore]);

    // Infinite scroll observer
    useEffect(() => {
        const target = observerTarget.current;
        if (!target) return;

        const observer = new IntersectionObserver(
            entries => {
                if (entries[0]?.isIntersecting && hasMore && !isFetchingRef.current) {
                    setPage(prev => prev + 1);
                }
            },
            {threshold: 0.1}
        );

        observer.observe(target);

        return () => {
            observer.unobserve(target);
            observer.disconnect();
        };
    }, [hasMore]);

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
