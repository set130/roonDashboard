import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { getTopArtists } from '../api/roon';

export default function TopArtists({ dateParams }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getTopArtists({ ...dateParams, limit: 20 })
      .then(setData)
      .catch((err) => {
        console.error('Failed to fetch top artists:', err);
        setData([]);
      })
      .finally(() => setLoading(false));
  }, [dateParams?.range, dateParams?.from, dateParams?.to]);

  if (loading) {
    return (
      <div className="card">
        <h3>Top Artists</h3>
        <p className="empty-state">Loading...</p>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="card">
        <h3>Top Artists</h3>
        <p className="empty-state">No data yet — start listening!</p>
      </div>
    );
  }

  // Transform data for chart
  const chartData = data.map((a) => ({
    name: a.artist,
    plays: a.play_count,
    hours: Math.round(a.total_secs / 3600 * 10) / 10,
  }));

  return (
    <div className="card top-artists-card">
      <h3>Top Artists</h3>
      <div className="chart-container">
        <ResponsiveContainer width="100%" height={600}>
          <BarChart data={chartData} layout="vertical" margin={{ left: 10 }}>
            <XAxis type="number" tick={{ fontSize: 11, fill: '#999' }} />
            <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 12, fill: '#ccc' }} />
            <Tooltip
              contentStyle={{ background: '#1e1e2e', border: '1px solid #333', borderRadius: 8 }}
              formatter={(val, name) => [val, name === 'plays' ? 'Plays' : 'Hours']}
            />
            <Bar dataKey="plays" fill="#e17055" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="ranked-list">
        {data.map((a, i) => (
          <div key={a.artist} className="ranked-item">
            <span className="rank">#{i + 1}</span>
            <span className="ranked-name">{a.artist}</span>
            <span className="ranked-stats">
              {a.play_count} plays · {Math.round(a.total_secs / 60)}m
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

