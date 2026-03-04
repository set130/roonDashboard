import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { getTopTracks, imageUrl } from '../api/roon';

export default function TopTracks({ dateParams }) {
  const [data, setData] = useState([]);

  useEffect(() => {
    getTopTracks({ ...dateParams, limit: 20 }).then(setData).catch(console.error);
  }, [dateParams.range, dateParams.from, dateParams.to]);

  if (data.length === 0) {
    return (
      <div className="card">
        <h3>Top Tracks</h3>
        <p className="empty-state">No data yet — start listening!</p>
      </div>
    );
  }

  // ...existing code...

  return (
    <div className="card top-tracks-card">
      <h3>Top Tracks</h3>
      <div className="chart-container">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} layout="vertical" margin={{ left: 10 }}>
            <XAxis type="number" tick={{ fontSize: 11, fill: '#999' }} />
            <YAxis type="category" dataKey="name" width={150} tick={{ fontSize: 12, fill: '#ccc' }} />
            <Tooltip
              contentStyle={{ background: '#1e1e2e', border: '1px solid #333', borderRadius: 8 }}
              formatter={(val) => [val, 'Plays']}
            />
            <Bar dataKey="plays" fill="#00cec9" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="ranked-list">
        {data.map((t, i) => (
          <div key={`${t.track_title}-${t.artist}`} className="ranked-item">
            <span className="rank">#{i + 1}</span>
            {t.image_key && (
              <img className="ranked-art" src={imageUrl(t.image_key, 40, 40)} alt="" />
            )}
            <div className="ranked-info">
              <span className="ranked-name">{t.track_title}</span>
              <span className="ranked-sub">{t.artist}</span>
            </div>
            <span className="ranked-stats">
              {t.play_count} plays · {Math.round(t.total_secs / 60)}m
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

