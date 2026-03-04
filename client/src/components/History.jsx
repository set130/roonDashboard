import { useState, useEffect } from 'react';
import { getHistory, imageUrl } from '../api/roon';

export default function History({ dateParams }) {
  const [data, setData] = useState({ rows: [], total: 0, page: 1, limit: 50 });
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
  }, [dateParams.range, dateParams.from, dateParams.to]);

  useEffect(() => {
    getHistory({ ...dateParams, page, limit: 50 }).then(setData).catch(console.error);
  }, [dateParams.range, dateParams.from, dateParams.to, page]);

  const totalPages = Math.ceil(data.total / data.limit) || 1;

  return (
    <div className="card history-card">
      <h3>Play History</h3>
      <div className="history-count">{data.total} total plays</div>
      {data.rows.length === 0 ? (
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
            {data.rows.map((row) => (
              <div key={row.id} className="history-row">
                <span className="h-col h-art">
                  {row.image_key ? (
                    <img src={imageUrl(row.image_key, 36, 36)} alt="" />
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
          <div className="pagination">
            <button disabled={page <= 1} onClick={() => setPage(page - 1)}>← Prev</button>
            <span>Page {page} of {totalPages}</span>
            <button disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next →</button>
          </div>
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
  return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

